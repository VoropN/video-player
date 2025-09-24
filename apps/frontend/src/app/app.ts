import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FolderPickerComponent } from '../folder-picker/folder-picker.component';
import { PlaylistComponent } from '../playlist/playlist.component';
import { PlaylistService } from '../playlist/playlist.service';
import { VideoPlayerComponent } from '../video-player/video-player.component';

@Component({
  imports: [
    RouterModule,
    VideoPlayerComponent,
    PlaylistComponent,
    FolderPickerComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true,
})
export class App implements OnInit {
  private readonly playlistService = inject(PlaylistService);

  ngOnInit(): void {
    this.playlistService.loadVideos();
  }

  protected onFolderUpdated(): void {
    this.playlistService.loadVideos();
  }
}
