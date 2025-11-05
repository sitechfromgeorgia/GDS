'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductCatalog } from '@/components/restaurant/ProductCatalog'
import { Cart } from '@/components/restaurant/Cart'
import { CartItem, Product } from '@/types/restaurant'
import { RestaurantUtils } from '@/lib/restaurant-utils'
import { useToast } from '@/hooks/use-toast'

export default function OrderPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [activeTab, setActiveTab] = useState('catalog')
  const { toast } = useToast()

  const loadCartFromStorage = useCallback(async () => {
    try {
      const savedCart = await RestaurantUtils.getCartFromStorage()
      setCartItems(savedCart)
    } catch (error) {
      logger.error('Failed to load cart from storage:', error)
    }
  }, [])

  const saveCartToStorage = useCallback(async () => {
    try {
      await RestaurantUtils.saveCartToStorage(cartItems)
    } catch (error) {
      logger.error('Failed to save cart to storage:', error)
    }
  }, [cartItems])

  useEffect(() => {
    const initializeCart = async () => {
      await loadCartFromStorage()
    }
    initializeCart()
  }, [loadCartFromStorage])

  useEffect(() => {
    const saveCart = async () => {
      await saveCartToStorage()
    }
    saveCart()
  }, [saveCartToStorage])

  const handleAddToCart = (product: Product, quantity: number, notes?: string) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id)

      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + quantity, product.max_order_quantity || 100),
                notes: notes || item.notes,
              }
            : item
        )
      } else {
        return [...prevItems, { product, quantity, notes }]
      }
    })

    toast({
      title: 'დამატებულია კალათში',
      description: `${product.name} დამატებულია კალათში`,
    })

    // Switch to cart tab if not already there
    if (activeTab === 'catalog') {
      setActiveTab('cart')
    }
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    )
  }

  const handleRemoveItem = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))

    toast({
      title: 'ამოღებულია კალათიდან',
      description: 'პროდუქტი ამოღებულია კალათიდან',
    })
  }

  const handleUpdateNotes = (productId: string, notes: string) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.product.id === productId ? { ...item, notes } : item))
    )
  }

  const handleClearCart = () => {
    setCartItems([])
    toast({
      title: 'კალათი გასუფთავებულია',
      description: 'ყველა პროდუქტი ამოღებულია კალათიდან',
    })
  }

  const handleSubmitOrder = async (orderData: {
    deliveryAddress: string
    deliveryTime?: string
    specialInstructions?: string
  }) => {
    try {
      if (cartItems.length === 0) {
        toast({
          title: 'შეცდომა',
          description: 'კალათი ცარიელია',
          variant: 'destructive',
        })
        return
      }

      const order = await RestaurantUtils.createOrder({
        items: cartItems,
        delivery_address: orderData.deliveryAddress,
        delivery_time: orderData.deliveryTime,
        special_instructions: orderData.specialInstructions,
      })

      // Clear cart after successful order
      setCartItems([])
      await RestaurantUtils.saveCartToStorage([])

      toast({
        title: 'შეკვეთა გაგზავნილია',
        description: `შეკვეთა #${order.id.slice(-8)} წარმატებით გაგზავნილია`,
      })

      // Redirect to tracking page or show success message
      setActiveTab('catalog')
    } catch (error) {
      logger.error('Failed to submit order:', error)
      toast({
        title: 'შეცდომა',
        description: 'შეკვეთის გაგზავნა ვერ მოხერხდა',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ახალი შეკვეთა</h1>
        <p className="text-muted-foreground">აირჩიეთ პროდუქტები და განათავსეთ შეკვეთა</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="catalog">პროდუქტები</TabsTrigger>
          <TabsTrigger value="cart">
            კალათი {cartItems.length > 0 && `(${cartItems.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-6">
          <ProductCatalog onAddToCart={handleAddToCart} cartItems={cartItems} />
        </TabsContent>

        <TabsContent value="cart" className="mt-6">
          <Cart
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onUpdateNotes={handleUpdateNotes}
            onClearCart={handleClearCart}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
