import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { loadFolderConfig, saveFolderConfig } from './file-path';

const app = express();
const port = process.env.PORT || 3333;
app.use(express.json());

let folderConfig = loadFolderConfig();
let videoDir = folderConfig.current || folderConfig.paths[0] || '';

// 📁 GET all paths and current one
app.get('/api/folders', (_req, res) => {
  return res.json({
    current: folderConfig.current,
    paths: folderConfig.paths,
  });
});

// 📁 POST set or add new folder
app.post('/api/set-folder', (req, res) => {
  const { path: newPath } = req.body;

  if (!newPath) {
    return res.status(400).json({ error: 'Missing "path" in body' });
  }

  if (!folderConfig.paths.includes(newPath)) {
    folderConfig.paths.push(newPath);
  }

  folderConfig.current = newPath;
  videoDir = newPath;
  saveFolderConfig(folderConfig);

  return res.json({ message: 'Folder set', current: newPath });
});

app.post('/api/set-folder', express.json(), (req, res) => {
  const { path: newPath } = req.body;

  if (!newPath) {
    return res.status(400).json({ error: 'Missing "path" in body' });
  }

  videoDir = newPath;

  // 🟡 Load previous config
  const config = loadFolderConfig();

  // 🟡 Update current and ensure path is included in history
  config.current = newPath;
  if (!config.paths.includes(newPath)) {
    config.paths.push(newPath);
  }

  // 🟡 Save updated config
  saveFolderConfig(config);

  return res.json({
    message: 'Folder path updated',
    path: newPath,
  });
});

// 🎬 GET videos in current folder
app.get('/api/videos', (req, res) => {
  if (!videoDir) return res.json([]);

  fs.readdir(videoDir, (err, files) => {
    if (err) {
      console.error('Error reading video directory', err);
      return res.status(500).json({ error: 'Could not read video directory' });
    }

    const videoFiles = files
      .filter((f) =>
        ['.mp4', '.webm', '.ogg'].includes(path.extname(f).toLowerCase())
      )
      .sort(
        new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
          .compare
      )
      .map((title) => ({ url: `/api/videos/${title}`, title }));

    res.json(videoFiles);
  });
});

// 🎬 Serve videos dynamically
app.get('/api/videos/:filename', (req, res) => {
  const file = req.params.filename;
  const filePath = path.join(videoDir, file);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  res.sendFile(filePath);
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
