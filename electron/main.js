const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: 'S2DIO Control Room',
    backgroundColor: '#07080a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Enables local VST3 loopback on ws://127.0.0.1:4949 without HTTPS mixed-content blocks
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#07080a',
      symbolColor: '#f4f4f6',
      height: 36,
    },
  });

  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000/session/studio';
  win.loadURL(startUrl);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
