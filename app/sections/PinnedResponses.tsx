'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { copyToClipboard } from '@/lib/clipboard'
import {
  RiPushpinLine,
  RiUnpinLine,
  RiFileCopyLine,
  RiFullscreenLine,
  RiCloseLine,
  RiCheckLine,
} from 'react-icons/ri'

export interface PinnedResponse {
  id: string
  content: string
  sources: string[]
  actionItems: string[]
  category: string
  pinnedAt: string
}

interface PinnedResponsesProps {
  pinned: PinnedResponse[]
  onUnpin: (id: string) => void
}

function renderMarkdownSimple(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-2 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-3 mb-1">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{line.slice(2)}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{line.replace(/^\d+\.\s/, '')}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{line}</p>
      })}
    </div>
  )
}

export default function PinnedResponses({ pinned, onUnpin }: PinnedResponsesProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (id: string, content: string) => {
    const success = await copyToClipboard(content)
    if (success) {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Pinned Responses</h2>
            <p className="text-sm text-muted-foreground mt-1">{pinned.length} saved response{pinned.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <RiPushpinLine className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 pb-6">
        {pinned.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <RiPushpinLine className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-1">No pinned responses yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">Pin important Nyx responses for quick access.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pinned.map((item) => (
              <Card key={item.id} className="bg-card border-border hover:border-primary/30 transition-all duration-200 shadow-[0_2px_10px_rgba(139,92,246,0.08)] relative group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {item.category && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">{item.category}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{formatDate(item.pinnedAt)}</span>
                  </div>

                  <div className={`text-foreground ${expandedId === item.id ? '' : 'line-clamp-4'}`}>
                    {renderMarkdownSimple(item.content)}
                  </div>

                  {Array.isArray(item.sources) && item.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.sources.map((src, i) => (
                        <Badge key={i} variant="outline" className="text-xs border-border text-muted-foreground">{src}</Badge>
                      ))}
                    </div>
                  )}

                  {Array.isArray(item.actionItems) && item.actionItems.length > 0 && expandedId === item.id && (
                    <div className="mt-3 p-3 bg-secondary/50 rounded-xl">
                      <p className="text-xs font-semibold text-foreground mb-1.5">Action Items:</p>
                      <ul className="space-y-1">
                        {item.actionItems.map((ai, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-2">
                            <span className="text-primary font-mono">{i + 1}.</span>
                            <span>{ai}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                    <Button size="sm" variant="ghost" onClick={() => handleCopy(item.id, item.content)} className="text-xs text-muted-foreground hover:text-foreground h-8">
                      {copiedId === item.id ? <RiCheckLine className="w-3.5 h-3.5 mr-1 text-green-400" /> : <RiFileCopyLine className="w-3.5 h-3.5 mr-1" />}
                      {copiedId === item.id ? 'Copied' : 'Copy'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="text-xs text-muted-foreground hover:text-foreground h-8">
                      {expandedId === item.id ? <RiCloseLine className="w-3.5 h-3.5 mr-1" /> : <RiFullscreenLine className="w-3.5 h-3.5 mr-1" />}
                      {expandedId === item.id ? 'Collapse' : 'Expand'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onUnpin(item.id)} className="text-xs text-muted-foreground hover:text-destructive h-8 ml-auto">
                      <RiUnpinLine className="w-3.5 h-3.5 mr-1" />
                      Unpin
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
