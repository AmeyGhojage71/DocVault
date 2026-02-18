import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocumentModel {
  id: number;
  fileName: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  private apiUrl = 'https://localhost:5001/api/documents';

  constructor(private http: HttpClient) {}

  getDocuments(): Observable<DocumentModel[]> {
    return this.http.get<DocumentModel[]>(this.apiUrl);
  }

  // ✅ ADD THIS METHOD
  upload(file: File): Observable<any> {

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/upload`, formData);
  }
}
