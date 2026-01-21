---
name: form-design-validation-ux
description: Creates accessible, user-friendly forms with excellent validation UX, real-time feedback, and progressive disclosure patterns. Use when designing forms, implementing validation, handling errors, or improving form completion rates in React/Next.js with Tailwind CSS and shadcn/ui.
---

# Form Design & Validation UX Best Practices

## Quick Start

Essential patterns for production-ready forms with 22%+ conversion improvements:

```typescript
// 1. Schema + React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const contactSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Alphanumeric only'),
  message: z.string().min(10).max(500),
});

type ContactForm = z.infer<typeof contactSchema>;

// 2. Form with inline validation + async checking
export default function ContactForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    mode: 'onBlur', // Validate on blur + submit (not on change for first interaction)
    reValidateMode: 'onChange', // Only use onChange after first blur
  });

  const usernameValue = watch('username');

  const onSubmit = async (data: ContactForm) => {
    // Submit to server action
    const result = await submitContactForm(data);
    if (!result.success) {
      // Handle server errors
      setFieldError('email', result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Label above input (fastest for users) */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Email <span aria-label="required" className="text-red-500">*</span>
        </label>
        <input
          {...register('email')}
          id="email"
          type="email"
          placeholder="you@example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {/* Inline error above field (avoid layout shift) */}
        {errors.email && (
          <p id="email-error" className="text-sm text-red-600" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Async validation example: username availability check */}
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium">
          Username <span aria-label="required" className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            {...register('username')}
            id="username"
            type="text"
            placeholder="john_doe"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-describedby={errors.username ? 'username-error' : 'username-hint'}
          />
          {/* Loading indicator for async validation */}
          {usernameValue && !errors.username && (
            <UsernameAvailabilityCheck username={usernameValue} />
          )}
        </div>
        {errors.username && (
          <p id="username-error" className="text-sm text-red-600" role="alert">
            {errors.username.message}
          </p>
        )}
        <p id="username-hint" className="text-xs text-gray-500">
          3-20 characters, alphanumeric only
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting && <span className="animate-spin">⚙️</span>}
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

## When to Use This Skill

**Use this skill when:**
- Designing new forms or refactoring existing ones
- Implementing form validation and error handling
- Improving form completion rates (conversion optimization)
- Building accessible forms for WCAG 2.2 compliance
- Handling real-time validation and async checks
- Creating multi-step forms with progressive disclosure
- Adding success feedback and form submission states

**Triggers:** Form design, validation UX, form conversion, form accessibility, React forms, form validation, error handling, form patterns, user experience

---

## Label Placement & Form Layout

### Top-Aligned Labels (BEST PRACTICE)

**Why:** Users scan from label to input in 50ms—10x faster than left-aligned labels. Superior for mobile and accessibility.

```typescript
// ✅ Correct: Label above input
<div className="space-y-2">
  <label htmlFor="firstName" className="block text-sm font-medium text-gray-900">
    First Name
  </label>
  <input id="firstName" type="text" className="w-full px-3 py-2 border rounded-lg" />
</div>

// ❌ Avoid: Label to the left (slow eye tracking)
<div className="flex gap-4">
  <label className="w-32 text-sm font-medium">First Name</label>
  <input type="text" className="flex-1 px-3 py-2 border rounded-lg" />
</div>
```

### Floating Labels (Use Carefully)

**When:** Highly space-constrained mobile interfaces OR established design system expectation.

**Critical requirements:**
- Label must maintain visible 4.5:1 contrast ratio when floated
- Input must NOT be obscured by label position
- Use proper ARIA associations

```typescript
// Floating label with accessibility
<div className="relative">
  <input
    id="email"
    type="email"
    placeholder=" " // Empty placeholder forces label to float
    className="peer w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-shown:pt-3 placeholder-shown:pb-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
    aria-label="Email address"
  />
  <label
    htmlFor="email"
    className="absolute top-2 left-3 text-sm font-medium text-gray-700 pointer-events-none transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm bg-white px-1"
  >
    Email
  </label>
