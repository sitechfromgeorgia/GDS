# Refactoring Catalog - Common Code Improvements

## Extract Function

**When to Use**: Long methods, duplicated code, complex logic

**Before**:
```typescript
function processOrder(order: Order) {
  // Validate order
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
  if (!order.customer || !order.customer.email) {
    throw new Error('Order must have customer with email');
  }
  
  // Calculate total
  let total = 0;
  for (const item of order.items) {
    total += item.price * item.quantity;
    if (item.discount) {
      total -= (item.price * item.quantity * item.discount);
    }
  }
  
  // Apply shipping
  if (total < 50) {
    total += 10;
  }
  
  // Send confirmation
  const emailHtml = `<h1>Order Confirmation</h1>
    <p>Thank you for your order!</p>
    <p>Total: $${total}</p>`;
  sendEmail(order.customer.email, 'Order Confirmation', emailHtml);
  
  return total;
}
```

**After**:
```typescript
function processOrder(order: Order): number {
  validateOrder(order);
  const total = calculateOrderTotal(order);
  const finalTotal = applyShipping(total);
  sendOrderConfirmation(order.customer, finalTotal);
  return finalTotal;
}

function validateOrder(order: Order): void {
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
  if (!order.customer || !order.customer.email) {
    throw new Error('Order must have customer with email');
  }
}

function calculateOrderTotal(order: Order): number {
  return order.items.reduce((total, item) => {
    const itemTotal = item.price * item.quantity;
    const discountAmount = item.discount 
      ? itemTotal * item.discount 
      : 0;
    return total + itemTotal - discountAmount;
  }, 0);
}

function applyShipping(subtotal: number): number {
  const SHIPPING_COST = 10;
  const FREE_SHIPPING_THRESHOLD = 50;
  return subtotal < FREE_SHIPPING_THRESHOLD 
    ? subtotal + SHIPPING_COST 
    : subtotal;
}

function sendOrderConfirmation(customer: Customer, total: number): void {
  const emailHtml = `<h1>Order Confirmation</h1>
    <p>Thank you for your order!</p>
    <p>Total: $${total}</p>`;
  sendEmail(customer.email, 'Order Confirmation', emailHtml);
}
```

**Benefits**:
- Each function has single responsibility
- Easier to test independently
- More readable and maintainable
- Can reuse extracted functions

---

## Replace Conditional with Polymorphism

**When to Use**: Switch statements or multiple if-else chains based on type

**Before**:
```typescript
interface Bird {
  type: 'sparrow' | 'penguin' | 'parrot';
  speed: number;
}

function getSpeed(bird: Bird): number {
  switch (bird.type) {
    case 'sparrow':
      return bird.speed;
    case 'penguin':
      return 0; // Penguins can't fly
    case 'parrot':
      return bird.speed * 1.5; // Parrots are faster
    default:
      return 0;
  }
}

function makeSound(bird: Bird): string {
  switch (bird.type) {
    case 'sparrow':
      return 'chirp';
    case 'penguin':
      return 'squawk';
    case 'parrot':
      return 'talk';
    default:
      return '';
  }
}
```

**After**:
```typescript
interface Bird {
  getSpeed(): number;
  makeSound(): string;
}

class Sparrow implements Bird {
  constructor(private speed: number) {}
  
  getSpeed(): number {
    return this.speed;
  }
  
  makeSound(): string {
    return 'chirp';
  }
}

class Penguin implements Bird {
  getSpeed(): number {
    return 0; // Can't fly
  }
  
  makeSound(): string {
    return 'squawk';
  }
}

class Parrot implements Bird {
  constructor(private speed: number) {}
  
  getSpeed(): number {
    return this.speed * 1.5;
  }
  
  makeSound(): string {
    return 'talk';
  }
}

// Usage - no conditionals needed
function displayBird(bird: Bird) {
  console.log(`Speed: ${bird.getSpeed()}`);
  console.log(`Sound: ${bird.makeSound()}`);
}
```

**Benefits**:
- Open/Closed Principle - easy to add new bird types
- No branching logic to maintain
- Each class focused on single type
- More extensible

