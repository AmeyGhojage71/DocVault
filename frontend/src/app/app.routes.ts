import { Routes } from '@angular/router';
import { UploadComponent } from './components/upload/upload';
import { DocumentList } from './components/document-list/document-list';

export const routes: Routes = [
  { path: '', component: UploadComponent },
  { path: 'documents', component: DocumentList }
];