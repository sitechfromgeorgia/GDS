# Advanced TypeScript Patterns

## Utility Types and Type Manipulation

### Built-in Utility Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// ✅ Partial - Make all properties optional
type UserUpdate = Partial<User>;
const update: UserUpdate = { name: 'John' }; // Valid

// ✅ Required - Make all properties required
type RequiredUser = Required<Partial<User>>;

// ✅ Readonly - Make all properties immutable
type ImmutableUser = Readonly<User>;

// ✅ Pick - Select specific properties
type UserCredentials = Pick<User, 'email' | 'password'>;

// ✅ Omit - Exclude specific properties
type PublicUser = Omit<User, 'password'>;

// ✅ Record - Create object type with keys and values
type UserRoles = Record<string, User>;
const users: UserRoles = {
  'user-1': { /* user object */ },
  'user-2': { /* user object */ }
};

// ✅ Extract - Extract types from union
type AdminOrUser = Extract<User['role'], 'admin' | 'user'>;

// ✅ Exclude - Remove types from union
type JustUser = Exclude<User['role'], 'admin'>; // 'user'

// ✅ NonNullable - Remove null and undefined
type DefinitelyUser = NonNullable<User | null | undefined>;

// ✅ ReturnType - Get return type of function
function getUser(): User { /* ... */ }
type UserType = ReturnType<typeof getUser>; // User

// ✅ Parameters - Get function parameter types
function createUser(name: string, email: string): User { /* ... */ }
type CreateUserParams = Parameters<typeof createUser>; // [string, string]
```

---

## Advanced Type Guards

### Type Predicates

```typescript
// ✅ Custom type guard with type predicate
interface Dog {
  type: 'dog';
  bark(): void;
}

interface Cat {
  type: 'cat';
  meow(): void;
}

type Pet = Dog | Cat;

// Type predicate function
function isDog(pet: Pet): pet is Dog {
  return pet.type === 'dog';
}

function handlePet(pet: Pet) {
  if (isDog(pet)) {
    pet.bark(); // TypeScript knows it's Dog
  } else {
    pet.meow(); // TypeScript knows it's Cat
  }
}
```

### Discriminated Unions

```typescript
// ✅ Use discriminated unions for type safety
interface SuccessResponse {
  status: 'success';
  data: User;
}

interface ErrorResponse {
  status: 'error';
  error: string;
  code: number;
}

type ApiResponse = SuccessResponse | ErrorResponse;

function handleResponse(response: ApiResponse) {
  // TypeScript narrows type based on discriminant
  if (response.status === 'success') {
    console.log(response.data.name); // OK - knows it has data
  } else {
    console.error(response.error); // OK - knows it has error
  }
}
```

### Assertion Functions

```typescript
// ✅ Assertion functions for runtime validation
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('Value must be a string');
  }
}

function processInput(input: unknown) {
  assertIsString(input);
  // After assertion, TypeScript knows input is string
  console.log(input.toUpperCase());
}

// ✅ Assert with custom condition
function assertIsDefined<T>(
  value: T | null | undefined
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error('Value must be defined');
  }
}

function getUserName(user: User | null): string {
  assertIsDefined(user);
  return user.name; // TypeScript knows user is not null
}
```

---

## Generic Patterns

### Generic Constraints

```typescript
// ✅ Constrain generic types
interface HasId {
  id: string;
}

function findById<T extends HasId>(
  items: T[], 
  id: string
): T | undefined {
  return items.find(item => item.id === id);
}

// ✅ Multiple type parameters with constraints
function merge<T extends object, U extends object>(
  obj1: T,
  obj2: U
): T & U {
  return { ...obj1, ...obj2 };
}
```

### Generic Factory Pattern

```typescript
// ✅ Generic factory for creating instances
class Repository<T extends { id: string }> {
  private items: Map<string, T> = new Map();
  
  add(item: T): void {
    this.items.set(item.id, item);
  }
  
  findById(id: string): T | undefined {
    return this.items.get(id);
  }
  
  findAll(): T[] {
    return Array.from(this.items.values());
  }
  
  remove(id: string): boolean {
    return this.items.delete(id);
  }
}

// Usage - type-safe for specific entity
const userRepo = new Repository<User>();
userRepo.add({ id: '1', name: 'John', /* ... */ });
```

### Conditional Types

```typescript
// ✅ Conditional types for complex type logic
type IsString<T> = T extends string ? true : false;
type Test1 = IsString<string>; // true
type Test2 = IsString<number>; // false

// ✅ Practical example - unwrap Promise type
type Unwrap<T> = T extends Promise<infer U> ? U : T;

type Result1 = Unwrap<Promise<string>>; // string
type Result2 = Unwrap<number>; // number

