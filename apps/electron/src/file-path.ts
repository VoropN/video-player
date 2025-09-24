import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const userDataPath = app.getPath('userData');
const filePath = path.join(userDataPath, 'folder-paths.json'); // File path outside app.asar

// Ensure the directory exists
const directoryPath = path.dirname(filePath);
if (!fs.existsSync(directoryPath)) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

type FolderConfig = {
  current: string;
  paths: string[];
};

export function loadFolderConfig(): FolderConfig {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as FolderConfig;
  } catch {
    const data = { current: '', paths: [] };
    saveFolderConfig(data);
    return data;
  }
}

export function saveFolderConfig(config: FolderConfig) {
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
}
