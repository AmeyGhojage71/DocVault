import { Routes } from '@angular/router';
import { Upload } from './upload/upload';
import { DocumentList } from './document-list/document-list';

export const routes: Routes = [
  { path: '', component: Upload },
  { path: 'documents', component: DocumentList }
];