</div>
```

### Field Grouping & Visual Hierarchy

```typescript
// Group related fields logically
<form className="space-y-8">
  {/* Personal Information Section */}
  <fieldset className="space-y-4 border-b pb-6">
    <legend className="text-lg font-semibold">Personal Information</legend>
    <FormField label="First Name" name="firstName" />
    <FormField label="Last Name" name="lastName" />
  </fieldset>

  {/* Contact Information Section */}
  <fieldset className="space-y-4">
    <legend className="text-lg font-semibold">Contact Information</legend>
    <FormField label="Email" name="email" type="email" />
    <FormField label="Phone" name="phone" type="tel" />
  </fieldset>
</form>
```

### Optimal Field Width & Spacing

- **Single column**: Best for mobile-first (100% width on mobile, 100% on tablet)
- **Two columns**: Desktop only, typically 50/50 split for first/last name
- **Spacing**: 8px grid system (24px between field groups, 16px between fields)

```typescript
// Responsive grid with proper spacing
<form className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
  <FormField label="First Name" name="firstName" /> {/* Full width on mobile */}
  <FormField label="Last Name" name="lastName" />
  <FormField label="Email" name="email" className="md:col-span-2 lg:col-span-3" />
</form>
```

---

## Real-Time Validation Patterns

### Validation Timing Strategy (Hybrid Approach)

**Research Finding:** Baymard Institute shows 22% increase in completion with inline validation, but only AFTER first blur to avoid friction.

```typescript
// ✅ Recommended: Hybrid validation strategy
const { register, formState: { errors }, trigger } = useForm({
  resolver: zodResolver(schema),
  mode: 'onBlur',          // Initial: validate on blur only
  reValidateMode: 'onChange', // After first blur: validate on change
  shouldFocusError: true,
});

// This means:
// 1. User types in field → no errors shown yet (respect their flow)
// 2. User leaves field (blur) → validation runs, errors show
// 3. User corrects error → inline validation runs immediately on each keystroke
// 4. User submits → final validation pass
```

### Debouncing Async Validation

**Critical:** Prevent excessive API calls during rapid input changes.

```typescript
// Async availability check with debouncing
import { useDeferredValue } from 'react';

function UsernameAvailabilityCheck({ username }: { username: string }) {
  const deferredUsername = useDeferredValue(username);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  
  const checkAvailabilityRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear previous timeout
    clearTimeout(checkAvailabilityRef.current);

    if (!deferredUsername) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);

    // Debounce: wait 500ms after user stops typing
    checkAvailabilityRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/check-username?username=${deferredUsername}`);
        const { available } = await response.json();
        setIsAvailable(available);
        setIsChecking(false);
      } catch (error) {
        setIsChecking(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(checkAvailabilityRef.current);
  }, [deferredUsername]);

  if (isChecking) {
    return <span className="text-xs text-gray-500">Checking availability...</span>;
  }

  if (isAvailable) {
    return <span className="text-xs text-green-600">✓ Available</span>;
  }

  if (isAvailable === false) {
    return <span className="text-xs text-red-600">✗ Already taken</span>;
  }

  return null;
}
```

### Zod + React Hook Form Integration (2024-2025)

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define schema with custom error messages
const registrationSchema = z.object({
  email: z.string()
    .email('Must be a valid email address')
    .refine(
      async (email) => {
        // Async validation: check if email exists
        const response = await fetch(`/api/check-email?email=${email}`);
        const { exists } = await response.json();
        return !exists;
      },
      { message: 'Email already registered' }
    ),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[!@#$%^&*]/, 'Must contain a special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'], // This sets which field the error appears on
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export function RegistrationForm() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    mode: 'onBlur',
    criteriaMode: 'all', // Show all validation errors for a field
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Field with async validation */}
      <FormField
        label="Email"
        {...register('email')}
        error={errors.email?.message}
        type="email"
      />
      
      {/* Field with multiple sync validations */}
      <FormField
        label="Password"
        {...register('password')}
        error={errors.password?.message}
        type="password"
        hint="8+ chars, uppercase, number, special character"
      />

      <FormField
        label="Confirm Password"
        {...register('confirmPassword')}
        error={errors.confirmPassword?.message}
        type="password"
      />

      <button type="submit">Register</button>
    </form>
  );
}
```

### Field-Level vs Form-Level Validation

```typescript
// Field-level: runs on individual field changes
// Best for: immediate feedback, async checks, user guidance
mode: 'onChange' // Validates field when value changes
mode: 'onBlur'   // Validates field when focus leaves
mode: 'onSubmit' // Validates all fields when form submitted

