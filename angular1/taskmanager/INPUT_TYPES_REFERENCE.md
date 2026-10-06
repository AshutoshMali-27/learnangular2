# Angular Input Types & Reactive Forms Reference

## Product Manager Component - Input Types Overview

This component demonstrates all common HTML input types used in Angular with Reactive Forms.

---

## Input Types Used

### 1. **TEXT INPUT**
```html
<input type="text" formControlName="name" />
```
- Used for: Product name
- Validators: required, minLength, maxLength
- Best for: Short text entries

---

### 2. **TEXTAREA**
```html
<textarea formControlName="description"></textarea>
```
- Used for: Product description
- Validators: required, minLength, maxLength
- Best for: Long text entries, multiple paragraphs
- Features: Resizable, multiple rows

---

### 3. **NUMBER INPUT**
```html
<input type="number" formControlName="price" step="0.01" />
<input type="number" formControlName="quantity" min="0" />
```
- Used for: Price, Quantity
- Validators: required, min, max
- Best for: Numeric values
- Attributes:
  - `step` - Increment/decrement value
  - `min` - Minimum allowed value
  - `max` - Maximum allowed value

---

### 4. **DATE INPUT**
```html
<input type="date" formControlName="launchDate" />
```
- Used for: Launch date
- Validators: required
- Best for: Date selection
- Output format: YYYY-MM-DD

---

### 5. **URL INPUT**
```html
<input type="url" formControlName="imageUrl" />
```
- Used for: Image URL
- Validators: required, pattern (regex for image URLs)
- Best for: URL entries with browser validation
- Pattern: `/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i`

---

### 6. **SELECT/DROPDOWN**
```html
<select formControlName="category">
  <option value="">-- Select Category --</option>
  <option value="Electronics">Electronics</option>
  <option value="Appliances">Appliances</option>
</select>
```
- Used for: Category selection
- Validators: required
- Best for: Single selection from predefined options
- Note: First option is usually placeholder

---

### 7. **RADIO BUTTONS**
```html
<label class="radio-label">
  <input type="radio" formControlName="rating" value="1" />
  ⭐ 1 Star
</label>
<label class="radio-label">
  <input type="radio" formControlName="rating" value="2" />
  ⭐⭐ 2 Stars
</label>
```
- Used for: Rating selection
- Validators: required
- Best for: Single selection with visible options
- Behavior: Only one can be selected at a time

---

### 8. **CHECKBOX**
```html
<label class="checkbox-label">
  <input type="checkbox" formControlName="isAvailable" />
  <span>Available for Purchase</span>
</label>

<label class="checkbox-label">
  <input type="checkbox" formControlName="isFeatured" />
  <span>Featured Product</span>
</label>
```
- Used for: Boolean values (isAvailable, isFeatured)
- Validators: none (optional)
- Best for: Yes/No or boolean flags
- Behavior: Multiple can be selected

---

## Validation Patterns Used

### Email Pattern
```typescript
email: ['', [Validators.required, Validators.email]]
```

### Image URL Pattern
```typescript
imageUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)]]
```

### Custom Pattern Example
```typescript
phone: ['', [Validators.pattern(/^\+?1?\d{9,15}$/)]]  // International phone
zipcode: ['', [Validators.pattern(/^\d{5}(-\d{4})?$/)]]  // US zip code
```

---

## Form Control Binding Methods

### **formControlName** (Recommended for Reactive Forms)
```html
<input formControlName="name" />
```
- Used with FormGroup
- Automatic binding to FormControl
- Clean and type-safe

### **[(ngModel)]** (Template-Driven Forms)
```html
<input [(ngModel)]="product.name" />
```
- Direct binding to component property
- Simpler but less powerful
- Mixed approach can cause conflicts

---

## Form State Management in Template

```html
<!-- Get current value -->
{{ productForm.get('name')?.value }}

<!-- Check if field is valid -->
{{ productForm.get('name')?.valid }}

<!-- Check if field was touched -->
{{ productForm.get('name')?.touched }}

<!-- Check if field was modified -->
{{ productForm.get('name')?.dirty }}

<!-- Check for specific error -->
{{ productForm.get('name')?.hasError('required') }}

<!-- Get all errors -->
{{ productForm.get('name')?.errors | json }}
```

---

## Conditional Styling Based on Form State

```html
<!-- Red border if invalid and touched -->
<input
  formControlName="email"
  [class.input-error]="isFieldInvalid('email')"
/>

<!-- Disabled button if form invalid -->
<button [disabled]="productForm.invalid">Submit</button>

<!-- Show error only if touched -->
<p *ngIf="getControl('email')?.touched && getControl('email')?.invalid">
  Invalid email
</p>
```

---

## Validators Reference

