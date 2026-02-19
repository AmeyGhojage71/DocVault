import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.html'
})
export class UploadComponent {

  selectedFile!: File;
  uploading = false;
  success = false;
  error = '';

  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  upload() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.uploading = true;
    this.success = false;
    this.error = '';

    this.http.post('/api/documents', formData).subscribe({
      next: () => {
        this.uploading = false;
        this.success = true;
      },
      error: (err: any) => {
        this.uploading = false;
        this.error = err?.error?.message || 'Upload failed';
      }
    });
  }
}