// Recommended: Hybrid mode as shown above
// Don't validate on first change (friction), only after blur
```

---

## Error Message Design

### Error Message Placement (ANTI-PATTERNS & PATTERNS)

```typescript
// ❌ ANTI-PATTERN: Toast messages for errors
toast.error('Email is required'); // User doesn't know which field!

// ❌ ANTI-PATTERN: Below input with layout shift
<div>
  <input />
  {error && <p>{error}</p>} {/* Causes layout shift */}
</div>

// ✅ CORRECT: Inline above input, prevent layout shift
<div className="space-y-2">
  <input aria-invalid={!!error} aria-describedby={error ? 'email-error' : undefined} />
  {error && (
    <p id="email-error" role="alert" className="text-sm text-red-600">
      {error}
    </p>
  )}
</div>

// ✅ ALSO CORRECT: Error summary at top
<div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
  <h3 className="font-semibold text-red-900">Please fix the following errors:</h3>
  <ul className="mt-2 space-y-1 text-sm text-red-800">
    {Object.entries(errors).map(([field, error]) => (
      <li key={field}>
        <a href={`#${field}`} className="underline hover:no-underline">
          {fieldLabels[field]}: {error.message}
        </a>
      </li>
    ))}
  </ul>
</div>
```

### Error Message Copy Best Practices

```typescript
// ❌ BAD: Generic, not actionable
"Invalid input"
"Error"
"Failed"

// ✅ GOOD: Specific, actionable, friendly
"Email must be at least 5 characters (e.g., user@example.com)"
"Password needs at least one uppercase letter (A-Z)"
"Username is already taken. Try adding a number or suffix."

