import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/client'

export interface Product {
    id: string
    name: string
    category: string
    unit: string
    is_active: boolean
    image_url?: string
    description?: string
}

export class ProductService {
    static async getActiveProducts() {
        // Use client-side client for components, server-side for server components
        // This service might be used in both contexts, so we need to handle it.
        // For now, let's assume this is primarily used in Server Components or API routes.
        // If used in Client Components, we should pass the data or use a separate client-side service.

        // However, for simplicity in this phase, let's assume we are fetching data in a Server Component
        // and passing it to the Client Component, OR using a client-side fetch.

        // Let's create a client-side compatible method using the browser client if window is defined,
        // otherwise use server client.

        let supabase;
        if (typeof window === 'undefined') {
            supabase = await createServerClient()
        } else {
            supabase = createClient()
        }

        const { data, error } = await supabase
            .from('products')
            .select('id, name, category, unit, is_active, image_url, description')
            .eq('is_active', true)
            .order('category', { ascending: true })
            .order('name', { ascending: true })

        if (error) {
            throw new Error(`Failed to fetch products: ${error.message}`)
        }

        return data as Product[]
    }

    static async getCategories(): Promise<string[]> {
        let supabase;
        if (typeof window === 'undefined') {
            supabase = await createServerClient()
        } else {
            supabase = createClient()
        }

        const { data, error } = await supabase
            .from('products')
            .select('category')
            .eq('is_active', true)

        if (error) {
            throw new Error(`Failed to fetch categories: ${error.message}`)
        }

        // Extract unique categories
        const categories: string[] = Array.from(new Set(data.map((p: { category: string }) => p.category)))
        return categories.sort()
    }
}
