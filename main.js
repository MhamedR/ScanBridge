const { app, BrowserWindow } = require('electron');
const express = require('express');
const https = require('https');
const cors = require('cors');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const os = require('os');
const selfsigned = require('selfsigned');

const PORT = 3000;
const HTTPS_PORT = 3443;
let server;
let httpsServer;
let wss;
let wssHttps;
let mainWindow;
const devices = new Map(); // token -> { id, name, ws, connectedAt }

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Generate self-signed certificate for HTTPS
function generateCertificate() {
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const localIP = getLocalIP();
  const altNames = [
    {
      type: 2, // DNS
      value: 'localhost',
    },
    {
      type: 7, // IP
      ip: '127.0.0.1',
    },
  ];

  // Add local IP to alt names if it's not localhost
  if (localIP !== 'localhost' && localIP !== '127.0.0.1') {
    altNames.push({
      type: 7, // IP
      ip: localIP,
    });
    altNames.push({
      type: 2, // DNS
      value: localIP,
    });
  }

  const pems = selfsigned.generate(attrs, {
    keySize: 2048,
    days: 365,
    algorithm: 'sha256',
    extensions: [
      {
        name: 'basicConstraints',
        cA: true,
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true,
      },
      {
        name: 'subjectAltName',
        altNames: altNames,
      },
    ],
  });
  return pems;
}

// Initialize Express server
function createServer() {
  const appServer = express();

  // Enable CORS for Angular dev server
  appServer.use(cors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200', 'https://localhost:4200', 'https://127.0.0.1:4200'],
    credentials: true
  }));

  appServer.use(express.json());
  appServer.use(express.static('dist/scanbridge'));

  // Serve mobile client page
  appServer.get('/mobile', (req, res) => {
    res.sendFile(path.join(__dirname, 'mobile.html'));
  });

  // Get list of connected devices
  appServer.get('/devices', (req, res) => {
    const deviceList = Array.from(devices.values())
      .filter(d => d.ws && d.ws.readyState === WebSocket.OPEN)
      .map(d => ({
        id: d.id,
        name: d.name,
        connectedAt: d.connectedAt
      }));
    res.json(deviceList);
  });

  // Send command to device
  appServer.post('/command/:id', (req, res) => {
    const { id } = req.params;
    const command = req.body;

    const device = Array.from(devices.values()).find(d => d.id === id);
    if (!device || !device.ws || device.ws.readyState !== WebSocket.OPEN) {
      return res.status(404).json({ error: 'Device not found or disconnected' });
    }

    device.ws.send(JSON.stringify(command));
    res.json({ success: true, message: 'Command sent' });
  });

  // Get pairing token and QR data
  appServer.get('/pairing', (req, res) => {
    const token = uuidv4();
    const ip = getLocalIP();
    // Use HTTPS for mobile camera access
    const url = `https://${ip}:${HTTPS_PORT}/mobile?token=${token}`;
    res.json({ token, url, ip, port: HTTPS_PORT, secure: true });
  });

  // Receive scan result
  appServer.post('/scan-result', (req, res) => {
    const { fileName, data, deviceId } = req.body;

    if (!fileName || !data) {
      return res.status(400).json({ error: 'Missing fileName or data' });
    }

    // Sanitize filename
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalFileName = `${timestamp}_${sanitizedFileName}`;

    // Save to Desktop
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const filePath = path.join(desktopPath, finalFileName);

    // Convert base64 to buffer
    const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        console.error('Error saving file:', err);
        return res.status(500).json({ error: 'Failed to save file' });
      }

      console.log('File saved:', filePath);
      res.json({ success: true, path: filePath, fileName: finalFileName });
    });
  });

  // Start HTTP server
  server = appServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Local IP: http://${getLocalIP()}:${PORT}`);
  });

  // Start HTTPS server for mobile camera access
  try {
    const pems = generateCertificate();
    httpsServer = https.createServer({
      key: pems.private,
      cert: pems.cert,
    }, appServer);

    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`HTTPS Server running on https://localhost:${HTTPS_PORT}`);
      console.log(`HTTPS Local IP: https://${getLocalIP()}:${HTTPS_PORT}`);
      console.log('⚠️  Using self-signed certificate. Mobile browsers will show a security warning.');
      console.log('   Please accept the certificate to allow camera access.');

      // Create WebSocket server for HTTPS
      if (!wssHttps) {
        wssHttps = new WebSocket.Server({ server: httpsServer, path: '/ws' });
        setupWebSocketHandlers(wssHttps);
      }
    });
  } catch (error) {
    console.error('Error starting HTTPS server:', error);
    console.log('Camera may not work without HTTPS. Continuing with HTTP only.');
  }
}

