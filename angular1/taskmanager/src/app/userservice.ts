import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Service } from '@angular/core';
import { User } from './user';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Userservice {
      private http = inject(HttpClient);
  private apiUrl = 'https://jsonplaceholder.typicode.com/users';

  getUsers():Observable<User[]> {
   return this.http.get<User[]>(this.apiUrl);
  }

  
}
