'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommentList } from './CommentList'
import { CommentForm } from './CommentForm'
import { orderService } from '@/lib/services/restaurant/order.service'
import { createBrowserClient } from '@/lib/supabase/client'

interface OrderCommentSectionProps {
  orderId: string
  initialComments?: any[]
}

export function OrderCommentSection({ orderId, initialComments = [] }: OrderCommentSectionProps) {
  const [comments, setComments] = useState(initialComments)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const supabase = createBrowserClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    }
    getUser()

    // Subscribe to new comments
    const channel = supabase
      .channel(`comments-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_comments',
          filter: `order_id=eq.${orderId}`,
        },
        (payload: any) => {
          setComments((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [orderId])

  const handleAddComment = async (content: string) => {
    await orderService.addComment(orderId, content)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">კომენტარები</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <CommentList comments={comments} currentUserId={currentUserId} />
        <CommentForm onSubmit={handleAddComment} />
      </CardContent>
    </Card>
  )
}
