import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './upload.html',
  styleUrls: ['./upload.css']
})
export class Upload {

  selectedFile!: File;

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  upload() {
    if (!this.selectedFile) return;
    this.uploading.set(true);
    this.error.set('');
    this.success.set(false);

    this.docService.upload(this.selectedFile).subscribe({
      next: () => {
        this.uploading.set(false);
        this.success.set(true);
        this.selectedFile = null;
      },
      error: (err) => {
        this.uploading.set(false);
        this.error.set(err?.error?.message ?? 'Upload failed. Please try again.');
      }
    });
  }

  clearFile() {
    this.selectedFile = null;
    this.success.set(false);
    this.error.set('');
  }
}
