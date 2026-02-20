import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DocumentService, DocRecord } from '../../services/document.service';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './document-list.html',
  styleUrls: ['./document-list.css']
})
export class DocumentList implements OnInit {
  documents = signal<DocRecord[]>([]);
  loading = signal(true);
  error = signal('');
  searchQuery = signal('');
  deletingId = signal<string | null>(null);

  filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.documents();
    return this.documents().filter(d =>
      d.fileName.toLowerCase().includes(q)
    );
  });

  constructor(private docService: DocumentService) { }

  ngOnInit() { this.loadDocuments(); }

  loadDocuments() {
    this.loading.set(true);
    this.error.set('');
    this.docService.list().subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load documents.');
        this.loading.set(false);
      }
    });
  }

  download(doc: DocRecord) {
    this.docService.downloadDocument(doc.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        alert('Download failed. Please try again.');
      }
    });
  }



  deleteDocument(doc: DocRecord) {
    if (this.deletingId()) return;
    if (!confirm(`Delete "${doc.fileName}"? This cannot be undone.`)) return;
    this.deletingId.set(doc.id);
    this.docService.delete(doc.id, doc.fileName).subscribe({
      next: () => {
        this.documents.update(docs => docs.filter(d => d.id !== doc.id));
        this.deletingId.set(null);
      },
      error: (err) => {
        alert('Failed to delete file. Please try again.');
        this.deletingId.set(null);
      }
    });
  }

  clearSearch() {
    this.searchQuery.set('');
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date}, ${time}`;
  }

  formatSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  getFileType(fileName: string): string {
    if (!fileName) return 'FILE';
    return (fileName.split('.').pop() ?? 'FILE').toUpperCase();
  }

  getFileTypeClass(fileName: string): string {
    if (!fileName) return 'badge-default';
    const ext = (fileName.split('.').pop() ?? '').toLowerCase();
    if (['pdf'].includes(ext)) return 'badge-pdf';
    if (['doc', 'docx'].includes(ext)) return 'badge-doc';
    if (['xls', 'xlsx'].includes(ext)) return 'badge-xls';
    if (['ppt', 'pptx'].includes(ext)) return 'badge-ppt';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'badge-img';
    if (['zip', 'rar', '7z'].includes(ext)) return 'badge-zip';
    if (['txt', 'md'].includes(ext)) return 'badge-txt';
    if (['html', 'css', 'js', 'ts', 'json'].includes(ext)) return 'badge-code';
    return 'badge-default';
  }

  getFileIcon(fileName: string): string {
    if (!fileName) return '📄';
    const ext = (fileName.split('.').pop() ?? '').toLowerCase();
    if (ext === 'pdf') return '📕';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (['xls', 'xlsx'].includes(ext)) return '📗';
    if (['ppt', 'pptx'].includes(ext)) return '📙';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['zip', 'rar', '7z'].includes(ext)) return '🗜️';
    if (['html', 'css', 'js', 'ts'].includes(ext)) return '💻';
    return '📄';
  }
}
