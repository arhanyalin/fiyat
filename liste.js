"use strict";
/* Fiyat Okuyucu – ortak kod: Excel/CSV okuma ve liste şifreleme.
   index.html (uygulama) ve sifrele.html (liste hazırlama) birlikte kullanır. */

/* ---------- Excel / CSV okuma ---------- */
const fold = s => String(s).toLocaleLowerCase("tr").replace(/ı/g,"i").replace(/ş/g,"s").replace(/ğ/g,"g")
  .replace(/ü/g,"u").replace(/ö/g,"o").replace(/ç/g,"c").trim();

function barcodeKey(v){
  if (v == null) return "";
  let s = (typeof v === "number") ? (Number.isFinite(v) ? v.toFixed(0) : "") : String(v);
  s = s.replace(/[\s\u00A0'"=]/g, "");
  if (/^\d+\.0+$/.test(s)) s = s.replace(/\.0+$/, "");
  if (/^\d+$/.test(s)) s = s.replace(/^0+(?=\d)/, "");   // Excel baştaki sıfırları siler; iki tarafı da eşitle
  return s;
}
function parsePrice(v){
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (v == null) return null;
  let s = String(v).replace(/[^\d.,-]/g, "");
  if (!s) return null;
  const c = s.lastIndexOf(","), d = s.lastIndexOf(".");
  if (c > -1 && d > -1) s = c > d ? s.replace(/\./g,"").replace(",",".") : s.replace(/,/g,"");
  else if (c > -1) s = (s.split(",").length > 2) ? s.replace(/,/g,"") : s.replace(",",".");
  else if (d > -1 && /^\-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g,"");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}
function parseCSV(text){
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const first = text.slice(0, text.indexOf("\n") > -1 ? text.indexOf("\n") : text.length);
  const delim = [";", "\t", ","].map(d => [d, first.split(d).length]).sort((a,b) => b[1]-a[1])[0][0];
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++){
    const ch = text[i];
    if (q){
      if (ch === '"'){ if (text[i+1] === '"'){ cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim){ row.push(cur); cur = ""; }
    else if (ch === "\n"){ row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (ch !== "\r") cur += ch;
  }
  if (cur !== "" || row.length){ row.push(cur); rows.push(row); }
  return rows;
}
function decodeText(buf){
  try { return new TextDecoder("utf-8", {fatal:true}).decode(buf); }
  catch(e){ return new TextDecoder("windows-1254").decode(buf); }   // Türkçe Excel'in CSV çıktısı
}
function rowsToItems(rows){
  rows = rows.filter(r => r && r.some(c => c !== "" && c != null));
  if (!rows.length) throw new Error("Dosya boş.");
  let iB = 0, iN = 1, iP = 2, start = 0;
  const head = rows[0].map(c => fold(c == null ? "" : c));
  const find = re => head.findIndex(h => re.test(h));
  const hb = find(/barkod|barcode|ean|gtin/), hp = find(/fiyat|price|tutar|satis/);
  let hn = -1;
  for (const re of [/urun\s*ad|urun\s*isim|product/, /urun|isim|name|tanim|aciklama/, /^adi?$/]){
    hn = head.findIndex((h,i) => i !== hb && i !== hp && re.test(h));
    if (hn > -1) break;
  }
  if (hb > -1 || hp > -1){
    start = 1;
    if (hb > -1) iB = hb;
    if (hp > -1) iP = hp;
    if (hn > -1) iN = hn; else iN = [0,1,2].find(i => i !== iB && i !== iP);
  } else if (!/^\d{6,}/.test(barcodeKey(rows[0][0]))) start = 1;   // tanınmayan başlık satırı
  const items = []; let bad = 0;
  for (let i = start; i < rows.length; i++){
    const r = rows[i], raw = r[iB];
    const key = barcodeKey(raw);
    if (!key){ continue; }
    if (/e\+?\d+$/i.test(key)){ bad++; continue; }      // 8,69E+12 gibi bozulmuş barkod
    items.push([key, String(r[iN] == null ? "" : r[iN]).trim(), parsePrice(r[iP])]);
  }
  if (!items.length) throw new Error("Dosyada okunabilir barkod bulunamadı.");
  return {items, bad};
}
function loadScript(src){
  return new Promise((ok, no) => {
    const s = document.createElement("script"); s.src = src; s.onload = ok;
    s.onerror = () => no(new Error(src + " yüklenemedi")); document.head.appendChild(s);
  });
}
async function parseFile(name, buf){
  if (/\.xlsx?$/i.test(name)){
    if (!window.XLSX) await loadScript("vendor/xlsx.min.js");
    const wb = XLSX.read(buf, {type:"array"});
    const ws = wb.Sheets[wb.SheetNames[0]];
    return rowsToItems(XLSX.utils.sheet_to_json(ws, {header:1, raw:true, defval:""}));
  }
  return rowsToItems(parseCSV(decodeText(buf)));
}

/* Birden fazla dosyayı tek listede birleştirir. Aynı barkod tekrar ederse sırada sonra gelen geçerli olur. */
async function parseFiles(fileList){
  const seen = new Map(), perFile = [];
  let bad = 0, dup = 0, latest = 0;
  for (const f of Array.from(fileList)){
    let parsed;
    try { parsed = await parseFile(f.name, await f.arrayBuffer()); }
    catch(e){ throw new Error(f.name + ": " + e.message); }
    for (const it of parsed.items){ if (seen.has(it[0])) dup++; seen.set(it[0], it); }
    bad += parsed.bad; perFile.push({name: f.name, count: parsed.items.length});
    if (f.lastModified > latest) latest = f.lastModified;
  }
  return {items: Array.from(seen.values()), bad, dup, perFile, listDate: latest || Date.now(),
          source: perFile.map(x => x.name).join(", ")};
}

/* ---------- Şifreleme (AES-256-GCM, anahtar: PBKDF2-SHA256) ---------- */
const ENC_MAGIC = [0x50, 0x47, 0x53, 0x31];   // "PGS1"
const KDF_ITER = 600000;
function encError(code){ const e = new Error(code); e.code = code; return e; }
async function deriveKey(pw, salt){
  if (!window.crypto || !crypto.subtle) throw encError("insecure");   // https gerekir
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2", salt, iterations:KDF_ITER, hash:"SHA-256"}, base,
    {name:"AES-GCM", length:256}, false, ["encrypt", "decrypt"]);
}
async function encryptList(obj, pw){
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pw, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, new TextEncoder().encode(JSON.stringify(obj))));
  const out = new Uint8Array(32 + ct.length);
  out.set(ENC_MAGIC, 0); out.set(salt, 4); out.set(iv, 20); out.set(ct, 32);
  return out;
}
async function decryptList(buf, pw){
  const b = new Uint8Array(buf);
  if (b.length < 49 || ENC_MAGIC.some((v, i) => b[i] !== v)) throw encError("format");
  const key = await deriveKey(pw, b.slice(4, 20));
  let pt;
  try { pt = await crypto.subtle.decrypt({name:"AES-GCM", iv:b.slice(20, 32)}, key, b.slice(32)); }
  catch(_){ throw encError("password"); }
  return JSON.parse(new TextDecoder().decode(pt));
}
