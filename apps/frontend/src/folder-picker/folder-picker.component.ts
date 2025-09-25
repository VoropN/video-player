import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { map, withLatestFrom } from 'rxjs';
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
    const previous$ = this.folderPath$;
    this.folderPath$ = this.videoService.setFolder().pipe(
      withLatestFrom(previous$),
      map(([folder, previos]) => {
        if (folder) {
          this.playlistService.loadVideos();
          return folder;
        }
        return previos;
      })
    );
  }
}
