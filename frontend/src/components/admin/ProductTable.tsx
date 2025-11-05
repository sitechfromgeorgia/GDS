'use client'
import { logger } from '@/lib/logger'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createBrowserClient } from '@/lib/supabase'
import { Product } from '@/types/database'

// Create Supabase client instance
const supabase = createBrowserClient()

interface ProductTableProps {
  searchTerm: string
  categoryFilter: string
  onEditProduct: (product: Product) => void
}

export function ProductTable({ searchTerm, categoryFilter, onEditProduct }: ProductTableProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const { toast } = useToast()

  const itemsPerPage = 20

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase.from('products').select('*', { count: 'exact' })

      // Apply search filter
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`)
      }

      // Apply category filter
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      setProducts(data || [])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      logger.error('Error fetching products:', error)
      toast({
        title: 'შეცდომა',
        description: 'პროდუქტების ჩატვირთვა ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [searchTerm, categoryFilter, currentPage, sortBy, sortOrder, toast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts((prev) => [...prev, productId])
    } else {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map((p) => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleBulkActivate = async () => {
    try {
      // Type assertion to bypass Supabase type inference issue

      const productsTable = supabase.from('products') as any
      const { error } = await productsTable.update({ is_active: true }).in('id', selectedProducts)

      if (error) throw error

      toast({
        title: 'წარმატება',
        description: `${selectedProducts.length} პროდუქტი გააქტიურდა`,
      })

      fetchProducts()
      setSelectedProducts([])
    } catch (error) {
      logger.error('Error activating products:', error)
      toast({
        title: 'შეცდომა',
        description: 'პროდუქტების გააქტიურება ვერ მოხერხდა',
        variant: 'destructive',
      })
    }
  }

  const handleBulkDeactivate = async () => {
    try {
      // Type assertion to bypass Supabase type inference issue

      const productsTable = supabase.from('products') as any
      const { error } = await productsTable.update({ is_active: false }).in('id', selectedProducts)

      if (error) throw error

      toast({
        title: 'წარმატება',
        description: `${selectedProducts.length} პროდუქტი გააქტიურდა`,
      })

      fetchProducts()
      setSelectedProducts([])
    } catch (error) {
      logger.error('Error deactivating products:', error)
      toast({
        title: 'შეცდომა',
        description: 'პროდუქტების გააქტიურება ვერ მოხერხდა',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ პროდუქტის წაშლა?')) return

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId)

      if (error) throw error

      toast({
        title: 'წარმატება',
        description: 'პროდუქტი წაიშალა',
      })

      fetchProducts()
    } catch (error) {
      logger.error('Error deleting product:', error)
      toast({
        title: 'შეცდომა',
        description: 'პროდუქტის წაშლა ვერ მოხერხდა',
        variant: 'destructive',
      })
    }
  }

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity <= 0) {
      return { status: 'out_of_stock', label: 'არ არის', color: 'destructive' }
    } else if (product.stock_quantity <= product.min_stock_level) {
      return { status: 'low_stock', label: 'დაბალი', color: 'warning' }
    } else {
      return { status: 'in_stock', label: 'ხელმისაწვდომია', color: 'default' }
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">არჩეულია {selectedProducts.length} პროდუქტი</span>
          <Button size="sm" onClick={handleBulkActivate}>
            <CheckCircle className="mr-2 h-4 w-4" />
            გააქტიურება
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkDeactivate}>
            <XCircle className="mr-2 h-4 w-4" />
            გააქტიურება
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>სურათი</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSortBy('name')
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  }}
                >
                  დასახელება
                </Button>
              </TableHead>
              <TableHead>კატეგორია</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSortBy('price')
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  }}
                >
                  ფასი
                </Button>
              </TableHead>
              <TableHead>ინვენტარი</TableHead>
              <TableHead>სტატუსი</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const stockStatus = getStockStatus(product)
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked: boolean) =>
                        handleSelectProduct(product.id, checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {product.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.price}₾</div>
                      <div className="text-sm text-muted-foreground">
                        ღირებულება: {product.cost_price}₾
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.stock_quantity}</span>
                      {stockStatus.status === 'low_stock' && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      {stockStatus.status === 'out_of_stock' && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'აქტიური' : 'არააქტიური'}
                      </Badge>
                      <Badge
                        variant={
                          stockStatus.color === 'destructive'
                            ? 'destructive'
                            : stockStatus.color === 'warning'
                              ? 'secondary'
                              : 'default'
                        }
                      >
                        {stockStatus.label}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditProduct(product)}>
                          <Edit className="mr-2 h-4 w-4" />
                          რედაქტირება
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          ნახვა
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          წაშლა
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            გვერდი {currentPage} / {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              წინა
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              შემდეგი
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
