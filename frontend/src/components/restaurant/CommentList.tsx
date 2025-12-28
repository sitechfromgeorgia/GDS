import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDate } from '@/lib/constants/georgian'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  // In a real app, we'd join with profiles to get name/avatar
  // For now we might need to fetch it or just show generic
}

interface CommentListProps {
  comments: Comment[]
  currentUserId: string
}

export function CommentList({ comments, currentUserId }: CommentListProps) {
  if (comments.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-sm">კომენტარები არ არის</div>
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {comments.map((comment) => {
          const isMe = comment.user_id === currentUserId
          return (
            <div key={comment.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              <Avatar className="h-8 w-8">
                <AvatarFallback>{isMe ? 'მე' : 'U'}</AvatarFallback>
              </Avatar>
              <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  {comment.content}
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {formatDate(comment.created_at, true)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
