# CRUD Operations in Angular - Learning Guide

## What is CRUD?

CRUD stands for **Create, Read, Update, Delete** - the four basic operations for managing data in any application.

---

## 📚 Component Overview

The `StudentManagerComponent` demonstrates all CRUD operations with a real-world example: managing student records.

### File Structure
```
src/app/
├── student-manager.component.ts      (TypeScript - Logic)
├── student-manager.component.html    (HTML - Template/UI)
└── student-manager.component.css     (CSS - Styling)
```

---

## 🔍 Understanding the Code

### 1. **The Data Model (Interface)**

```typescript
interface Student {
  id: number;       // Unique identifier
  name: string;     // Student's name
  email: string;    // Student's email
  grade: number;    // Student's grade
}
```

This interface defines the structure of our data. Think of it as a blueprint for each student record.

---

## ✨ CRUD Operations Explained

### **C - CREATE (Insert New Data)**

**What it does:** Adds a new student to the list.

**Code:**
```typescript
addStudent(): void {
  // Step 1: Validate inputs
  if (!this.newStudent.name.trim() || !this.newStudent.email.trim()) {
    alert('Please fill in all fields');
    return;
  }

  // Step 2: Create a new student object
  const student: Student = {
    id: this.nextId,                    // Assign unique ID
    name: this.newStudent.name.trim(),
    email: this.newStudent.email.trim(),
    grade: this.newStudent.grade,
  };

  // Step 3: Add to array
  this.students.push(student);

  // Step 4: Increment ID for next student
  this.nextId++;

  // Step 5: Clear the form
  this.resetForm();
}
```

**HTML (Template):**
```html
<button (click)="addStudent()" class="btn btn-add">
  ➕ Add Student
</button>
```

**How it works in the UI:**
1. User fills in Name, Email, and Grade fields
2. User clicks "Add Student" button
3. Component validates the data
4. New student is added to the `students` array
5. Form is cleared and ready for next entry

---

### **R - READ (Display Data)**

**What it does:** Shows all students in a table.

**Code:**
```typescript
students: Student[] = [];  // Array to store all students
```

**HTML (Template):**
```html
<!-- Loop through all students and display each row -->
<tr *ngFor="let student of students" class="table-row">
  <td>{{ student.id }}</td>
  <td>{{ student.name }}</td>
  <td>{{ student.email }}</td>
  <td>{{ student.grade }}</td>
</tr>
```

**How it works:**
- The `*ngFor` directive loops through each student in the `students` array
- `{{ student.name }}` displays the student's name using interpolation
- This happens automatically whenever the array changes

---

### **U - UPDATE (Edit Existing Data)**

**What it does:** Allows editing an existing student's information.

**Code - Step 1: Load data into form:**
```typescript
editStudent(id: number): void {
  // Find the student to edit
  const student = this.students.find(s => s.id === id);

  if (student) {
    // Fill form with current data
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
```

**Code - Step 2: Update the student:**
```typescript
updateStudent(): void {
  // Validate
  if (!this.newStudent.name.trim() || !this.newStudent.email.trim()) {
    alert('Please fill in all fields');
    return;
  }

  // Find and update the student
  const student = this.students.find(s => s.id === this.editingId);

  if (student) {
    student.name = this.newStudent.name.trim();
    student.email = this.newStudent.email.trim();
    student.grade = this.newStudent.grade;
  }

  // Exit edit mode
  this.resetForm();
}
```

**HTML (Template):**
```html
<!-- Edit button in table -->
<button (click)="editStudent(student.id)" class="btn btn-edit">
  ✏️ Edit
</button>

<!-- Update button shown only in edit mode -->
<button *ngIf="isEditMode" (click)="updateStudent()" class="btn btn-update">
  💾 Update Student
</button>
```

**How it works:**
1. User clicks "Edit" button next to a student
2. Form fills with that student's current data
3. User modifies the fields
4. User clicks "Update Student"
5. Student record is updated in the array
6. Form clears and goes back to "Add" mode

---

### **D - DELETE (Remove Data)**

**What it does:** Removes a student from the list.

