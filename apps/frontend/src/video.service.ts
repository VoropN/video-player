import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

export type VideoItem = {
  url: string;
  title: string;
  filePath: string;
};

export type FolderConfig = {
  current: string;
  paths: string[];
};

declare global {
  interface Window {
    electron: {
      getFolders: () => Promise<FolderConfig>;
      setFolder: () => Promise<string>;
      getVideos: () => Promise<VideoItem[]>;
      getVideoFile: (filename: string) => Promise<string>;
    };
  }
}

@Injectable({ providedIn: 'root' })
export class VideoService {
  getFolders() {
    return from(window.electron.getFolders());
  }

  setFolder() {
    return from(window.electron.setFolder());
  }

  getVideos() {
    return window.electron.getVideos();
  }

  getVideoFile(filename: string): Observable<string> {
    return from(window.electron.getVideoFile(filename));
  }
}
