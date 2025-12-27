# Required Images for Base Mini App

Add these images to the `public/` directory for the Mini App manifest:

## Required Images

1. **icon.png** (512x512px)
   - App icon displayed in Base App
   - Should be square, high quality
   - Place in: `public/icon.png`

2. **splash.png** (1200x675px)
   - Splash screen shown when app loads
   - Should match app branding
   - Place in: `public/splash.png`

3. **screenshot1.png** (minimum 1200x675px)
   - Screenshot of the app interface
   - Can add up to 5 screenshots
   - Place in: `public/screenshot1.png`, `screenshot2.png`, etc.

4. **hero.png** (1200x630px recommended)
   - Hero image for app listing
   - Place in: `public/hero.png`

5. **og.png** (1200x630px)
   - Open Graph image for social sharing
   - Place in: `public/og.png`

6. **embed-image.png** (1200x630px)
   - Image for rich embeds when app is shared
   - Place in: `public/embed-image.png`

## Current Status

All image URLs are configured in:
- `src/app/.well-known/farcaster.json/route.ts` (manifest)
- `src/app/layout.tsx` (metadata)

Once you add these images to `public/`, they will be automatically served and available for the Mini App.

