import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { catchError, of, Subscription } from 'rxjs';
import { PlaylistItem, PlaylistService } from './playlist.service';
import { VideoService } from './video.service';

@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss'],
})
export class PlaylistComponent implements OnInit, AfterViewInit {
  @ViewChildren('videoItem') videoItems!: QueryList<ElementRef>;

  playlist: PlaylistItem[] = [];
  currentIndex = 0;
  error = '';
  private sub?: Subscription;

  constructor(
    private playlistService: PlaylistService,
    private videoService: VideoService
  ) {}

  ngAfterViewInit() {
    // When the QueryList changes (e.g., DOM updates), scroll the selected item
    this.sub = this.videoItems.changes.subscribe(() => this.scrollToCurrent());

    // Initial scroll on first load
    this.scrollToCurrent();
  }

  ngOnInit() {
    // Fetch raw URLs from backend
    this.videoService
      .getVideos()
      .pipe(
        catchError((err) => {
          this.error = 'Failed to load playlist';
          console.error(err);
          return of([]);
        })
      )
      .subscribe((urls) => {
        this.playlistService.setPlaylistFromItems(urls);
      });

    // Subscribe to playlist & currentIndex from PlaylistService
    this.playlistService.playlist$.subscribe((list) => {
      this.playlist = list;
    });

    this.playlistService.currentIndex$.subscribe((index) => {
      this.currentIndex = index;
    });
  }

  selectVideoIndex(index: number) {
    this.playlistService.setCurrentIndex(index);
  }

  selectVideo(index: number) {
    this.currentIndex = index;
    this.scrollToCurrent();
  }

  scrollToCurrent() {
    const items = this.videoItems.toArray();
    if (items[this.currentIndex]) {
      items[this.currentIndex].nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