---

## Replace Magic Numbers with Named Constants

**When to Use**: Any hardcoded number or string in code

**Before**:
```typescript
function calculatePrice(quantity: number, userType: string): number {
  let price = quantity * 29.99;
  
  if (userType === 'premium') {
    price *= 0.85; // 15% discount
  } else if (userType === 'gold') {
    price *= 0.75; // 25% discount
  }
  
  if (quantity > 10) {
    price *= 0.9; // 10% bulk discount
  }
  
  return price;
}
```

**After**:
```typescript
const PRICING = {
  BASE_PRICE: 29.99,
  DISCOUNTS: {
    PREMIUM: 0.15,
    GOLD: 0.25,
    BULK: 0.10
  },
  BULK_THRESHOLD: 10
} as const;

type UserType = 'standard' | 'premium' | 'gold';

function calculatePrice(quantity: number, userType: UserType): number {
  let price = quantity * PRICING.BASE_PRICE;
  
  // Apply user type discount
  if (userType === 'premium') {
    price *= (1 - PRICING.DISCOUNTS.PREMIUM);
  } else if (userType === 'gold') {
    price *= (1 - PRICING.DISCOUNTS.GOLD);
  }
  
  // Apply bulk discount
  if (quantity > PRICING.BULK_THRESHOLD) {
    price *= (1 - PRICING.DISCOUNTS.BULK);
  }
  
  return price;
}
```

**Benefits**:
- Clear intent - numbers have meaning
- Easy to change - update in one place
- Type-safe with constants
- Self-documenting code

---

## Introduce Parameter Object

**When to Use**: Functions with many parameters (>3)

**Before**:
```typescript
function createUser(
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  address: string,
  city: string,
  country: string,
  postalCode: string
): User {
  // Implementation
}

// Hard to remember parameter order
const user = createUser(
  'John', 
  'Doe', 
  'john@example.com',
  '555-0123',
  '123 Main St',
  'New York',
  'USA',
  '10001'
);
```

**After**:
```typescript
interface UserCreateParams {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
}

function createUser(params: UserCreateParams): User {
  // Implementation
}

// Clear, no order confusion
const user = createUser({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '555-0123',
  address: {
    street: '123 Main St',
    city: 'New York',
    country: 'USA',
    postalCode: '10001'
  }
});
```

**Benefits**:
- No parameter order confusion
- Easy to add optional parameters
- Better IDE autocomplete
- More readable at call site

---

## Replace Nested Conditionals with Guard Clauses

**When to Use**: Deep nesting, multiple return paths

**Before**:
```typescript
function processPayment(
  amount: number, 
  user: User | null
): PaymentResult {
  if (amount > 0) {
    if (user) {
      if (user.isActive) {
        if (user.balance >= amount) {
          user.balance -= amount;
          return { success: true, message: 'Payment processed' };
        } else {
          return { success: false, message: 'Insufficient balance' };
        }
      } else {
        return { success: false, message: 'User not active' };
      }
    } else {
      return { success: false, message: 'User not found' };
    }
  } else {
    return { success: false, message: 'Invalid amount' };
  }
}
```

**After**:
```typescript
function processPayment(
  amount: number, 
  user: User | null
): PaymentResult {
  // Guard clauses - fail fast
  if (amount <= 0) {
    return { success: false, message: 'Invalid amount' };
  }
  
  if (!user) {
    return { success: false, message: 'User not found' };
  }
  
  if (!user.isActive) {
    return { success: false, message: 'User not active' };
  }
  
  if (user.balance < amount) {
    return { success: false, message: 'Insufficient balance' };
  }
  
  // Happy path at the end, no nesting
  user.balance -= amount;
  return { success: true, message: 'Payment processed' };
}
```

**Benefits**:
- Linear, easy to follow
- No deep nesting
- Happy path clearly visible
- Early returns prevent unnecessary work

---

## Extract Interface

**When to Use**: Testing, dependency injection, multiple implementations

