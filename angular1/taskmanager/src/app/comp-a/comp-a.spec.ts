import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompA } from './comp-a';

describe('CompA', () => {
  let component: CompA;
  let fixture: ComponentFixture<CompA>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompA],
    }).compileComponents();

    fixture = TestBed.createComponent(CompA);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
