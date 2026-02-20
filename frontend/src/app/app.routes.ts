import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { UploadComponent } from './components/upload/upload';
import { DocumentList } from './components/document-list/document-list';

export const routes: Routes = [
  {
    path: '',
    component: UploadComponent,
    canActivate: [MsalGuard]
  },
  {
    path: 'documents',
    component: DocumentList,
    canActivate: [MsalGuard]
  },
  { path: '**', redirectTo: '' }
];
