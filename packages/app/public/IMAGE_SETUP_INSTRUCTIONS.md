# BaseD Mini App - Image Setup Instructions

## Görselleri Ekleme Adımları

Aşağıdaki görselleri `packages/app/public/` klasörüne ekle:

### 1. icon.png (512x512px)
**Kullanılacak görsel:** İlk görsel (sadece "BaseD" yazısı, mavi glow)
- Dosya adı: `icon.png`
- Boyut: 512x512px (kare)
- Format: PNG
- Kullanım: Base App'te gösterilecek app ikonu

### 2. splash.png (1200x675px)
**Kullanılacak görsel:** İkinci görsel ("BaseD: The On-Chain Reputation Protocol")
- Dosya adı: `splash.png`
- Boyut: 1200x675px (16:9 oran)
- Format: PNG
- Kullanım: Uygulama açılırken gösterilen splash screen

### 3. screenshot1.png (1200x675px)
**Kullanılacak görsel:** Üçüncü görsel (Dashboard ekran görüntüsü)
- Dosya adı: `screenshot1.png`
- Boyut: 1200x675px (16:9 oran)
- Format: PNG
- Kullanım: App store listing'de gösterilecek screenshot

### 4. hero.png (1200x630px)
**Kullanılacak görsel:** Dördüncü görsel ("BaseD: Your On-Chain Credit Score is Here")
- Dosya adı: `hero.png`
- Boyut: 1200x630px (yaklaşık 1.9:1 oran)
- Format: PNG
- Kullanım: Hero görseli

### 5. og.png (1200x630px)
**Kullanılacak görsel:** Dördüncü görsel (hero ile aynı)
- Dosya adı: `og.png`
- Boyut: 1200x630px
- Format: PNG
- Kullanım: Open Graph image (social media paylaşımları için)

### 6. embed-image.png (1200x630px)
**Kullanılacak görsel:** Dördüncü görsel (hero ile aynı)
- Dosya adı: `embed-image.png`
- Boyut: 1200x630px
- Format: PNG
- Kullanım: Rich embed görseli (Base App'te paylaşıldığında)

## Resize İşlemi

Görselleri resize etmek için:
- **Online tool:** https://www.iloveimg.com/resize-image veya https://imageresizer.com
- **Desktop:** Photoshop, GIMP, veya Figma
- **Command line:** ImageMagick (eğer kuruluysa)

## Dosya Yerleşimi

Tüm dosyalar şu klasörde olmalı:
```
packages/app/public/
├── icon.png
├── splash.png
├── screenshot1.png
├── hero.png
├── og.png
└── embed-image.png
```

## Kontrol

Dosyaları ekledikten sonra:
1. Build çalıştır: `npm run build --workspace=packages/app`
2. Local'de test et: `npm run dev --workspace=packages/app`
3. Manifest'i kontrol et: http://localhost:3000/.well-known/farcaster.json

## Notlar

- Tüm görseller optimize edilmiş olmalı (dosya boyutu küçük tutulmalı)
- PNG formatı tercih edilir (transparency desteği için)
- Görseller yüksek kaliteli olmalı ama çok büyük olmamalı (max 500KB per image önerilir)

