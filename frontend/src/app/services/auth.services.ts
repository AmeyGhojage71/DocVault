import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import{ environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, {
      username,
      password
    });
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
