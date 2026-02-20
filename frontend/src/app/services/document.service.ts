import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocRecord {
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    url: string;
    uploadedOn: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
    private readonly api = 'http://localhost:5032/api/documents';

    constructor(private http: HttpClient) { }

    upload(file: File): Observable<DocRecord> {
        const form = new FormData();
        form.append('file', file, file.name);
        return this.http.post<DocRecord>(this.api, form);
    }

    list(): Observable<DocRecord[]> {
        return this.http.get<DocRecord[]>(this.api);
    }
    downloadDocument(id: string) {
  return this.http.get(
    `http://localhost:5032/api/documents/${id}/download`,
    { responseType: 'blob' }
  );
}

    delete(id: string, fileName: string): Observable<void> {
        return this.http.delete<void>(`${this.api}/${id}?fileName=${encodeURIComponent(fileName)}`);
    }
}
