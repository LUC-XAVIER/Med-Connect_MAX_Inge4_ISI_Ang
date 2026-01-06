import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatDashboardComponent } from './pat-dashboard.component';

describe('PatDashboardComponent', () => {
  let component: PatDashboardComponent;
  let fixture: ComponentFixture<PatDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PatDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
