import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Define the Student interface - this is the structure of our data
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
  // Array to store all students
  students: Student[] = [];

  // Auto-increment ID for new students
  nextId = 1;

  // Form fields for adding/editing student
  newStudent = {
    name: '',
    email: '',
    grade: 0,
  };

  // Track if we're in edit mode
  isEditMode = false;
  editingId: number | null = null;

  constructor() {
    // Initialize with sample data for learning purposes
    this.initializeSampleData();
  }

  // Initialize with some sample students
  initializeSampleData(): void {
    this.students = [
      { id: 1, name: 'John Doe', email: 'john@example.com', grade: 85 },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', grade: 92 },
      { id: 3, name: 'Bob Wilson', email: 'bob@example.com', grade: 78 },
    ];
    this.nextId = 4;
  }

  // CREATE - Add a new student
  addStudent(): void {
    // Validate that required fields are filled
    if (!this.newStudent.name.trim() || !this.newStudent.email.trim()) {
      alert('Please fill in all fields');
      return;
    }

    // Create a new student object with a unique ID
    const student: Student = {
      id: this.nextId,
      name: this.newStudent.name.trim(),
      email: this.newStudent.email.trim(),
      grade: this.newStudent.grade,
    };

    // Add the student to our array
    this.students.push(student);

    // Increment the ID for the next student
    this.nextId++;

    // Clear the form
    this.resetForm();
  }

  // UPDATE - Edit an existing student
  updateStudent(): void {
    // Validate that required fields are filled
    if (!this.newStudent.name.trim() || !this.newStudent.email.trim()) {
      alert('Please fill in all fields');
      return;
    }

    // Find the student we're editing
    const student = this.students.find(s => s.id === this.editingId);

    if (student) {
      // Update the student's properties
      student.name = this.newStudent.name.trim();
      student.email = this.newStudent.email.trim();
      student.grade = this.newStudent.grade;
    }

    // Exit edit mode and clear form
    this.resetForm();
  }

  // DELETE - Remove a student by ID
  deleteStudent(id: number): void {
    // Find the index of the student
    const index = this.students.findIndex(student => student.id === id);

    // If found, remove it from the array
    if (index > -1) {
      this.students.splice(index, 1);
    }
  }

  // Set form for editing an existing student
  editStudent(id: number): void {
    // Find the student to edit
    const student = this.students.find(s => s.id === id);

    if (student) {
      // Fill the form with the student's current data
      this.newStudent = {
        name: student.name,
        email: student.email,
        grade: student.grade,
      };

      // Set edit mode flags
      this.isEditMode = true;
      this.editingId = id;
    }
  }

  // Cancel editing and reset the form
  cancelEdit(): void {
    this.resetForm();
  }

  // Helper function to reset the form
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
