# Day 1 Morning: TypeScript Crash Course

Since you already know JavaScript, we focus only on what TypeScript adds on top of it.

## 📋 Topics for this morning

- [ ] **1. Types**
  - Basic types: `string`, `number`, `boolean`, `any`, `unknown`, `void`, `null`, `undefined`
  - Arrays and tuples
  - Type inference (when you don't need to write the type)
- [ ] **2. Interfaces**
  - Defining the shape of an object
  - Optional (`?`) and `readonly` properties
  - Extending interfaces
- [ ] **3. Type Aliases**
  - `type` vs `interface`, and when to use each
- [ ] **4. Union Types**
  - `string | number`, literal unions like `'todo' | 'done'`
  - Type narrowing with `typeof` and checks
- [ ] **5. Generics**
  - Writing reusable functions and types like `Array<T>`
  - Why Angular uses them everywhere (e.g. `signal<Task[]>()`)
- [ ] **6. Classes**
  - Constructors, properties, methods
  - Access modifiers: `public`, `private`, `protected`, `readonly`
  - Parameter properties shorthand
- [ ] **7. Decorators**
  - What they are (functions that add metadata to classes)
  - Recognizing `@Component`, `@Injectable` in Angular
- [ ] **8. Strict Mode**
  - What `strict: true` turns on
  - Why Angular uses it, and how it catches bugs early

> 🔨 **Mini-practice at the end:** model the `Task` type for the Task Manager capstone using an interface, a union type for status, and a small generic helper.

---

# Topic 1: Types

TypeScript is JavaScript plus a type system. You write type annotations, the compiler checks them, and then they're **erased**. The browser only ever runs plain JS. So types catch bugs while you code and cost nothing at runtime.

---

## 1. Basic types

```ts
let username: string = 'Rahul';
let age: number = 25;          // integers and decimals are both `number`
let isActive: boolean = true;

age = 'twenty';  // ❌ Error: Type 'string' is not assignable to type 'number'
```

The syntax is always `name: type`.

---

## 2. Type inference (you'll rely on this most)

You usually **don't** need to write the type. TypeScript figures it out from the value:

```ts
let city = 'Mumbai';   // inferred as string
city = 42;             // ❌ still an error

const count = 10;      // inferred as the literal type 10 (const can't change)
```

**Rule of thumb:** let inference work for variables with an initial value. Write types explicitly for:

- function parameters
- return types (optional but good practice)
- variables you declare without a value

```ts
let score: number;     // no value yet, so annotate it
score = 90;
```

---

## 3. Arrays

Two equivalent syntaxes:

```ts
let tags: string[] = ['work', 'urgent'];
let ids: Array<number> = [1, 2, 3];   // generic syntax, covered in Topic 5

tags.push(5);  // ❌ Error: number is not a string
```

---

## 4. Tuples

A fixed-length array where each position has its own type:

```ts
let point: [number, number] = [10, 20];
let entry: [string, number] = ['age', 25];

entry = [25, 'age'];  // ❌ order matters
```

Less common in Angular, but useful for returning pairs of values.

---

## 5. Functions

Annotate parameters and the return type:

```ts
function add(a: number, b: number): number {
  return a + b;
}

const greet = (name: string): string => `Hello, ${name}`;

add(5, '3');  // ❌ caught before runtime (plain JS would return "53")
```

Optional and default parameters:

```ts
function createTask(title: string, priority?: number) { }  // priority may be undefined
function log(msg: string, level: string = 'info') { }
```

---

## 6. Special types

| Type | Meaning | When you'll see it |
|---|---|---|
| `void` | Function returns nothing | Event handlers, `deleteTask(): void` |
| `null` / `undefined` | Absence of a value | Data not loaded yet |
| `any` | **Turns off type checking** | Avoid it. It defeats the purpose of TS |
| `unknown` | "Could be anything, but check before use" | Safe alternative to `any` (e.g. API errors) |
| `never` | A value that can never occur | Functions that always throw |

### `any` vs `unknown`: the important difference

```ts
let a: any = 'hello';
a.toFixed();          // ✅ compiles, 💥 crashes at runtime

let u: unknown = 'hello';
u.toFixed();          // ❌ compile error, you must check first
if (typeof u === 'number') {
  u.toFixed();        // ✅ safe
}
```

### `void` and `never`

```ts
function logMessage(msg: string): void {
  console.log(msg);
}

function fail(msg: string): never {
  throw new Error(msg);
}
```

---

## 7. Typing objects inline

```ts
let user: { name: string; age: number } = { name: 'Rahul', age: 25 };

user.email = 'r@x.com';  // ❌ property 'email' does not exist
```

Writing object shapes inline gets messy fast. That's exactly what **interfaces** (Topic 2) solve.

---

## 🧠 Quick recap

- Syntax: `name: type`
- Let **inference** do the work when a value is assigned
- Always type **function parameters**
- Arrays: `string[]` or `Array<string>`; tuples: `[string, number]`
- Prefer `unknown` over `any`
- `void` = returns nothing, `never` = never returns

---

## ✍️ Practice (type it yourself, ~15 min)

Create `types-practice.ts` and run it with `npx tsx types-practice.ts` (or use the [TypeScript Playground](https://www.typescriptlang.org/play)).

- [ ] Declare `taskTitle` (string), `estimatedHours` (number), `isCompleted` (boolean). Assign a wrong type to each and read the error.
- [ ] Create a `tags` array of strings and try pushing a number into it.
- [ ] Write `calculateTotalHours(hours: number[]): number` that returns the sum.
- [ ] Write `formatTask(title: string, done: boolean): string` that returns `"✅ Buy milk"` or `"⬜ Buy milk"`.
- [ ] Write `parseInput(value: unknown): string` that returns the value uppercased if it's a string, otherwise `"invalid"`.

**Next up:** Topic 2, Interfaces.
