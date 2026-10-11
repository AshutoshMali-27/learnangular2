import { Component, input, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-child',
  styleUrl: './child.css',
  templateUrl: './child.html',
})
export class Child {
  name=input.required<string>();  // parent must pass this
  age=input(18);                  // optional, defaults to 0
  message=output<string>();

  sendMessage(){
    this.message.emit('Hello from child');
  }
  
}
