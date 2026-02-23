import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  styles: [`
    .shell { min-height: 100vh; background: var(--bg); }

    nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      height: 56px;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--bg);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 700;
      color: var(--gold);
      text-decoration: none;
    }
    .brand-icon { font-size: 20px; }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-link {
      padding: 6px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.2s;
      cursor: pointer;
      background: none;
      border: none;
      font-family: 'Inter', sans-serif;
    }
    .nav-link:hover { color: var(--text); }
    .nav-link.active-link {
      border: 1.5px solid var(--gold);
      color: var(--gold);
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      font-size: 13px;
      color: var(--text-muted);
    }
    .user-pill span { font-size: 16px; }

    .signout-btn {
      padding: 6px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      background: transparent;
      border: 1.5px solid var(--red);
      color: var(--red);
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      transition: background 0.2s;
    }
    .signout-btn:hover { background: rgba(224,82,82,0.1); }

    .content { padding: 40px 32px; }
  `],
  template: `
    <div class="shell">
      <nav *ngIf="authService.isAuthenticated$ | async">
        <a class="brand" routerLink="/upload">
          <span class="brand-icon">🗂️</span>
          DocVault
        </a>
        <div class="nav-right">
          <a class="nav-link"
             routerLink="/upload"
             routerLinkActive="active-link">Upload</a>

          <a class="nav-link"
             routerLink="/documents"
             routerLinkActive="active-link">My Documents</a>

          <div class="user-pill">
            <span>👤</span>
            {{ authService.userDisplayName }}
          </div>

          <button class="signout-btn" (click)="logout()">Sign Out</button>
        </div>
      </nav>

      <div class="content">
        <router-outlet />
      </div>
    </div>
  `
})
export class AppComponent implements OnInit {
  constructor(
    public authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() { }

  logout() {
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/login'])
    });
  }
}