// ✅ Function overloads with conditional types
function process<T extends string | number>(
  value: T
): T extends string ? string[] : number[];
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.split('');
  }
  return [value];
}
```

---

## Mapped Types

### Custom Mapped Types

```typescript
// ✅ Make properties optional and nullable
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

type NullableUser = Nullable<User>;
// { id: string | null; name: string | null; ... }

// ✅ Add prefix to property names
type Prefixed<T, P extends string> = {
  [K in keyof T as `${P}${Capitalize<string & K>}`]: T[K];
};

type ApiUser = Prefixed<User, 'api'>;
// { apiId: string; apiName: string; ... }

// ✅ Filter properties by type
type StringProperties<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

type UserStrings = StringProperties<User>;
// { id: string; name: string; email: string }
```

### Getters and Setters with Mapped Types

```typescript
// ✅ Generate getters and setters
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

type UserAccessors = Getters<User> & Setters<User>;
// { getId(): string; setId(value: string): void; getName(): string; ... }
```

---

## Template Literal Types

```typescript
// ✅ Generate string literal unions
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type Endpoint = '/users' | '/posts' | '/comments';

type APIRoute = `${HTTPMethod} ${Endpoint}`;
// "GET /users" | "GET /posts" | "POST /users" | ...

// ✅ Event naming pattern
type EventName = 'click' | 'focus' | 'blur';
type EventHandler = `on${Capitalize<EventName>}`;
// "onClick" | "onFocus" | "onBlur"

// ✅ CSS properties with vendor prefixes
type CSSProperty = 'transform' | 'appearance';
type VendorPrefix = '-webkit-' | '-moz-' | '-ms-';
type VendorProperty = `${VendorPrefix}${CSSProperty}`;
```

---

## Advanced Function Types

### Function Overloads

```typescript
// ✅ Precise function overloading
function createElement(tag: 'div'): HTMLDivElement;
function createElement(tag: 'span'): HTMLSpanElement;
function createElement(tag: 'button'): HTMLButtonElement;
function createElement(tag: string): HTMLElement;
function createElement(tag: string): HTMLElement {
  return document.createElement(tag);
}

const div = createElement('div'); // Type: HTMLDivElement
const span = createElement('span'); // Type: HTMLSpanElement
```

### Builder Pattern with Fluent API

```typescript
// ✅ Type-safe builder pattern
class QueryBuilder<T> {
  private conditions: string[] = [];
  private orderBy?: string;
  private limitValue?: number;
  
  where(condition: string): this {
    this.conditions.push(condition);
    return this;
  }
  
  order(field: keyof T, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderBy = `${String(field)} ${direction}`;
    return this;
  }
  
  limit(count: number): this {
    this.limitValue = count;
    return this;
  }
  
  build(): string {
    let query = 'SELECT *';
    if (this.conditions.length > 0) {
      query += ' WHERE ' + this.conditions.join(' AND ');
    }
    if (this.orderBy) {
      query += ' ORDER BY ' + this.orderBy;
    }
    if (this.limitValue) {
      query += ' LIMIT ' + this.limitValue;
    }
    return query;
  }
}

// Usage - fully type-safe
const query = new QueryBuilder<User>()
  .where('age > 18')
  .where('active = true')
  .order('name', 'ASC')
  .limit(10)
  .build();
```

---

## Branded Types (Nominal Typing)

```typescript
// ✅ Create distinct types for same primitive
type UserId = string & { readonly __brand: 'UserId' };
type ProductId = string & { readonly __brand: 'ProductId' };

function createUserId(id: string): UserId {
  // Validation logic here
  return id as UserId;
}

function createProductId(id: string): ProductId {
  return id as ProductId;
}

// ✅ Type-safe - prevents mixing IDs
function getUser(userId: UserId): User { /* ... */ }
function getProduct(productId: ProductId): Product { /* ... */ }

const userId = createUserId('user-123');
const productId = createProductId('prod-456');

getUser(userId); // ✅ OK
getUser(productId); // ❌ Error: Type 'ProductId' is not assignable to 'UserId'
```

---

## Recursive Types

```typescript
// ✅ Tree structure with recursive type
interface TreeNode<T> {
  value: T;
  children: TreeNode<T>[];
}

const tree: TreeNode<number> = {
  value: 1,
  children: [
    {
      value: 2,
      children: [
        { value: 4, children: [] },
        { value: 5, children: [] }
      ]
    },
    { value: 3, children: [] }
  ]
};

// ✅ Deep partial (recursive)
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

