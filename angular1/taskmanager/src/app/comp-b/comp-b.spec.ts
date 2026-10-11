import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompB } from './comp-b';

describe('CompB', () => {
  let component: CompB;
  let fixture: ComponentFixture<CompB>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompB],
    }).compileComponents();

    fixture = TestBed.createComponent(CompB);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
