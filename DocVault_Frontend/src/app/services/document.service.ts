import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Document, DocumentListResponse, SearchResult, UploadProgress } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {

    private readonly baseUrl = `${environment.apimUrl}/api/documents`;

    constructor(private http: HttpClient) { }

    /** Upload a file with progress tracking */
    uploadWithProgress(file: File, tags: string[]): Observable<UploadProgress> {
        const subject = new Subject<UploadProgress>();

        const formData = new FormData();
        formData.append('file', file);
        formData.append('tags', tags.join(','));

        const req = new HttpRequest('POST', this.baseUrl, formData, {
            reportProgress: true
        });

        subject.next({ fileName: file.name, progress: 0, status: 'uploading' });

        this.http.request(req).subscribe({
            next: (event) => {
                if (event.type === HttpEventType.UploadProgress && event.total) {
                    const progress = Math.round(100 * event.loaded / event.total);
                    subject.next({ fileName: file.name, progress, status: 'uploading' });
                } else if (event instanceof HttpResponse) {
                    subject.next({ fileName: file.name, progress: 100, status: 'success' });
                    subject.complete();
                }
            },
            error: (err) => {
                subject.next({
                    fileName: file.name,
                    progress: 0,
                    status: 'error',
                    error: err.error?.error || 'Upload failed'
                });
                subject.complete();
            }
        });

        return subject.asObservable();
    }

    /** List all documents for the current user */
    list(): Observable<DocumentListResponse> {
        return this.http.get<DocumentListResponse>(this.baseUrl).pipe(
            catchError(err => throwError(() => new Error(err.error?.error || 'Failed to load documents')))
        );
    }

    /** Get a single document by ID */
    getById(id: string): Observable<Document> {
        return this.http.get<Document>(`${this.baseUrl}/${id}`).pipe(
            catchError(err => throwError(() => new Error(err.error?.error || 'Document not found')))
        );
    }

    /** Soft-delete a document */
    delete(id: string): Observable<{ message: string; id: string }> {
        return this.http.delete<{ message: string; id: string }>(`${this.baseUrl}/${id}`).pipe(
            catchError(err => throwError(() => new Error(err.error?.error || 'Delete failed')))
        );
    }

    /** Full-text search over excerpts and file names */
    search(query: string): Observable<SearchResult> {
        return this.http.get<SearchResult>(`${this.baseUrl}/search`, {
            params: { q: query }
        }).pipe(
            catchError(err => throwError(() => new Error(err.error?.error || 'Search failed')))
        );
    }

    /** Format file size into human-readable string */
    formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }

    /** Returns icon name for a given MIME type */
    getFileIcon(contentType: string): string {
        if (contentType.startsWith('image/')) return 'image';
        if (contentType === 'application/pdf') return 'picture_as_pdf';
        if (contentType.includes('word')) return 'description';
        if (contentType.includes('excel') || contentType.includes('spreadsheet')) return 'table_chart';
        if (contentType.includes('presentation') || contentType.includes('powerpoint')) return 'slideshow';
        if (contentType.startsWith('text/')) return 'article';
        if (contentType.includes('zip') || contentType.includes('compressed')) return 'archive';
        return 'insert_drive_file';
    }
}
