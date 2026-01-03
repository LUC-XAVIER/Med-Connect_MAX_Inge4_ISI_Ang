import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocConnectionComponent } from './doc-connection.component';

describe('DocConnectionComponent', () => {
  let component: DocConnectionComponent;
  let fixture: ComponentFixture<DocConnectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocConnectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocConnectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
