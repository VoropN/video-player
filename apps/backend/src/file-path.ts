import * as fs from 'fs';
import * as path from 'path';

const storageFile = path.resolve(
  process.cwd(),
  'apps/backend/folder-paths.json'
);

type FolderConfig = {
  current: string;
  paths: string[];
};

export function loadFolderConfig(): FolderConfig {
  if (!fs.existsSync(storageFile)) {
    return { current: '', paths: [] };
  }

  try {
    const data = fs.readFileSync(storageFile, 'utf-8');
    return JSON.parse(data) as FolderConfig;
  } catch {
    return { current: '', paths: [] };
  }
}

export function saveFolderConfig(config: FolderConfig) {
  fs.writeFileSync(storageFile, JSON.stringify(config, null, 2));
}
