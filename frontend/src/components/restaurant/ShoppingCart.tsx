import { useCartStore } from '@/lib/store/cart.store'
import { CartItem } from './CartItem'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShoppingBag, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

interface ShoppingCartProps {
  isDemo?: boolean
}

export function ShoppingCart({ isDemo = false }: ShoppingCartProps) {
  const items = useCartStore((state) => state.items)
  const totalItems = useCartStore((state) => state.totalItems())
  const [showContactForm, setShowContactForm] = useState(false)
  const { toast } = useToast()

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: 'Message Sent',
      description: 'We will contact you shortly via WhatsApp.',
    })
    setShowContactForm(false)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
        <ShoppingBag className="h-12 w-12 mb-4 opacity-20" />
        <p>კალათა ცარიელია</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-4">
        <div className="divide-y">
          {items.map((item) => (
            <CartItem key={item.productId} item={item} />
          ))}
        </div>
      </ScrollArea>

      <div className="mt-auto border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-muted-foreground">სულ რაოდენობა:</span>
          <span className="font-bold text-lg">{totalItems}</span>
        </div>

        {isDemo ? (
          <>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => setShowContactForm(true)}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              შეკვეთა WhatsApp-ით
            </Button>

            <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Contact via WhatsApp</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input required placeholder="Your Name" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input required placeholder="+995 5XX XX XX XX" />
                  </div>
                  <div>
                    <Label>Message</Label>
                    <Textarea placeholder="I am interested in these products..." />
                  </div>
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <Button asChild className="w-full" size="lg">
            <Link href="/dashboard/restaurant/orders/new">შეკვეთის გაფორმება</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
