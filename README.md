# Etüt Panelim

Öğrenci etüt / sınav / ödev takip uygulaması. Veriler Supabase'de (bulut veritabanı) tutulur, bu yüzden telefon ve bilgisayardan aynı anda erişip senkron çalışır.

## 1. GitHub'a yükle

1. GitHub'da yeni bir repo oluştur (örn. `etut-panelim`), **public** ya da **private** fark etmez.
2. Bu klasördeki TÜM dosya ve klasörleri (node_modules HARİÇ, zaten yok) repoya yükle:
   - Repo sayfasında "Add file" → "Upload files"
   - Bu klasörün içindeki her şeyi sürükle-bırak yap (index.html, package.json, src/, public/ vb.)
3. "Commit changes" ile kaydet.

## 2. Vercel ile yayınla

1. [vercel.com](https://vercel.com) → GitHub hesabınla giriş yap.
2. "Add New Project" → az önce yüklediğin repoyu seç.
3. Ayarları değiştirmene gerek yok (Vercel Vite projesini otomatik tanır: Build Command `vite build`, Output `dist`).
4. "Deploy" butonuna bas, 1 dakika içinde `https://etut-panelim-xxxx.vercel.app` gibi bir adres alırsın.

Bu adresi telefonuna ve bilgisayarına kaydet — ikisi de aynı veritabanına bağlı olduğu için girdiğin veri anında her iki cihazda da görünür.

## 3. Telefonda uygulama gibi kullan

- Adresi telefonda tarayıcıda aç.
- iPhone (Safari): Paylaş → "Ana Ekrana Ekle"
- Android (Chrome): ⋮ menü → "Ana ekrana ekle"

## Notlar

- Veritabanı bağlantı bilgileri `src/supabaseClient.js` içinde tanımlı.
- Şu an herkes bu Supabase tablolarına erişebilir durumda (satır güvenliği "allow all" olarak ayarlandı). Sadece sen kullanacağın ve linki paylaşmayacağın sürece sorun olmaz. İstersen ileride giriş/şifre ekleyebiliriz.
- Yerelde denemek istersen: `npm install` sonra `npm run dev`
