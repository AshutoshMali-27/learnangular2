import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StudentManagerComponent } from './student-manager.component';
import { EmployeeManagerComponent } from './employee-manager.component';
import { ProductManagerComponent } from './product-manager.component';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [FormsModule, CommonModule, StudentManagerComponent, EmployeeManagerComponent, ProductManagerComponent],
})
export class App {
  todos: Todo[] = [];
  nextId = 1;
  newTodoTitle = '';
  addTodo(): void {
    if (!this.newTodoTitle.trim()) {
      return;
    }
    const newTodo: Todo = {
      id: this.nextId,
      title: this.newTodoTitle,
      completed: false,
    };
    this.todos.push(newTodo);
    this.nextId++;
    this.newTodoTitle = '';
  }

  deleteTodo(id: number): void {
    const index = this.todos.findIndex(todo => todo.id === id);
    if (index > -1) {
      this.todos.splice(index, 1);
    }
  }

  toggleTodo(id: number): void {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  }
  getCompletedCount(): number {
    return this.todos.filter(todo => todo.completed).length;
  }
}
