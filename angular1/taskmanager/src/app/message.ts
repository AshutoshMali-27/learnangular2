import { Injectable, Service, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Message {
    message=signal<string[]>([]);

    add(msg:string){
        this.message.update((list)=>[...list,msg]);
    }

    clear(){
        this.message.set([]);
    }
}