// Setup WebSocket handlers (shared between HTTP and HTTPS)
function setupWebSocketHandlers(websocketServer) {
  websocketServer.on('connection', (ws, req) => {
    console.log('New WebSocket connection');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'register') {
          const { token, name } = data;

          if (!token || !name) {
            ws.send(JSON.stringify({ type: 'error', message: 'Missing token or name' }));
            return;
          }

          // Clean up old device with same token
          if (devices.has(token)) {
            const oldDevice = devices.get(token);
            if (oldDevice.ws) {
              oldDevice.ws.close();
            }
          }

          const deviceId = uuidv4();
          devices.set(token, {
            id: deviceId,
            name: name || 'Unknown Device',
            token,
            ws,
            connectedAt: new Date().toISOString()
          });

          ws.send(JSON.stringify({
            type: 'registered',
            deviceId,
            message: 'Successfully registered'
          }));

          console.log(`Device registered: ${name} (${deviceId})`);

          // Notify Angular app of new device
          if (mainWindow) {
            mainWindow.webContents.send('device-update', {
              type: 'device-connected',
              deviceId,
              name: name || 'Unknown Device'
            });
          }
        } else if (data.type === 'scanResult') {
          const device = Array.from(devices.values()).find(d => d.ws === ws);

          if (device) {
            // Directly save the file instead of making HTTP request
            const fileName = data.fileName || 'scan.jpg';
            const imageData = data.data;

            if (!fileName || !imageData) {
              ws.send(JSON.stringify({
                type: 'scanError',
                message: 'Missing fileName or data'
              }));
              return;
            }

            try {
              // Sanitize filename
              const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const finalFileName = `${timestamp}_${sanitizedFileName}`;

              // Save to Desktop
              const desktopPath = path.join(os.homedir(), 'Desktop');
              const filePath = path.join(desktopPath, finalFileName);

              // Convert base64 to buffer
              const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
              const buffer = Buffer.from(base64Data, 'base64');

              fs.writeFile(filePath, buffer, (err) => {
                if (err) {
                  console.error('Error saving file:', err);
                  ws.send(JSON.stringify({
                    type: 'scanError',
                    message: 'Failed to save file: ' + err.message
                  }));
                  return;
                }

                console.log('File saved:', filePath);

                // Send success message
                ws.send(JSON.stringify({
                  type: 'scanSuccess',
                  message: 'Scan saved successfully',
                  fileName: finalFileName
                }));

                // Notify Angular app
                if (mainWindow) {
                  mainWindow.webContents.send('scan-complete', {
                    fileName: finalFileName,
                    path: filePath,
                    deviceId: device.id
                  });
                }
              });
            } catch (error) {
              console.error('Error processing scan result:', error);
              ws.send(JSON.stringify({
                type: 'scanError',
                message: 'Failed to process scan: ' + error.message
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket disconnected');
      // Clean up device
      for (const [token, device] of devices.entries()) {
        if (device.ws === ws) {
          devices.delete(token);
          if (mainWindow) {
            mainWindow.webContents.send('device-update', {
              type: 'device-disconnected',
              deviceId: device.id
            });
          }
          break;
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
}

// Initialize WebSocket server
function createWebSocketServer() {
  wss = new WebSocket.Server({ server, path: '/ws' });
  setupWebSocketHandlers(wss);

  // HTTPS WebSocket server will be created after HTTPS server starts
}

// Create Electron window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png').replace(/\\/g, '/')
  });

  mainWindow.loadURL('http://localhost:4200');

  // Open DevTools in development
  if (process.env.NODE_ENV !== 'production') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createServer();
  createWebSocketServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (wss) {
      wss.close();
    }
    if (wssHttps) {
      wssHttps.close();
    }
    if (server) {
      server.close();
    }
    if (httpsServer) {
      httpsServer.close();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (wss) {
    wss.close();
  }
  if (wssHttps) {
    wssHttps.close();
  }
  if (server) {
    server.close();
  }
  if (httpsServer) {
    httpsServer.close();
  }
});

