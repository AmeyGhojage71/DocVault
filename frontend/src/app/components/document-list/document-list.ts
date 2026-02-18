import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-list.html',
  styleUrls: ['./document-list.css']
})
export class DocumentList {

  // Sample data (Replace later with API data)
  documents = [
    { id: 1, fileName: 'report.pdf' },
    { id: 2, fileName: 'invoice.docx' },
    { id: 3, fileName: 'data.xlsx' },
    { id: 4, fileName: 'image.png' }
  ];

  // ✅ SAFE version (No crash)
  getFileIcon(fileName?: string): string {

    const extension = fileName?.split('.')?.pop()?.toLowerCase();

    if (!extension) return '📁';

    const iconMap: any = {
      pdf: '📕',
      doc: '📘',
      docx: '📘',
      xls: '📗',
      xlsx: '📗',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️'
    };

    return iconMap[extension] || '📁';
  }
}