**Code:**
```typescript
deleteStudent(id: number): void {
  // Step 1: Find the index of the student
  const index = this.students.findIndex(student => student.id === id);

  // Step 2: If found, remove it
  if (index > -1) {
    this.students.splice(index, 1);  // Remove 1 item at index
  }
}
```

**HTML (Template):**
```html
<!-- Delete button in table -->
<button (click)="deleteStudent(student.id)" class="btn btn-delete">
  🗑️ Delete
</button>
```

**How it works:**
1. User clicks the "Delete" button next to a student
2. Component finds the student in the array
3. Student is removed using `splice()`
4. Table updates automatically

---

## 📊 Key Angular Concepts Used

### **1. Two-Way Data Binding: `[(ngModel)]`**
```html
<input [(ngModel)]="newStudent.name" />
```
- `[ngModel]` = One-way binding (Component → HTML)
- `(ngModel)` = Event binding (HTML → Component)
- `[(ngModel)]` = Two-way binding (Component ↔ HTML)

When user types in input, `newStudent.name` updates automatically, and vice versa.

### **2. Structural Directive: `*ngIf`**
```html
<button *ngIf="!isEditMode" (click)="addStudent()">Add</button>
<button *ngIf="isEditMode" (click)="updateStudent()">Update</button>
```
Shows/hides elements based on conditions.

### **3. Structural Directive: `*ngFor`**
```html
<tr *ngFor="let student of students">
  <td>{{ student.name }}</td>
</tr>
```
Loops through an array and creates DOM elements for each item.

### **4. Event Binding: `(click)`**
```html
<button (click)="addStudent()">Add</button>
```
Calls component method when user clicks button.

### **5. Property Binding: `{{ }}`**
```html
<td>{{ student.name }}</td>
```
Displays component property in HTML.

---

## 🧪 Testing the Component

1. **Test CREATE:**
   - Fill in Name, Email, Grade
   - Click "Add Student"
   - Verify student appears in table

2. **Test READ:**
   - Check that all students display in table
   - Table shows ID, Name, Email, Grade columns

3. **Test UPDATE:**
   - Click "Edit" on a student
   - Form fills with student's data
   - Change values
   - Click "Update Student"
   - Verify changes in table

4. **Test DELETE:**
   - Click "Delete" on a student
   - Verify student is removed from table
   - Check total count decreases

---

## 💡 Key Takeaways

1. **Interface/Model**: Defines data structure (`Student`)
2. **Array**: Stores multiple records (`students: Student[]`)
3. **Create**: Push new items to array
4. **Read**: Display array data with `*ngFor`
5. **Update**: Find item by ID and modify properties
6. **Delete**: Find item and remove from array with `splice()`
7. **Two-Way Binding**: `[(ngModel)]` keeps form and component in sync
8. **Events**: `(click)` triggers methods
9. **Conditions**: `*ngIf` shows/hides elements based on state
10. **Loops**: `*ngFor` renders elements for each array item

---

## 🚀 Next Steps to Learn

1. Try modifying the Student interface (add more fields like phone number)
2. Add validation (email format check, grade range validation)
3. Add sorting (sort students by name or grade)
4. Add filtering (show only high-performing students)
5. Connect to a real API (backend server) instead of local array
6. Add search functionality
7. Export data to CSV or PDF

---

## 📌 Common Mistakes to Avoid

1. ❌ **Forgetting `[(ngModel)]` import** - Add `FormsModule` to imports
2. ❌ **Not validating user input** - Always check before adding/updating
3. ❌ **Using `==` instead of `===`** - Use strict equality
4. ❌ **Not clearing form after submit** - Call `resetForm()`
5. ❌ **Modifying array without triggering update** - Angular detects `push()`, `splice()`, direct assignment

---

## 🔗 Angular Resources

- [Angular Documentation](https://angular.io/docs)
- [Angular Forms](https://angular.io/guide/forms)
- [Angular Built-in Directives](https://angular.io/guide/built-in-directives)
- [Two-Way Binding](https://angular.io/guide/two-way-binding)
