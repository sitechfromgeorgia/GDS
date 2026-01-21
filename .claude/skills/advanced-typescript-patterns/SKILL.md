---
description: Master advanced TypeScript features like Generics, Conditional Types, Utility Types, and Discriminated Unions for building type-safe applications.
---

# Advanced TypeScript Patterns (2025)

## 🌟 Purpose
To enable the creation of highly dynamic, safe, and reusable code. Advanced TypeScript goes beyond basic interfaces to model complex relationships, API responses, and state machines, ensuring that the compiler catches logic errors before they hit production.

## 🛠️ Tools & Capabilities
-   **TypeScript 5.0+**: Essential for performance and modern inference.
-   **Utility Types**: Built-in helpers like `Pick`, `Omit`, `Partial`.
-   **VS Code**: For real-time type inspection.

## 📋 Instructions

### 1. Discriminated Unions (The "State Machine" Pattern)
Use this for Redux actions, API responses, or UI states.

```typescript
type SearchState =
  | { status: "IDLE" }
  | { status: "LOADING" }
  | { status: "SUCCESS"; data: string[] }
  | { status: "ERROR"; error: Error };

function render(state: SearchState) {
  // TypeScript knows 'state.status' is the common key
  switch (state.status) {
    case "SUCCESS":
      // Safe to access state.data here
      return state.data.join(", ");
    case "ERROR":
      // Safe to access state.error here
      return state.error.message;
    default:
      return null;
  }
}
```

### 2. Generic Constraints & Inference
Write functions that adapt to their inputs while keeping strict safety.

```typescript
// Constraint: T must have an 'id' property
interface HasId { id: string; }

function getById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// Usage
const users = [{ id: "1", name: "Alice" }];
const user = getById(users, "1"); // Inferred as { id: string; name: string; } | undefined
```

### 3. Type Guards
Runtime checks that tell TypeScript "trust me, it's this type."

```typescript
type User = { id: string; role: "admin" | "user" };

function isAdmin(user: User): user is User & { role: "admin" } {
  return user.role === "admin";
}

// Usage
if (isAdmin(currentUser)) {
  // TypeScript allows admin-only actions here
  console.log("Admin access granted");
}
```

### 4. Utility Types in Action
Don't duplicate types; transform them.

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  meta: { createdAt: string; lastLogin: string };
}

// 1. For Update forms (all optional)
type UpdateUser = Partial<UserProfile>;

// 2. For rendering a list (no meta, no email)
type UserCard = Pick<UserProfile, "id" | "name" | "avatarUrl">;

// 3. For excluding sensitive data
type PublicUser = Omit<UserProfile, "meta">;
```

## 📝 Rules & Guidelines
-   **Rule 1:** Prefer **Unions** over Enums. Unions (`"admin" | "user"`) are simpler and faster.
-   **Rule 2:** Always use **Discriminated Unions** for handling multiple states (Loading/Success/Error).
-   **Rule 3:** Use `unknown` instead of `any` for incoming API data, then use Type Guards (e.g., Zod) to validate.
-   **Rule 4:** If generic types get too complex (nested conditional types), simplify the design. Readability counts.

## 💡 Examples
### Scenario: Strictly Typed API Response
**Problem:** API returns different structures based on success/failure.
**Solution:**
```typescript
type APIResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function handleData(res: APIResponse<User>) {
  if (res.success) {
    // res.data is accessible
    console.log(res.data.name);
  } else {
    // res.error is accessible
    console.error(res.error);
  }
}
```

## 📂 File Structure
Not applicable (Pattern-based skill).
