import express from 'express';

import * as fs from 'fs';
import * as path from 'path';

const app = express();
const port = process.env.PORT || 3333;

// Path to videos folder
const videoDir = path.join(
  __dirname,
  '../../../../../../../../nick/MyFiles/Files/typescript/Advanced TypeScript Patterns'
);
console.log('Serving videos from', videoDir);

// Serve video files statically via /videos
app.use('/api/videos', express.static(videoDir));

// API to list videos
app.get('/api/videos', (req, res) => {
  fs.readdir(videoDir, (err, files) => {
    if (err) {
      console.error('Error reading video directory', err);
      return res.status(500).json({ error: 'Could not read video directory' });
    }
    // Filter video files by extension
    const videoFiles = files
      .filter((f) => {
        const ext = path.extname(f).toLowerCase();
        return ['.mp4', '.webm', '.ogg'].includes(ext);
      })
      .sort(
        new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
          .compare
      )
      .map((title) => ({ url: `/api/videos/${title}`, title }));
    res.json(videoFiles);
  });
});

// app.get('/api/video/:filename', (req, res) => {
//   const filePath = path.join(videoDir, req.params.filename);
//
//   const stat = fs.statSync(filePath);
//   const fileSize = stat.size;
//   const range = req.headers.range;
//
//   if (range) {
//     const parts = range.replace(/bytes=/, "").split("-");
//     const start = parseInt(parts[0], 10);
//     const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
//     const chunkSize = (end - start) + 1;
//
//     const file = fs.createReadStream(filePath, { start, end });
//     const head = {
//       'Content-Range': `bytes ${start}-${end}/${fileSize}`,
//       'Accept-Ranges': 'bytes',
//       'Content-Length': chunkSize,
//       'Content-Type': 'video/mp4',
//     };
//
//     res.writeHead(206, head);
//     file.pipe(res);
//   } else {
//     const head = {
//       'Content-Length': fileSize,
//       'Content-Type': 'video/mp4',
//     };
//     res.writeHead(200, head);
//     fs.createReadStream(filePath).pipe(res);
//   }
// });

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
