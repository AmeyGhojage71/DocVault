import { TestBed } from '@angular/core/testing';
import { UploadComponent } from './upload';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('UploadComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadComponent],
      providers: [
        provideHttpClient(),
        provideRouter([])   // ✅ Provides ActivatedRoute
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(UploadComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