**Before**:
```typescript
class EmailService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // SMTP implementation
  }
  
  async sendBulkEmail(recipients: string[], subject: string, body: string): Promise<void> {
    // Bulk email logic
  }
}

class UserService {
  constructor(private emailService: EmailService) {}
  
  async notifyUser(user: User, message: string): Promise<void> {
    await this.emailService.sendEmail(user.email, 'Notification', message);
  }
}

// Hard to test - tightly coupled to EmailService implementation
```

**After**:
```typescript
interface IEmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendBulkEmail(recipients: string[], subject: string, body: string): Promise<void>;
}

class SMTPEmailService implements IEmailService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // SMTP implementation
  }
  
  async sendBulkEmail(recipients: string[], subject: string, body: string): Promise<void> {
    // Bulk email logic
  }
}

class MockEmailService implements IEmailService {
  emails: Array<{ to: string; subject: string; body: string }> = [];
  
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.emails.push({ to, subject, body });
  }
  
  async sendBulkEmail(recipients: string[], subject: string, body: string): Promise<void> {
    recipients.forEach(to => {
      this.emails.push({ to, subject, body });
    });
  }
}

class UserService {
  constructor(private emailService: IEmailService) {}
  
  async notifyUser(user: User, message: string): Promise<void> {
    await this.emailService.sendEmail(user.email, 'Notification', message);
  }
}

// Easy to test with mock
const mockEmail = new MockEmailService();
const userService = new UserService(mockEmail);
```

**Benefits**:
- Testable with mocks
- Multiple implementations possible
- Dependency inversion
- Loosely coupled

---

## Replace Callback with Promise/Async-Await

**When to Use**: Callback hell, complex async flows

**Before**:
```typescript
function getUser(userId: string, callback: (error: Error | null, user?: User) => void) {
  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      callback(err);
      return;
    }
    
    if (results.length === 0) {
      callback(new Error('User not found'));
      return;
    }
    
    const user = results[0];
    
    db.query('SELECT * FROM posts WHERE user_id = ?', [userId], (err, posts) => {
      if (err) {
        callback(err);
        return;
      }
      
      user.posts = posts;
      
      db.query('SELECT * FROM comments WHERE user_id = ?', [userId], (err, comments) => {
        if (err) {
          callback(err);
          return;
        }
        
        user.comments = comments;
        callback(null, user);
      });
    });
  });
}
```

**After**:
```typescript
async function getUser(userId: string): Promise<User> {
  const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
  
  if (users.length === 0) {
    throw new Error('User not found');
  }
  
  const user = users[0];
  
  // Can run in parallel
  const [posts, comments] = await Promise.all([
    db.query('SELECT * FROM posts WHERE user_id = ?', [userId]),
    db.query('SELECT * FROM comments WHERE user_id = ?', [userId])
  ]);
  
  user.posts = posts;
  user.comments = comments;
  
  return user;
}
```

**Benefits**:
- Linear, readable flow
- Error handling with try-catch
- Can parallelize with Promise.all
- No callback hell

---

## Consolidate Duplicate Conditional Fragments

**When to Use**: Same code in multiple branches

**Before**:
```typescript
function processTransaction(transaction: Transaction): void {
  if (transaction.type === 'deposit') {
    logTransaction(transaction);
    account.balance += transaction.amount;
    saveAccount(account);
  } else if (transaction.type === 'withdrawal') {
    logTransaction(transaction);
    account.balance -= transaction.amount;
    saveAccount(account);
  } else {
    logTransaction(transaction);
    throw new Error('Unknown transaction type');
  }
}
```

**After**:
```typescript
function processTransaction(transaction: Transaction): void {
  logTransaction(transaction); // Moved outside conditionals
  
  if (transaction.type === 'deposit') {
    account.balance += transaction.amount;
  } else if (transaction.type === 'withdrawal') {
    account.balance -= transaction.amount;
  } else {
    throw new Error('Unknown transaction type');
  }
  
  if (transaction.type !== 'error') {
    saveAccount(account); // Moved outside conditionals
  }
}
```

