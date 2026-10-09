const { app, BrowserWindow, shell, session, desktopCapturer } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1080,
    height: 720,
    minWidth: 940,
    minHeight: 640,
    title: 'S2DIO Control Room',
    backgroundColor: '#07080a',
    autoHideMenuBar: true,
    show: false, // show gracefully when ready
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Enables local VST3 loopback on ws://127.0.0.1:4949
    },
  });

  win.removeMenu();

  // Handle getDisplayMedia (Screen / DAW sharing in Electron)
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
      // Find a window with "FL Studio", "Ableton", "Cubase", "Reaper" or pick primary screen
      const dawSource = sources.find(s => /fl studio|ableton|cubase|reaper|studio one|bitwig/i.test(s.name)) || sources[0];
      callback({ video: dawSource });
    }).catch((err) => {
      console.error('desktopCapturer error:', err);
      callback({});
    });
  });

  // Automatically grant camera, mic, and screen capture permissions
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });

  win.once('ready-to-show', () => {
    win.show();
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
