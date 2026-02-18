import { Routes } from '@angular/router';
import { Upload } from './components/upload/upload';
import { DocumentList } from './components/document-list/document-list';

export const routes: Routes = [
  { path: '', component: Upload },
  { path: 'documents', component: DocumentList },
  { path: '**', redirectTo: '' }
];