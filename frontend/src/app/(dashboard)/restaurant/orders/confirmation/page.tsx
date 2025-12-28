import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function OrderConfirmationPage() {
  return (
    <div className="container mx-auto py-12 flex flex-col items-center justify-center text-center space-y-6">
      <div className="rounded-full bg-green-100 p-6">
        <CheckCircle2 className="h-12 w-12 text-green-600" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">შეკვეთა მიღებულია!</h1>
        <p className="text-muted-foreground max-w-[600px]">
          თქვენი შეკვეთა წარმატებით გაიგზავნა. შეკვეთის სტატუსის შესამოწმებლად გადადით შეკვეთების
          ისტორიაში.
        </p>
      </div>

      <div className="flex gap-4">
        <Button asChild variant="outline">
          <Link href="/dashboard/restaurant/products">კატალოგში დაბრუნება</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard/restaurant/orders/history">შეკვეთების ისტორია</Link>
        </Button>
      </div>
    </div>
  )
}
