'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { RiSearchLine, RiChat1Line, RiAddLine, RiTimeLine, RiArrowDownSLine, RiArrowUpSLine } from 'react-icons/ri'

export interface ConversationMessage {
  role: 'user' | 'agent'
  content: string
  category?: string
  sources?: string[]
  action_items?: string[]
  timestamp: string
}

export interface Conversation {
  id: string
  sessionId: string
  messages: ConversationMessage[]
  createdAt: string
  lastMessageAt: string
}

interface ConversationHistoryProps {
  conversations: Conversation[]
  onNewChat: () => void
  onLoadConversation: (conversation: Conversation) => void
}

export default function ConversationHistory({ conversations, onNewChat, onLoadConversation }: ConversationHistoryProps) {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations
    const lower = search.toLowerCase()
    return conversations.filter((c) =>
      c.messages.some((m) => m.content.toLowerCase().includes(lower))
    )
  }, [conversations, search])

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateStr
    }
  }

  const getPreview = (conv: Conversation) => {
    const firstUser = conv.messages.find((m) => m.role === 'user')
    return firstUser?.content?.slice(0, 120) ?? 'No preview available'
  }

  const getCategory = (conv: Conversation) => {
    const agentMsg = conv.messages.find((m) => m.role === 'agent' && m.category)
    return agentMsg?.category ?? ''
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Conversation History</h2>
            <p className="text-sm text-muted-foreground mt-1">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''} stored</p>
          </div>
          <Button onClick={onNewChat} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_20px_rgba(139,92,246,0.25)]">
            <RiAddLine className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 pb-6">
        {filtered.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <RiChat1Line className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-1">No conversations found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {search ? 'Try a different search term.' : 'Start chatting with Nyx to build your history.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((conv) => (
              <Card key={conv.id} className="bg-card border-border hover:border-primary/30 transition-all duration-200 shadow-[0_2px_10px_rgba(139,92,246,0.08)]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">{getPreview(conv)}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <RiTimeLine className="w-3 h-3" />
                          {formatDate(conv.lastMessageAt)}
                        </span>
                        <span className="text-xs text-muted-foreground">{conv.messages.length} messages</span>
                        {getCategory(conv) && (
                          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">{getCategory(conv)}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => onLoadConversation(conv)} className="text-xs border-border text-muted-foreground hover:text-foreground hover:border-primary/50">
                        Load
                      </Button>
                      <button onClick={() => setExpandedId(expandedId === conv.id ? null : conv.id)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                        {expandedId === conv.id ? <RiArrowUpSLine className="w-4 h-4" /> : <RiArrowDownSLine className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {expandedId === conv.id && (
                    <>
                      <Separator className="my-3 bg-border" />
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {conv.messages.map((msg, i) => (
                          <div key={i} className={`text-xs p-2 rounded-lg ${msg.role === 'user' ? 'bg-primary/10 text-primary ml-8' : 'bg-secondary text-foreground mr-8'}`}>
                            <span className="font-semibold">{msg.role === 'user' ? 'You' : 'Nyx'}:</span>{' '}
                            {msg.content.slice(0, 300)}{msg.content.length > 300 ? '...' : ''}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