interface Config {
  database: {
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
}

const partialConfig: DeepPartial<Config> = {
  database: {
    host: 'localhost'
    // Other fields optional at any depth
  }
};
```

---

## Decorator Patterns (Experimental)

```typescript
// ✅ Method decorator for logging
function log(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function (...args: any[]) {
    console.log(`Calling ${propertyKey} with:`, args);
    const result = originalMethod.apply(this, args);
    console.log(`Result:`, result);
    return result;
  };
  
  return descriptor;
}

class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }
}

// ✅ Class decorator for validation
function validateInput(constructor: Function) {
  const original = constructor;
  
  function newConstructor(...args: any[]) {
    // Validation logic
    if (args.some(arg => arg === null || arg === undefined)) {
      throw new Error('Invalid input');
    }
    return new original(...args);
  }
  
  newConstructor.prototype = original.prototype;
  return newConstructor;
}

@validateInput
class User {
  constructor(public name: string, public email: string) {}
}
```

---

## Type-Safe Event Emitters

```typescript
// ✅ Strongly-typed event emitter
interface Events {
  'user:created': (user: User) => void;
  'user:updated': (id: string, changes: Partial<User>) => void;
  'user:deleted': (id: string) => void;
}

class TypedEventEmitter<T extends Record<string, (...args: any[]) => void>> {
  private listeners: {
    [K in keyof T]?: Set<T[K]>;
  } = {};
  
  on<K extends keyof T>(event: K, listener: T[K]): void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]!.add(listener);
  }
  
  emit<K extends keyof T>(
    event: K,
    ...args: Parameters<T[K]>
  ): void {
    const listeners = this.listeners[event];
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }
  
  off<K extends keyof T>(event: K, listener: T[K]): void {
    this.listeners[event]?.delete(listener);
  }
}

// Usage - fully type-safe
const emitter = new TypedEventEmitter<Events>();

emitter.on('user:created', (user) => {
  console.log('User created:', user.name);
});

emitter.emit('user:created', { 
  id: '1', 
  name: 'John',
  email: 'john@example.com'
});
```

---

## Variadic Tuple Types

```typescript
// ✅ Type-safe function composition
type UnaryFunction<A, B> = (arg: A) => B;

function pipe<A, B>(f: UnaryFunction<A, B>): UnaryFunction<A, B>;
function pipe<A, B, C>(
  f1: UnaryFunction<A, B>,
  f2: UnaryFunction<B, C>
): UnaryFunction<A, C>;
function pipe<A, B, C, D>(
  f1: UnaryFunction<A, B>,
  f2: UnaryFunction<B, C>,
  f3: UnaryFunction<C, D>
): UnaryFunction<A, D>;
function pipe(...fns: UnaryFunction<any, any>[]) {
  return (input: any) => fns.reduce((acc, fn) => fn(acc), input);
}

// Usage
const addOne = (n: number) => n + 1;
const double = (n: number) => n * 2;
const toString = (n: number) => n.toString();

const transform = pipe(addOne, double, toString);
const result = transform(5); // "12" (type: string)
```

---

## Index Signatures and Mapped Types

```typescript
// ✅ Dynamic property access with constraints
interface StringMap {
  [key: string]: string;
}

// ✅ Record with specific keys
type RGB = Record<'red' | 'green' | 'blue', number>;

const color: RGB = {
  red: 255,
  green: 128,
  blue: 0
};

// ✅ Index signature with template literal
type ResponseData = {
  [key: `data_${number}`]: string;
};

const response: ResponseData = {
  data_0: 'first',
  data_1: 'second',
  data_2: 'third'
};
```

---

## Type Inference Tricks

```typescript
// ✅ Infer function parameter types
function processUser(
  user: { id: string; name: string; email: string }
) {
  // ...
}

type UserParam = Parameters<typeof processUser>[0];
// { id: string; name: string; email: string }

// ✅ Infer array element type
const users = [
  { id: '1', name: 'John' },
  { id: '2', name: 'Jane' }
];

type User = typeof users[number];
// { id: string; name: string }

// ✅ as const for literal types
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
} as const;

type Config = typeof config;
// { readonly apiUrl: "https://api.example.com"; readonly timeout: 5000 }
```

---

## Best Practices Summary

1. **Prefer `unknown` over `any`** - Forces type checking
2. **Use strict mode** - Catches more errors at compile time
3. **Explicit return types** - Prevents accidental changes
4. **Discriminated unions** - Type-safe state management
5. **Generic constraints** - Reusable, type-safe code
6. **Branded types** - Prevent mixing similar primitives
7. **Type guards** - Safe runtime type narrowing
8. **Utility types** - Leverage built-in transformations
9. **Template literals** - Generate type-safe string patterns
10. **Immutability** - Use `readonly` and `ReadonlyArray`

---

**Remember**: TypeScript's type system is Turing complete. These patterns 
enable building type-safe APIs that catch bugs at compile time rather than runtime.
