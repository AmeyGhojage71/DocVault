import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html'
})
export class Login {

  username: string = '';
  password: string = '';
  error: string = '';
  loading: boolean = false;

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.error = '';
    this.loading = true;
    
    this.auth.login(this.username, this.password)
      .subscribe({
        next: (res) => {
          this.auth.saveToken(res.token);
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.error = 'Invalid username or password';
          this.loading = false;
        }
      });
  }
}
