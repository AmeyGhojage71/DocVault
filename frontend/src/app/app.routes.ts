import { Routes } from '@angular/router';
import { UploadComponent } from './components/upload/upload';
import { DocumentListComponent } from './components/document-list/document-list';

export const routes: Routes = [
  { path: 'upload', component: UploadComponent },
  { path: 'documents', component: DocumentListComponent },
  { path: '', redirectTo: 'upload', pathMatch: 'full' }
];
