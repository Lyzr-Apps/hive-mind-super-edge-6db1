'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { callAIAgent, extractText } from '@/lib/aiAgent'
import {
  RiCalendarEventLine,
  RiSearchLine,
  RiRefreshLine,
  RiLoader4Line,
  RiMapPinLine,
  RiTimeLine,
  RiStarLine,
  RiStarFill,
  RiLightbulbLine,
  RiRobot2Line,
  RiArrowRightSLine,
  RiAddLine,
  RiDeleteBinLine,
  RiExternalLinkLine,
  RiTicketLine,
  RiMusicLine,
  RiGlobalLine,
  RiGroupLine,
  RiMegaphoneLine,
  RiComputerLine,
  RiCloseLine,
} from 'react-icons/ri'

const AGENT_ID = '69a3026a0df1e4d737281da1'
const STORAGE_KEY_EVENTS = 'hive_events_tracker'

export interface TrackedEvent {
  id: string
  name: string
  date: string
  location: string
  category: 'music' | 'tech' | 'entertainment' | 'business' | 'community' | 'sports'
  platform: string
  url: string
  opportunity: string
  priority: 'high' | 'medium' | 'low'
  starred: boolean
  aiAnalysis?: string
  createdAt: string
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  music: <RiMusicLine className="w-4 h-4" />,
  tech: <RiComputerLine className="w-4 h-4" />,
  entertainment: <RiTicketLine className="w-4 h-4" />,
  business: <RiMegaphoneLine className="w-4 h-4" />,
  community: <RiGroupLine className="w-4 h-4" />,
  sports: <RiGlobalLine className="w-4 h-4" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  music: 'bg-green-500/10 text-green-400',
  tech: 'bg-blue-500/10 text-blue-400',
  entertainment: 'bg-pink-500/10 text-pink-400',
  business: 'bg-orange-500/10 text-orange-400',
  community: 'bg-purple-500/10 text-purple-400',
  sports: 'bg-cyan-500/10 text-cyan-400',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-muted text-muted-foreground border-border',
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const SAMPLE_EVENTS: TrackedEvent[] = [
  {
    id: 'evt1', name: 'SXSW 2026', date: '2026-03-13', location: 'Austin, TX',
    category: 'tech', platform: 'Eventbrite', url: 'https://www.sxsw.com',
    opportunity: 'Major exposure opportunity for Hive\'s creator tools. Potential partnership announcements and press coverage. Target: 500+ creator signups.',
    priority: 'high', starred: true, createdAt: new Date().toISOString()
  },
  {
    id: 'evt2', name: 'Web Summit 2026', date: '2026-11-04', location: 'Lisbon, Portugal',
    category: 'tech', platform: 'Ticketmaster', url: 'https://websummit.com',
    opportunity: 'Investor networking, B2B partnerships, and media exposure. Pitch competition entry could drive funding interest.',
    priority: 'high', starred: true, createdAt: new Date().toISOString()
  },
  {
    id: 'evt3', name: 'Glastonbury Festival 2026', date: '2026-06-24', location: 'Somerset, UK',
    category: 'music', platform: 'Ticketmaster', url: 'https://www.glastonburyfestivals.co.uk',
    opportunity: 'Massive audience for Hive\'s ticketing and events platform. Live streaming partnership potential. Brand presence via digital integration.',
    priority: 'medium', starred: false, createdAt: new Date().toISOString()
  },
  {
    id: 'evt4', name: 'TwitchCon 2026', date: '2026-09-20', location: 'San Diego, CA',
    category: 'entertainment', platform: 'Discord', url: 'https://www.twitchcon.com',
    opportunity: 'Creator acquisition event. Target streamers and content creators for Hive platform onboarding. Community building opportunity.',
    priority: 'medium', starred: false, createdAt: new Date().toISOString()
  },
  {
    id: 'evt5', name: 'Afro Nation 2026', date: '2026-07-03', location: 'Porto, Portugal',
    category: 'music', platform: 'Eventbrite', url: 'https://afronation.com',
    opportunity: 'Key market for Hive\'s music and creator ecosystem. Partnership with organizers for ticketing integration. Cultural alignment with Hive brand.',
    priority: 'high', starred: true, createdAt: new Date().toISOString()
  },
]

export default function EventsTracker() {
  const [events, setEvents] = useState<TrackedEvent[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_EVENTS)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch { /* ignore */ }
    }
    return SAMPLE_EVENTS
  })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Add form state
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newCategory, setNewCategory] = useState<TrackedEvent['category']>('tech')
  const [newUrl, setNewUrl] = useState('')
  const [newPriority, setNewPriority] = useState<TrackedEvent['priority']>('medium')

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events)) } catch { /* ignore */ }
  }, [events])

  const handleScanForEvents = useCallback(async () => {
    setScanning(true)
    setError('')
    setSuccess('')
    try {
      const result = await callAIAgent(
        'Based on the Hive documentation (especially Part 7 Events & Ticketing, Part 8 Monetization, Part 14 Strategic Partnerships, and Part 21 Business Models), identify 5 upcoming real-world events happening in the next 6-12 months that present strategic opportunities for Hive. For each event, provide: the event name, approximate date, location, category (music/tech/entertainment/business/community), and a brief explanation of the specific opportunity it presents for Hive. Focus on events in music, tech conferences, creator economy summits, and entertainment industry gatherings. Format each as: EVENT_NAME | DATE | LOCATION | CATEGORY | OPPORTUNITY',
        AGENT_ID,
        { session_id: 'events_scan_' + Date.now() }
      )
      const agentResult = result?.response?.result
      const text = agentResult?.response || extractText(result?.response) || ''
      if (text) {
        setSuccess('Nyx has scanned for events. Review the opportunities below and add any that interest you via the chat interface.')
        setTimeout(() => setSuccess(''), 5000)
      }
    } catch {
      setError('Failed to scan for events.')
      setTimeout(() => setError(''), 4000)
    } finally {
      setScanning(false)
    }
  }, [])

  const handleAnalyzeEvent = useCallback(async (event: TrackedEvent) => {
    setAnalyzingId(event.id)
    try {
      const result = await callAIAgent(
        `Analyze this event for Hive: "${event.name}" on ${event.date} in ${event.location} (${event.category}). Based on the Hive documentation, provide: 1) Specific partnership opportunities, 2) Revenue potential, 3) Creator acquisition strategy, 4) Competitive intelligence (which rivals might be present), 5) Recommended Hive presence (booth, sponsorship, digital integration, etc). Be specific and actionable.`,
        AGENT_ID,
        { session_id: 'events_analyze_' + event.id }
      )
      const agentResult = result?.response?.result
      const analysis = agentResult?.response || extractText(result?.response) || 'No analysis available.'
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, aiAnalysis: analysis } : e))
      setExpandedId(event.id)
    } catch {
      setError('Failed to analyze event.')
      setTimeout(() => setError(''), 4000)
    } finally {
      setAnalyzingId(null)
    }
  }, [])

  const handleAddEvent = useCallback(() => {
    if (!newName.trim() || !newDate) return
    const evt: TrackedEvent = {
      id: generateId(),
      name: newName.trim(),
      date: newDate,
      location: newLocation.trim() || 'TBD',
      category: newCategory,
      platform: 'Manual',
      url: newUrl.trim() || '',
      opportunity: '',
      priority: newPriority,
      starred: false,
      createdAt: new Date().toISOString(),
    }
    setEvents(prev => [...prev, evt])
    setShowAddForm(false)
    setNewName(''); setNewDate(''); setNewLocation(''); setNewUrl('')
    setSuccess('Event added to tracker.')
    setTimeout(() => setSuccess(''), 3000)
  }, [newName, newDate, newLocation, newCategory, newUrl, newPriority])

  const handleDelete = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }, [])

  const handleToggleStar = useCallback((id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e))
  }, [])

  const categories = ['all', 'music', 'tech', 'entertainment', 'business', 'community', 'sports']
  const filtered = events
    .filter(e => filter === 'all' || e.category === filter)
    .filter(e => !search.trim() || e.name.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.starred !== b.starred) return a.starred ? -1 : 1
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

  const upcomingCount = events.filter(e => new Date(e.date) > new Date()).length
  const highPriorityCount = events.filter(e => e.priority === 'high').length

  const getDaysUntil = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 'Past'
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Tomorrow'
    if (diff <= 7) return `${diff} days`
    if (diff <= 30) return `${Math.ceil(diff / 7)} weeks`
    return `${Math.ceil(diff / 30)} months`
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <RiCalendarEventLine className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Events Tracker</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {upcomingCount} upcoming -- {highPriorityCount} high priority
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleScanForEvents}
              disabled={scanning}
              className="border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
            >
              {scanning ? <RiLoader4Line className="w-4 h-4 mr-1 animate-spin" /> : <RiRobot2Line className="w-4 h-4 mr-1" />}
              {scanning ? 'Scanning...' : 'Nyx Scan'}
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_12px_rgba(139,92,246,0.25)]"
            >
              <RiAddLine className="w-4 h-4 mr-1" />
              Add Event
            </Button>
          </div>
        </div>

        {showAddForm && (
          <Card className="bg-card border-border shadow-[0_4px_20px_rgba(139,92,246,0.1)] mb-4">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Add New Event</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <Input
                  placeholder="Event name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
                <Input
                  placeholder="Location (e.g. London, UK)"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TrackedEvent['category'])}
                  className="bg-input border border-border text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="tech">Tech</option>
                  <option value="music">Music</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="business">Business</option>
                  <option value="community">Community</option>
                  <option value="sports">Sports</option>
                </select>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TrackedEvent['priority'])}
                  className="bg-input border border-border text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <Input
                  placeholder="Event URL (optional)"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddEvent} disabled={!newName.trim() || !newDate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <RiAddLine className="w-4 h-4 mr-1" />
                  Add Event
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)} className="border-border text-muted-foreground">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2">
            <RiCloseLine className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
            <RiLightbulbLine className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filter === cat ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat !== 'all' && CATEGORY_ICONS[cat]}
              {cat === 'all' ? `All (${events.length})` : `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${events.filter(e => e.category === cat).length})`}
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-border" />

      <ScrollArea className="flex-1 px-6 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <RiCalendarEventLine className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-1">No events found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {search ? 'Try a different search.' : 'Add events manually or use Nyx Scan to discover opportunities.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(event => {
              const isExpanded = expandedId === event.id
              const daysUntil = getDaysUntil(event.date)
              const isPast = daysUntil === 'Past'
              return (
                <Card
                  key={event.id}
                  className={`bg-card border-border hover:border-primary/20 transition-all duration-200 shadow-[0_2px_10px_rgba(139,92,246,0.05)] ${isPast ? 'opacity-60' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isPast ? 'bg-muted' : 'bg-primary/10'}`}>
                        <span className={`text-lg font-bold ${isPast ? 'text-muted-foreground' : 'text-primary'}`}>
                          {new Date(event.date).getDate()}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase">
                          {new Date(event.date).toLocaleString('en-GB', { month: 'short' })}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-semibold text-foreground">{event.name}</h3>
                          <Badge variant="secondary" className={`text-xs border-0 ${CATEGORY_COLORS[event.category]}`}>
                            {event.category}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[event.priority]}`}>
                            {event.priority}
                          </Badge>
                          {!isPast && (
                            <span className="text-xs text-muted-foreground font-mono">{daysUntil}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <RiMapPinLine className="w-3 h-3" /> {event.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <RiTimeLine className="w-3 h-3" /> {new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>

                        {event.opportunity && (
                          <div className="flex items-start gap-2 mt-2 p-2.5 bg-secondary/30 rounded-lg">
                            <RiLightbulbLine className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-foreground/80 leading-relaxed">{event.opportunity}</p>
                          </div>
                        )}

                        {isExpanded && event.aiAnalysis && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <RiRobot2Line className="w-3.5 h-3.5 text-primary" />
                              <p className="text-xs font-semibold text-primary">Nyx Strategic Analysis</p>
                            </div>
                            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-secondary/30 rounded-xl p-3">
                              {event.aiAnalysis}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleToggleStar(event.id)}
                          className={`p-1.5 rounded-lg transition-colors ${event.starred ? 'text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'}`}
                          title={event.starred ? 'Unstar' : 'Star'}
                        >
                          {event.starred ? <RiStarFill className="w-4 h-4" /> : <RiStarLine className="w-4 h-4" />}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (isExpanded) setExpandedId(null)
                            else handleAnalyzeEvent(event)
                          }}
                          disabled={analyzingId === event.id}
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Analyze with Nyx"
                        >
                          {analyzingId === event.id ? (
                            <RiLoader4Line className="w-3.5 h-3.5 animate-spin" />
                          ) : isExpanded ? (
                            <RiArrowRightSLine className="w-3.5 h-3.5 rotate-90" />
                          ) : (
                            <RiRobot2Line className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        {event.url && (
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            title="Visit event"
                          >
                            <RiExternalLinkLine className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove"
                        >
                          <RiDeleteBinLine className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <Card className="bg-card/50 border-border mt-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <RiLightbulbLine className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Event Opportunities</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click the Nyx icon on any event for a deep strategic analysis. Use "Nyx Scan" to discover new events aligned with Hive's strategy from Parts 7, 8, 14, and 21.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </ScrollArea>
    </div>
  )
}
