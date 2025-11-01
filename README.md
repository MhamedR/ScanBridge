# ScanBridge

A production-grade Electron + Angular desktop application that connects to mobile phones over Wi-Fi using QR code pairing and allows users to trigger document scans from their phone.

## 🚀 Features

- **QR Code Pairing**: Easy connection via QR code scan
- **Real-time Device Management**: See all connected phones in real-time
- **Document Scanning**: Trigger document scans from desktop to phone
- **Automatic File Saving**: Scanned images automatically saved to Desktop
- **Modern UI**: Built with Angular Material and Tailwind CSS
- **WebSocket Communication**: Real-time bidirectional communication

## 🛠️ Tech Stack

- **Frontend**: Angular 20, Angular Material, Tailwind CSS
- **Backend**: Electron, Express.js, WebSocket (ws)
- **Mobile Client**: HTML5, JavaScript, MediaDevices API
- **Build Tools**: Angular CLI, Electron Builder

## 📋 Prerequisites

- Node.js 18+ and npm
- Git

## 🔧 Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd ScanBridge
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

   > Note: The `--legacy-peer-deps` flag is needed due to some peer dependency conflicts with Angular 20 and certain packages.

3. **Install Angular CLI globally (if not already installed):**
   ```bash
   npm install -g @angular/cli
   ```

## 🎯 Usage

### Development Mode

1. **Start the development server:**
   ```bash
   npm run electron:serve
   ```

   This command will:
   - Start the Angular development server on `http://localhost:4200`
   - Wait for it to be ready
   - Launch the Electron desktop app

2. **Connect a mobile device:**
   - Ensure your phone is on the same Wi-Fi network as your computer
   - Open the desktop app
   - Scan the QR code displayed in the app
   - Your device will appear in the "Connected Devices" list

3. **Scan a document:**
   - Click "Scan Document" next to a connected device
   - The phone will open its camera
   - Take a photo (or it will auto-capture after 2 seconds)
   - The image will be saved to your Desktop

### Production Build

1. **Build the Angular app and package Electron:**
   ```bash
   npm run electron:build
   ```

   The packaged application will be in the `dist-electron` directory.

## 📁 Project Structure

```
ScanBridge/
├── main.js                 # Electron main process + Express server
├── mobile.html             # Mobile client page
├── package.json            # Dependencies and scripts
├── angular.json            # Angular configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── src/
│   ├── index.html          # Main HTML entry point
│   ├── main.ts             # Angular bootstrap
│   ├── styles.scss         # Global styles with Tailwind
│   └── app/
│       ├── app.component.* # Main app component
│       ├── app.module.ts   # Angular module
│       ├── components/
│       │   ├── qr-card/    # QR code pairing component
│       │   ├── device-list/ # Connected devices list
│       │   └── scan-preview/ # Last scan preview
│       └── services/
│           ├── api.service.ts      # HTTP API service
│           └── websocket.service.ts # WebSocket service
└── README.md
```

## 🔌 API Endpoints

The Express server exposes the following endpoints:

- `GET /pairing` - Get pairing token and QR code URL
- `GET /devices` - Get list of connected devices
- `POST /command/:id` - Send command to device (e.g., scan command)
- `POST /scan-result` - Receive scan result from device
- `GET /mobile` - Serve mobile client HTML page
- `WS /ws` - WebSocket endpoint for real-time communication

## 🔐 Security Considerations

- Token-based pairing prevents unauthorized connections
- Filename sanitization prevents path traversal attacks
- LAN-only access (restricts to local network)
- No arbitrary code execution or insecure evals

## 🎨 UI Components

### QR Card Component
- Displays QR code for device pairing
- Auto-refreshes pairing token
- Loading and error states

### Device List Component
- Shows all connected devices
- Real-time updates (refreshes every 2 seconds)
- Scan button for each device
- Connection status indicators

### Scan Preview Component
- Shows last scanned document
- "Open Folder" button to navigate to Desktop
- Clean, minimal design

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is already in use, modify `PORT` in `main.js`.

### Camera Not Working on Mobile
- Ensure HTTPS is not required (local network)
- Check browser permissions for camera access
- Try a different browser

### Devices Not Connecting
- Verify both devices are on the same Wi-Fi network
- Check firewall settings (allow port 3000)
- Ensure the Electron app is running

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install --legacy-peer-deps`
- Clear Angular cache: `rm -rf .angular`
- Check Node.js version: `node --version` (should be 18+)

## 📝 Development Notes

- The app uses `contextIsolation: false` to allow IPC communication between Angular and Electron
- WebSocket connections are managed in the Electron main process
- Images are saved as base64-encoded JPEG files
- Device names are sanitized and limited to 50 characters

## 🚀 Future Enhancements

Potential improvements (as mentioned in requirements):
- Dark mode toggle
- Toast notifications for scan progress
- Edge detection using OpenCV.js
- Settings dialog for scan quality and save directory
- Multi-scan support
- Image compression options

## 📄 License

MIT

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ using Electron, Angular, and WebSocket**

