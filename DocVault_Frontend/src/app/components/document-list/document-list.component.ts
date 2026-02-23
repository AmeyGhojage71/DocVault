import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document.service';
import { Document } from '../../models/document.model';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
        .page { padding: 8px 0; }

        .page-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 28px;
            flex-wrap: wrap;
            gap: 16px;
        }

        h2 {
            font-size: 26px;
            font-weight: 700;
            color: #f0f0f0;
            margin: 0 0 4px;
        }
        .subtitle { font-size: 13px; color: #555; }

        .search-box {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #141414;
            border: 1px solid #2a2a2a;
            border-radius: 10px;
            padding: 8px 14px;
            min-width: 240px;
        }
        .search-icon { font-size: 16px; color: #555; }
        .search-box input {
            background: none;
            border: none;
            outline: none;
            color: #f0f0f0;
            font-size: 13px;
            font-family: 'Inter', sans-serif;
            width: 100%;
        }
        .search-box input::placeholder { color: #444; }

        /* States */
        .state-center {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding: 60px 24px;
            color: #555;
        }
        .state-icon { font-size: 40px; }

        /* Table */
        .table-wrap {
            background: #141414;
            border: 1px solid #1e1e1e;
            border-radius: 12px;
            overflow: hidden;
        }

        table { width: 100%; border-collapse: collapse; }

        thead th {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #555;
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #1e1e1e;
        }

        tbody tr {
            border-bottom: 1px solid #1a1a1a;
            transition: background 0.15s;
        }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: rgba(255,255,255,0.02); }

        td {
            padding: 14px 16px;
            vertical-align: middle;
        }

        .file-row {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .file-thumb {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            background: #1e1e1e;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
        }
        .file-name {
            font-size: 13px;
            color: #d0d0d0;
            max-width: 280px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* Type badge */
        .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            color: #fff;
            text-transform: uppercase;
        }
        .badge-png  { background: #7c3aed; }
        .badge-pdf  { background: #dc2626; }
        .badge-docx { background: #2563eb; }
        .badge-xlsx { background: #16a34a; }
        .badge-jpg, .badge-jpeg { background: #d97706; }
        .badge-txt  { background: #475569; }
        .badge-other { background: #374151; }

        .meta { font-size: 13px; color: #555; white-space: nowrap; }

        /* Action buttons */
        .actions { display: flex; align-items: center; gap: 8px; }

        .act-btn {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 12px;
            border-radius: 7px;
            font-size: 12px;
            font-weight: 500;
            font-family: 'Inter', sans-serif;
            cursor: pointer;
            border: none;
            transition: opacity 0.2s;
            text-decoration: none;
        }
        .act-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .act-download {
            background: #1e2a1e;
            color: #4ade80;
            border: 1px solid #1a3a1a;
        }
        .act-download:hover { background: #243024; }

        .act-delete {
            background: #2a1a1a;
            color: #f87171;
            border: 1px solid #3a1a1a;
        }
        .act-delete:hover { background: #321e1e; }

        .act-icon { font-size: 13px; }
    `],
  template: `
        <div class="page">
            <div class="page-header">
                <div>
                    <h2>My Documents</h2>
                    <p class="subtitle">{{ documents.length }} files stored securely</p>
                </div>
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input [(ngModel)]="searchQuery" placeholder="Search by file name..." (input)="applyFilter()">
                </div>
            </div>

            <!-- Loading -->
            <div class="state-center" *ngIf="isLoading">
                <span class="state-icon">⏳</span>
                <p>Loading documents...</p>
            </div>

            <!-- Error -->
            <div class="state-center" *ngIf="error && !isLoading" style="color:#f87171">
                <span class="state-icon">⚠️</span>
                <p>{{ error }}</p>
                <button class="act-btn act-download" (click)="loadDocuments()">Retry</button>
            </div>

            <!-- Empty -->
            <div class="state-center" *ngIf="!isLoading && !error && filtered.length === 0">
                <span class="state-icon">📂</span>
                <p>No documents found</p>
            </div>

            <!-- Table -->
            <div class="table-wrap" *ngIf="!isLoading && !error && filtered.length > 0">
                <table>
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Type</th>
                            <th>Size</th>
                            <th>Uploaded On</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let doc of filtered">
                            <td>
                                <div class="file-row">
                                    <div class="file-thumb">{{ getEmoji(doc.contentType) }}</div>
                                    <span class="file-name" [title]="doc.fileName">{{ doc.fileName }}</span>
                                </div>
                            </td>
                            <td>
                                <span class="badge" [ngClass]="'badge-' + getExt(doc.fileName).toLowerCase()">
                                    {{ getExt(doc.fileName) }}
                                </span>
                            </td>
                            <td><span class="meta">{{ formatSize(doc.sizeBytes) }}</span></td>
                            <td><span class="meta">{{ formatDate(doc.uploadedAt) }}</span></td>
                            <td>
                                <div class="actions">
                                    <a class="act-btn act-download"
                                       [href]="doc.downloadUrl"
                                       target="_blank"
                                       [class.disabled]="!doc.downloadUrl">
                                        <span class="act-icon">⬇</span> Download
                                    </a>
                                    <button class="act-btn act-delete"
                                            (click)="deleteDoc(doc)"
                                            [disabled]="deletingId === doc.id">
                                        <span class="act-icon">🗑</span>
                                        {{ deletingId === doc.id ? '...' : 'Delete' }}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `
})
export class DocumentListComponent implements OnInit {
  documents: Document[] = [];
  filtered: Document[] = [];
  searchQuery = '';
  isLoading = false;
  error = '';
  deletingId = '';

  constructor(private docService: DocumentService) { }

  ngOnInit() { this.loadDocuments(); }

  loadDocuments() {
    this.isLoading = true;
    this.error = '';
    this.docService.list().subscribe({
      next: (res) => {
        this.documents = res.items;
        this.filtered = [...this.documents];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message ?? 'Failed to load documents';
        this.isLoading = false;
      }
    });
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase();
    this.filtered = this.documents.filter(d =>
      d.fileName.toLowerCase().includes(q)
    );
  }

  deleteDoc(doc: Document) {
    if (!confirm(`Delete "${doc.fileName}"?`)) return;
    this.deletingId = doc.id;
    this.docService.delete(doc.id).subscribe({
      next: () => {
        this.documents = this.documents.filter(d => d.id !== doc.id);
        this.filtered = this.filtered.filter(d => d.id !== doc.id);
        this.deletingId = '';
      },
      error: () => { this.deletingId = ''; }
    });
  }

  getExt(name: string): string {
    return name.split('.').pop()?.toUpperCase() ?? 'FILE';
  }

  getEmoji(contentType: string): string {
    if (contentType?.includes('image')) return '🖼';
    if (contentType?.includes('pdf')) return '📄';
    if (contentType?.includes('word')) return '📝';
    if (contentType?.includes('sheet') || contentType?.includes('excel')) return '📊';
    return '📁';
  }

  formatSize(bytes: number): string {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return iso; }
  }
}
