import { Routes } from '@angular/router';
import { Home } from './home/home';
import { UserList } from './user-list/user-list';
import { UserDetails } from './user-details/user-details';
import { Notfound } from './notfound/notfound';

export const routes: Routes = [
    {path:'',component:Home},
    {path:'users',component:UserList},
     {path:'users/:id',component:UserDetails},
     {path:'**',component:Notfound},
];
