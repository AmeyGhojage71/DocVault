import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DocumentService } from '../../services/document.service';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './upload.html',
  styleUrls: ['./upload.css']
})
export class Upload {
  selectedFile: File | null = null;
  uploading = signal(false);
  success = signal(false);
  error = signal('');
  dragOver = signal(false);

  get userName(): string {
    const account = this.msalService.instance.getActiveAccount()
      ?? this.msalService.instance.getAllAccounts()[0];
    return account?.name ?? account?.username ?? 'User';
  }

  constructor(private docService: DocumentService, private msalService: MsalService) { }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.setFile(input.files[0]);
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave() {
    this.dragOver.set(false);
  }

  setFile(file: File) {
    this.selectedFile = file;
    this.success.set(false);
    this.error.set('');
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getFileEmoji(name: string): string {
    const ext = (name.split('.').pop() ?? '').toLowerCase();
    if (ext === 'pdf') return '📕';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (['xls', 'xlsx'].includes(ext)) return '📗';
    if (['ppt', 'pptx'].includes(ext)) return '📙';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['zip', 'rar', '7z'].includes(ext)) return '🗜️';
    if (['html', 'css', 'js', 'ts'].includes(ext)) return '💻';
    return '📄';
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

  logout() {
    this.msalService.logoutRedirect();
  }
}
