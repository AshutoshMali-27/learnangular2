import { Component, viewChild } from '@angular/core';
import { Counter } from '../counter/counter';

@Component({
  imports: [Counter],
  selector: 'app-parentcounter',
  styleUrl: './parentcounter.css',
  templateUrl: './parentcounter.html',
})
export class Parentcounter {
  count=viewChild(Counter);

  add(){
    this.count()?.increase();
  }

  subtract(){
    this.count()?.decrease();
  }

  reset(){
    this.count()?.reset();
  }
}
