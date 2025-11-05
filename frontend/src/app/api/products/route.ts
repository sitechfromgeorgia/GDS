import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { productFilterSchema } from '@/lib/validators/products/products'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get URL parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build filters object from search params
    const filters = {
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      min_price: searchParams.get('min_price')
        ? parseFloat(searchParams.get('min_price')!)
        : undefined,
      max_price: searchParams.get('max_price')
        ? parseFloat(searchParams.get('max_price')!)
        : undefined,
    }

    // Validate filters
    const validatedFilters = productFilterSchema.parse(filters)

    // Calculate pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .eq('is_available', true)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (validatedFilters.category) {
      query = query.eq('category', validatedFilters.category)
    }

    if (validatedFilters.search) {
      query = query.or(
        `name.ilike.%${validatedFilters.search}%,description.ilike.%${validatedFilters.search}%`
      )
    }

    if (validatedFilters.min_price !== undefined) {
      query = query.gte('price', validatedFilters.min_price)
    }

    if (validatedFilters.max_price !== undefined) {
      query = query.lte('price', validatedFilters.max_price)
    }

    const { data, error, count } = await query

    if (error) {
      logger.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products', details: error.message },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      products: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: validatedFilters,
    })
  } catch (error) {
    logger.error('API error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    // Validate request body (you can extend the schema based on requirements)
    // For now, we'll allow basic product creation

    const { data, error } = await supabase.from('products').insert(body).select().single()

    if (error) {
      logger.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create product', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ product: data }, { status: 201 })
  } catch (error) {
    logger.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
