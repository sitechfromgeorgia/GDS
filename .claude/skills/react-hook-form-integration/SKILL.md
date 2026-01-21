---
description: Ultimate guide to type-safe forms using React Hook Form and Zod integration. Covers setup, validation, error handling, and performance optimization.
---

# React Hook Form + Zod Integration

## 🌟 Purpose
To build performant, type-safe forms with minimal re-renders. By combining React Hook Form's event-based architecture with Zod's schema validation, you get strict data guarantees and a seamless developer experience (auto-complete for form fields).

## 🛠️ Tools & Capabilities
-   **react-hook-form**: `npm install react-hook-form`
-   **@hookform/resolvers**: `npm install @hookform/resolvers`
-   **Zod**: `npm install zod`

## 📋 Instructions

### 1. Setup & Boilerplate
The standard pattern for every form component.

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// 1. Define Schema
const formSchema = z.object({
  username: z.string().min(2, "Name must be 2+ chars"),
  email: z.string().email(),
});

type FormValues = z.infer<typeof formSchema>;

export function MyForm() {
  // 2. Initialize Hook
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", email: "" },
  });

  // 3. Submit Handler
  const onSubmit = async (data: FormValues) => {
    console.log("Validated Data:", data);
    // Call Server Action or API here
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Input 1 */}
      <div>
        <label>Username</label>
        <input {...register("username")} className="border p-2" />
        {errors.username && <p className="text-red-500">{errors.username.message}</p>}
      </div>

      {/* Input 2 */}
      <div>
        <label>Email</label>
        <input {...register("email")} className="border p-2" />
        {errors.email && <p className="text-red-500">{errors.email.message}</p>}
      </div>

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Saving..." : "Submit"}
      </button>
    </form>
  );
}
```

### 2. Controlled Components (Select, DatePicker)
For components that don't expose a simple `ref` (like shadcn/ui components), use `Controller` or `render` props (if using shadcn's Form wrapper).

```tsx
// Example with shadcn/ui FormField (which wraps Controller)
<FormField
  control={form.control}
  name="role"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Role</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>
    </FormItem>
  )}
/>
```

## 📝 Rules & Guidelines
-   **Rule 1:** Always use `defaultValues`. RHF needs them to control inputs and avoid "uncontrolled to controlled" warnings.
-   **Rule 2:** Avoid `watch()` in the root of the component if possible. It causes re-renders on every keystroke. Use `watch` only where needed or isolate heavily dynamic parts into sub-components.
-   **Rule 3:** Use **`isSubmitting`** to disable buttons immediately.
-   **Rule 4:** For complex object arrays (e.g., dynamic rows), use `useFieldArray`.

## 💡 Examples
### Scenario: Server Side Validation Error handling
**Problem:** The API returns "Email already taken". How to show it on the specific input?
**Solution:** `setError`
```tsx
const onSubmit = async (data: FormValues) => {
  const result = await serverAction(data);
  
  if (result.error === "EMAIL_TAKEN") {
    setError("email", { 
      type: "manual", 
      message: "This email is already in use." 
    });
  }
};
```

## 📂 File Structure
- `src/components/forms/signup-form.tsx`
