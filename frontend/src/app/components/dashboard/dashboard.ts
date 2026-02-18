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
    // ── Upload state ──
    selectedFile: File | null = null;
    uploading = signal(false);
    uploadSuccess = signal(false);
    uploadError = signal('');
    dragOver = signal(false);

    // ── Documents state ──
    documents = signal<DocRecord[]>([]);
    loading = signal(true);
    listError = signal('');
    searchQuery = signal('');
    deletingId = signal('');

    filtered = computed(() => {
        const q = this.searchQuery().toLowerCase().trim();
        if (!q) return this.documents();
        return this.documents().filter(d =>
            d.fileName.toLowerCase().includes(q) ||
            (d.fileType ?? '').toLowerCase().includes(q)
        );
    });

    constructor(private docService: DocumentService) { }

    ngOnInit() { this.loadDocuments(); }

    // ── Upload ──
    onFileSelected(event: Event) {
        const f = (event.target as HTMLInputElement).files?.[0];
        if (f) this.setFile(f);
    }
    onDrop(e: DragEvent) {
        e.preventDefault(); this.dragOver.set(false);
        const f = e.dataTransfer?.files[0];
        if (f) this.setFile(f);
    }
    onDragOver(e: DragEvent) { e.preventDefault(); this.dragOver.set(true); }
    onDragLeave() { this.dragOver.set(false); }

    setFile(f: File) {
        this.selectedFile = f;
        this.uploadSuccess.set(false);
        this.uploadError.set('');
    }

    clearFile() {
        this.selectedFile = null;
        this.uploadSuccess.set(false);
        this.uploadError.set('');
    }

    upload() {
        if (!this.selectedFile) return;
        this.uploading.set(true);
        this.uploadError.set('');
        this.uploadSuccess.set(false);

        this.docService.upload(this.selectedFile).subscribe({
            next: (doc) => {
                this.uploading.set(false);
                this.uploadSuccess.set(true);
                this.selectedFile = null;
                // Prepend new doc to list
                this.documents.update(docs => [doc, ...docs]);
            },
            error: (err) => {
                this.uploading.set(false);
                this.uploadError.set(err?.error?.message ?? 'Upload failed. Please try again.');
            }
        });
    }

    // ── Documents ──
    loadDocuments() {
        this.loading.set(true);
        this.listError.set('');
        this.docService.list().subscribe({
            next: (docs) => { this.documents.set(docs); this.loading.set(false); },
            error: (err) => { this.listError.set(err?.error?.message ?? 'Failed to load.'); this.loading.set(false); }
        });
    }

    deleteDoc(doc: DocRecord) {
        if (this.deletingId()) return;
        this.deletingId.set(doc.id);
        this.docService.delete(doc.id, doc.fileName).subscribe({
            next: () => {
                this.documents.update(docs => docs.filter(d => d.id !== doc.id));
                this.deletingId.set('');
            },
            error: () => { this.deletingId.set(''); }
        });
    }

    onSearch(e: Event) { this.searchQuery.set((e.target as HTMLInputElement).value); }

    formatSize(bytes: number): string {
        if (!bytes || isNaN(Number(bytes))) return '—';
        const b = Number(bytes);
        if (b < 1024) return b + ' B';
        if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
        return (b / (1024 * 1024)).toFixed(1) + ' MB';
    }

    formatDate(d: string): string {
        if (!d) return '—';
        try {
            return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch { return '—'; }
    }

    fileIcon(name: string): string {
        const ext = String(name ?? '').split('.').pop()?.toLowerCase() ?? '';
        const m: Record<string, string> = {
            pdf: '📕', doc: '📘', docx: '📘', xls: '📗', xlsx: '📗',
            ppt: '📙', pptx: '📙', jpg: '🖼️', jpeg: '🖼️', png: '🖼️',
            gif: '🖼️', svg: '🖼️', zip: '🗜️', rar: '🗜️', txt: '📄',
            html: '🌐', css: '🎨', js: '⚡', ts: '⚡', json: '📋'
        };
        return m[ext] ?? '📄';
    }

    typeBadgeClass(type: string): string {
        const t = String(type ?? '').toLowerCase();
        if (t === 'pdf') return 'badge-red';
        if (['doc', 'docx'].includes(t)) return 'badge-blue';
        if (['xls', 'xlsx'].includes(t)) return 'badge-green';
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(t)) return 'badge-purple';
        if (['zip', 'rar', '7z'].includes(t)) return 'badge-yellow';
        return 'badge-gray';
    }
}
