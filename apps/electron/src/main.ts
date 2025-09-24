import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { setupHandlers } from './handlers';

setupHandlers();

let mainWindow: BrowserWindow;

// Handle Electron's app lifecycle events
app.whenReady().then(() => {
  createWindow();
});

// Quit when all windows are closed (except on macOS where the app stays active)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Recreate window when the app is activated (macOS behavior)
app.on('activate', () => {
  if (mainWindow) {
    return;
  }
  createWindow();
  mainWindow.on('closed', () => {
    mainWindow = null; // Clean up when window is closed
  });
});

function createWindow() {
  const indexPath =
    process.env.NODE_ENV === 'development'
      ? createWindowForDev()
      : createWindowForProd();

  mainWindow.loadURL(`file://${indexPath}`);
}

function createWindowForDev() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // For security, disable node integration
      contextIsolation: true, // Isolate context for security
      preload: path.join(__dirname, 'preload.js'), // Preload script
    },
  });

  return path.join(
    __dirname,
    '../../../../../',
    'dist/frontend/browser/index.html'
  );
}

function createWindowForProd() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // For security, disable node integration
      contextIsolation: true, // Isolate context for security
      preload: path.join(
        process.resourcesPath,
        'app.asar',
        'dist/electron/apps/electron/src',
        'preload.js'
      ),
    },
  });

  return path.join(
    process.resourcesPath,
    'app.asar',
    'dist',
    'frontend',
    'browser',
    'index.html'
  );
}
