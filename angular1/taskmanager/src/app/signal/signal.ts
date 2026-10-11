import { Component, computed, effect, signal, untracked } from '@angular/core';
import { Usercard } from '../usercard/usercard';

interface Todo{
  id:number;
  title:string;
  done:boolean;
}
@Component({
  imports: [],
  selector: 'app-signal',
  styleUrl: './signal.css',
  templateUrl: './signal.html',
})
export class Signal {
  name=signal('Ashutosh')
  count=signal(0)
  count1=signal(0)
  price=signal(100)
  qty=signal(1)
  todo=signal<Todo[]>([]);


  constructor() {
      effect(() => {
          const user = this.count1(); 
           const page = untracked(() => this.count1()); 
      console.log('Count is now', this.count1());
       console.log(`${user} is on ${page}`);
    });
  }
 updatecount(){
  this.count1.update(value=>value+1)
 }
  add(title:string){
    if(!title.trim()){
      return;
    }
    this.todo.update(list=>[...list,{id:Date.now(),title,done:false}])
  }

    remaining = computed(() => this.todo().filter(t => !t.done).length);

  toggle(id:number){
     this.todo.update(list =>
      list.map(t => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }
  total=computed(()=>this.price()*this.qty())
  isExpensive=computed(()=>this.total()>1000)


incrementqty(){
  this.qty.update(value=>value+1)
}
  increment() {
    this.count.update(value=>value+1)
  }
  decrement() {
    this.count.update(value=>value-1)
  }

  reset(){
    this.count.set(0)
  }
}
