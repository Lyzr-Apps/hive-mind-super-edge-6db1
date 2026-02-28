'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { callAIAgent, extractText } from '@/lib/aiAgent'
import {
  RiBarChartBoxLine,
  RiPieChartLine,
  RiLineChartLine,
  RiRefreshLine,
  RiLoader4Line,
  RiArrowUpSLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiAlertLine,
  RiRocketLine,
  RiShieldLine,
  RiCodeSSlashLine,
  RiPaletteLine,
  RiMoneyDollarCircleLine,
  RiTeamLine,
  RiMapPinLine,
  RiDatabase2Line,
  RiBrainLine,
  RiCalendarEventLine,
  RiHandHeartLine,
  RiAwardLine,
  RiBuildingLine,
  RiRobot2Line,
  RiBookOpenLine,
  RiLayoutGridLine,
} from 'react-icons/ri'

const AGENT_ID = '69a3026a0df1e4d737281da1'
const STORAGE_KEY_ANALYTICS = 'hive_analytics_data'

interface ProgressArea {
  id: string
  name: string
  shortName: string
  docRef: string
  icon: React.ReactNode
  progress: number
  status: 'on-track' | 'at-risk' | 'behind' | 'completed' | 'not-started'
  category: 'product' | 'business' | 'technical' | 'operations'
  details: string
  milestones: string[]
  lastUpdated: string
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'completed': { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Completed' },
  'on-track': { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'On Track' },
  'at-risk': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'At Risk' },
  'behind': { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Behind' },
  'not-started': { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Not Started' },
}

const DEFAULT_AREAS: ProgressArea[] = [
  {
    id: 'manifesto', name: 'Founding Vision & Manifesto', shortName: 'Manifesto', docRef: 'Part 1',
    icon: <RiRocketLine className="w-5 h-5" />, progress: 100, status: 'completed', category: 'business',
    details: 'Core vision, mission, and guiding principles established.',
    milestones: ['Vision statement finalized', 'Mission defined', 'Core values documented'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'vault', name: 'Vault System Architecture', shortName: 'Vault System', docRef: 'Part 2',
    icon: <RiShieldLine className="w-5 h-5" />, progress: 65, status: 'on-track', category: 'technical',
    details: 'Secure vault system for content storage and access control.',
    milestones: ['Architecture designed', 'Security model defined', 'API endpoints in progress', 'Testing pending'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'gestures', name: 'Gesture Interaction System', shortName: 'Gestures', docRef: 'Part 3',
    icon: <RiHandHeartLine className="w-5 h-5" />, progress: 45, status: 'on-track', category: 'product',
    details: 'Touch and gesture-based interaction patterns for the platform.',
    milestones: ['Gesture library defined', 'Prototype built', 'User testing pending', 'Integration pending'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'ux_map', name: 'UX Map & User Journeys', shortName: 'UX Map', docRef: 'Part 4',
    icon: <RiMapPinLine className="w-5 h-5" />, progress: 80, status: 'on-track', category: 'product',
    details: 'Complete user experience mapping and journey flow documentation.',
    milestones: ['User personas created', 'Journey maps completed', 'Wireframes done', 'Usability testing in progress'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'design', name: 'Design System', shortName: 'Design System', docRef: 'Part 5',
    icon: <RiPaletteLine className="w-5 h-5" />, progress: 70, status: 'on-track', category: 'product',
    details: 'Component library, visual language, and design tokens.',
    milestones: ['Design tokens set', 'Component library 70%', 'Responsive patterns defined', 'Dark mode pending'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'content', name: 'Content Architecture', shortName: 'Content Arch', docRef: 'Part 6',
    icon: <RiBookOpenLine className="w-5 h-5" />, progress: 55, status: 'on-track', category: 'product',
    details: 'Content structure, taxonomy, and delivery pipeline.',
    milestones: ['Taxonomy defined', 'Content models created', 'CMS integration in progress', 'Localization pending'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'events', name: 'Events & Ticketing Platform', shortName: 'Events', docRef: 'Part 7',
    icon: <RiCalendarEventLine className="w-5 h-5" />, progress: 40, status: 'at-risk', category: 'product',
    details: 'Event creation, discovery, ticketing, and management system.',
    milestones: ['Event model designed', 'Ticketing flow prototyped', 'Payment integration pending', 'Launch plan needed'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'monetization', name: 'Monetization Architecture', shortName: 'Monetization', docRef: 'Part 8',
    icon: <RiMoneyDollarCircleLine className="w-5 h-5" />, progress: 50, status: 'on-track', category: 'business',
    details: 'Revenue models, pricing strategy, and payment infrastructure.',
    milestones: ['Revenue models defined', 'Pricing tiers designed', 'Payment gateway integration pending', 'Analytics dashboard pending'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'technical', name: 'Technical Architecture', shortName: 'Tech Stack', docRef: 'Part 9',
    icon: <RiCodeSSlashLine className="w-5 h-5" />, progress: 60, status: 'on-track', category: 'technical',
    details: 'Core technical stack, infrastructure, and architecture decisions.',
    milestones: ['Stack selected', 'Infrastructure provisioned', 'CI/CD pipeline set', 'Scaling strategy pending'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'roadmap', name: 'Product Roadmap', shortName: 'Roadmap', docRef: 'Part 10',
    icon: <RiLineChartLine className="w-5 h-5" />, progress: 35, status: 'at-risk', category: 'business',
    details: 'Product milestones, sprint planning, and delivery timeline.',
    milestones: ['Q1 milestones set', 'Q2 in planning', 'Resource allocation needed', 'Dependencies mapping pending'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'data_intel', name: 'Data Intelligence System', shortName: 'Data Intel', docRef: 'Part 11',
    icon: <RiDatabase2Line className="w-5 h-5" />, progress: 30, status: 'behind', category: 'technical',
    details: 'Data pipeline, analytics engine, and intelligence layer.',
    milestones: ['Data models defined', 'Pipeline architecture designed', 'Implementation pending', 'ML models pending'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'creator_analytics', name: 'Creator & User Analytics', shortName: 'Analytics', docRef: 'Part 12',
    icon: <RiPieChartLine className="w-5 h-5" />, progress: 25, status: 'behind', category: 'technical',
    details: 'Creator dashboards, user behavior analytics, and insights.',
    milestones: ['Metrics defined', 'Dashboard mockups done', 'Backend tracking pending', 'Real-time analytics pending'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'partnerships', name: 'Strategic Partnerships', shortName: 'Partnerships', docRef: 'Part 14',
    icon: <RiTeamLine className="w-5 h-5" />, progress: 20, status: 'at-risk', category: 'business',
    details: 'Partnership strategy, outreach, and collaboration framework.',
    milestones: ['Target list created', 'Outreach templates ready', 'First meetings pending', 'Agreements pending'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'constitution', name: 'Hive Constitution & Governance', shortName: 'Constitution', docRef: 'Part 15',
    icon: <RiBookOpenLine className="w-5 h-5" />, progress: 90, status: 'on-track', category: 'operations',
    details: 'Platform governance, community rules, and moderation framework.',
    milestones: ['Constitution drafted', 'Community guidelines set', 'Moderation tools specced', 'Legal review pending'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'verification', name: 'Verification & Awards', shortName: 'Verification', docRef: 'Part 16',
    icon: <RiAwardLine className="w-5 h-5" />, progress: 35, status: 'on-track', category: 'product',
    details: 'User verification system, awards program, and ambassador network.',
    milestones: ['Verification tiers defined', 'Badge system designed', 'Ambassador program drafted', 'Implementation pending'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'operations', name: 'Company Operations', shortName: 'Operations', docRef: 'Part 17',
    icon: <RiBuildingLine className="w-5 h-5" />, progress: 55, status: 'on-track', category: 'operations',
    details: 'Organizational structure, processes, and operational workflows.',
    milestones: ['Org structure defined', 'Hiring plan created', 'Processes documented', 'Tools stack selected'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'ai_division', name: 'AI Division & Tools', shortName: 'AI Division', docRef: 'Part 19',
    icon: <RiRobot2Line className="w-5 h-5" />, progress: 45, status: 'on-track', category: 'technical',
    details: 'AI tooling, automation systems, and intelligent features.',
    milestones: ['AI strategy defined', 'Tool evaluation done', 'First integrations built', 'Advanced features pending'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'hais', name: 'HAIS (Hive AI System)', shortName: 'HAIS', docRef: 'Part 20',
    icon: <RiBrainLine className="w-5 h-5" />, progress: 30, status: 'at-risk', category: 'technical',
    details: 'Core AI system specifications and capabilities.',
    milestones: ['Specification drafted', 'Architecture designed', 'Prototype pending', 'Training pipeline pending'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'business_models', name: 'Business Models & Market Expansion', shortName: 'Business Models', docRef: 'Part 21',
    icon: <RiBarChartBoxLine className="w-5 h-5" />, progress: 40, status: 'on-track', category: 'business',
    details: 'Market analysis, expansion strategy, and business model validation.',
    milestones: ['Market research done', 'Business models defined', 'Financial projections drafted', 'Investor deck pending'], lastUpdated: new Date().toISOString()
  },
  {
    id: 'completion_map', name: 'Product Completion Map', shortName: 'Completion Map', docRef: 'Part 22',
    icon: <RiLayoutGridLine className="w-5 h-5" />, progress: 50, status: 'on-track', category: 'product',
    details: 'Overall product readiness tracking and feature completion status.',
    milestones: ['Feature inventory complete', 'Priority matrix set', 'Sprint allocation done', 'Launch readiness assessment pending'], lastUpdated: new Date().toISOString()
  },
]

const CATEGORIES = [
  { key: 'all', label: 'All Areas' },
  { key: 'product', label: 'Product' },
  { key: 'technical', label: 'Technical' },
  { key: 'business', label: 'Business' },
  { key: 'operations', label: 'Operations' },
]

export default function AnalyticsDashboard() {
  const [areas, setAreas] = useState<ProgressArea[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_ANALYTICS)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch { /* ignore */ }
    }
    return DEFAULT_AREAS
  })
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [aiInsight, setAiInsight] = useState<string | null>(null)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_ANALYTICS, JSON.stringify(areas)) } catch { /* ignore */ }
  }, [areas])

  const getOverallProgress = () => {
    const total = areas.reduce((sum, a) => sum + a.progress, 0)
    return Math.round(total / areas.length)
  }

  const getStatusCounts = () => {
    const counts: Record<string, number> = { 'completed': 0, 'on-track': 0, 'at-risk': 0, 'behind': 0, 'not-started': 0 }
    areas.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 })
    return counts
  }

  const getCategoryProgress = (cat: string) => {
    const catAreas = areas.filter(a => a.category === cat)
    if (catAreas.length === 0) return 0
    return Math.round(catAreas.reduce((s, a) => s + a.progress, 0) / catAreas.length)
  }

  const handleAskNyxAbout = useCallback(async (area: ProgressArea) => {
    setUpdatingId(area.id)
    setAiInsight(null)
    try {
      const result = await callAIAgent(
        `Based on ${area.docRef} - ${area.name}, give me a brief progress update. What are the key priorities, blockers, and next steps? Be specific and reference the documentation.`,
        AGENT_ID,
        { session_id: 'analytics_' + area.id }
      )
      const agentResult = result?.response?.result
      const text = agentResult?.response || extractText(result?.response) || 'No insight available.'
      setAiInsight(text)
      setExpandedId(area.id)
    } catch {
      setAiInsight('Failed to get insight from Nyx.')
    } finally {
      setUpdatingId(null)
    }
  }, [])

  const handleRefreshAll = useCallback(async () => {
    setLoading(true)
    setAiInsight(null)
    try {
      const result = await callAIAgent(
        'Based on all the Hive documentation (Parts 1-23), give me a brief executive summary of overall project progress. Which areas are on track, which are at risk, and what are the top 3 priorities right now? Format as a structured overview.',
        AGENT_ID,
        { session_id: 'analytics_refresh' }
      )
      const agentResult = result?.response?.result
      const text = agentResult?.response || extractText(result?.response) || 'No summary available.'
      setAiInsight(text)
      setExpandedId(null)
    } catch {
      setAiInsight('Failed to get project summary from Nyx.')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProgress = useCallback((id: string, newProgress: number) => {
    setAreas(prev => prev.map(a => {
      if (a.id !== id) return a
      let status: ProgressArea['status'] = 'on-track'
      if (newProgress >= 100) status = 'completed'
      else if (newProgress >= 60) status = 'on-track'
      else if (newProgress >= 30) status = 'at-risk'
      else if (newProgress > 0) status = 'behind'
      else status = 'not-started'
      return { ...a, progress: newProgress, status, lastUpdated: new Date().toISOString() }
    }))
  }, [])

  const statusCounts = getStatusCounts()
  const overallProgress = getOverallProgress()
  const filtered = filter === 'all' ? areas : areas.filter(a => a.category === filter)

  const progressColor = (p: number) => {
    if (p >= 80) return 'text-green-400'
    if (p >= 50) return 'text-blue-400'
    if (p >= 30) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <RiBarChartBoxLine className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Hive Analytics</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Progress across all {areas.length} documentation areas</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={loading}
            className="border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
          >
            {loading ? <RiLoader4Line className="w-4 h-4 mr-1 animate-spin" /> : <RiRefreshLine className="w-4 h-4 mr-1" />}
            {loading ? 'Analyzing...' : 'Ask Nyx for Summary'}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <Card className="bg-card border-border col-span-2 md:col-span-1">
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold ${progressColor(overallProgress)}`}>{overallProgress}%</p>
              <p className="text-xs text-muted-foreground mt-1">Overall Progress</p>
            </CardContent>
          </Card>
          {Object.entries(statusCounts).filter(([, c]) => c > 0).map(([status, count]) => (
            <Card key={status} className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${STATUS_STYLES[status]?.bg} ${STATUS_STYLES[status]?.text}`} style={{ boxShadow: status === 'completed' ? '0 0 6px rgba(74,222,128,0.5)' : undefined }}>
                  <div className={`w-3 h-3 rounded-full ${status === 'completed' ? 'bg-green-400' : status === 'on-track' ? 'bg-blue-400' : status === 'at-risk' ? 'bg-yellow-400' : status === 'behind' ? 'bg-red-400' : 'bg-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground">{STATUS_STYLES[status]?.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {['product', 'technical', 'business', 'operations'].map(cat => (
            <Card key={cat} className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground capitalize">{cat}</p>
                  <span className={`text-sm font-bold ${progressColor(getCategoryProgress(cat))}`}>{getCategoryProgress(cat)}%</span>
                </div>
                <Progress value={getCategoryProgress(cat)} className="h-1.5" />
              </CardContent>
            </Card>
          ))}
        </div>

        {aiInsight && !expandedId && (
          <Card className="bg-card border-primary/30 shadow-[0_4px_20px_rgba(139,92,246,0.1)] mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <RiRobot2Line className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Nyx Executive Summary</p>
              </div>
              <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{aiInsight}</div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filter === cat.key ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-border" />

      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-3">
          {filtered.sort((a, b) => b.progress - a.progress).map(area => {
            const style = STATUS_STYLES[area.status]
            const isExpanded = expandedId === area.id
            return (
              <Card key={area.id} className="bg-card border-border hover:border-primary/20 transition-all duration-200 shadow-[0_2px_10px_rgba(139,92,246,0.05)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 text-muted-foreground">
                      {area.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-foreground truncate">{area.name}</h3>
                        <Badge variant="secondary" className={`text-xs border-0 ${style.bg} ${style.text}`}>{style.label}</Badge>
                        <Badge variant="outline" className="text-xs border-border text-muted-foreground">{area.docRef}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{area.details}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${progressColor(area.progress)}`}>{area.progress}%</p>
                      </div>
                      <div className="w-24">
                        <Progress value={area.progress} className="h-2" />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateProgress(area.id, Math.min(100, area.progress + 5))}
                          className="p-1 rounded text-muted-foreground hover:text-green-400 hover:bg-green-400/10 transition-colors"
                          title="Increase progress"
                        >
                          <RiArrowUpSLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateProgress(area.id, Math.max(0, area.progress - 5))}
                          className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Decrease progress"
                        >
                          <RiArrowDownSLine className="w-4 h-4" />
                        </button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (isExpanded) { setExpandedId(null); setAiInsight(null) }
                          else handleAskNyxAbout(area)
                        }}
                        disabled={updatingId === area.id}
                        className="h-8 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        {updatingId === area.id ? (
                          <RiLoader4Line className="w-3.5 h-3.5 animate-spin" />
                        ) : isExpanded ? (
                          <RiArrowRightSLine className="w-3.5 h-3.5 rotate-90" />
                        ) : (
                          <RiRobot2Line className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && aiInsight && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <RiRobot2Line className="w-3.5 h-3.5 text-primary" />
                        <p className="text-xs font-semibold text-primary">Nyx Insight</p>
                      </div>
                      <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-secondary/30 rounded-xl p-3">
                        {aiInsight}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 flex-wrap">
                    {area.milestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        {i < Math.ceil(area.milestones.length * (area.progress / 100)) ? (
                          <RiCheckboxCircleLine className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        ) : (
                          <RiTimeLine className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={i < Math.ceil(area.milestones.length * (area.progress / 100)) ? 'text-foreground/70 line-through' : 'text-muted-foreground'}>
                          {m}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
