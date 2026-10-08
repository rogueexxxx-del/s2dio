const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1024,
    minHeight: 720,
    title: 'S2DIO Studio Control Room',
    backgroundColor: '#07080a',
    autoHideMenuBar: true,
    frame: true, // Standard native dark frame ensures Windows controls never collide with UI
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Enables local VST3 loopback on ws://127.0.0.1:4949 without HTTPS mixed-content blocks
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
