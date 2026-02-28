'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { callAIAgent, extractText } from '@/lib/aiAgent'
import { copyToClipboard } from '@/lib/clipboard'
import {
  RiSendPlaneFill,
  RiPushpinLine,
  RiFileCopyLine,
  RiCheckLine,
  RiRobot2Line,
  RiUser3Line,
} from 'react-icons/ri'

const AGENT_ID = '69a3026a0df1e4d737281da1'

export interface ChatMessage {
  role: 'user' | 'agent'
  content: string
  category?: string
  sources?: string[]
  action_items?: string[]
  timestamp: string
}

interface ChatInterfaceProps {
  sessionId: string
  messages: ChatMessage[]
  onMessagesUpdate: (messages: ChatMessage[]) => void
  onPinResponse: (msg: ChatMessage) => void
  activeAgentId: string | null
  onAgentActivity: (agentId: string | null) => void
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{formatInline(line.slice(4))}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{formatInline(line.slice(3))}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{formatInline(line.slice(2))}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

export default function ChatInterface({ sessionId, messages, onMessagesUpdate, onPinResponse, activeAgentId, onAgentActivity }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg: ChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    }
    const updated = [...messages, userMsg]
    onMessagesUpdate(updated)
    setInput('')
    setLoading(true)
    onAgentActivity(AGENT_ID)

    try {
      const result = await callAIAgent(trimmed, AGENT_ID, { session_id: sessionId })
      const agentResult = result?.response?.result
      const responseText = agentResult?.response || extractText(result?.response) || 'No response received.'
      const sources = Array.isArray(agentResult?.sources) ? agentResult.sources : []
      const actionItems = Array.isArray(agentResult?.action_items) ? agentResult.action_items : []
      const category = agentResult?.category || 'general'

      const agentMsg: ChatMessage = {
        role: 'agent',
        content: responseText,
        category,
        sources,
        action_items: actionItems,
        timestamp: new Date().toISOString(),
      }
      onMessagesUpdate([...updated, agentMsg])
    } catch {
      const errorMsg: ChatMessage = {
        role: 'agent',
        content: 'An error occurred while processing your request. Please try again.',
        timestamp: new Date().toISOString(),
      }
      onMessagesUpdate([...updated, errorMsg])
    } finally {
      setLoading(false)
      onAgentActivity(null)
    }
  }, [input, loading, messages, onMessagesUpdate, onAgentActivity, sessionId])

  const handleCopy = async (idx: number, content: string) => {
    const success = await copyToClipboard(content)
    if (success) {
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
              <RiRobot2Line className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
              {getGreeting()}, Greatness.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              I'm Nyx, your personal AI executive. What are we working on today? Ask me anything about your knowledge base, strategy, or operations.
            </p>
          </div>
        )}

        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'agent' && (
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <RiRobot2Line className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                {msg.role === 'user' ? (
                  <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-br-md shadow-[0_2px_10px_rgba(139,92,246,0.25)]">
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                ) : (
                  <Card className="bg-card border-border shadow-[0_2px_10px_rgba(139,92,246,0.08)] relative group">
                    <CardContent className="p-4">
                      {msg.category && (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0 mb-2">{msg.category}</Badge>
                      )}
                      <div className="text-foreground">{renderMarkdown(msg.content)}</div>

                      {Array.isArray(msg.sources) && msg.sources.length > 0 && (
                        <>
                          <Separator className="my-3 bg-border" />
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Sources:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.sources.map((src, si) => (
                                <Badge key={si} variant="outline" className="text-xs border-border text-muted-foreground hover:border-primary/50 hover:text-primary cursor-default transition-colors">{src}</Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {Array.isArray(msg.action_items) && msg.action_items.length > 0 && (
                        <>
                          <Separator className="my-3 bg-border" />
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Action Items:</p>
                            <ul className="space-y-1">
                              {msg.action_items.map((ai, ai_i) => (
                                <li key={ai_i} className="text-sm text-foreground flex gap-2">
                                  <span className="text-primary font-mono text-xs mt-0.5">{ai_i + 1}.</span>
                                  <span className="leading-relaxed">{ai}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}

                      <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onPinResponse(msg)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Pin response">
                          <RiPushpinLine className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleCopy(idx, msg.content)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Copy">
                          {copiedIdx === idx ? <RiCheckLine className="w-3.5 h-3.5 text-green-400" /> : <RiFileCopyLine className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <p className="text-xs text-muted-foreground mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                  <RiUser3Line className="w-4 h-4 text-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <RiRobot2Line className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.3s' }} />
                    <span className="text-sm text-muted-foreground ml-2">Nyx is thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border bg-card/50 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Nyx..."
              rows={1}
              className="w-full resize-none bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring max-h-32 overflow-y-auto"
              style={{ minHeight: '48px' }}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_20px_rgba(139,92,246,0.3)] disabled:opacity-40 flex-shrink-0"
          >
            <RiSendPlaneFill className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
