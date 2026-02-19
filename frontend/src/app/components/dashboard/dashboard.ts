import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService, DocRecord } from '../../services/document.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './dashboard.html',
    styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {

    // ───────── Upload State ─────────
    selectedFile: File | null = null;
    uploading = signal(false);
    uploadSuccess = signal(false);
    uploadError = signal('');
    dragOver = signal(false);

    // ───────── Documents State ─────────
    documents = signal<DocRecord[]>([]);
    loading = signal(true);
    listError = signal('');
    searchQuery = signal('');
    deletingId = signal('');

    // ───────── Filtered List (Computed) ─────────
    filtered = computed(() => {
        const q = this.searchQuery().toLowerCase().trim();
        if (!q) return this.documents();
        return this.documents().filter(d =>
            d.fileName.toLowerCase().includes(q) ||
            (d.fileType ?? '').toLowerCase().includes(q)
        );
    });

    constructor(private docService: DocumentService) { }

    ngOnInit(): void {
        this.loadDocuments();
    }

    // ───────────────────────────────
    // Upload Logic
    // ───────────────────────────────

    onFileSelected(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) this.setFile(file);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.dragOver.set(false);

        const file = event.dataTransfer?.files[0];
        if (file) this.setFile(file);
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.dragOver.set(true);
    }

    onDragLeave(): void {
        this.dragOver.set(false);
    }

    private setFile(file: File): void {
        this.selectedFile = file;
        this.uploadSuccess.set(false);
        this.uploadError.set('');
    }

    clearFile(): void {
        this.selectedFile = null;
        this.uploadSuccess.set(false);
        this.uploadError.set('');
    }

    upload(): void {
        if (!this.selectedFile) return;

        this.uploading.set(true);
        this.uploadError.set('');
        this.uploadSuccess.set(false);

        this.docService.upload(this.selectedFile).subscribe({
            next: (doc) => {
                this.uploading.set(false);
                this.uploadSuccess.set(true);
                this.selectedFile = null;

                // Add new document at top
                this.documents.update(docs => [doc, ...docs]);
            },
            error: (err) => {
                this.uploading.set(false);
                this.uploadError.set(
                    err?.error?.message || 'Upload failed. Please try again.'
                );
            }
        });
    }

    // ───────────────────────────────
    // Document List Logic
    // ───────────────────────────────

    loadDocuments(): void {
        this.loading.set(true);
        this.listError.set('');

        this.docService.list().subscribe({
            next: (docs) => {
                this.documents.set(docs);
                this.loading.set(false);
            },
            error: (err) => {
                this.listError.set(
                    err?.error?.message || 'Failed to load documents.'
                );
                this.loading.set(false);
            }
        });
    }

    deleteDoc(doc: DocRecord): void {
        if (this.deletingId()) return;

        this.deletingId.set(doc.id);

        this.docService.delete(doc.id, doc.fileName).subscribe({
            next: () => {
                this.documents.update(docs =>
                    docs.filter(d => d.id !== doc.id)
                );
                this.deletingId.set('');
            },
            error: () => {
                this.deletingId.set('');
            }
        });
    }

    onSearch(event: Event): void {
        this.searchQuery.set(
            (event.target as HTMLInputElement).value
        );
    }

    // ───────────────────────────────
    // Helper Methods
    // ───────────────────────────────

    getEffectiveFileType(doc: DocRecord): string {
        return doc.fileType || doc.fileName.split('.').pop() || '';
    }

    formatSize(bytes: number): string {
        if (!bytes || isNaN(Number(bytes))) return '—';

        const b = Number(bytes);

        if (b < 1024) return `${b} B`;
        if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
        return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    }

    formatDate(date: string): string {
        if (!date) return '—';

        try {
            return new Date(date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '—';
        }
    }

    fileIcon(fileName: string): string {
        const ext = fileName.split('.').pop()?.toLowerCase() || '';

        const icons: Record<string, string> = {
            pdf: '📕',
            doc: '📘',
            docx: '📘',
            xls: '📗',
            xlsx: '📗',
            ppt: '📙',
            pptx: '📙',
            jpg: '🖼️',
            jpeg: '🖼️',
            png: '🖼️',
            gif: '🖼️',
            svg: '🖼️',
            zip: '🗜️',
            rar: '🗜️',
            txt: '📄',
            html: '🌐',
            css: '🎨',
            js: '⚡',
            ts: '⚡',
            json: '📋'
        };

        return icons[ext] || '📄';
    }

    typeBadgeClass(type: string): string {
        const t = type.toLowerCase();

        if (t === 'pdf') return 'badge-red';
        if (['doc', 'docx'].includes(t)) return 'badge-blue';
        if (['xls', 'xlsx'].includes(t)) return 'badge-green';
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(t))
            return 'badge-purple';
        if (['zip', 'rar', '7z'].includes(t))
            return 'badge-yellow';

        return 'badge-gray';
    }
}