// Schema with helpful messages
const schema = z.object({
  email: z.string()
    .email('Enter a valid email address (e.g., you@company.com)')
    .min(5, 'Email must be at least 5 characters'),
  
  password: z.string()
    .min(8, 'Minimum 8 characters required')
    .regex(/[A-Z]/, 'Add at least one uppercase letter')
    .regex(/[0-9]/, 'Add at least one number (0-9)')
    .regex(/[!@#$%^&*]/, 'Add a special character: !@#$%^&*'),

  phone: z.string()
    .regex(/^[0-9-()+ ]+$/, 'Phone: 555-0123 or +1 (555) 0123 or 5550123'),
});
```

### Visual Error Design (Accessibility First)

```typescript
// ✅ Use color + icon + text (never color alone)
function FormField({ error, ...props }) {
  return (
    <div className="space-y-2">
      <input
        className={`px-3 py-2 border-2 rounded-lg transition-colors ${
          error 
            ? 'border-red-500 bg-red-50' // Color
            : 'border-gray-300 bg-white'
        }`}
        {...props}
      />
      {error && (
        <div className="flex items-start gap-2">
          <span className="text-red-600 flex-shrink-0">✕</span> {/* Icon */}
          <p className="text-sm text-red-600">{error}</p> {/* Text */}
        </div>
      )}
    </div>
  );
}

// Focus indicator (WCAG 2.4.13)
// 2px minimum, 3:1 contrast ratio
<input
  className="focus:outline-2 focus:outline-offset-2 focus:outline-blue-600" // 3:1 contrast
/>
```

### Screen Reader Announcements

```typescript
// ✅ Proper ARIA for errors
<input
  aria-invalid={!!error}
  aria-describedby={error ? 'field-error' : 'field-hint'}
  aria-required="true"
/>
<p id="field-error" role="alert" className="text-red-600">
  {error}
</p>

// ✅ Form-level error summary
<div role="alert" aria-live="polite" aria-atomic="true" className="mb-4">
  {errorCount > 0 && (
    <p className="font-semibold text-red-600">
      {errorCount} error{errorCount !== 1 ? 's' : ''} found
    </p>
  )}
</div>
```

---

## Progressive Disclosure Patterns

### Multi-Step Forms (Staged Disclosure)

**Best for:** Complex forms, reducing cognitive load, checkout flows

```typescript
type FormStep = 'personal' | 'contact' | 'review';

export function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState<FormStep>('personal');
  const { register, handleSubmit, getValues, watch } = useForm({
    resolver: zodResolver(multiStepSchema),
    mode: 'onBlur',
  });

  const onNext = async (step: FormStep) => {
    // Validate current step before moving
    const isValid = await trigger(getCurrentStepFields(step));
    if (isValid) {
      setCurrentStep(getNextStep(step));
      window.scrollTo(0, 0); // Bring focus to top
    }
  };

  return (
    <form className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {['personal', 'contact', 'review'].map((step, idx) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentStep === step || isStepComplete(step)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {idx + 1}
            </div>
            {idx < 2 && (
              <div className={`h-1 w-24 mx-2 ${isStepComplete(step) ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Personal Info */}
      {currentStep === 'personal' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Personal Information</h2>
          <FormField label="First Name" {...register('firstName')} />
          <FormField label="Last Name" {...register('lastName')} />
          <button
            type="button"
            onClick={() => onNext('contact')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Next
          </button>
        </div>
      )}

      {/* Step 2: Contact Info */}
      {currentStep === 'contact' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Contact Information</h2>
          <FormField label="Email" {...register('email')} type="email" />
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setCurrentStep('personal')}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => onNext('review')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 'review' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Review & Submit</h2>
          <ReviewSection data={getValues()} />
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setCurrentStep('contact')}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
```

### Conditional Fields (Conditional Disclosure)

```typescript
export function ConditionalFieldsForm() {
  const { register, watch } = useForm({
    resolver: zodResolver(schema),
  });

  const employmentType = watch('employmentType');
  const country = watch('country');

  return (
    <form className="space-y-4">
      <FormField label="Employment Type" {...register('employmentType')} as="select">
        <option>Employed</option>
        <option>Self-employed</option>
        <option>Student</option>
      </FormField>

      {/* Show only if employed */}
      {employmentType === 'Employed' && (
        <FormField label="Employer Name" {...register('employerName')} />
      )}

      {/* Show only if self-employed */}
      {employmentType === 'Self-employed' && (
        <>
          <FormField label="Business Name" {...register('businessName')} />
          <FormField label="Industry" {...register('industry')} />
        </>
      )}

      {/* Show only for specific countries */}
      <FormField label="Country" {...register('country')} as="select" />
      {country === 'US' && (
        <FormField label="State" {...register('state')} />
      )}
    </form>
  );
}
```

### Save & Resume (Long Forms)

```typescript
// Save draft to localStorage for recovery
export function useFormDraft(formKey: string) {
  const { watch, reset } = useForm();
  const watchedValues = watch();

  // Auto-save every 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(`form_draft_${formKey}`, JSON.stringify(watchedValues));
    }, 30000);
    return () => clearTimeout(timer);
  }, [watchedValues, formKey]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(`form_draft_${formKey}`);
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      reset(parsedDraft);
      
      // Show recovery notification
      toast('Draft recovered', {
        action: {
          label: 'Clear',
          onClick: () => localStorage.removeItem(`form_draft_${formKey}`),
        },
      });
    }
  }, [formKey, reset]);

  return { watchedValues };
}
```

---

## Success States & Submission Feedback

### Submit Button States (Complete Pattern)

```typescript
export function SubmitButton({ isSubmitting, isValid, isDirty }) {
  return (
    <button
      type="submit"
      disabled={isSubmitting || !isValid}
      className={`px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
        isSubmitting
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
      }`}
    >
      {isSubmitting && (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Submitting...</span>
        </>
      )}
      {!isSubmitting && !isDirty && (
        <>
          <span>Submit</span>
        </>
      )}
      {!isSubmitting && isDirty && (
        <>
          <span>Save Changes</span>
        </>
      )}
    </button>
  );
}
```

### Form Submission with Server Actions (Next.js 15)

```typescript
'use client';

import { useActionState } from 'react';
import { submitContactForm } from '@/app/actions';

export function ContactFormWithServerAction() {
  const [state, formAction, isPending] = useActionState(submitContactForm, null);

  return (
    <form action={formAction} className="space-y-4">
      {/* Form-level error summary */}
      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4" role="alert">
          <p className="text-red-900 font-semibold">{state.error}</p>
        </div>
      )}

      {/* Field errors */}
      <FormField
        label="Email"
        name="email"
        error={state?.errors?.email}
        type="email"
      />

      {/* Submit button */}
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        {isPending ? 'Submitting...' : 'Submit'}
      </button>

      {/* Success message */}
      {state?.success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4" role="status">
          <p className="text-green-900">✓ Form submitted successfully</p>
        </div>
      )}
    </form>
  );
}

// Server action with validation
export async function submitContactForm(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;

  // Validate with Zod
  const result = contactSchema.safeParse({ email, message });

  if (!result.success) {
    return {
      error: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    };
  }

  // Submit to database
  try {
    await db.contact.create({ email, message });
    return { success: true };
  } catch (error) {
    return { error: 'Failed to submit form. Please try again.' };
  }
}
```

### Optimistic UI Pattern (React 19)

```typescript
'use client';

import { useOptimistic } from 'react';

export function OptimisticFormSubmit() {
  const [messages, addMessage] = useOptimistic<Message[]>(
    [],
    (state, newMessage) => [...state, { ...newMessage, pending: true }]
  );

  async function formAction(formData: FormData) {
    const content = formData.get('message') as string;

    // Optimistic update (instant feedback)
    addMessage({
      id: `temp-${Date.now()}`,
      content,
      pending: true,
      createdAt: new Date(),
    });

    // Actual server call
    const result = await submitMessage(content);

    if (!result.success) {
      // Handle error - don't remove optimistic update, show error instead
      toast.error('Failed to send message');
    }
  }

  return (
    <div>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={msg.pending ? 'opacity-50' : ''}
        >
          {msg.content}
        </div>
      ))}
      <form action={formAction} className="mt-4">
        <input name="message" required className="px-3 py-2 border rounded" />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Send
        </button>
      </form>
    </div>
  );
}
```

---

## Accessibility Requirements (WCAG 2.2)

### Required Field Indicators

```typescript
// ✅ CORRECT: Use asterisk + aria-required
<label htmlFor="email" className="text-sm font-medium">
  Email Address
  <span aria-label="required" className="ml-1 text-red-600">*</span>
</label>
<input
  id="email"
  type="email"
  required
  aria-required="true"
  className="w-full px-3 py-2 border rounded"
/>

// ❌ INCORRECT: Only asterisk, no aria-label
<label>Email Address *</label>

// ℹ️ Alternative: Use aria-label
<input
  aria-label="Email address (required)"
  aria-required="true"
/>
```

### Focus Management

```typescript
// ✅ Focus first error field on validation failure
export function FocusOnError() {
  const firstErrorRef = useRef<HTMLInputElement>(null);

  const handleValidationError = () => {
    // Scroll to first error
    firstErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Focus input
    firstErrorRef.current?.focus();
    // Announce to screen readers
    const errorMsg = firstErrorRef.current?.getAttribute('aria-describedby');
    if (errorMsg) {
      const element = document.getElementById(errorMsg);
      element?.setAttribute('role', 'alert');
    }
  };

  return (
    <input
      ref={firstErrorRef}
      type="email"
      className="focus:outline-2 focus:outline-offset-2 focus:outline-blue-600" // WCAG 2.4.13
    />
  );
}

// ✅ Use scroll-margin-top to prevent fixed headers from obscuring focus
<input
  className="scroll-mt-24" // Account for sticky header height
  style={{ scrollMarginTop: '6rem' }} // 96px for typical header
/>
```

### Color Contrast & Error States

```typescript
// ✅ Error text + icon + color (3 redundant cues)
<div className="flex items-start gap-2 text-red-600">
  <span className="flex-shrink-0 mt-0.5">✕</span>
  <span className="text-sm">This field is required</span>
</div>

// Color contrast ratios:
// 4.5:1 for normal text (AA)
// 7:1 for enhanced (AAA)
const textContrast = {
  error: 'text-red-600',      // ~7:1 on white
  success: 'text-green-700',  // ~7:1 on white
  warning: 'text-orange-700', // ~7:1 on white
};
```

### Keyboard Navigation

```typescript
// ✅ Proper tab order
<form>
  <input type="text" /> {/* Tab 1 */}
  <input type="email" /> {/* Tab 2 */}
  <textarea /> {/* Tab 3 */}
  <button type="submit" /> {/* Tab 4 */}
  {/* Don't skip inputs or override tab order */}
</form>

// ✅ Skip to main content
<a href="#main-form" className="sr-only focus:not-sr-only">
  Skip to form
</a>
<main id="main-form">
  {/* Form content */}
</main>
```

### Screen Reader Compatibility

```typescript
// ✅ ARIA live regions for dynamic validation
<div
  aria-live="polite"
  aria-atomic="true"
  role="status"
  className="sr-only"
>
  {error && `${fieldLabel}: ${error.message}`}
</div>

// ✅ Associate error with input
<input
  id="email"
  type="email"
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : undefined}
/>
<p id="email-error" role="alert" className="text-red-600 text-sm">
  {error?.message}
</p>
```

---

## Best Practices with Rationale

| Pattern | Rationale | Implementation |
|---------|-----------|-----------------|
| **Top-aligned labels** | 50ms eye scan vs 170ms for left-aligned (Nielsen) | `<label>` above `<input>` |
| **Inline validation** | 22% completion increase (Baymard Institute) | Validate on blur first, then onChange |
| **Debounce async checks** | Reduces server load 70%+ for rapid typing | 300-500ms delay for API calls |
| **Error above input** | Prevents layout shift + keeps error visible with input | Use `scroll-margin-top` for positioning |
| **No toast errors** | Users can't read before dismissal; can't connect error to field | Show inline + form-level summary |
| **Progressive disclosure** | Reduces cognitive load; increases completion 15-40% | Multi-step forms, conditional fields |
| **Save/resume** | Critical for forms >5 fields; reduces abandonment | localStorage for long forms |
| **Submit button states** | Prevents duplicate submissions; shows progress | Disabled during submission + spinner |
| **Success feedback** | Confirms action completed; improves trust | Inline success message + focus management |
| **Optimistic UI** | Reduces perceived wait time by 40% (OpenReplay) | Update UI before server response |
| **Focus indicators** | WCAG 2.4.13: 2px thick, 3:1 contrast ratio | outline-2 focus:outline-offset-2 |
| **Error messages** | Actionable, specific language increases recovery 31% | "Add uppercase letter" not "Invalid" |

---

## Common Errors & Solutions

### Error 1: Validating on Every Keystroke (First Visit)

**Problem:** User types "e" → sees "Email is required" error immediately → frustration → abandonment.

**Solution:**
```typescript
// ❌ WRONG
useForm({ mode: 'onChange' }) // Validates on every keystroke from start

// ✅ CORRECT
useForm({
  mode: 'onBlur',           // First time: validate on blur
  reValidateMode: 'onChange', // After blur: validate on change
})
```

### Error 2: Toast Messages for Validation Errors

**Problem:** Toast disappears before user reads it; user doesn't know which field has error.

**Solution:**
```typescript
// ❌ WRONG
if (error) toast.error('Email is invalid');

// ✅ CORRECT
{error && (
  <p id="email-error" role="alert" className="text-red-600 text-sm">
    {error.message}
  </p>
)}
```

### Error 3: No Loading State During Submission

**Problem:** User clicks submit twice → duplicate submissions → data issues.

**Solution:**
```typescript
// ✅ Disable button during submission
<button disabled={isSubmitting} type="submit">
  {isSubmitting ? 'Submitting...' : 'Submit'}
</button>
```

### Error 4: Async Validation Without Debouncing

**Problem:** API called on every keystroke → 100+ requests for 100-character username → server load.

**Solution:** See debouncing example in Real-Time Validation section (500ms delay).

### Error 5: Error Messages Without Visual Indicators

**Problem:** User with colorblindness can't distinguish error field from normal field.

**Solution:**
```typescript
// ✅ Use icon + text + color (3 redundant cues)
<div className="flex items-center gap-2 text-red-600">
  <span>✕</span> {/* Icon */}
  <span>This field is required</span> {/* Text */}
</div>
```

### Error 6: Layout Shift on Error Messages

**Problem:** Error message appears → form shifts down → user loses place → friction.

**Solution:**
```typescript
// ✅ Reserve space with scroll-margin
<div className="space-y-2">
  <input className="scroll-mt-24" />
  <div className="min-h-6"> {/* Reserve space */}
    {error && <p className="text-red-600 text-sm">{error}</p>}
  </div>
</div>
```

### Error 7: Focus on Hidden Error Field

**Problem:** Error field is off-screen → user focused on it → can't see what's wrong.

**Solution:**
```typescript
// ✅ Scroll field into view when focused
const handleValidationError = () => {
  firstErrorRef.current?.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'center'  // Center in viewport
  });
  firstErrorRef.current?.focus();
};
```

### Error 8: Floating Labels Obscuring Input

**Problem:** Floating label text overlaps user's input.

**Solution:** Ensure label moves completely above input; maintain 4.5:1 contrast ratio.

### Error 9: No Accessibility for Required Fields

**Problem:** Screen reader user doesn't know field is required; sees no visual indicator.

**Solution:**
```typescript
// ✅ Use both visual + programmatic indicators
<label htmlFor="email" className="text-sm font-medium">
  Email
  <span aria-label="required" className="text-red-600">*</span>
</label>
<input
  id="email"
  type="email"
  required
  aria-required="true"
  aria-describedby="email-error"
/>
```

### Error 10: Generic Error Messages

**Problem:** "Invalid input" doesn't tell user HOW to fix it.

**Solution:**
```typescript
// ❌ Generic
"Invalid email"

// ✅ Specific + actionable
"Email must include @ symbol (e.g., user@example.com)"
"Username already taken. Try: john_doe_2024"
```

---

## References

### Official Documentation
- [React Hook Form](https://react-hook-form.com/) - Form state management
- [Zod](https://zod.dev/) - Schema validation
- [shadcn/ui Forms](https://ui.shadcn.com/docs/components/form) - Accessible form components
- [WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/) - Web Content Accessibility Guidelines
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) - Server-side form handling
- [WAI-ARIA: Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html) - Label accessibility

### UX Research & Best Practices
- [Nielsen Norman Group - Form Design](https://www.nngroup.com/articles/errors-forms-design-guidelines/) - Error message guidelines
- [Baymard Institute - Form UX Research](https://baymard.com/) - Conversion rate improvements
- [Smashing Magazine - Error Messages UX](https://www.smashingmagazine.com/2022/08/error-messages-ux-design/) - Error placement patterns
- [Interaction Design Foundation - Progressive Disclosure](https://www.interaction-design.org/literature/topics/progressive-disclosure) - Information hierarchy

### Library Integration
- [@hookform/resolvers](https://www.npmjs.com/package/@hookform/resolvers) - Connect Zod to React Hook Form
- [TailwindCSS Forms](https://tailwindcss.com/docs/preflight) - Form element styling