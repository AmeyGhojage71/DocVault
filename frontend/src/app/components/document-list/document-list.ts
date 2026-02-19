import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-list.html'
})
export class DocumentListComponent implements OnInit {

  documents: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.http.get<any[]>('/api/documents')
      .subscribe(data => {
        this.documents = data;
      });
  }
}
