import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Parentcounter } from './parentcounter';

describe('Parentcounter', () => {
  let component: Parentcounter;
  let fixture: ComponentFixture<Parentcounter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Parentcounter],
    }).compileComponents();

    fixture = TestBed.createComponent(Parentcounter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
