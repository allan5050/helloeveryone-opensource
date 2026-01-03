'use client'

import { MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MessageButtonProps {
  targetUserId: string
  className?: string
  showText?: boolean
}

export default function MessageButton({
  targetUserId,
  className = '',
  showText = true,
}: MessageButtonProps) {
  const router = useRouter()

  const handleClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Navigate to chat page when implemented
    // For now, we'll log the action
    console.log('Message user:', targetUserId)

    // TODO: Uncomment when chat is implemented
    // router.push(`/chat/${targetUserId}`);
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center space-x-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700 ${className}`}
    >
      <MessageCircle size={showText ? 20 : 16} />
      {showText && <span>Send Message</span>}
    </button>
  )
}