**Benefits**:
- Less duplication
- Easier to maintain
- Clear common behavior
- DRY principle

---

## Replace Type Code with Subclasses

**When to Use**: Type field dictating behavior

**Before**:
```typescript
class Employee {
  constructor(
    public name: string,
    public type: 'engineer' | 'manager' | 'salesperson'
  ) {}
  
  getSalary(): number {
    switch (this.type) {
      case 'engineer':
        return 80000;
      case 'manager':
        return 100000;
      case 'salesperson':
        return 60000;
      default:
        throw new Error('Unknown type');
    }
  }
  
  getBonus(): number {
    switch (this.type) {
      case 'engineer':
        return 5000;
      case 'manager':
        return 15000;
      case 'salesperson':
        return 10000;
      default:
        throw new Error('Unknown type');
    }
  }
}
```

**After**:
```typescript
abstract class Employee {
  constructor(public name: string) {}
  
  abstract getSalary(): number;
  abstract getBonus(): number;
}

class Engineer extends Employee {
  getSalary(): number {
    return 80000;
  }
  
  getBonus(): number {
    return 5000;
  }
}

class Manager extends Employee {
  getSalary(): number {
    return 100000;
  }
  
  getBonus(): number {
    return 15000;
  }
}

class Salesperson extends Employee {
  getSalary(): number {
    return 60000;
  }
  
  getBonus(): number {
    return 10000;
  }
}
```

**Benefits**:
- Polymorphic behavior
- No switch statements
- Easy to add new types
- Open/Closed Principle

---

## Decompose Conditional

**When to Use**: Complex boolean expressions

**Before**:
```typescript
function calculateDiscount(
  customer: Customer, 
  order: Order
): number {
  if (
    customer.isPremium && 
    order.total > 100 && 
    new Date().getMonth() === 11 && // December
    order.items.some(item => item.category === 'electronics')
  ) {
    return 0.25; // 25% discount
  } else if (
    customer.orderCount > 10 && 
    order.total > 50
  ) {
    return 0.15; // 15% discount
  }
  return 0;
}
```

**After**:
```typescript
function calculateDiscount(
  customer: Customer, 
  order: Order
): number {
  if (isEligibleForHolidayDiscount(customer, order)) {
    return 0.25;
  }
  
  if (isEligibleForLoyaltyDiscount(customer, order)) {
    return 0.15;
  }
  
  return 0;
}

function isEligibleForHolidayDiscount(
  customer: Customer, 
  order: Order
): boolean {
  return (
    customer.isPremium &&
    order.total > 100 &&
    isDecember() &&
    hasElectronics(order)
  );
}

function isEligibleForLoyaltyDiscount(
  customer: Customer,
  order: Order
): boolean {
  return customer.orderCount > 10 && order.total > 50;
}

function isDecember(): boolean {
  return new Date().getMonth() === 11;
}

function hasElectronics(order: Order): boolean {
  return order.items.some(item => item.category === 'electronics');
}
```

**Benefits**:
- Readable condition names
- Testable conditions independently
- Reusable logic
- Self-documenting

---

## Replace Loop with Pipeline

**When to Use**: Complex loops with multiple operations

**Before**:
```typescript
const activeUserEmails: string[] = [];
for (const user of users) {
  if (user.isActive && user.age >= 18) {
    activeUserEmails.push(user.email.toLowerCase());
  }
}
```

**After**:
```typescript
const activeUserEmails = users
  .filter(user => user.isActive && user.age >= 18)
  .map(user => user.email.toLowerCase());
```

**Benefits**:
- Declarative, not imperative
- Chainable operations
- More readable
- No intermediate variables

---

## Refactoring Checklist

Before refactoring:
- [ ] Have tests in place
- [ ] Understand current behavior
- [ ] Commit current working state
- [ ] Refactor in small steps

After refactoring:
- [ ] All tests pass
- [ ] Code is more readable
- [ ] Complexity reduced
- [ ] No behavioral changes

**Remember**: Refactoring is about improving structure WITHOUT changing behavior.
Always have tests to verify behavior remains the same.
