import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="login-page">
      <div class="login-bg">
        <div class="bg-orb orb-1"></div>
        <div class="bg-orb orb-2"></div>
        <div class="bg-orb orb-3"></div>
      </div>

      <div class="login-card animate-in">
        <div class="login-logo">
          <div class="logo-icon">🔒</div>
          <h1>DocVault</h1>
          <p class="login-subtitle">Secure Document Management Platform</p>
        </div>

        <div class="login-features">
          <div class="feature-item">
            <span>☁️</span>
            <span>Secure upload to Azure Blob Storage</span>
          </div>
          <div class="feature-item">
            <span>🔍</span>
            <span>Full-text search with AI excerpts</span>
          </div>
          <div class="feature-item">
            <span>🛡️</span>
            <span>Protected by Microsoft Entra ID</span>
          </div>
          <div class="feature-item">
            <span>🔗</span>
            <span>Time-limited SAS download links</span>
          </div>
        </div>

        <button class="login-btn" (click)="login()" [disabled]="isLoading">
          <mat-spinner *ngIf="isLoading" diameter="18" style="--mdc-circular-progress-active-indicator-color: #fff;"></mat-spinner>
          <span>{{ isLoading ? 'Signing in...' : 'Sign in with Microsoft' }}</span>
        </button>

        <p *ngIf="errorMessage" class="login-error">{{ errorMessage }}</p>

        <p class="login-footer">Powered by Azure — AZ-204 Capstone Project</p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0a;
      position: relative;
      overflow: hidden;
      padding: 24px;
    }

    .login-bg { position: absolute; inset: 0; pointer-events: none; }

    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.12;
    }
    .orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, #c8891a, transparent); top: -150px; left: -150px; }
    .orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #a0620f, transparent); bottom: -100px; right: -100px; }
    .orb-3 { width: 300px; height: 300px; background: radial-gradient(circle, #e8a020, transparent); top: 50%; left: 55%; }

    .login-card {
      background: #141414;
      border: 1px solid #222;
      border-radius: 20px;
      padding: 48px 40px;
      width: 100%;
      max-width: 460px;
      display: flex;
      flex-direction: column;
      gap: 28px;
      position: relative;
      z-index: 1;
    }

    .login-logo { text-align: center; }
    .logo-icon { font-size: 3rem; display: block; margin-bottom: 10px; }
    h1 {
      font-size: 2.2rem;
      font-weight: 800;
      color: #c8891a;
      margin: 0 0 8px;
    }
    .login-subtitle { color: #666; font-size: 0.9rem; margin: 0; }

    .login-features { display: flex; flex-direction: column; gap: 12px; }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #888;
      font-size: 0.88rem;
    }

    .login-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #c8891a, #9a6210);
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: filter 0.2s, opacity 0.2s;
    }
    .login-btn:hover:not(:disabled) { filter: brightness(1.1); }
    .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .login-error {
      color: #f87171;
      font-size: 0.85rem;
      background: rgba(248,113,113,0.1);
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid rgba(248,113,113,0.2);
      text-align: center;
    }

    .login-footer { text-align: center; font-size: 0.75rem; color: #444; margin: 0; }

    @keyframes animate-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
    .animate-in { animation: animate-in 0.4s ease-out; }
  `]
})
export class LoginComponent implements OnInit {
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    // Already signed in? Go straight to the app
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/upload']);
    }
  }

  login(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.login().subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/upload']);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.message || 'Login failed. Please try again.';
      }
    });
  }
}
