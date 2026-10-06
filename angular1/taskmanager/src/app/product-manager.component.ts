import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  isAvailable: boolean;
  rating: string;
  launchDate: string;
  imageUrl: string;
  isFeatured: boolean;
}

@Component({
  selector: 'app-product-manager',
  templateUrl: './product-manager.component.html',
  styleUrl: './product-manager.component.css',
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
})
export class ProductManagerComponent implements OnInit {
  products: Product[] = [];
  nextId = 1;
  productForm!: FormGroup;
  isEditMode = false;
  editingId: number | null = null;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
    this.initializeSampleData();
  }

  initializeForm(): void {
    this.productForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      price: ['', [Validators.required, Validators.min(1), Validators.max(100000)]],
      quantity: ['', [Validators.required, Validators.min(0), Validators.max(10000)]],
      category: ['', Validators.required],
      isAvailable: [true],
      rating: ['3', Validators.required],
      launchDate: ['', Validators.required],
      imageUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)]],
      isFeatured: [false],
    });
  }

  initializeSampleData(): void {
    this.products = [
      {
        id: 1,
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
        price: 199.99,
        quantity: 45,
        category: 'Electronics',
        isAvailable: true,
        rating: '5',
        launchDate: '2023-01-10',
        imageUrl: 'https://example.com/headphones.jpg',
        isFeatured: true,
      },
      {
        id: 2,
        name: 'Coffee Maker',
        description: 'Automatic coffee maker with programmable timer and built-in grinder for fresh coffee.',
        price: 79.99,
        quantity: 30,
        category: 'Appliances',
        isAvailable: true,
        rating: '4',
        launchDate: '2023-02-15',
        imageUrl: 'https://example.com/coffee.jpg',
        isFeatured: false,
      },
      {
        id: 3,
        name: 'Yoga Mat',
        description: 'Non-slip eco-friendly yoga mat with carrying strap for yoga and fitness training.',
        price: 49.99,
        quantity: 60,
        category: 'Sports',
        isAvailable: true,
        rating: '4',
        launchDate: '2023-03-05',
        imageUrl: 'https://example.com/yoga.jpg',
        isFeatured: false,
      },
    ];
    this.nextId = 4;
  }

  addProduct(): void {
    if (this.productForm.invalid) {
      alert('Please fill all fields correctly');
      return;
    }

    const newProduct: Product = {
      id: this.nextId,
      ...this.productForm.value,
    };

    this.products.push(newProduct);
    this.nextId++;
    this.resetForm();
  }

  updateProduct(): void {
    if (this.productForm.invalid) {
      alert('Please fill all fields correctly');
      return;
    }

    const product = this.products.find(p => p.id === this.editingId);
    if (product) {
      Object.assign(product, this.productForm.value);
    }

    this.resetForm();
  }

  deleteProduct(id: number): void {
    const index = this.products.findIndex(p => p.id === id);
    if (index > -1) {
      this.products.splice(index, 1);
    }
  }

  editProduct(id: number): void {
    const product = this.products.find(p => p.id === id);
    if (product) {
      this.productForm.patchValue(product);
      this.isEditMode = true;
      this.editingId = id;
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.productForm.reset({ isAvailable: true, rating: '3', isFeatured: false });
    this.isEditMode = false;
    this.editingId = null;
  }

  getControl(fieldName: string) {
    return this.productForm.get(fieldName);
  }

  hasError(fieldName: string, errorType: string): boolean {
    const control = this.productForm.get(fieldName);
    return !!(control && control.hasError(errorType) && control.touched);
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.productForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  getTotalInventoryValue(): number {
    return this.products.reduce((total, product) => total + product.price * product.quantity, 0);
  }

  getAveragePrice(): number {
    if (this.products.length === 0) return 0;
    return Math.round((this.products.reduce((sum, p) => sum + p.price, 0) / this.products.length) * 100) / 100;
  }

  getFeaturedCount(): number {
    return this.products.filter(p => p.isFeatured).length;
  }
}
