import { Component, signal } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-counter',
  styleUrl: './counter.css',
  templateUrl: './counter.html',
})
export class Counter {
  counter = signal(0);

  increase() {
    this.counter.update(v => v + 1);
  }

  decrease() {
    this.counter.update(v => v - 1);
  }

  reset() {
    this.counter.set(0);
  }
}
