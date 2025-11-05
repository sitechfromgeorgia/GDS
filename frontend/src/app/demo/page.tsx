import { redirect } from 'next/navigation'

// Redirect /demo to main page
export default function DemoPage() {
  redirect('/')
}
