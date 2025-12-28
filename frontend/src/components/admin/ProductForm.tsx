'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Plus, ImageIcon } from 'lucide-react'
import { logger } from '@/lib/logger'
import { createBrowserClient } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import type { Product, ProductInsert } from '@/types/database'

interface ProductFormProps {
  product?: Product | null
  onClose: () => void
}

const categories = [
  'საკვები',
  'სასმელები',
  'რძის პროდუქტები',
  'საცხობი',
  'ხილი და ბოსტნეული',
  'სანელებლები',
  'სხვა',
]

export function ProductForm({ product, onClose }: ProductFormProps) {
  const supabase = createBrowserClient()
  const { toast } = useToast()

  const [formData, setFormData] = useState<ProductInsert>({
    name: '',
    description: '',
    price: 0,
    cost_price: 0,
    category: '',
    unit: '',
    stock_quantity: 0,
    min_stock_level: 10,
    image_url: null,
    tags: null,
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        cost_price: product.cost_price,
        category: product.category,
        unit: product.unit,
        stock_quantity: product.stock_quantity,
        min_stock_level: product.min_stock_level,
        image_url: product.image_url,
        tags: product.tags,
        is_active: product.is_active,
      })
      if (product.image_url) {
        setImagePreview(product.image_url)
      }
    }
  }, [product])

  const handleInputChange = (field: keyof Product, value: string | number | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData((prev) => ({ ...prev, image_url: undefined }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()],
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }))
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url || null

    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `products/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageFile)

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: 'შეცდომა',
        description: 'პროდუქტის დასახელება აუცილებელია',
        variant: 'destructive',
      })
      return
    }

    if (formData.price <= 0) {
      toast({
        title: 'შეცდომა',
        description: 'ფასი უნდა იყოს დადებითი რიცხვი',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      // Upload image if there's a new one
      const imageUrl = await uploadImage()

      const productData = {
        ...formData,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      }

      if (product?.id) {
        // Temporary workaround for Supabase type inference issue
        // TODO: Fix Supabase client type configuration
        // Using direct Supabase client call with type assertion
        const updatePayload = {
          name: productData.name,
          description: productData.description || null,
          price: productData.price,
          cost_price: productData.cost_price,
          category: productData.category,
          unit: productData.unit,
          stock_quantity: productData.stock_quantity || 0,
          min_stock_level: productData.min_stock_level || 0,
          image_url: imageUrl,
          tags: productData.tags,
          is_active: productData.is_active,
        }

        // @ts-ignore Supabase client type issue

        const { error } = await (supabase as any)
          .from('products')
          .update(updatePayload)
          .eq('id', product.id)

        if (error) throw error

        toast({
          title: 'წარმატება',
          description: 'პროდუქტი განახლდა',
        })
      } else {
        // Create new product
        const insertData = {
          name: productData.name,
          description: productData.description || null,
          price: productData.price,
          cost_price: productData.cost_price,
          category: productData.category,
          unit: productData.unit,
          stock_quantity: productData.stock_quantity || 0,
          min_stock_level: productData.min_stock_level || 0,
          image_url: imageUrl,
          tags: productData.tags,
          is_active: productData.is_active || true,
          created_at: new Date().toISOString(),
        } as ProductInsert

        // Type assertion to bypass Supabase type inference issue

        const { error } = await (supabase as any).from('products').insert([insertData])

        if (error) throw error

        toast({
          title: 'წარმატება',
          description: 'პროდუქტი შეიქმნა',
        })
      }

      onClose()
    } catch (error) {
      logger.error('Error saving product:', error)
      toast({
        title: 'შეცდომა',
        description: 'პროდუქტის შენახვა ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">ძირითადი</TabsTrigger>
          <TabsTrigger value="pricing">ფასები</TabsTrigger>
          <TabsTrigger value="inventory">ინვენტარი</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">დასახელება *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="პროდუქტის დასახელება"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">კატეგორია *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="აირჩიეთ კატეგორია" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">აღწერა</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="პროდუქტის დეტალური აღწერა"
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">სურათი</CardTitle>
            </CardHeader>
            <CardContent>
              {imagePreview ? (
                <div className="relative">
                  <Image
                    src={imagePreview}
                    alt="Product preview"
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-sm font-medium">სურათის ატვირთვა</span>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        aria-label="ატვირთეთ პროდუქტის სურათი"
                      />
                    </Label>
                    <p className="text-xs text-muted-foreground">PNG, JPG, JPEG (მაქს. 5MB)</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <div className="space-y-2">
            <Label>ტეგები</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="დაამატეთ ტეგი"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags?.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeTag(tag)}
                >
                  {tag} <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">აქტიური პროდუქტი</Label>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">გასაყიდი ფასი (₾) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_price">ღირებულება (₾)</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>

          {formData.price > 0 && formData.cost_price > 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">მოგება ერთეულზე:</span>
                    <span className="font-medium ml-2">
                      {(formData.price - formData.cost_price).toFixed(2)}₾
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">მოგების პროცენტი:</span>
                    <span className="font-medium ml-2">
                      {(
                        ((formData.price - formData.cost_price) / formData.cost_price) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">მარაგი (ერთეული)</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => handleInputChange('stock_quantity', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock_level">მინიმალური დონე</Label>
              <Input
                id="min_stock_level"
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) =>
                  handleInputChange('min_stock_level', parseInt(e.target.value) || 0)
                }
                placeholder="10"
              />
            </div>
          </div>

          <Card>
            <CardContent className="pt-4">
              <div className="text-sm">
                <span className="text-muted-foreground">სტატუსი:</span>
                <span
                  className={`font-medium ml-2 ${
                    (formData.stock_quantity || 0) <= 0
                      ? 'text-red-600'
                      : (formData.stock_quantity || 0) <= (formData.min_stock_level || 0)
                        ? 'text-yellow-600'
                        : 'text-green-600'
                  }`}
                >
                  {(formData.stock_quantity || 0) <= 0
                    ? 'არ არის მარაგში'
                    : (formData.stock_quantity || 0) <= (formData.min_stock_level || 0)
                      ? 'დაბალი მარაგი'
                      : 'ხელმისაწვდომია'}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          გაუქმება
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'შენახვა...' : product?.id ? 'განახლება' : 'შექმნა'}
        </Button>
      </div>
    </form>
  )
}
