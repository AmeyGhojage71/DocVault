import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    template: `
    <div class="login-page">
      <div class="login-bg">
        <div class="bg-orb orb-1"></div>
        <div class="bg-orb orb-2"></div>
        <div class="bg-orb orb-3"></div>
      </div>

      <div class="login-card card-glass animate-in">
        <div class="login-logo">
          <div class="logo-icon">🔒</div>
          <h1 class="text-gradient">DocVault</h1>
          <p class="login-subtitle">Secure Document Management Platform</p>
        </div>

        <div class="login-features">
          <div class="feature-item">
            <mat-icon class="feature-icon">cloud_upload</mat-icon>
            <span>Secure upload to Azure Blob Storage</span>
          </div>
          <div class="feature-item">
            <mat-icon class="feature-icon">search</mat-icon>
            <span>Full-text search with AI excerpts</span>
          </div>
          <div class="feature-item">
            <mat-icon class="feature-icon">verified_user</mat-icon>
            <span>Protected by Microsoft Entra ID</span>
          </div>
          <div class="feature-item">
            <mat-icon class="feature-icon">lock</mat-icon>
            <span>Time-limited SAS download links</span>
          </div>
        </div>

        <button
          class="btn btn-primary login-btn"
          (click)="login()"
          [disabled]="isLoading">
          <mat-spinner *ngIf="isLoading" diameter="18"></mat-spinner>
          <mat-icon *ngIf="!isLoading">login</mat-icon>
          <span>{{ isLoading ? 'Signing in...' : 'Sign in with Microsoft' }}</span>
        </button>

        <p *ngIf="errorMessage" class="login-error">
          <mat-icon>error_outline</mat-icon>
          {{ errorMessage }}
        </p>

        <p class="login-footer">
          Powered by Azure — AZ-204 Capstone Project
        </p>
      </div>
    </div>
  `,
    styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--gradient-hero);
      position: relative;
      overflow: hidden;
      padding: 24px;
    }

    .login-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
    }

    .orb-1 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, #388bfd, transparent);
      top: -100px; left: -100px;
    }
    .orb-2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, #a371f7, transparent);
      bottom: -100px; right: -50px;
    }
    .orb-3 {
      width: 300px; height: 300px;
      background: radial-gradient(circle, #3fb950, transparent);
      top: 50%; left: 60%;
    }

    .login-card {
      width: 100%;
      max-width: 460px;
      padding: 48px 40px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 32px;
      position: relative;
      z-index: 1;
    }

    .login-logo {
      text-align: center;
    }

    .logo-icon {
      font-size: 3rem;
      margin-bottom: 12px;
      display: block;
    }

    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 8px;
    }

    .login-subtitle {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .login-features {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .feature-icon {
      color: var(--accent-blue);
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .login-btn {
      width: 100%;
      justify-content: center;
      padding: 14px 24px;
      font-size: 1rem;
      border-radius: var(--radius-sm);
    }

    .login-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .login-error {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--accent-red);
      font-size: 0.875rem;
      background: rgba(248,81,73,0.1);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(248,81,73,0.2);
    }

    .login-footer {
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  `]
})
export class LoginComponent {
    isLoading = false;
    errorMessage = '';

    constructor(private authService: AuthService) { }

    login(): void {
        this.isLoading = true;
        this.errorMessage = '';
        this.authService.login().subscribe({
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.message || 'Login failed. Please try again.';
            }
        });
    }
}
