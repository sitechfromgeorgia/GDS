---
description: Complete guide to ensuring data integrity with Zod. Covers schema definition, runtime validation, type inference, and integration with Forms/APIs.
---

# Zod Schema Validation

## 🌟 Purpose
To guarantee that data entering your application (from APIs, forms, or URLs) matches your expectations. Zod eliminates "trust" issues by validating data at runtime and providing static TypeScript types for free.

## 🛠️ Tools & Capabilities
-   **Zod Library**: `npm install zod`
-   **Type Inference**: `z.infer<typeof schema>`
-   **Frameworks**: Integration with React Hook Form, tRPC, Next.js Actions.

## 📋 Instructions

### 1. Defining Basic Schemas
Start by modelling your data.

```typescript
import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3, "Too short").max(20),
  email: z.string().email("Invalid email"),
  age: z.number().int().positive().optional(),
  role: z.enum(["admin", "user", "guest"]).default("guest"),
});

// Extract the TypeScript type automatically
export type User = z.infer<typeof UserSchema>;
```

### 2. Runtime Validation
Use `.parse()` (throws error) or `.safeParse()` (returns result object).

```typescript
function processUser(input: unknown) {
  const result = UserSchema.safeParse(input);

  if (!result.success) {
    console.error("Validation failed:", result.error.format());
    return;
  }

  // result.data is typed as User
  const user = result.data;
  console.log("Valid user:", user.username);
}
```

### 3. Asynchronous Refinements
For checks like "email already exists".

```typescript
const SignupSchema = z.object({
  email: z.string().email(),
}).refine(async (data) => {
  const exists = await checkEmailInDb(data.email);
  return !exists;
}, {
  message: "Email already taken",
  path: ["email"] // Attach error to email field
});
```

### 4. Recursive Schemas
For comments, categories, or trees.

```typescript
type Category = {
  name: string;
  subcategories?: Category[];
};

const CategorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    name: z.string(),
    subcategories: z.array(CategorySchema).optional(),
  })
);
```

## 📝 Rules & Guidelines
-   **Rule 1:** Always use **`safeParse`** in server code to avoid crashing the process. Handle errors gracefully.
-   **Rule 2:** Define schemas **once** and export the inferred type (`z.infer`). Single source of truth.
-   **Rule 3:** Use **`.strict()`** or **`.strip()`** (default) to handle unknown keys. Avoid `.passthrough()` unless necessary.
-   **Rule 4:** Colocate schemas with the features that use them (e.g., in `actions.ts` or `validations.ts`).

## 💡 Examples
### Scenario: Validating Environment Variables
**Problem:** App crashes randomly because `NEXT_PUBLIC_API_URL` is missing.
**Solution:**
```typescript
const EnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  DATABASE_URL: z.string(),
});

// Run this at app startup
const env = EnvSchema.parse(process.env);

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof EnvSchema> {}
  }
}
```

## 📂 File Structure
Recommended placement:
- `src/lib/validations/user.ts` (Schemas)
- `src/app/actions.ts` (Usage)
