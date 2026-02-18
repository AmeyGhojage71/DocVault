import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';   // ✅ ADD THIS
import { DocumentService, Document } from '../../services/document.service';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule],   // ✅ ADD THIS
  templateUrl: './document-list.html',
  styleUrls: ['./document-list.css']
})
export class DocumentListComponent {

  documents = [
    {
      id: '1',
      fileName: 'Project_Report.pdf',
      size: '250 KB',
      uploadedAt: '2026-02-17'
    },
    {
      id: '2',
      fileName: 'Invoice_2026.jpg',
      size: '520 KB',
      uploadedAt: '2026-02-16'
    }
  ];

  deleteDocument(id: string) {
    this.documents = this.documents.filter(doc => doc.id !== id);
  }
}
