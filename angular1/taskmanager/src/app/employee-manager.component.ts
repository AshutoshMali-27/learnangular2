import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Employee {
  id: number;
  name: string;
  email: string;
  salary: number;
  department: string;
  joiningDate: string;
}

@Component({
  selector: 'app-employee-manager',
  templateUrl: './employee-manager.component.html',
  styleUrl: './employee-manager.component.css',
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
})
export class EmployeeManagerComponent implements OnInit {
  // Array to store all employees
  employees: Employee[] = [];
  nextId = 1;
  employeeForm!: FormGroup;
  isEditMode = false;
  editingId: number | null = null;
  constructor(private formBuilder: FormBuilder) {}
  ngOnInit(): void {
    this.initializeForm();
    this.initializeSampleData();
  }
  initializeForm(): void {
    this.employeeForm = this.formBuilder.group({
      name: ['',[Validators.required,  Validators.minLength(3), Validators.maxLength(50)]],
      email: ['',[Validators.required,Validators.email]],
      salary: ['',[Validators.required, Validators.min(15000),Validators.max(1000000)]],
      department: ['',[ Validators.required]],
      joiningDate: ['',[Validators.required]],
    });
  }
  initializeSampleData(): void {
    this.employees = [
      {
        id: 1,
        name: 'Alice Johnson',
        email: 'alice@example.com',
        salary: 75000,
        department: 'Engineering',
        joiningDate: '2023-01-15',
      },
      {
        id: 2,
        name: 'Bob Smith',
        email: 'bob@example.com',
        salary: 65000,
        department: 'Sales',
        joiningDate: '2023-03-20',
      },
      {
        id: 3,
        name: 'Carol Davis',
        email: 'carol@example.com',
        salary: 70000,
        department: 'HR',
        joiningDate: '2023-02-10',
      },
    ];
    this.nextId = 4;
  }

  addEmployee(): void {
    if (this.employeeForm.invalid) {
      alert('Please fill all fields correctly');
      return;
    }
    const newEmployee: Employee = {
      id: this.nextId,
      name: this.employeeForm.value.name,
      email: this.employeeForm.value.email,
      salary: this.employeeForm.value.salary,
      department: this.employeeForm.value.department,
      joiningDate: this.employeeForm.value.joiningDate,
    };
    this.employees.push(newEmployee);
    this.nextId++;
    this.resetForm();
  }
  updateEmployee(): void {
    if (this.employeeForm.invalid) {
      alert('Please fill all fields correctly');
      return;
    }
    const employee = this.employees.find(e => e.id === this.editingId);
    if (employee) {
      employee.name = this.employeeForm.value.name;
      employee.email = this.employeeForm.value.email;
      employee.salary = this.employeeForm.value.salary;
      employee.department = this.employeeForm.value.department;
      employee.joiningDate = this.employeeForm.value.joiningDate;
    }
    this.resetForm();
  }
  deleteEmployee(id: number): void {
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index > -1) {
      this.employees.splice(index, 1);
    }
  }

  editEmployee(id: number): void {
    const employee = this.employees.find(e => e.id === id);
    if (employee) {
      this.employeeForm.patchValue({
        name: employee.name,
        email: employee.email,
        salary: employee.salary,
        department: employee.department,
        joiningDate: employee.joiningDate,
      });
      this.isEditMode = true;
      this.editingId = id;
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }
  private resetForm(): void {
    this.employeeForm.reset(); 
    this.isEditMode = false;
    this.editingId = null;
  }
  getControl(fieldName: string) {
    return this.employeeForm.get(fieldName);
  }

  hasError(fieldName: string, errorType: string): boolean {
    const control = this.employeeForm.get(fieldName);
    return !!(control && control.hasError(errorType) && control.touched);
  }
  isFieldInvalid(fieldName: string): boolean {
    const control = this.employeeForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  getAverageSalary(): number {
    if (this.employees.length === 0) return 0;
    const total = this.employees.reduce((sum, emp) => sum + emp.salary, 0);
    return Math.round(total / this.employees.length);
  }

  getHighestSalary(): number {
    if (this.employees.length === 0) return 0;
    return Math.max(...this.employees.map(emp => emp.salary));
  }
}
