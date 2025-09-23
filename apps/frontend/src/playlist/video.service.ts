import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type VideoItem = {
  url: string;
  title: string;
};
@Injectable({ providedIn: 'root' })
export class VideoService {
  private apiUrl = '/api/videos/';

  constructor(private http: HttpClient) {}

  getVideos(): Observable<VideoItem[]> {
    return this.http.get<VideoItem[]>(this.apiUrl);
  }
}
