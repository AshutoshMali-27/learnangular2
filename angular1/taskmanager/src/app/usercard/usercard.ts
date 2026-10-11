import { Component, computed, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-usercard',
  styleUrl: './usercard.css',
  templateUrl: './usercard.html',
})
export class Usercard {
    firstName = input.required<string>();  // parent must pass this
  lastName = input('');                  // optional, defaults to ''
  age = input(0);

  fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
  isAdult = computed(() => this.age() >= 18);
}
