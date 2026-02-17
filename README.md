<div align="center">

# Convertly

**Free, private file conversion that runs entirely in your browser.**

No uploads. No servers. No tracking. Just fast, local conversion.

[![MIT License](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![Made by Gegamo Team](https://img.shields.io/badge/Made%20by-Gegamo%20Team-FF6B00.svg)](https://gegamo.xyz)

</div>

---

## About

Convertly is an open-source file converter that processes **everything locally in your browser**. Your files never leave your device — no uploads, no server processing, no data collection. Built with Next.js by the [Gegamo Team](https://gegamo.xyz).

## Features

- **100% Local Processing** — All conversions happen client-side in your browser
- **Zero Tracking** — No cookies, no analytics, no data collection
- **50+ Formats** — Images, documents, audio, video, and data files
- **Lightning Fast** — No upload/download delays
- **Completely Free** — No subscriptions, no limits, no hidden fees
- **Works Everywhere** — Desktop, tablet, or phone
- **No Installation** — Open the page and start converting

## Supported Formats

| Category | Formats |
|----------|---------|
| **Images** | PNG, JPG, WEBP, GIF, BMP, ICO, SVG, TIFF |
| **Documents** | TXT, HTML, Markdown, CSV |
| **Data** | JSON, CSV, XML, YAML, TSV |

> Audio and video conversion support (MP3, WAV, MP4, WEBM, etc.) can be added via ffmpeg.wasm.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Vanilla CSS (CSS Modules) |
| Icons | Lucide React |
| Fonts | Syne + DM Sans |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+ installed
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/gegamoteam/convertly.git
cd convertly

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with SEO metadata
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Design system & global styles
│   ├── legal.module.css    # Shared legal page styles
│   ├── convert/
│   │   ├── page.tsx        # File converter page
│   │   ├── layout.tsx      # Convert page SEO
│   │   └── convert.module.css
│   ├── privacy/
│   │   └── page.tsx        # Privacy Policy
│   └── terms/
│       └── page.tsx        # Terms of Service
├── components/
│   ├── Navbar.tsx           # Sticky navigation
│   ├── Footer.tsx           # Site footer
│   ├── Hero.tsx             # Landing hero section
│   ├── Features.tsx         # Feature cards grid
│   ├── HowItWorks.tsx       # 3-step visual guide
│   ├── SupportedFormats.tsx  # Format categories
│   └── CTA.tsx              # Call-to-action section
└── lib/
    └── converter.ts         # Client-side conversion engine
```

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit** your changes
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push** to the branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open** a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Credits

Made with care by the [Gegamo Team](https://gegamo.xyz).

---

<div align="center">
<strong>Your files. Your device. Your privacy.</strong>
</div>
