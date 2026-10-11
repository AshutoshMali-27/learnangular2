import { Component, inject } from '@angular/core';
import { Message } from '../message';

@Component({
  imports: [],
  selector: 'app-comp-a',
  styleUrl: './comp-a.css',
  templateUrl: './comp-a.html',
})
export class CompA {
  private messageService = inject(Message);

  send(){
    this.messageService.add('Hello at ' + new Date().toLocaleTimeString());
  }
}
