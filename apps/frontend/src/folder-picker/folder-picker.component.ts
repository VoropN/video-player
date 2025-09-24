import { Component, inject } from '@angular/core';
import { PlaylistService } from '../playlist/playlist.service';
import { VideoService } from '../video.service';

@Component({
  selector: 'app-folder-picker',
  templateUrl: './folder-picker.component.html',
  styleUrls: ['./folder-picker.component.scss'],
})
export class FolderPickerComponent {
  private readonly videoService = inject(VideoService);
  private readonly playlistService = inject(PlaylistService);

  protected folderPath = '';

  protected async openFolderDialog() {
    try {
      const folderPath = await this.videoService.setFolder();

      if (folderPath) {
        this.folderPath = folderPath.current;
        this.playlistService.loadVideos();
      }
    } catch (err) {
      console.error('Failed to select folder:', err);
    }
  }
}
