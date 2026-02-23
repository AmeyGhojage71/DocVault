import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of, catchError } from 'rxjs';
import { DocumentService } from '../../services/document.service';
import { Document, SearchResult } from '../../models/document.model';

@Component({
    selector: 'app-search',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        MatIconModule, MatButtonModule, MatFormFieldModule,
        MatInputModule, MatProgressSpinnerModule, MatChipsModule, MatTooltipModule
    ],
    template: `
    <div class="page-container section animate-in">
      <div class="search-header">
        <h2>Search Documents</h2>
        <p class="search-desc">Search by file name or extracted text content</p>
      </div>

      <div class="search-box">
        <mat-icon class="search-icon">search</mat-icon>
        <input
          class="search-input"
          [(ngModel)]="query"
          (ngModelChange)="onQueryChange($event)"
          placeholder="Search documents... (e.g. invoice, quarterly, report)"
          [disabled]="false">
        <button *ngIf="query" class="clear-btn" (click)="clearSearch()">
          <mat-icon>close</mat-icon>
        </button>
        <mat-spinner *ngIf="isLoading" diameter="18" class="search-spinner"></mat-spinner>
      </div>

      <!-- Results summary -->
      <div *ngIf="result && !isLoading" class="result-summary">
        <span>{{ result.totalCount }} result{{ result.totalCount !== 1 ? 's' : '' }} for
          "<strong>{{ result.query }}</strong>"</span>
      </div>

      <!-- Error -->
      <div *ngIf="errorMessage" class="search-error">
        <mat-icon>error_outline</mat-icon>
        {{ errorMessage }}
      </div>

      <!-- Empty Results -->
      <div *ngIf="result && result.totalCount === 0 && !isLoading" class="empty-results">
        <mat-icon>search_off</mat-icon>
        <h4>No documents found</h4>
        <p>Try a different search term or upload more documents</p>
      </div>

      <!-- Search Results -->
      <div *ngIf="result && result.items.length > 0" class="results-grid animate-in">
        <div *ngFor="let doc of result.items" class="result-card card">
          <div class="result-card-top">
            <div class="result-icon">
              <mat-icon>{{ docService.getFileIcon(doc.contentType) }}</mat-icon>
            </div>
            <div class="result-meta">
              <span class="result-name">{{ doc.fileName }}</span>
              <div class="result-tags">
                <span class="badge badge-{{ doc.status }}">{{ doc.status }}</span>
                <span *ngFor="let tag of doc.tags" class="tag-pill">{{ tag }}</span>
              </div>
            </div>
            <div class="result-actions">
              <a [href]="doc.downloadUrl" target="_blank" rel="noopener"
                 class="btn btn-secondary action-btn"
                 [class.disabled]="!doc.downloadUrl"
                 matTooltip="Download">
                <mat-icon>download</mat-icon>
              </a>
            </div>
          </div>

          <div *ngIf="doc.excerpt" class="result-excerpt">
            <mat-icon class="excerpt-icon">article</mat-icon>
            <p [innerHTML]="highlight(doc.excerpt, result!.query)"></p>
          </div>

          <div class="result-footer">
            <span class="meta-text">{{ docService.formatSize(doc.sizeBytes) }}</span>
            <span class="meta-dot">·</span>
            <span class="meta-text">{{ formatDate(doc.uploadedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Initial state -->
      <div *ngIf="!result && !isLoading && !errorMessage" class="initial-state">
        <mat-icon class="initial-icon">manage_search</mat-icon>
        <h4>Start searching</h4>
        <p>Type a search term to find documents by name or content</p>
      </div>
    </div>
  `,
    styles: [`
    .search-header { margin-bottom: 24px; }
    .search-header h2 { margin-bottom: 6px; }
    .search-desc { color: var(--text-secondary); font-size: 0.9rem; }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 12px 16px;
      margin-bottom: 24px;
      gap: 12px;
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }

    .search-box:focus-within {
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 3px rgba(56, 139, 253, 0.15);
    }

    .search-icon { color: var(--text-muted); flex-shrink: 0; }

    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-primary);
      font-family: inherit;
      font-size: 1rem;
    }

    .search-input::placeholder { color: var(--text-muted); }

    .clear-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      padding: 2px;
      border-radius: 50%;
      transition: background var(--transition-fast);
    }
    .clear-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }
    .search-spinner { flex-shrink: 0; }

    .result-summary {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-bottom: 16px;
    }
    .result-summary strong { color: var(--text-primary); }

    .search-error {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--accent-red);
      padding: 12px 16px;
      background: rgba(248,81,73,0.1);
      border-radius: var(--radius-sm);
      border: 1px solid rgba(248,81,73,0.2);
    }

    .empty-results, .initial-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 64px 24px;
      text-align: center;
      color: var(--text-secondary);
    }

    .empty-results mat-icon, .initial-state mat-icon {
      font-size: 52px;
      width: 52px;
      height: 52px;
      color: var(--text-muted);
    }

    .initial-icon { opacity: 0.5; }
    .empty-results h4, .initial-state h4 { color: var(--text-primary); margin: 0; }
    .empty-results p, .initial-state p { margin: 0; font-size: 0.875rem; }

    .results-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .result-card { padding: 16px 20px; }

    .result-card-top {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .result-icon {
      width: 40px; height: 40px;
      background: rgba(56, 139, 253, 0.1);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .result-icon mat-icon { color: var(--accent-blue); }

    .result-meta {
      flex: 1;
      min-width: 0;
    }

    .result-name {
      font-weight: 600;
      color: var(--text-primary);
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 4px;
    }

    .result-tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .tag-pill {
      background: rgba(56, 139, 253, 0.12);
      color: var(--accent-blue-hover);
      font-size: 0.72rem;
      padding: 2px 8px;
      border-radius: 20px;
      font-weight: 500;
    }

    .result-actions { flex-shrink: 0; }

    .action-btn { padding: 5px 10px; }
    .action-btn.disabled { opacity: 0.4; pointer-events: none; }

    .result-excerpt {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      margin-top: 12px;
    }

    .excerpt-icon {
      color: var(--text-muted);
      font-size: 16px;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .result-excerpt p {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.5;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }

    .result-excerpt p :global(mark) {
      background: rgba(210, 153, 34, 0.3);
      color: var(--accent-orange);
      border-radius: 2px;
      padding: 0 2px;
    }

    .result-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      font-size: 0.8rem;
    }

    .meta-text { color: var(--text-muted); }
    .meta-dot { color: var(--text-muted); }
  `]
})
export class SearchComponent {
    query = '';
    result: SearchResult | null = null;
    isLoading = false;
    errorMessage = '';

    private searchSubject = new Subject<string>();

    constructor(public docService: DocumentService) {
        this.searchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(q => {
                if (!q.trim()) return of(null);
                this.isLoading = true;
                return this.docService.search(q).pipe(
                    catchError(err => {
                        this.errorMessage = err.message;
                        this.isLoading = false;
                        return of(null);
                    })
                );
            })
        ).subscribe(result => {
            this.result = result;
            this.isLoading = false;
        });
    }

    onQueryChange(value: string): void {
        this.errorMessage = '';
        this.searchSubject.next(value);
    }

    clearSearch(): void {
        this.query = '';
        this.result = null;
        this.errorMessage = '';
        this.searchSubject.next('');
    }

    highlight(text: string, query: string): string {
        if (!query.trim()) return text;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
    }

    formatDate(iso: string): string {
        try {
            return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        } catch { return iso; }
    }
}
