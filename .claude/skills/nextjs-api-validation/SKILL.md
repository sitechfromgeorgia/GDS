---
description: Guide to building type-safe, validated API Routes and Server Actions in Next.js 15 using Zod. Covers error handling, status codes, and security.
---

# Next.js API & Route Handler Validation

## 🌟 Purpose
To ensure all backend endpoints (Route Handlers and Server Actions) strictly validate incoming data before processing. This prevents invalid state, SQL injections, and runtime errors.

## 🛠️ Tools & Capabilities
-   **Next.js 15**: `NextRequest`, `NextResponse`, `Server Actions`.
-   **Zod**: For schema validation.

## 📋 Instructions

### 1. Validating Route Handlers (POST/PUT)
Always validate `body`, `searchParams`, and dynamic `params`.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 1. Validate
    const data = createPostSchema.parse(body);

    // 2. Process (Type-safe 'data')
    // await db.post.create({ data });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation Failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

### 2. Validating Server Actions
Use inside `actions.ts`.

```typescript
"use server";

import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function subscribe(prevState: any, formData: FormData) {
  const data = {
    email: formData.get("email"),
  };

  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      message: "Invalid email",
      errors: result.error.flatten().fieldErrors,
    };
  }

  // db.subscribe(result.data.email);
  return { message: "Subscribed!" };
}
```

## 📝 Rules & Guidelines
-   **Rule 1:** NEVER trust `req.body`. Always `.parse()` or `.safeParse()`.
-   **Rule 2:** Return **400 Bad Request** for validation errors, not 500.
-   **Rule 3:** Sanitize Zod error messages before sending them to the user (use `.flatten()` or `.format()`).
-   **Rule 4:** For query parameters (`?limit=10`), remember they are **strings**. Use `z.coerce.number()` to handle them (e.g., `z.coerce.number().min(1).default(10)`).

## 💡 Examples
### Scenario: Validating Query Params
**Problem:** `limit` comes in as "10" (string), but DB needs number.
**Solution:** `z.coerce`
```typescript
const searchSchema = z.object({
  query: z.string(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().max(100).default(20),
});

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Safe parsing of entire searchParams object
  const params = searchSchema.parse(Object.fromEntries(searchParams));
  
  // params.page is verified number
}
```

## 📂 File Structure
- `src/app/api/route.ts`
- `src/lib/schemas.ts`
