import { Routes } from '@angular/router';
<<<<<<< HEAD
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
=======
import { MsalGuard } from '@azure/msal-angular';
import { Upload } from './components/upload/upload';
import { DocumentList } from './components/document-list/document-list';

export const routes: Routes = [
  {
    path: '',
    component: Upload,
    canActivate: [MsalGuard]
  },
  {
    path: 'documents',
    component: DocumentList,
    canActivate: [MsalGuard]
>>>>>>> 86eb5db723262b5037083d0c3966665747074811
  },
  { path: '**', redirectTo: '' }
];
