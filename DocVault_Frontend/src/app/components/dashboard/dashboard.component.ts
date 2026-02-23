import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DocumentService } from '../../services/document.service';
import { Document } from '../../models/document.model';

interface DashboardStats {
    total: number;
    processed: number;
    pending: number;
    failed: number;
    totalSizeMb: number;
    fileTypes: { type: string; count: number; icon: string }[];
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
    template: `
    <div class="page-container section animate-in">
      <div class="dash-header">
        <h2>Dashboard</h2>
        <p class="dash-desc">Overview of your document storage activity</p>
      </div>

      <div *ngIf="isLoading" class="state-center">
        <mat-spinner diameter="36"></mat-spinner>
        <p>Loading stats...</p>
      </div>

      <ng-container *ngIf="!isLoading && stats">
        <!-- Stat Cards Row -->
        <div class="stats-grid">
          <div class="stat-card card">
            <div class="stat-icon-wrap icon-blue">
              <mat-icon>description</mat-icon>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ stats.total }}</span>
              <span class="stat-label">Total Documents</span>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon-wrap icon-green">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ stats.processed }}</span>
              <span class="stat-label">Processed</span>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon-wrap icon-orange">
              <mat-icon>hourglass_empty</mat-icon>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ stats.pending }}</span>
              <span class="stat-label">Pending</span>
            </div>
          </div>

          <div class="stat-card card">
            <div class="stat-icon-wrap icon-red">
              <mat-icon>error</mat-icon>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ stats.failed }}</span>
              <span class="stat-label">Failed</span>
            </div>
          </div>

          <div class="stat-card card wide">
            <div class="stat-icon-wrap icon-purple">
              <mat-icon>storage</mat-icon>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ stats.totalSizeMb | number:'1.1-1' }} MB</span>
              <span class="stat-label">Total Storage Used</span>
            </div>
          </div>
        </div>

        <!-- Processing health bar -->
        <div class="card health-card" *ngIf="stats.total > 0">
          <div class="health-header">
            <span class="health-title">Processing Health</span>
            <span class="health-pct">{{ processedPct }}% processed</span>
          </div>
          <div class="health-bar">
            <div class="health-fill processed" [style.width.%]="processedPct"></div>
            <div class="health-fill pending" [style.width.%]="pendingPct"></div>
            <div class="health-fill failed" [style.width.%]="failedPct"></div>
          </div>
          <div class="health-legend">
            <span class="legend-item"><span class="legend-dot processed-dot"></span>Processed ({{ stats.processed }})</span>
            <span class="legend-item"><span class="legend-dot pending-dot"></span>Pending ({{ stats.pending }})</span>
            <span class="legend-item"><span class="legend-dot failed-dot"></span>Failed ({{ stats.failed }})</span>
          </div>
        </div>

        <!-- File types breakdown -->
        <div class="card" *ngIf="stats.fileTypes.length > 0">
          <h4 class="section-label">File Types</h4>
          <div class="type-grid">
            <div *ngFor="let ft of stats.fileTypes" class="type-card">
              <mat-icon class="type-icon">{{ ft.icon }}</mat-icon>
              <span class="type-name">{{ ft.type }}</span>
              <span class="type-count">{{ ft.count }}</span>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="stats.total === 0" class="empty-state">
          <mat-icon class="empty-icon">bar_chart</mat-icon>
          <h4>No data yet</h4>
          <p>Upload documents to see statistics here</p>
        </div>
      </ng-container>

      <div *ngIf="!isLoading && errorMessage" class="error-state">
        <mat-icon>error_outline</mat-icon>
        <p>{{ errorMessage }}</p>
      </div>
    </div>
  `,
    styles: [`
    .dash-header { margin-bottom: 28px; }
    .dash-header h2 { margin-bottom: 6px; }
    .dash-desc { color: var(--text-secondary); font-size: 0.9rem; }

    .state-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 64px;
      color: var(--text-secondary);
    }

    /* ── Stats Grid ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }

    .stat-card.wide {
      grid-column: span 2;
    }

    .stat-icon-wrap {
      width: 48px; height: 48px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-blue   { background: rgba(56,139,253,0.15);  color: var(--accent-blue); }
    .icon-green  { background: rgba(63,185,80,0.15);   color: var(--accent-green); }
    .icon-orange { background: rgba(210,153,34,0.15);  color: var(--accent-orange); }
    .icon-red    { background: rgba(248,81,73,0.15);   color: var(--accent-red); }
    .icon-purple { background: rgba(163,113,247,0.15); color: var(--accent-purple); }

    .stat-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }

    .stat-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    /* ── Health Bar ── */
    .health-card {
      padding: 20px 24px;
      margin-bottom: 20px;
    }

    .health-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .health-title { font-weight: 600; color: var(--text-primary); }
    .health-pct { font-size: 0.875rem; color: var(--text-secondary); }

    .health-bar {
      height: 10px;
      border-radius: 5px;
      background: var(--bg-secondary);
      display: flex;
      overflow: hidden;
      margin-bottom: 12px;
    }

    .health-fill {
      height: 100%;
      transition: width 600ms ease;
    }

    .health-fill.processed { background: var(--accent-green); }
    .health-fill.pending   { background: var(--accent-orange); }
    .health-fill.failed    { background: var(--accent-red); }

    .health-legend {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .legend-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .processed-dot { background: var(--accent-green); }
    .pending-dot   { background: var(--accent-orange); }
    .failed-dot    { background: var(--accent-red); }

    /* ── File Types ── */
    .section-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 16px;
    }

    .type-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .type-card {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 10px 16px;
    }

    .type-icon { color: var(--accent-blue); font-size: 20px; }

    .type-name {
      font-size: 0.875rem;
      color: var(--text-primary);
      font-weight: 500;
    }

    .type-count {
      font-size: 0.85rem;
      color: var(--text-muted);
      background: var(--bg-elevated);
      padding: 1px 7px;
      border-radius: 10px;
    }

    /* ── Empty / Error ── */
    .empty-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 64px 24px;
      text-align: center;
      color: var(--text-secondary);
    }

    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--text-muted);
    }

    .empty-state h4 { color: var(--text-primary); margin: 0; }
    .empty-state p, .error-state p { margin: 0; font-size: 0.875rem; }
    .error-state mat-icon { color: var(--accent-red); font-size: 32px; }

    @media (max-width: 900px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .stat-card.wide { grid-column: span 1; }
    }

    @media (max-width: 500px) {
      .stats-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
    isLoading = false;
    errorMessage = '';
    stats: DashboardStats | null = null;

    constructor(private docService: DocumentService) { }

    ngOnInit(): void {
        this.loadStats();
    }

    get processedPct(): number {
        return this.stats?.total ? Math.round((this.stats.processed / this.stats.total) * 100) : 0;
    }

    get pendingPct(): number {
        return this.stats?.total ? Math.round((this.stats.pending / this.stats.total) * 100) : 0;
    }

    get failedPct(): number {
        return this.stats?.total ? Math.round((this.stats.failed / this.stats.total) * 100) : 0;
    }

    loadStats(): void {
        this.isLoading = true;
        this.docService.list().subscribe({
            next: (res) => {
                this.stats = this.buildStats(res.items);
                this.isLoading = false;
            },
            error: (err) => {
                this.errorMessage = err.message;
                this.isLoading = false;
            }
        });
    }

    private buildStats(docs: Document[]): DashboardStats {
        const typeMap = new Map<string, number>();

        for (const doc of docs) {
            const type = this.simplifyType(doc.contentType);
            typeMap.set(type, (typeMap.get(type) ?? 0) + 1);
        }

        const fileTypes = Array.from(typeMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([type, count]) => ({
                type,
                count,
                icon: this.docService.getFileIcon(this.mimeFromLabel(type))
            }));

        return {
            total: docs.length,
            processed: docs.filter(d => d.status === 'processed').length,
            pending: docs.filter(d => d.status === 'pending').length,
            failed: docs.filter(d => d.status === 'failed').length,
            totalSizeMb: docs.reduce((sum, d) => sum + d.sizeBytes, 0) / (1024 * 1024),
            fileTypes
        };
    }

    private simplifyType(contentType: string): string {
        if (contentType.startsWith('image/')) return 'Images';
        if (contentType === 'application/pdf') return 'PDF';
        if (contentType.includes('word')) return 'Word';
        if (contentType.includes('excel') || contentType.includes('spreadsheet')) return 'Excel';
        if (contentType.startsWith('text/')) return 'Text';
        return 'Other';
    }

    private mimeFromLabel(label: string): string {
        const map: Record<string, string> = {
            'Image': 'image/png', 'PDF': 'application/pdf',
            'Word': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Text': 'text/plain'
        };
        return map[label] ?? 'application/octet-stream';
    }
}
