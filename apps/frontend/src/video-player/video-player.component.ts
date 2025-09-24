import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PlaylistItem, PlaylistService } from '../playlist/playlist.service';

const PLAYBACK_SPEED_KEY = 'video-playback-speed';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
})
export class VideoPlayerComponent implements OnInit, OnDestroy {
  private readonly playlistService = inject(PlaylistService);

  @ViewChild('videoElement')
  private _videoRef!: ElementRef<HTMLVideoElement>;
  public get videoRef(): ElementRef<HTMLVideoElement> {
    return this._videoRef;
  }
  public set videoRef(value: ElementRef<HTMLVideoElement>) {
    this._videoRef = value;
  }

  playlist: PlaylistItem[] = [];
  currentIndex = 0;
  currentVideoUrl: string | null = null;
  playbackSpeed = 1;

  private subs = new Subscription();
  private shouldSeekOnLoad = false;
  private pendingSeekTime: number | null = null;
  validSpeeds = [0.5, 1, 1.25, 1.5, 2];

  ngOnInit() {
    const savedSpeed = localStorage.getItem(PLAYBACK_SPEED_KEY);
    const speed = savedSpeed ? parseFloat(savedSpeed) : 1;
    this.playbackSpeed = isNaN(speed) ? 1 : speed;

    // Subscribe to playlist updates but DO NOT reload video here
    this.subs.add(
      this.playlistService.playlist$.subscribe((list) => {
        this.playlist = list;
      })
    );

    // Subscribe to current index updates and update video only when index changes
    this.subs.add(
      this.playlistService.currentIndex$.subscribe((index) => {
        this.currentIndex = index;
        this.updateCurrentVideoUrl();

        // Prepare seeking after metadata load
        const current = this.playlist[this.currentIndex];
        if (current && current.progress) {
          this.pendingSeekTime = current.progress;
          this.shouldSeekOnLoad = true;
        } else {
          this.pendingSeekTime = null;
        }
      })
    );

    this.subs.add(
      this.playlistService.refresh$.subscribe(() => {
        this.seekToSavedProgress();
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  setPlaybackSpeed(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;
    const speed = parseFloat(value);

    if (!isNaN(speed)) {
      this.playbackSpeed = speed;
      if (this.videoRef?.nativeElement) {
        this.videoRef.nativeElement.playbackRate = this.playbackSpeed;
      }
      localStorage.setItem(PLAYBACK_SPEED_KEY, this.playbackSpeed.toString());
    }
  }

  // Only update video URL and play if URL changed
  private updateCurrentVideoUrl() {
    const current = this.playlist[this.currentIndex];
    const newUrl = current ? current.url : null;

    if (this.currentVideoUrl !== newUrl) {
      this.currentVideoUrl = newUrl;

      // Play video after Angular updates the binding (reduce delay to 100ms)
      setTimeout(() => {
        if (this.videoRef?.nativeElement && this.currentVideoUrl) {
          this.videoRef.nativeElement.play().catch((e) => {
            console.warn('Playback error', e);
          });
        }
      }, 100);
    }
  }

  playVideo() {
    const video = this.videoRef?.nativeElement;
    if (video) {
      video.playbackRate = this.playbackSpeed;
      video.play().catch((err) => {
        console.warn('Autoplay failed:', err);
      });
    }
  }

  onTimeUpdate() {
    const video = this.videoRef?.nativeElement;
    const current = this.playlist[this.currentIndex];
    if (video && current) {
      const progressPercent = (video.currentTime / video.duration) * 100;
      this.playlistService.updateProgress(current, progressPercent);
    }
  }

  onLoadedMetadata() {
    if (!this.shouldSeekOnLoad) return;

    const video = this.videoRef?.nativeElement;
    const current = this.playlist[this.currentIndex];
    if (video) {
      video.playbackRate = this.playbackSpeed;
    }
    if (video && this.pendingSeekTime !== null && current) {
      const time = (this.pendingSeekTime / 100) * video.duration;

      if (!isNaN(time) && time > 0 && time < video.duration) {
        video.currentTime = time;
      }
    }

    this.shouldSeekOnLoad = false;
    this.pendingSeekTime = null;

    // Play AFTER seek
    this.playVideo();
  }

  onEnded() {
    this.nextVideo();
  }

  private seekToSavedProgress() {
    const video = this.videoRef?.nativeElement;
    const current = this.playlist[this.currentIndex];
    if (video && current && current.progress) {
      const seekTime = (current.progress / 100) * video.duration;
      if (!isNaN(seekTime) && seekTime > 0 && seekTime < video.duration) {
        video.currentTime = seekTime;
      }
    }
  }

  prevVideo() {
    if (this.currentIndex > 0) {
      this.playlistService.setCurrentIndex(this.currentIndex - 1);
    }
  }

  nextVideo() {
    if (this.currentIndex < this.playlist.length - 1) {
      this.playlistService.setCurrentIndex(this.currentIndex + 1);
    }
  }

  // Called from playlist UI when user clicks a video
  selectVideo(index: number) {
    const video = this.videoRef?.nativeElement;
    if (!video) return;

    if (this.currentIndex === index) {
      // Toggle play/pause on same video
      if (video.paused) {
        video.play().catch((e) => console.warn('Playback error', e));
      } else {
        video.pause();
      }
    } else {
      // Switch video by updating current index through service
      this.playlistService.setCurrentIndex(index);
    }
  }
}
