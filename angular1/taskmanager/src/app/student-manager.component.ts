import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Student {
  id: number;
  name: string;
  email: string;
  grade: number;
}

@Component({
  selector: 'app-student-manager',
  templateUrl: './student-manager.component.html',
  styleUrl: './student-manager.component.css',
  imports: [CommonModule, FormsModule],
  standalone: true,
})
export class StudentManagerComponent {
  students: Student[] = [];
  nextId = 1;
  newStudent = {
    name: '',
    email: '',
    grade: 0,
  };
  isEditMode = false;
  editingId: number | null = null;
  constructor() {
    this.initializeSampleData();
  }
  initializeSampleData(): void {
    this.students = [
      { id: 1, name: 'John Doe', email: 'john@example.com', grade: 85 },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', grade: 92 },
      { id: 3, name: 'Bob Wilson', email: 'bob@example.com', grade: 78 },
    ];
    this.nextId = 4;
  }
  addStudent(): void {
    if (!this.newStudent.name.trim() || !this.newStudent.email.trim()) {
      alert('Please fill in all fields');
      return;
    }
    const student: Student = {
      id: this.nextId,
      name: this.newStudent.name.trim(),
      email: this.newStudent.email.trim(),
      grade: this.newStudent.grade,
    };
    this.students.push(student);
    this.nextId++;
    this.resetForm();
  }
  updateStudent(): void {
    if (!this.newStudent.name.trim() || !this.newStudent.email.trim()) {
      alert('Please fill in all fields');
      return;
    }
    const student = this.students.find(s => s.id === this.editingId);
    if (student) {
      student.name = this.newStudent.name.trim();
      student.email = this.newStudent.email.trim();
      student.grade = this.newStudent.grade;
    }
    this.resetForm();
  }
  
  deleteStudent(id: number): void {
    const index = this.students.findIndex(student => student.id === id);
    if (index > -1) {
      this.students.splice(index, 1);
    }
  }

  editStudent(id: number): void {
    const student = this.students.find(s => s.id === id);
    if (student) {
      this.newStudent = {
        name: student.name,
        email: student.email,
        grade: student.grade,
      };
      this.isEditMode = true;
      this.editingId = id;
    }
  }
  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.newStudent = {
      name: '',
      email: '',
      grade: 0,
    };
    this.isEditMode = false;
    this.editingId = null;
  }
}
