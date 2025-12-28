import { logger } from '@/lib/logger'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
  role: z.string().optional(),
  inquiryType: z.string().min(1, 'Inquiry type is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export async function POST(request: NextRequest) {
  try {
    // Check content-type header
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 })
    }

    // Get raw text first to check for empty body
    const rawBody = await request.text()
    if (!rawBody || rawBody.trim() === '') {
      return NextResponse.json({ error: 'Request body cannot be empty' }, { status: 400 })
    }

    // Parse JSON with proper error handling
    let body
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
    }

    // Validate input
    const validatedData = contactSchema.parse(body)

    // For now, we'll just log the contact submission
    // In a real implementation, you'd store this in a database or send via email
    logger.info('Contact submission:', {
      name: validatedData.name,
      email: validatedData.email,
      company: validatedData.company || null,
      role: validatedData.role || null,
      inquiry_type: validatedData.inquiryType,
      message: validatedData.message,
      submitted_at: new Date().toISOString(),
      status: 'new',
    })

    // Here you could also send an email notification
    // For now, we'll just return success

    return NextResponse.json(
      { message: 'Contact submission received successfully' },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Contact submission error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
