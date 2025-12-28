'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import { toast } from 'sonner'

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>
}

export function CommentForm({ onSubmit }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    try {
      await onSubmit(content)
      setContent('')
    } catch (error) {
      toast.error('კომენტარის გაგზავნა ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="დაწერეთ კომენტარი..."
        className="min-h-[80px]"
      />
      <Button type="submit" size="icon" disabled={loading || !content.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}
