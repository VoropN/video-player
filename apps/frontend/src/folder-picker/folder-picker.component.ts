import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { map, tap } from 'rxjs';
import { PlaylistService } from '../playlist/playlist.service';
import { VideoService } from '../video.service';

@Component({
  selector: 'app-folder-picker',
  templateUrl: './folder-picker.component.html',
  styleUrls: ['./folder-picker.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class FolderPickerComponent {
  private readonly videoService = inject(VideoService);
  private readonly playlistService = inject(PlaylistService);

  protected folderPath$ = this.videoService
    .getFolders()
    .pipe(map((f) => f.current));

  protected openFolderDialog() {
    this.folderPath$ = this.videoService.setFolder().pipe(
      tap((f) => {
        this.playlistService.loadVideos();
      })
    );
  }
}
