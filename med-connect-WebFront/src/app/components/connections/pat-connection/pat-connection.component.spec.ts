import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatConnectionComponent } from './pat-connection.component';

describe('PatConnectionComponent', () => {
  let component: PatConnectionComponent;
  let fixture: ComponentFixture<PatConnectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatConnectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PatConnectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
