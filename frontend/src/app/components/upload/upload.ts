import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.html',
  styleUrls: ['./upload.css']
})
export class UploadComponent {

  selectedFile: File | null = null;
  progress = 0;

  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    console.log("Selected file:", this.selectedFile);
  }

  upload() {
    if (!this.selectedFile) {
      alert("No file selected");
      return;
    }

    const form = new FormData();
    form.append('file', this.selectedFile);

    this.http.post('/api/documents', form, {
      observe: 'events',
      reportProgress: true
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.progress = Math.round(100 * (event.loaded / (event.total || 1)));
        }

        if (event.type === HttpEventType.Response) {
          alert("Upload successful");
          this.progress = 0;
        }
      },
      error: (err) => {
        console.error("Upload error:", err);
        alert("Upload failed");
      }
    });
  }
}
