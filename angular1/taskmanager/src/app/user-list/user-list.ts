import { Component, inject, OnInit, signal } from '@angular/core';
import { Userservice } from '../userservice';
import { User } from '../user';

@Component({
  imports: [],
  selector: 'app-user-list',
  styleUrl: './user-list.css',
  templateUrl: './user-list.html',
})
export class UserList implements OnInit {



  private userService = inject(Userservice);
  users=signal<User[]>([]);
  loading=signal(false);
  error=signal('');

    ngOnInit(): void {
     this.userService.getUsers().subscribe({
      next:(data)=>{
        this.users.set(data);
        this.loading.set(false);
      },
      error:(err)=>{
       this.error.set('Error fetching users: ' + err.message);
       this.loading.set(false);
      }
     })
  }
}
