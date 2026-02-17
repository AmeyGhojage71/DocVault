import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.html',
  styleUrl: './upload.css'
})
export class Upload {

  upload(event: any) {

    const file = event.target.files[0];

    const formData = new FormData();
    formData.append('file', file);

    fetch('https://localhost:5001/api/documents', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      console.log('Uploaded:', data);
      alert('Upload successful');
    });
  }
}