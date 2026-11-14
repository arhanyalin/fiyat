# Fiyat Okuyucu – Kurulum

Çalışanların telefon kamerasıyla barkod okutup ürün adını ve fiyatını gördüğü web uygulaması (PWA).
App Store ya da Google Play gerekmez; bir link üzerinden telefona kurulur. Giriş şifrelidir.

## Şifre nasıl çalışır

Ürün listesi siteye **şifrelenmiş** olarak (`urunler.enc`) yüklenir. Şifre hiçbir dosyada yazılı değildir; liste yalnızca doğru şifre girildiğinde telefonda çözülür. Şifreyi bilmeyen biri siteyi açsa da dosyayı indirse de ürünleri ve fiyatları göremez.

- Şifreyi bu klasördeki hiçbir dosyaya, repo açıklamasına ya da commit mesajına yazmayın.
- Şifresiz `urunler.xlsx` / `urunler.csv` dosyasını siteye **yüklemeyin**. Daha önce public bir GitHub reposuna yüklediyseniz dosyayı silmek yetmez (geçmişte kalır); repoyu silip yeniden oluşturun.

## 1. Klasörü yayınlayın

Bu klasörün içindekileri **https** ile açılan bir adrese yükleyin (GitHub Pages, Netlify, şirket sunucusu). Kamera ve şifreleme yalnızca https üzerinde çalışır.

Klasördeki `urunler.enc` üç örnek ürün içerir; kendi listenizle değiştirene kadar uygulamayı denemek içindir.

## 2. Kendi listenizi şifreleyin

1. Sitenizde `sifrele.html` sayfasını açın (örnek: `https://adresiniz/sifrele.html`).
2. Excel dosyalarınızı seçin (birden fazla dosyayı birlikte seçebilirsiniz; tek listede birleştirilir), şifreyi yazın, “Şifrele ve indir”e basın.
3. İnen `urunler.enc` dosyasını sitedeki eskisinin yerine yükleyin.

Excel dosyası tarayıcıdan dışarı gönderilmez; şifreleme cihazın içinde yapılır.

Excel biçimi: ilk sayfada **barkod, ürün adı, fiyat** sütunları. Başlık satırı (“Barkod”, “Ürün Adı”, “Fiyat”) varsa sütun sırası önemli değildir; yoksa sıra barkod, ürün adı, fiyat olmalıdır. `.xlsx` önerilir. Her dosyanın yalnızca ilk sayfası okunur; dosyaların sütun sırası birbirinden farklı olabilir. Aynı barkod birden fazla dosyada geçerse sonra okunan dosyadaki fiyat kullanılır.

## 3. Çalışanlar telefona kurar

Linki ve şifreyi çalışanlara iletin (şifreyi linkle aynı mesajda göndermeyin).

- **iPhone:** Linki **Safari** ile açın → Paylaş düğmesi → **Ana Ekrana Ekle**.
- **Android:** Linki **Chrome** ile açın → ⋮ menüsü → **Uygulamayı yükle**.

Şifre her telefonda bir kez sorulur. Sonrasında uygulama internetsiz de çalışır. Menüdeki “Çıkış yap”, o telefondaki listeyi ve kayıtlı şifreyi siler.

## 4. Fiyatlar değiştiğinde

Yeni Excel dosyasını `sifrele.html` ile **aynı şifreyle** şifreleyip `urunler.enc` dosyasını değiştirin. Telefonlar bir sonraki açılışta yeni listeyi kendiliğinden alır.

## 5. Şifreyi değiştirmek / birinin erişimini kesmek

Listeyi `sifrele.html` ile **yeni bir şifreyle** şifreleyip yükleyin. Bütün telefonlar bir sonraki açılışta (internet varken) eski listeyi siler ve yeni şifreyi sorar. İşten ayrılan biri olduğunda bunu yapın.

## Dosyalar

| Dosya | Görevi |
|---|---|
| `index.html` | Uygulamanın kendisi |
| `sifrele.html` | Excel listesini şifreleyen sayfa (yalnızca siz kullanırsınız) |
| `urunler.enc` | Şifreli ürün listesi |
| `liste.js` | Excel okuma ve şifreleme kodu |
| `sw.js` | İnternetsiz çalışma |
| `manifest.webmanifest`, `icons/` | Ana ekran adı ve ikonu |
| `vendor/` | Barkod okuma ve Excel okuma kütüphaneleri |

`index.html` ya da `liste.js` içinde değişiklik yaparsanız `sw.js` içindeki sürüm numarasını (`fiyat-okuyucu-v5`) artırın; telefonlar yeni sürümü böyle alır.
