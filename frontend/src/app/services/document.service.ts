import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Document {
  id: string;
  fileName: string;
  blobUrl: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  private apiUrl = 'http://localhost:5000/api/documents';

  constructor(private http: HttpClient) {}

  upload(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(this.apiUrl, formData);
  }

  getDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(this.apiUrl);
  }
}
