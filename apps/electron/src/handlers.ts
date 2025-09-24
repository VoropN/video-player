import { dialog, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { loadFolderConfig, saveFolderConfig } from './file-path';

// 📁 IPC Handlers
export function setupHandlers() {
  ipcMain.handle('get-folders', () => {
    return loadFolderConfig();
  });

  // 📁 IPC Handler to set or add a new folder
  ipcMain.handle('set-folder', async () => {
    const config = loadFolderConfig();
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
      });
      const newPath = result.canceled ? null : result.filePaths[0];

      if (!newPath) {
        return null;
      }

      if (!config.paths.includes(newPath)) {
        config.paths.push(newPath);
      }

      config.current = newPath;
      saveFolderConfig(config);

      return newPath;
    } catch (error) {
      console.error('Dialog error:', error);
      throw error;
    }
  });

  // 🎬 IPC Handler to get videos in the current folder
  ipcMain.handle('get-videos', () => {
    const config = loadFolderConfig();
    const videoDir = config.current || config.paths[0] || '';

    if (!videoDir) return [];

    try {
      const files = fs.readdirSync(videoDir);

      // Generate an array of videos with full file paths (relative or absolute URLs)
      return files
        .filter((file) =>
          ['.mp4', '.webm', '.ogg', '.mov'].includes(
            path.extname(file).toLowerCase()
          )
        )
        .sort(
          new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
            .compare
        )
        .map((filename) => {
          // Absolute path for video
          const filePath = path.join(videoDir, filename);

          return {
            title: filename,
            filePath,
            url: `file://${filePath}`, // URL reflecting file path
          };
        });
    } catch (err) {
      console.error('Error reading video directory', err);
      return [];
    }
  });

  // 🎬 IPC Handler to serve videos
  ipcMain.handle('get-video-file', (event, filename: string) => {
    const config = loadFolderConfig();
    const videoDir = config.current || config.paths[0] || '';
    const filePath = path.join(videoDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    return filePath; // Send the path to the file, renderer will handle file serving
  });
}
