'use client'

import { useState, Suspense, lazy } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Package,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { ProductFormSkeleton } from '@/components/admin/ProductFormSkeleton'
import { ProductTableSkeleton } from '@/components/admin/ProductTableSkeleton'
import { useToast } from '@/hooks/use-toast'
import type { Product } from '@/types/database'

// ============================================================================
// Code Splitting (T059 - Heavy Dependencies)
// ============================================================================
// Lazy load ProductForm
// Why: Large form component with image upload, tabs, and complex UI (~8-10 KB)
// Expected impact: 8-12% bundle reduction for admin products page
const ProductForm = lazy(() =>
  import('@/components/admin/ProductForm').then((m) => ({ default: m.ProductForm }))
)

// Lazy load ProductTable
// Why: Large table component with data fetching, filtering, sorting, pagination (~8 KB)
// Expected impact: Additional 6-8% bundle reduction
const ProductTable = lazy(() =>
  import('@/components/admin/ProductTable').then((m) => ({ default: m.ProductTable }))
)

type ProductForm = NonNullable<Product>

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const { toast } = useToast()

  const handleCreateProduct = () => {
    setEditingProduct(null)
    setShowProductForm(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowProductForm(true)
  }

  const handleProductFormClose = () => {
    setShowProductForm(false)
    setEditingProduct(null)
  }

  const handleExportProducts = () => {
    toast({
      title: 'ექსპორტი',
      description: 'პროდუქტების ექსპორტი მიმდინარეობს...',
    })
  }

  const handleImportProducts = () => {
    toast({
      title: 'იმპორტი',
      description: 'პროდუქტების იმპორტი მიმდინარეობს...',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">პროდუქტების მართვა</h1>
          <p className="text-muted-foreground">მართეთ პროდუქტების კატალოგი, ინვენტარი და ფასები</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportProducts}>
            <Upload className="mr-2 h-4 w-4" />
            იმპორტი
          </Button>
          <Button variant="outline" onClick={handleExportProducts}>
            <Download className="mr-2 h-4 w-4" />
            ექსპორტი
          </Button>
          <Button onClick={handleCreateProduct}>
            <Plus className="mr-2 h-4 w-4" />
            ახალი პროდუქტი
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">სულ პროდუქტები</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> წინა თვესთან შედარებით
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">აქტიური პროდუქტები</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,156</div>
            <p className="text-xs text-muted-foreground">94% ყველა პროდუქტიდან</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">დაბალი ინვენტარი</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">საჭიროა შევსება</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">კატეგორიები</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">აქტიური კატეგორიები</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>ფილტრები და ძიება</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="პროდუქტის სახელით ძიება..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                aria-label="კატეგორიის ფილტრი"
              >
                <option value="all">ყველა კატეგორია</option>
                <option value="food">საკვები</option>
                <option value="beverages">სასმელები</option>
                <option value="dairy">რძის პროდუქტები</option>
                <option value="bakery">საცხობი</option>
              </select>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                დამატებითი ფილტრები
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Table */}
      <Card>
        <CardHeader>
          <CardTitle>პროდუქტები</CardTitle>
          <CardDescription>მართეთ პროდუქტების სია, ფასები და ინვენტარი</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ProductTableSkeleton />}>
            <ProductTable
              searchTerm={searchTerm}
              categoryFilter={selectedCategory}
              onEditProduct={handleEditProduct}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'პროდუქტის რედაქტირება' : 'ახალი პროდუქტი'}</DialogTitle>
            <DialogDescription>შეავსეთ პროდუქტის დეტალები</DialogDescription>
          </DialogHeader>
          <Suspense fallback={<ProductFormSkeleton />}>
            <ProductForm product={editingProduct} onClose={handleProductFormClose} />
          </Suspense>
        </DialogContent>
      </Dialog>
    </div>
  )
}
