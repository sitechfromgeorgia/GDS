'use client'

import { useEffect, useState } from 'react'
import type { Product } from '@/lib/services/restaurant/product.service'
import { productService } from '@/lib/services/restaurant/product.service'
import { ProductCard } from './ProductCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const CATEGORIES = [
  { id: 'all', label: 'ყველა' },
  { id: 'meat', label: 'ხორცი' },
  { id: 'vegetables', label: 'ბოსტნეული' },
  { id: 'dairy', label: 'რძის პროდუქტები' },
  { id: 'grains', label: 'ბურღულეული' },
  { id: 'beverages', label: 'სასმელები' },
  { id: 'condiments', label: 'სოუსები' },
  { id: 'spices', label: 'სანელებლები' },
  { id: 'other', label: 'სხვა' },
]

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  useEffect(() => {
    loadProducts()

    // Real-time subscription
    const channel = productService.subscribeToCatalogChanges(() => {
      // Refresh products on any change
      // In a more optimized version, we could update the local state directly
      loadProducts()
    })

    return () => {
      channel.unsubscribe()
    }
  }, [category])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        handleSearch()
      } else {
        loadProducts()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  async function loadProducts() {
    setLoading(true)
    try {
      const data = await productService.getProducts(category)
      setProducts(data)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch() {
    setLoading(true)
    try {
      const data = await productService.searchProducts(search)
      setProducts(data)
    } catch (error) {
      console.error('Failed to search products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ძებნა..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Tabs
          value={category}
          onValueChange={setCategory}
          className="w-full sm:w-auto overflow-x-auto"
        >
          <TabsList>
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[300px] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              პროდუქტები არ მოიძებნა
            </div>
          )}
        </div>
      )}
    </div>
  )
}
