'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RiRobot2Line, RiHexagonLine } from 'react-icons/ri'

import AuthGate from './sections/AuthGate'
import Sidebar from './sections/Sidebar'
import type { ViewType } from './sections/Sidebar'
import ChatInterface from './sections/ChatInterface'
import type { ChatMessage } from './sections/ChatInterface'
import KnowledgeBaseManager from './sections/KnowledgeBaseManager'
import ConversationHistory from './sections/ConversationHistory'
import type { Conversation } from './sections/ConversationHistory'
import PinnedResponses from './sections/PinnedResponses'
import type { PinnedResponse } from './sections/PinnedResponses'
import RivalTracker from './sections/RivalTracker'
import AnalyticsDashboard from './sections/AnalyticsDashboard'
import EventsTracker from './sections/EventsTracker'

const AGENT_ID = '69a3026a0df1e4d737281da1'
const STORAGE_KEY_CONVOS = 'hive_conversations'
const STORAGE_KEY_PINNED = 'hive_pinned'

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const SAMPLE_MESSAGES: ChatMessage[] = [
  {
    role: 'user',
    content: 'What is our Q4 revenue strategy?',
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    role: 'agent',
    content: '## Q4 Revenue Strategy Overview\n\nGreatness, here are the key strategic pillars I\'ve identified for Q4:\n\n### 1. Enterprise Expansion\n- Focus on upselling to existing enterprise accounts\n- Target **30% increase** in average contract value\n- Launch dedicated enterprise success team\n\n### 2. Product-Led Growth\n- Implement self-serve onboarding for SMB segment\n- Reduce time-to-value from 14 days to **3 days**\n\n### 3. Strategic Partnerships\n- Finalize integration partnerships with top 5 platforms\n- Co-marketing campaigns with **3 key partners**\n\n**Projected Impact:** 25-35% revenue increase vs Q3. I\'ll keep tracking these metrics for you, Greatness.',
    category: 'strategy',
    sources: ['Q4_Strategy_Deck.pdf', 'Revenue_Targets_2024.docx'],
    action_items: [
      'Schedule enterprise expansion kickoff meeting',
      'Review self-serve onboarding prototype by Friday',
      'Finalize partnership agreements with legal team',
    ],
    timestamp: new Date(Date.now() - 290000).toISOString(),
  },
  {
    role: 'user',
    content: 'Summarize our technical roadmap priorities.',
    timestamp: new Date(Date.now() - 200000).toISOString(),
  },
  {
    role: 'agent',
    content: '## Technical Roadmap Priorities\n\nGreatness, here is a summary of the current technical priorities:\n\n- **API v3 Migration:** Complete by end of November. All legacy endpoints deprecated.\n- **Performance Optimization:** Target sub-200ms response times for core endpoints.\n- **Security Audit:** Third-party penetration testing scheduled for October.\n- **Infrastructure:** Migration to multi-region deployment for improved latency.\n\nThe engineering team is on track with **78% of Q4 milestones** completed or in progress. I recommend we review the API migration progress in the next standup, Greatness.',
    category: 'technical',
    sources: ['Engineering_Roadmap_Q4.pdf'],
    action_items: [
      'Review API v3 migration progress in standup',
      'Confirm penetration testing vendor selection',
    ],
    timestamp: new Date(Date.now() - 190000).toISOString(),
  },
]

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeView, setActiveView] = useState<ViewType>('chat')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [pinnedResponses, setPinnedResponses] = useState<PinnedResponse[]>([])
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [sampleMode, setSampleMode] = useState(false)

  useEffect(() => {
    setSessionId(generateId())
    try {
      const storedConvos = localStorage.getItem(STORAGE_KEY_CONVOS)
      if (storedConvos) {
        const parsed = JSON.parse(storedConvos)
        if (Array.isArray(parsed)) setConversations(parsed)
      }
    } catch { /* ignore */ }
    try {
      const storedPinned = localStorage.getItem(STORAGE_KEY_PINNED)
      if (storedPinned) {
        const parsed = JSON.parse(storedPinned)
        if (Array.isArray(parsed)) setPinnedResponses(parsed)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (conversations.length > 0) {
      try { localStorage.setItem(STORAGE_KEY_CONVOS, JSON.stringify(conversations)) } catch { /* ignore */ }
    }
  }, [conversations])

  useEffect(() => {
    if (pinnedResponses.length > 0) {
      try { localStorage.setItem(STORAGE_KEY_PINNED, JSON.stringify(pinnedResponses)) } catch { /* ignore */ }
    }
  }, [pinnedResponses])

  const handleMessagesUpdate = useCallback((newMessages: ChatMessage[]) => {
    setMessages(newMessages)
  }, [])

  const saveCurrentConversation = useCallback(() => {
    if (messages.length === 0) return
    const conv: Conversation = {
      id: generateId(),
      sessionId,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        category: m.category,
        sources: m.sources,
        action_items: m.action_items,
        timestamp: m.timestamp,
      })),
      createdAt: messages[0]?.timestamp || new Date().toISOString(),
      lastMessageAt: messages[messages.length - 1]?.timestamp || new Date().toISOString(),
    }
    setConversations((prev) => [conv, ...prev.slice(0, 49)])
  }, [messages, sessionId])

  const handleNewChat = useCallback(() => {
    saveCurrentConversation()
    setMessages([])
    setSessionId(generateId())
    setActiveView('chat')
    setSampleMode(false)
  }, [saveCurrentConversation])

  const handleLoadConversation = useCallback((conv: Conversation) => {
    saveCurrentConversation()
    setMessages(conv.messages.map((m) => ({
      role: m.role,
      content: m.content,
      category: m.category,
      sources: m.sources,
      action_items: m.action_items,
      timestamp: m.timestamp,
    })))
    setSessionId(conv.sessionId)
    setActiveView('chat')
  }, [saveCurrentConversation])

  const handlePinResponse = useCallback((msg: ChatMessage) => {
    const pinned: PinnedResponse = {
      id: generateId(),
      content: msg.content,
      sources: Array.isArray(msg.sources) ? msg.sources : [],
      actionItems: Array.isArray(msg.action_items) ? msg.action_items : [],
      category: msg.category || 'general',
      pinnedAt: new Date().toISOString(),
    }
    setPinnedResponses((prev) => [pinned, ...prev])
  }, [])

  const handleUnpin = useCallback((id: string) => {
    setPinnedResponses((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const handleLogout = useCallback(() => {
    saveCurrentConversation()
    setIsAuthenticated(false)
    setMessages([])
    setActiveView('chat')
    setSampleMode(false)
  }, [saveCurrentConversation])

  const handleViewChange = useCallback((view: ViewType) => {
    if (activeView === 'chat' && view !== 'chat') {
      saveCurrentConversation()
    }
    setActiveView(view)
  }, [activeView, saveCurrentConversation])

  const handleSampleToggle = useCallback((checked: boolean) => {
    setSampleMode(checked)
    if (checked) {
      setMessages(SAMPLE_MESSAGES)
    } else {
      setMessages([])
    }
  }, [])

  if (!isAuthenticated) {
    return (
      <PageErrorBoundary>
        <AuthGate onAuthenticated={() => setIsAuthenticated(true)} />
      </PageErrorBoundary>
    )
  }

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
          onLogout={handleLogout}
        />

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <RiHexagonLine className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold tracking-tight text-foreground">
                {activeView === 'chat' && 'Dashboard'}
                {activeView === 'analytics' && 'Hive Analytics'}
                {activeView === 'events' && 'Events Tracker'}
                {activeView === 'rivals' && 'Rival Intelligence'}
                {activeView === 'knowledge' && 'Knowledge Base'}
                {activeView === 'history' && 'History'}
                {activeView === 'pinned' && 'Pinned'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="sample-toggle"
                  checked={sampleMode}
                  onCheckedChange={handleSampleToggle}
                />
                <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">Sample Data</Label>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeView === 'chat' && (
              <ChatInterface
                sessionId={sessionId}
                messages={messages}
                onMessagesUpdate={handleMessagesUpdate}
                onPinResponse={handlePinResponse}
                activeAgentId={activeAgentId}
                onAgentActivity={setActiveAgentId}
              />
            )}
            {activeView === 'analytics' && <AnalyticsDashboard />}
            {activeView === 'events' && <EventsTracker />}
            {activeView === 'rivals' && <RivalTracker />}
            {activeView === 'knowledge' && <KnowledgeBaseManager />}
            {activeView === 'history' && (
              <ConversationHistory
                conversations={conversations}
                onNewChat={handleNewChat}
                onLoadConversation={handleLoadConversation}
              />
            )}
            {activeView === 'pinned' && (
              <PinnedResponses pinned={pinnedResponses} onUnpin={handleUnpin} />
            )}
          </div>

          <div className="h-10 border-t border-border flex items-center px-6 bg-card/30 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <RiRobot2Line className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">Hive Nyx Agent</span>
              </div>
              <Badge variant="secondary" className={`text-xs border-0 px-2 py-0 ${activeAgentId === AGENT_ID ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'}`}>
                {activeAgentId === AGENT_ID ? 'Processing' : 'Ready'}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">{AGENT_ID.slice(0, 8)}...</span>
            </div>
          </div>
        </main>
      </div>
    </PageErrorBoundary>
  )
}
