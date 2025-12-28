import { OrderDetails } from '@/components/admin/OrderDetails'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminOrderDetailsPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <OrderDetails orderId={id} />
    </div>
  )
}
