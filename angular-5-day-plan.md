# 🚀 Learn Angular in 5 Days: Master Plan

> **Mentor's note:** In 5 days you can learn modern Angular well enough to build real apps on your own. Mastery comes from building projects in the weeks after. Since you already know JavaScript, we skip the basics and go straight to Angular.

## How We'll Work

- About **8 hours a day**: roughly 30% learning, 70% coding
- Every day ends with a **mini-build**
- All five days feed into one capstone project: a **Task Manager app** with login, routing, API calls and forms

---

## 🗓️ Day 1: TypeScript + Angular Foundations

### Morning: TypeScript crash course (you know JS, so this is fast)
- [ ] Types, interfaces, type aliases, union types, generics
- [ ] Classes, access modifiers (`private`, `readonly`), decorators (what they are)
- [ ] `strict` mode and why Angular uses it

### Afternoon: Angular setup and core concepts
- [ ] Install Node and the Angular CLI, then run `ng new`
- [ ] Project structure: `main.ts`, `app.config.ts`, `angular.json`
- [ ] Standalone components, the modern default (NgModules only to recognize them)
- [ ] Data binding: interpolation `{{ }}`, property `[ ]`, event `( )`, two-way `[( )]`

### Evening: Templates in depth
- [ ] New control flow: `@if`, `@for` (with `track`), `@switch`
- [ ] Pipes: built-in pipes and writing a custom pipe

> 🔨 **Build:** a static task list UI with add and delete.

---

## 🗓️ Day 2: Components, Communication and Signals

### Morning: Component architecture
- [ ] Lifecycle hooks: `ngOnInit`, `ngOnDestroy`, `ngOnChanges`, `afterNextRender`
- [ ] Parent to child with `input()`, child to parent with `output()`, `model()` for two-way binding
- [ ] Content projection with `<ng-content>`
- [ ] `@ViewChild` and `viewChild()`

### Afternoon: Signals (modern Angular's core)
- [ ] `signal()`, `computed()`, `effect()`
- [ ] `linkedSignal()` and why signals replace much of the old change detection
- [ ] Change detection basics: `OnPush`, and what "zoneless" means

### Evening: Directives
- [ ] Attribute directives (`ngClass`, `ngStyle`), and writing your own (e.g. highlight-on-hover)
- [ ] Host bindings and listeners

> 🔨 **Build:** split the task app into components (TaskList, TaskItem, TaskForm). Manage state with signals.

---

## 🗓️ Day 3: Services, DI, Routing and HTTP

### Morning: Services and dependency injection
- [ ] `@Injectable`, `providedIn: 'root'`, and the `inject()` function
- [ ] Sharing state across components with a signal-based service
- [ ] Injection hierarchy, briefly

### Afternoon: Routing
- [ ] `provideRouter`, route config, `routerLink`, `router-outlet`
- [ ] Route params and query params, component input binding
- [ ] Child routes, lazy loading with `loadComponent`
- [ ] Guards (`canActivate`, functional guards) and resolvers

### Evening: HTTP
- [ ] `provideHttpClient`, GET, POST, PUT, DELETE
- [ ] Interceptors (auth token, global error handling)
- [ ] `resource()` / `httpResource()` for signal-based data loading
- [ ] Practice with a fake backend such as `json-server`

> 🔨 **Build:** add pages (Dashboard, Task Details, Login), connect to a fake API, and protect routes with a guard.

---

## 🗓️ Day 4: Forms + RxJS

### Morning: Forms
- [ ] Template-driven forms (quick overview)
- [ ] Reactive forms: `FormGroup`, `FormControl`, `FormBuilder`, `FormArray`
- [ ] Built-in and custom validators, async validators, displaying errors
- [ ] A brief look at the newer signal-based forms

### Afternoon: RxJS essentials
- [ ] Observables vs Promises, subscribing and unsubscribing (`takeUntilDestroyed`)
- [ ] Key operators: `map`, `filter`, `switchMap`, `mergeMap`, `debounceTime`, `distinctUntilChanged`, `catchError`, `combineLatest`
- [ ] `Subject` and `BehaviorSubject`
- [ ] `async` pipe, plus `toSignal()` and `toObservable()` to bridge RxJS and signals

### Evening: Practice
- [ ] Live search with debounce
- [ ] Login form with full validation

> 🔨 **Build:** reactive task form with validation, plus search and filter using RxJS.

---

## 🗓️ Day 5: Advanced Topics + Capstone Polish

### Morning: Professional skills
- [ ] State management patterns: signal store services, short NgRx Signal Store intro
- [ ] Performance: `@defer` blocks, lazy loading, `OnPush`, `track` in loops
- [ ] Error handling and loading states

### Afternoon: Quality and tooling
- [ ] Unit testing basics: testing a component and a service
- [ ] Angular Material or a UI library, quickly
- [ ] Environment configs, `ng build`, deploy to Netlify, Vercel or Firebase
- [ ] Brief look at SSR/hydration (what it is, when to use it)

### Evening: Finish the capstone
- [ ] Complete the Task Manager: auth, CRUD, filters, lazy routes, deployed live
- [ ] Review: what to revisit, and your next 30 days

---

## 📌 Rules for the 5 Days

1. **Type every line yourself.** Don't copy-paste code.
2. **Finish the daily build before sleeping**, even if it's rough.
3. **Use the official docs ([angular.dev](https://angular.dev))** alongside your mentor.
4. **Stuck for more than 20 minutes? Ask.** Don't stay blocked.

---

## ✅ Progress Tracker

| Day | Topic | Build | Done |
|-----|-------|-------|------|
| 1 | TypeScript + Foundations | Static task list | ⬜ |
| 2 | Components + Signals | Component-based task app | ⬜ |
| 3 | Services, Routing, HTTP | Multi-page app with API | ⬜ |
| 4 | Forms + RxJS | Validated forms + live search | ⬜ |
| 5 | Advanced + Capstone | Deployed Task Manager | ⬜ |
