import { Component, inject } from '@angular/core';
import { Message } from '../message';

@Component({
  imports: [],
  selector: 'app-comp-b',
  styleUrl: './comp-b.css',
  templateUrl: './comp-b.html',
})
export class CompB {
  massageService=   inject(Message);
}
