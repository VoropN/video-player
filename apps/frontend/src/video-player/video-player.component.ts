import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PlaylistService } from '../playlist/playlist.service';

const PLAYBACK_SPEED_KEY = 'video-playback-speed';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
})
export class VideoPlayerComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly playlistService = inject(PlaylistService);

  private shouldSeekOnLoad = false;
  private pendingSeekTime?: number;

  @ViewChild('videoElement', { static: false })
  videoRef!: ElementRef<HTMLVideoElement>;

  private get video(): HTMLVideoElement {
    return this.videoRef.nativeElement;
  }

  readonly playlist = toSignal(this.playlistService.playlist$, {
    initialValue: [],
  });
  readonly currentIndex = toSignal(this.playlistService.currentIndex$, {
    initialValue: 0,
  });
  readonly range = {
    min: 0.5,
    max: 3,
    step: 0.1,
  };

  readonly currentVideo = computed(() => this.playlist()[this.currentIndex()]);
  readonly playbackSpeed = signal(this.loadPlaybackSpeed());

  constructor() {
    effect(() => {
      if (this.currentVideo()?.url) {
        const progress = this.currentVideo()?.progress;
        this.shouldSeekOnLoad = progress !== undefined;
        this.pendingSeekTime = progress;
        setTimeout(() => this.tryPlay(), 100);
      }
    });
  }

  ngOnInit() {
    this.playlistService.refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.seekToSavedProgress();
      });
  }

  protected setPlaybackSpeed(event: Event): void {
    const select = event.target as HTMLInputElement;
    const speed = parseFloat(select.value);
    console.log('Setting speed to', speed);
    if (speed) {
      this.playbackSpeed.set(speed);
      if (this.video) this.video.playbackRate = speed;
      localStorage.setItem(PLAYBACK_SPEED_KEY, speed.toString());
    }
  }

  protected onLoadedMetadata(): void {
    const video = this.video;
    const speed = this.playbackSpeed();
    const current = this.currentVideo();

    video.playbackRate = speed;

    if (
      this.shouldSeekOnLoad &&
      this.pendingSeekTime !== undefined &&
      current
    ) {
      const time = (this.pendingSeekTime / 100) * video.duration;
      if (!isNaN(time) && time > 0 && time < video.duration) {
        video.currentTime = time;
      }
    }

    this.shouldSeekOnLoad = false;
    this.pendingSeekTime = undefined;

    this.playVideo();
  }

  protected onTimeUpdate(): void {
    const current = this.currentVideo();
    if (!current || !this.video.duration) return;

    const progress = (this.video.currentTime / this.video.duration) * 100;
    this.playlistService.updateProgress(current, progress);
  }

  protected prevVideo(): void {
    const index = this.currentIndex();
    if (index > 0) {
      this.playlistService.setCurrentIndex(index - 1);
    }
  }

  protected nextVideo(): void {
    const index = this.currentIndex();
    if (index < this.playlist().length - 1) {
      this.playlistService.setCurrentIndex(index + 1);
    }
  }

  protected toggleVideo(): void {
    if (this.video.paused) {
      this.video.play();
    } else {
      this.video.pause();
    }
  }

  private tryPlay(): void {
    if (this.currentVideo()) {
      this.video.play().catch((e) => console.warn('Playback error:', e));
    }
  }

  private playVideo(): void {
    const speed = this.playbackSpeed();
    this.video.playbackRate = speed;
    this.video.play().catch((err) => console.warn('Autoplay failed:', err));
  }

  private seekToSavedProgress(): void {
    const current = this.currentVideo();
    if (!current?.progress || !this.video.duration) return;

    const time = (current.progress / 100) * this.video.duration;
    if (!isNaN(time) && time > 0 && time < this.video.duration) {
      this.video.currentTime = time;
    }
  }

  private loadPlaybackSpeed(): number {
    const saved = parseFloat(localStorage.getItem(PLAYBACK_SPEED_KEY) ?? '1');
    return saved > 0.5 ? saved : 1;
  }
}
