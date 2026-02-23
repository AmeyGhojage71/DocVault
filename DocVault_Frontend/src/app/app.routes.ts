import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/upload', pathMatch: 'full' },
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'upload',
        loadComponent: () => import('./components/upload/upload.component').then(m => m.UploadComponent),
        canActivate: [authGuard]
    },
    {
        path: 'documents',
        loadComponent: () => import('./components/document-list/document-list.component').then(m => m.DocumentListComponent),
        canActivate: [authGuard]
    },
    { path: '**', redirectTo: '/upload' }
];
