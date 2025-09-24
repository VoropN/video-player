import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { VideoItem, VideoService } from '../video.service';

export interface PlaylistItem {
  id: string;
  title: string;
  url: string;
  watched: boolean;
  progress: number; // percent (0–100)
}

const PROGRESS_KEY = 'playlist-progress';
const INDEX_KEY = 'playlist-current-index';

@Injectable({ providedIn: 'root' })
export class PlaylistService {
  private readonly videoService = inject(VideoService);
  private readonly playlistSubject = new BehaviorSubject<PlaylistItem[]>([]);
  private readonly currentIndexSubject = new BehaviorSubject<number>(0);
  private readonly refreshSubject = new BehaviorSubject<void>(undefined);

  playlist$ = this.playlistSubject.asObservable();
  currentIndex$ = this.currentIndexSubject.asObservable();
  refresh$ = this.refreshSubject.asObservable();

  async loadVideos() {
    try {
      const items = await this.videoService.getVideos();
      this.setPlaylistFromItems(items);
    } catch (err) {
      console.error('Failed to load videos:', err);
      this.playlistSubject.next([]);
    }
  }

  setPlaylistFromItems(items: VideoItem[]): void {
    const folder = this.getFolderFromItem(items[0]);
    const savedProgress = new Map(
      this.loadProgressFromStorage(folder).map((x) => [x.id, x])
    );
    const savedIndex = this.loadCurrentIndexFromStorage();

    const playlist: PlaylistItem[] = items.map((item) => {
      const id = item.filePath;
      const saved = savedProgress.get(id);
      return {
        id,
        title: item.title,
        url: item.url,
        watched: saved?.watched || false,
        progress: saved?.progress || 0,
      };
    });

    this.playlistSubject.next(playlist);

    const validIndex = Math.min(savedIndex, playlist.length - 1);
    this.currentIndexSubject.next(validIndex);
  }

  setCurrentIndex(index: number): void {
    const current = this.currentIndexSubject.getValue();
    this.currentIndexSubject.next(index);
    localStorage.setItem(INDEX_KEY, index.toString());

    if (index === current) {
      this.refreshSubject.next(); // re-trigger seek if same video clicked
    }
  }

  updateProgress(item: PlaylistItem, progress: number): void {
    const playlist = this.playlistSubject.getValue();
    item.progress = progress;
    item.watched = progress >= 95;
    const items = playlist.map((x) => (x.id === item.id ? item : x));
    const folder = this.getFolderFromItem(item);
    this.saveProgressToStorage(items, folder);
  }

  private getFolderFromItem(item: { id?: string; filePath?: string }): string {
    return (item.id || item.filePath || '').split('/').slice(0, -1).join(''); // get parent folder name
  }

  private saveProgressToStorage(items: PlaylistItem[], folder: string): void {
    localStorage.setItem(PROGRESS_KEY + folder, JSON.stringify(items));
  }

  private loadProgressFromStorage(folder: string): PlaylistItem[] {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY + folder);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private loadCurrentIndexFromStorage(): number {
    const raw = localStorage.getItem(INDEX_KEY);
    const parsed = parseInt(raw || '0', 10);
    return isNaN(parsed) ? 0 : parsed;
  }
}