| Validator | Purpose | Example |
|-----------|---------|---------|
| `required` | Field must have a value | `Validators.required` |
| `minLength` | Minimum character count | `Validators.minLength(3)` |
| `maxLength` | Maximum character count | `Validators.maxLength(100)` |
| `min` | Minimum numeric value | `Validators.min(1)` |
| `max` | Maximum numeric value | `Validators.max(100000)` |
| `email` | Valid email format | `Validators.email` |
| `pattern` | Regex pattern match | `Validators.pattern(/^[A-Z]/)` |

---

## Component Methods Reference

### Get Control
```typescript
getControl(fieldName: string) {
  return this.productForm.get(fieldName);
}
```

### Check for Error
```typescript
hasError(fieldName: string, errorType: string): boolean {
  const control = this.productForm.get(fieldName);
  return !!(control && control.hasError(errorType) && control.touched);
}
```

### Check if Field Invalid
```typescript
isFieldInvalid(fieldName: string): boolean {
  const control = this.productForm.get(fieldName);
  return !!(control && control.invalid && control.touched);
}
```

### Reset Form
```typescript
this.productForm.reset({ 
  isAvailable: true,
  rating: '3',
  isFeatured: false 
});
```

### Patch Values (Update Specific Fields)
```typescript
this.productForm.patchValue({
  name: 'New Name',
  price: 99.99
});
```

### Set All Values
```typescript
this.productForm.setValue({
  name: 'Product',
  description: 'Description',
  price: 99.99,
  quantity: 10,
  category: 'Electronics',
  isAvailable: true,
  rating: '4',
  launchDate: '2023-01-01',
  imageUrl: 'https://...',
  isFeatured: false
});
```

---

## HTML5 Input Attributes

### Text Inputs
```html
<input 
  type="text" 
  placeholder="Help text"
  maxlength="50"
  pattern="[A-Za-z]+"
  required
/>
```

### Number Inputs
```html
<input 
  type="number" 
  min="0"
  max="100"
  step="0.01"
/>
```

### Date Inputs
```html
<input 
  type="date"
  min="2023-01-01"
  max="2024-12-31"
/>
```

### Select Options
```html
<select multiple>  <!-- Multiple selection -->
  <option value="opt1">Option 1</option>
  <option value="opt2" selected>Option 2</option>
  <option disabled>Disabled Option</option>
</select>
```

---

## Best Practices

1. **Always validate user input** - Use appropriate validators
2. **Show errors only after touch** - Don't show errors on initial load
3. **Disable submit on invalid form** - `[disabled]="form.invalid"`
4. **Use formControlName for Reactive Forms** - Never mix with [(ngModel)]
5. **Group related fields** - Use logical sections
6. **Provide clear placeholders** - Help users understand what to enter
7. **Use appropriate input types** - HTML5 provides browser validation
8. **Reset form after submit** - Clear data for next entry
9. **Disable button on submit** - Prevent double submission
10. **Test all validation states** - Valid, invalid, touched, untouched

---

## Quick CRUD Pattern

```typescript
// CREATE
addProduct(): void {
  if (this.productForm.invalid) return;
  const newProduct = { id: this.nextId, ...this.productForm.value };
  this.products.push(newProduct);
  this.nextId++;
  this.resetForm();
}

// READ
products: Product[] = [];  // Displayed in table with *ngFor

// UPDATE
updateProduct(): void {
  if (this.productForm.invalid) return;
  const product = this.products.find(p => p.id === this.editingId);
  if (product) Object.assign(product, this.productForm.value);
  this.resetForm();
}

// DELETE
deleteProduct(id: number): void {
  const index = this.products.findIndex(p => p.id === id);
  if (index > -1) this.products.splice(index, 1);
}
```

---

## Form Submission Workflow

1. User fills form with data
2. Real-time validation checks field validity
3. Submit button disabled until form.valid = true
4. User clicks submit
5. Component calls add/update method
6. Form is reset or goes to edit mode
7. Table updates with new/modified data

---

## Input Types Comparison

| Type | Use Case | Value Type | Multiple |
|------|----------|-----------|----------|
| text | Short text | string | No |
| textarea | Long text | string | No |
| number | Quantities | number | No |
| date | Dates | string (YYYY-MM-DD) | No |
| url | Web addresses | string | No |
| email | Email addresses | string | No |
| select | Dropdown choice | string | No* |
| radio | Single choice | string | No |
| checkbox | Boolean/Multiple | boolean or array | Yes |

*Select can allow multiple with `multiple` attribute

---

## Common Validation Errors

```typescript
Validators.required     → { required: true }
Validators.minLength(3) → { minlength: {requiredLength: 3, actualLength: 2} }
Validators.maxLength(50) → { maxlength: {requiredLength: 50, actualLength: 55} }
Validators.min(0)       → { min: {min: 0, actual: -5} }
Validators.max(100)     → { max: {max: 100, actual: 150} }
Validators.email        → { email: true }
Validators.pattern      → { pattern: {requiredPattern: '...', actualValue: '...'} }
```

Display with:
```html
<p *ngIf="form.get('field')?.getError('minlength') as error">
  Minimum {{ error.requiredLength }} characters needed
</p>
```
