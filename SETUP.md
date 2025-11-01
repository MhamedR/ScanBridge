# Quick Setup Guide

## Initial Setup Steps

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Run in development mode:**
   ```bash
   npm run electron:serve
   ```

## Project Structure Overview

```
ScanBridge/
├── main.js                    # Electron main process + Express server
├── mobile.html               # Mobile client page
├── package.json              # Dependencies
├── angular.json              # Angular config
├── tsconfig.json             # TypeScript config
├── tailwind.config.js        # Tailwind CSS config
├── postcss.config.js         # PostCSS config
├── src/
│   ├── index.html
│   ├── main.ts               # Angular bootstrap
│   ├── styles.scss           # Global styles
│   └── app/
│       ├── app.component.*   # Main component
│       ├── app.module.ts     # Angular module
│       ├── components/       # UI components
│       └── services/        # API & WebSocket services
└── README.md                 # Full documentation
```

## Key Features Implemented

✅ QR Code Pairing  
✅ Real-time Device Management  
✅ Document Scanning Trigger  
✅ Automatic File Saving  
✅ Modern UI with Angular Material + Tailwind  
✅ WebSocket Communication  
✅ Mobile Client Page  

## Development Workflow

1. Start dev server: `npm run electron:serve`
2. Make changes to Angular components
3. Electron window auto-reloads
4. Test mobile connection on same Wi-Fi network

## Building for Production

```bash
npm run electron:build
```

Output will be in `dist-electron/`

