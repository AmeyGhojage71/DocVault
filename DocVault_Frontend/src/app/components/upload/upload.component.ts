import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';
import { UploadProgress } from '../../models/document.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  styles: [`
        .page {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding-top: 60px;
        }

        .card {
            background: #141414;
            border: 1px solid #222;
            border-radius: 16px;
            padding: 36px;
            width: 100%;
            max-width: 520px;
        }

        h2 {
            font-size: 22px;
            font-weight: 700;
            color: #f0f0f0;
            margin-bottom: 4px;
        }

        .subtitle {
            font-size: 13px;
            color: #666;
            margin-bottom: 24px;
        }

        .drop-zone {
            border: 1.5px dashed #333;
            border-radius: 12px;
            padding: 40px 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            transition: border-color 0.2s, background 0.2s;
            margin-bottom: 20px;
        }
        .drop-zone:hover, .drop-zone.drag-over {
            border-color: var(--gold);
            background: rgba(200,137,26,0.05);
        }
        .drop-zone.has-file {
            border-color: #22c55e;
            background: rgba(34,197,94,0.05);
        }

        .upload-icon-box {
            width: 56px;
            height: 56px;
            background: #1e1a12;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            margin-bottom: 4px;
        }

        .drop-primary {
            font-size: 15px;
            font-weight: 600;
            color: #f0f0f0;
            margin: 0;
        }

        .browse-link {
            color: #4a9eff;
            cursor: pointer;
        }

        .drop-types {
            font-size: 12px;
            color: #555;
            margin: 0;
        }

        .file-selected-name {
            font-size: 14px;
            font-weight: 600;
            color: var(--gold);
        }

        .file-selected-size {
            font-size: 12px;
            color: #666;
        }

        /* Progress */
        .progress-bar-wrap {
            background: #1e1e1e;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 16px;
        }
        .progress-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #888;
            margin-bottom: 8px;
        }
        .progress-track {
            height: 4px;
            background: #2a2a2a;
            border-radius: 4px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: var(--gold);
            border-radius: 4px;
            transition: width 0.3s;
        }
        .progress-fill.success { background: #22c55e; }
        .progress-fill.error   { background: #ef4444; }
        .progress-status { font-size: 12px; margin-top: 6px; color: #888; }
        .progress-status.success { color: #22c55e; }
        .progress-status.error   { color: #ef4444; }

        /* Upload button */
        .upload-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 13px;
            border-radius: 10px;
            background: linear-gradient(135deg, #c8891a, #9a6210);
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            font-family: 'Inter', sans-serif;
            border: none;
            cursor: pointer;
            transition: filter 0.2s, opacity 0.2s;
        }
        .upload-btn:hover:not(:disabled) { filter: brightness(1.1); }
        .upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    `],
  template: `
        <div class="page">
            <div class="card">
                <h2>Upload Document</h2>
                <p class="subtitle">Securely store your files in Azure Blob Storage</p>

                <!-- Drop Zone -->
                <div class="drop-zone"
                     [class.drag-over]="isDragOver"
                     [class.has-file]="pendingFile"
                     (dragover)="onDragOver($event)"
                     (dragleave)="isDragOver = false"
                     (drop)="onDrop($event)"
                     (click)="fileInput.click()">

                    <input #fileInput type="file" hidden (change)="onFileSelected($event)" accept="*/*">

                    <ng-container *ngIf="!pendingFile">
                        <div class="upload-icon-box">⬆️</div>
                        <p class="drop-primary">
                            Drag &amp; drop your file here<br>
                            <span class="browse-link">or browse to choose</span>
                        </p>
                        <p class="drop-types">PDF, DOCX, XLSX, JPG, PNG and more</p>
                    </ng-container>

                    <ng-container *ngIf="pendingFile">
                        <div class="upload-icon-box">📄</div>
                        <p class="file-selected-name">{{ pendingFile.name }}</p>
                        <p class="file-selected-size">{{ formatSize(pendingFile.size) }}</p>
                    </ng-container>
                </div>

                <!-- Progress -->
                <div class="progress-bar-wrap" *ngIf="uploadProgress">
                    <div class="progress-row">
                        <span>{{ uploadProgress.fileName }}</span>
                        <span>{{ uploadProgress.progress }}%</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill"
                             [class.success]="uploadProgress.status === 'success'"
                             [class.error]="uploadProgress.status === 'error'"
                             [style.width.%]="uploadProgress.progress"></div>
                    </div>
                    <p class="progress-status"
                       [class.success]="uploadProgress.status === 'success'"
                       [class.error]="uploadProgress.status === 'error'">
                        <ng-container [ngSwitch]="uploadProgress.status">
                            <span *ngSwitchCase="'success'">✓ Uploaded successfully</span>
                            <span *ngSwitchCase="'error'">✗ {{ uploadProgress.error }}</span>
                            <span *ngSwitchDefault>Uploading...</span>
                        </ng-container>
                    </p>
                </div>

                <!-- Upload Button -->
                <button class="upload-btn" (click)="upload()"
                        [disabled]="!pendingFile || isUploading">
                    ⬆ {{ isUploading ? 'Uploading...' : 'Upload File' }}
                </button>
            </div>
        </div>
    `
})
export class UploadComponent {
  pendingFile: File | null = null;
  isDragOver = false;
  isUploading = false;
  uploadProgress: UploadProgress | null = null;

  constructor(private docService: DocumentService, private router: Router) { }

  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragOver = true; }
  onDrop(e: DragEvent) {
    e.preventDefault(); this.isDragOver = false;
    const f = e.dataTransfer?.files;
    if (f?.length) this.pendingFile = f[0];
  }
  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) this.pendingFile = input.files[0];
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  upload() {
    if (!this.pendingFile || this.isUploading) return;
    this.isUploading = true;
    this.uploadProgress = null;

    this.docService.uploadWithProgress(this.pendingFile, []).subscribe({
      next: (progress) => {
        this.uploadProgress = progress;
        if (progress.status === 'success') {
          this.isUploading = false;
          setTimeout(() => {
            this.pendingFile = null;
            this.uploadProgress = null;
            this.router.navigate(['/documents']);
          }, 1500);
        }
        if (progress.status === 'error') this.isUploading = false;
      }
    });
  }
}
