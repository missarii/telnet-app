import {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  Tray,
  Menu,
  nativeImage,
  session,
} from 'electron';
import path from 'path';
import { getSources } from './screen-capture';

const isDev = process.env.NODE_ENV !== 'production';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createTrayIcon(): Tray {
  // Create a simple 16x16 icon programmatically (white circle on transparent)
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAEUSURBVDiNpZM9SwNBEIbf2d3kEoMLFoKFkMJCsBIsBAtBrCwEK8FCsBAsLAQLwUKwECwEC8FCsBAsBAv5AQYSyJHL3e7OzlgkmkvuEHzgYZmZ9513hwEA/hUAQERsAFgDkADoAegAmMzsXkR2ReQSwLGqagwAVPVCRCoAG1X1t6pOVfXHzJy7+8DdIyLH3nsBIMuyLQBQ1a2IpFmWAUBd1/U+gL2UUkoAkFJK2wB2nHMnzrkDABCRhYjoEMJcRFYBrAA4BHAGoAZwBWAJ4BjAPoBTAHcAbgBc/wIws8fMHiLiHsCciHgAcO7uERHxJCLiZ0Zk5BMRMY+IiHlERMwjImIeERHziIiYR0TEPBIAAABJRU5ErkJggg=='
  );
  const trayInstance = new Tray(icon);
  trayInstance.setToolTip('Telnet — Screen Sharing');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: 'Stop Sharing',
      click: () => {
        mainWindow?.webContents.send('share-stopped');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  trayInstance.setContextMenu(contextMenu);

  trayInstance.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  return trayInstance;
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0a0a0a',
    show: false,
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  // Set Content-Security-Policy
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "media-src 'self' blob: mediastream:; " +
            "connect-src 'self' ws: wss: http: https:; " +
            "img-src 'self' data: blob:;",
        ],
      },
    });
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  // Hide to tray on close instead of quitting
  win.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });

  return win;
}

// Register desktopCapturer permissions
function setupPermissions(): void {
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      const allowedPermissions = ['media', 'display-capture', 'screen'];
      if (allowedPermissions.includes(permission)) {
        callback(true);
      } else {
        callback(false);
      }
    }
  );

  session.defaultSession.setDisplayMediaRequestHandler(
    (_request, callback) => {
      desktopCapturer
        .getSources({ types: ['screen', 'window'] })
        .then((sources) => {
          callback({ video: sources[0], audio: 'loopback' });
        })
        .catch(() => {
          callback({});
        });
    }
  );
}

// IPC Handlers
function setupIpcHandlers(): void {
  ipcMain.handle('get-sources', async () => {
    return getSources();
  });

  ipcMain.handle('start-capture', async (_event, sourceId: string) => {
    mainWindow?.webContents.send('share-started', { sourceId });
    return { success: true, sourceId };
  });

  ipcMain.handle('stop-capture', async () => {
    mainWindow?.webContents.send('share-stopped');
    return { success: true };
  });
}

// Extend app type for quitting flag
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Electron {
    interface App {
      isQuitting: boolean;
    }
  }
}

app.isQuitting = false;

app.whenReady().then(() => {
  setupPermissions();
  setupIpcHandlers();

  mainWindow = createWindow();
  tray = createTrayIcon();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
