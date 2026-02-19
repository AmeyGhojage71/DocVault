import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Login } from './components/login/login';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', component: Dashboard, canActivate: [AuthGuard] },
  { path: 'login', component: Login },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '' }
];
