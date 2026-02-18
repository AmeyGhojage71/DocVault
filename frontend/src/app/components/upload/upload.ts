import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';   // ✅ Required for Angular directives

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],   // ✅ Important
  templateUrl: './upload.html',
  styleUrls: ['./upload.css']
})
export class Upload {

  selectedFile!: File;

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  upload() {
    if (!this.selectedFile) {
      alert("Please select a file");
      return;
    }

    console.log("Selected file:", this.selectedFile.name);
    alert("File selected successfully!");
  }
}
