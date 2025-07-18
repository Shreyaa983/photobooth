# PhotoBooth App

A modern web photobooth built with Next.js, React, and Three.js. Capture photos, apply filters, decorate with stickers, and download your custom photo strip!

## Features
- Animated 3D landing page with interactive spider and web
- Webcam capture with fun filters
- Customizable photo strip templates and colors
- Drag-and-drop stickers
- Download your final photobooth strip as an image

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
2. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
- `src/app/page.tsx` - 3D animated landing page
- `src/app/camera/page.tsx` - Camera capture interface
- `src/app/preview/page.tsx` - Photo strip preview, styling, and download
- `src/components/CameraFeed.tsx` - Webcam and filter logic
- `public/stickers/` - Sticker images
- `public/models/` - 3D models for landing animation

## Customization
- Add your own stickers to `public/stickers/`
- Add new templates or colors in `src/app/preview/page.tsx`

## License
MIT
