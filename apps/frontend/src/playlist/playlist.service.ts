import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { VideoItem } from './video.service';

export interface PlaylistItem {
  id: string;
  title: string;
  url: string;
  watched: boolean;
  progress: number; // percent (0–100)
}

@Injectable({ providedIn: 'root' })
export class PlaylistService {
  private playlistSubject = new BehaviorSubject<PlaylistItem[]>([]);
  private currentIndexSubject = new BehaviorSubject<number>(0);
  private refreshSubject = new BehaviorSubject<void>(undefined);

  playlist$ = this.playlistSubject.asObservable();
  currentIndex$ = this.currentIndexSubject.asObservable();
  refresh$ = this.refreshSubject.asObservable();

  private PROGRESS_KEY = 'playlist-progress';
  private INDEX_KEY = 'playlist-current-index';

  setPlaylistFromItems(items: VideoItem[]): void {
    const savedProgress = this.loadProgressFromStorage();
    const savedIndex = this.loadCurrentIndexFromStorage();

    const playlist: PlaylistItem[] = items.map((item, index) => {
      const id = (index + 1).toString();
      const saved = savedProgress[id];
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
    localStorage.setItem(this.INDEX_KEY, index.toString());

    if (index === current) {
      this.refreshSubject.next(); // re-trigger seek if same video clicked
    }
  }

  updateProgress(id: string, progress: number): void {
    const playlist = this.playlistSubject.getValue();
    const idx = playlist.findIndex((item) => item.id === id);

    if (idx !== -1) {
      playlist[idx].progress = progress;
      playlist[idx].watched = progress >= 95;
      this.playlistSubject.next([...playlist]);
      this.saveProgressToStorage(playlist);
    }
  }

  private saveProgressToStorage(playlist: PlaylistItem[]): void {
    const data: Record<string, { progress: number; watched: boolean }> = {};
    playlist.forEach((item) => {
      data[item.id] = {
        progress: item.progress,
        watched: item.watched,
      };
    });
    localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(data));
  }

  private loadProgressFromStorage(): Record<
    string,
    { progress: number; watched: boolean }
  > {
    try {
      const raw = localStorage.getItem(this.PROGRESS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private loadCurrentIndexFromStorage(): number {
    const raw = localStorage.getItem(this.INDEX_KEY);
    const parsed = parseInt(raw || '0', 10);
    return isNaN(parsed) ? 0 : parsed;
  }
}
