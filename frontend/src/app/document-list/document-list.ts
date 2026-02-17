import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-list.html',
  styleUrl: './document-list.css'
})
export class DocumentList implements OnInit {

  docs: any[] = [];

  ngOnInit() {
    fetch('https://localhost:5001/api/documents')
      .then(res => res.json())
      .then(data => {
        this.docs = data;
      });
  }
}