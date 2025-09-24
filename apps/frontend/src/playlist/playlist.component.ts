import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlaylistItem, PlaylistService } from './playlist.service';

@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss'],
})
export class PlaylistComponent implements OnInit, AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly playlistService = inject(PlaylistService);

  @ViewChildren('videoItem') videoItems!: QueryList<ElementRef>;

  protected playlist$ = this.playlistService.playlist$
  protected currentIndex = 0;
  protected error = '';

  ngAfterViewInit() {
    this.videoItems.changes
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.scrollToCurrent());
    this.scrollToCurrent();
  }

  ngOnInit() {

    this.playlistService.currentIndex$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((index) => {
        this.currentIndex = index;
      });
  }

  protected selectVideoIndex(index: number) {
    this.playlistService.setCurrentIndex(index);
  }

  protected selectVideo(index: number) {
    this.currentIndex = index;
    this.scrollToCurrent();
  }

  protected scrollToCurrent() {
    const items = this.videoItems.toArray();
    if (items[this.currentIndex]) {
      items[this.currentIndex].nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }
}
