import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PlaylistComponent } from '../playlist/playlist.component';
import { VideoPlayerComponent } from '../video-player/video-player.component';

@Component({
  imports: [RouterModule, VideoPlayerComponent, PlaylistComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true,
})
export class App {
  protected title = 'frontend';
}
