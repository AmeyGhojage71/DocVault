import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadComponent } from '../../components/upload/upload.component';
import { DocumentListComponent } from '../../components/document-list/document-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, UploadComponent, DocumentListComponent],
  template: `
    <div class="page-container section animate-in">
      <div class="home-grid">
        <!-- Upload Panel -->
        <aside class="upload-panel">
          <app-upload (uploadComplete)="onUploadComplete()"></app-upload>
        </aside>
        <!-- Document List Panel -->
        <main class="list-panel">
          <app-document-list></app-document-list>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .home-grid {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 24px;
      align-items: start;
    }

    .upload-panel {
      position: sticky;
      top: 80px;
    }

    @media (max-width: 900px) {
      .home-grid {
        grid-template-columns: 1fr;
      }
      .upload-panel { position: static; }
    }
  `]
})
export class HomeComponent {
  refreshTrigger = 0;

  onUploadComplete(): void {
    this.refreshTrigger++;
  }
}
