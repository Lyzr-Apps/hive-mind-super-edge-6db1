'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { crawlWebsite } from '@/lib/ragKnowledgeBase'
import {
  RiSpyLine,
  RiGlobalLine,
  RiRefreshLine,
  RiLoader4Line,
  RiCheckLine,
  RiCloseLine,
  RiAddLine,
  RiDeleteBinLine,
  RiExternalLinkLine,
  RiEyeLine,
  RiTimeLine,
  RiSignalWifiLine,
} from 'react-icons/ri'
import {
  RiTiktokFill,
  RiInstagramFill,
  RiLinkedinFill,
  RiSpotifyFill,
  RiDiscordFill,
  RiTwitchFill,
  RiTwitterXFill,
  RiWhatsappFill,
  RiSnapchatFill,
  RiNetflixFill,
  RiYoutubeFill,
} from 'react-icons/ri'

const RAG_ID = '69a3022d00c2d274880f7f58'
const STORAGE_KEY_RIVALS = 'hive_rival_platforms'

export interface RivalPlatform {
  id: string
  name: string
  url: string
  icon: string
  category: 'social' | 'music' | 'events' | 'messaging' | 'entertainment' | 'community'
  status: 'active' | 'crawling' | 'pending' | 'error'
  lastCrawled?: string
  color: string
}

const DEFAULT_RIVALS: RivalPlatform[] = [
  { id: 'tiktok', name: 'TikTok', url: 'https://www.tiktok.com', icon: 'tiktok', category: 'social', status: 'active', lastCrawled: new Date().toISOString(), color: '#000000' },
  { id: 'instagram', name: 'Instagram', url: 'https://www.instagram.com', icon: 'instagram', category: 'social', status: 'active', lastCrawled: new Date().toISOString(), color: '#E4405F' },
  { id: 'linkedin', name: 'LinkedIn', url: 'https://www.linkedin.com', icon: 'linkedin', category: 'social', status: 'active', lastCrawled: new Date().toISOString(), color: '#0A66C2' },
  { id: 'spotify', name: 'Spotify', url: 'https://www.spotify.com', icon: 'spotify', category: 'music', status: 'active', lastCrawled: new Date().toISOString(), color: '#1DB954' },
  { id: 'deezer', name: 'Deezer', url: 'https://www.deezer.com', icon: 'deezer', category: 'music', status: 'active', lastCrawled: new Date().toISOString(), color: '#A238FF' },
  { id: 'eventbrite', name: 'Eventbrite', url: 'https://www.eventbrite.com', icon: 'eventbrite', category: 'events', status: 'active', lastCrawled: new Date().toISOString(), color: '#F05537' },
  { id: 'ticketmaster', name: 'Ticketmaster', url: 'https://www.ticketmaster.com', icon: 'ticketmaster', category: 'events', status: 'active', lastCrawled: new Date().toISOString(), color: '#026CDF' },
  { id: 'discord', name: 'Discord', url: 'https://www.discord.com', icon: 'discord', category: 'community', status: 'active', lastCrawled: new Date().toISOString(), color: '#5865F2' },
  { id: 'twitch', name: 'Twitch', url: 'https://www.twitch.tv', icon: 'twitch', category: 'entertainment', status: 'active', lastCrawled: new Date().toISOString(), color: '#9146FF' },
  { id: 'x', name: 'X (Twitter)', url: 'https://www.x.com', icon: 'x', category: 'social', status: 'active', lastCrawled: new Date().toISOString(), color: '#000000' },
  { id: 'whatsapp', name: 'WhatsApp', url: 'https://www.whatsapp.com', icon: 'whatsapp', category: 'messaging', status: 'active', lastCrawled: new Date().toISOString(), color: '#25D366' },
  { id: 'snapchat', name: 'Snapchat', url: 'https://www.snapchat.com', icon: 'snapchat', category: 'social', status: 'active', lastCrawled: new Date().toISOString(), color: '#FFFC00' },
  { id: 'netflix', name: 'Netflix', url: 'https://www.netflix.com', icon: 'netflix', category: 'entertainment', status: 'active', lastCrawled: new Date().toISOString(), color: '#E50914' },
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com', icon: 'youtube', category: 'entertainment', status: 'active', lastCrawled: new Date().toISOString(), color: '#FF0000' },
  { id: 'bbc_iplayer', name: 'BBC iPlayer', url: 'https://www.bbc.co.uk/iplayer', icon: 'bbc', category: 'entertainment', status: 'active', lastCrawled: new Date().toISOString(), color: '#FF4C98' },
]

const CATEGORY_COLORS: Record<string, string> = {
  social: 'bg-blue-500/10 text-blue-400',
  music: 'bg-green-500/10 text-green-400',
  events: 'bg-orange-500/10 text-orange-400',
  messaging: 'bg-emerald-500/10 text-emerald-400',
  entertainment: 'bg-red-500/10 text-red-400',
  community: 'bg-indigo-500/10 text-indigo-400',
}

function getPlatformIcon(iconKey: string, className: string) {
  switch (iconKey) {
    case 'tiktok': return <RiTiktokFill className={className} />
    case 'instagram': return <RiInstagramFill className={className} />
    case 'linkedin': return <RiLinkedinFill className={className} />
    case 'spotify': return <RiSpotifyFill className={className} />
    case 'discord': return <RiDiscordFill className={className} />
    case 'twitch': return <RiTwitchFill className={className} />
    case 'x': return <RiTwitterXFill className={className} />
    case 'whatsapp': return <RiWhatsappFill className={className} />
    case 'snapchat': return <RiSnapchatFill className={className} />
    case 'netflix': return <RiNetflixFill className={className} />
    case 'youtube': return <RiYoutubeFill className={className} />
    default: return <RiGlobalLine className={className} />
  }
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function RivalTracker() {
  const [platforms, setPlatforms] = useState<RivalPlatform[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_RIVALS)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch { /* ignore */ }
    }
    return DEFAULT_RIVALS
  })
  const [crawlingId, setCrawlingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newCategory, setNewCategory] = useState<RivalPlatform['category']>('social')
  const [filter, setFilter] = useState<string>('all')

  const savePlatforms = useCallback((updated: RivalPlatform[]) => {
    setPlatforms(updated)
    try { localStorage.setItem(STORAGE_KEY_RIVALS, JSON.stringify(updated)) } catch { /* ignore */ }
  }, [])

  const handleRecrawl = useCallback(async (platform: RivalPlatform) => {
    setCrawlingId(platform.id)
    setError('')
    setSuccess('')
    try {
      const result = await crawlWebsite(RAG_ID, platform.url)
      if (result.success) {
        const updated = platforms.map((p) =>
          p.id === platform.id ? { ...p, status: 'active' as const, lastCrawled: new Date().toISOString() } : p
        )
        savePlatforms(updated)
        setSuccess(`Re-crawled ${platform.name} successfully. Nyx knowledge updated.`)
        setTimeout(() => setSuccess(''), 4000)
      } else {
        setError(result.error || `Failed to crawl ${platform.name}`)
        setTimeout(() => setError(''), 4000)
      }
    } catch {
      setError(`Failed to crawl ${platform.name}`)
      setTimeout(() => setError(''), 4000)
    } finally {
      setCrawlingId(null)
    }
  }, [platforms, savePlatforms])

  const handleRecrawlAll = useCallback(async () => {
    setError('')
    setSuccess('')
    setCrawlingId('all')
    let successCount = 0
    for (const platform of platforms) {
      try {
        const result = await crawlWebsite(RAG_ID, platform.url)
        if (result.success) successCount++
      } catch { /* continue */ }
    }
    const updated = platforms.map((p) => ({ ...p, status: 'active' as const, lastCrawled: new Date().toISOString() }))
    savePlatforms(updated)
    setCrawlingId(null)
    setSuccess(`Re-crawled ${successCount}/${platforms.length} platforms. Nyx intel updated.`)
    setTimeout(() => setSuccess(''), 5000)
  }, [platforms, savePlatforms])

  const handleAddPlatform = useCallback(async () => {
    if (!newName.trim() || !newUrl.trim()) return
    let url = newUrl.trim()
    if (!url.startsWith('http')) url = 'https://' + url

    const newPlatform: RivalPlatform = {
      id: generateId(),
      name: newName.trim(),
      url,
      icon: 'global',
      category: newCategory,
      status: 'crawling',
      color: '#8B5CF6',
    }

    const updated = [...platforms, newPlatform]
    savePlatforms(updated)
    setShowAddForm(false)
    setNewName('')
    setNewUrl('')
    setCrawlingId(newPlatform.id)

    try {
      const result = await crawlWebsite(RAG_ID, url)
      if (result.success) {
        const final = updated.map((p) =>
          p.id === newPlatform.id ? { ...p, status: 'active' as const, lastCrawled: new Date().toISOString() } : p
        )
        savePlatforms(final)
        setSuccess(`${newPlatform.name} added and crawled into Nyx knowledge base.`)
        setTimeout(() => setSuccess(''), 4000)
      } else {
        const final = updated.map((p) =>
          p.id === newPlatform.id ? { ...p, status: 'error' as const } : p
        )
        savePlatforms(final)
        setError(`Added ${newPlatform.name} but crawl failed: ${result.error || 'Unknown error'}`)
        setTimeout(() => setError(''), 4000)
      }
    } catch {
      setError(`Added ${newPlatform.name} but crawl failed.`)
      setTimeout(() => setError(''), 4000)
    } finally {
      setCrawlingId(null)
    }
  }, [newName, newUrl, newCategory, platforms, savePlatforms])

  const handleRemovePlatform = useCallback((id: string) => {
    const updated = platforms.filter((p) => p.id !== id)
    savePlatforms(updated)
    setSuccess('Platform removed from tracker.')
    setTimeout(() => setSuccess(''), 3000)
  }, [platforms, savePlatforms])

  const categories = ['all', 'social', 'music', 'events', 'messaging', 'entertainment', 'community']
  const filtered = filter === 'all' ? platforms : platforms.filter((p) => p.category === filter)
  const activeCount = platforms.filter((p) => p.status === 'active').length

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <RiSpyLine className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Rival Intelligence</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {activeCount}/{platforms.length} platforms tracked
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecrawlAll}
              disabled={crawlingId === 'all'}
              className="border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
            >
              {crawlingId === 'all' ? (
                <RiLoader4Line className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RiRefreshLine className="w-4 h-4 mr-1" />
              )}
              {crawlingId === 'all' ? 'Crawling All...' : 'Re-crawl All'}
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_12px_rgba(139,92,246,0.25)]"
            >
              <RiAddLine className="w-4 h-4 mr-1" />
              Add Platform
            </Button>
          </div>
        </div>

        {showAddForm && (
          <Card className="bg-card border-border shadow-[0_4px_20px_rgba(139,92,246,0.1)] mb-4">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Add New Rival Platform</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Platform name (e.g. Clubhouse)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
                <Input
                  placeholder="URL (e.g. https://clubhouse.com)"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as RivalPlatform['category'])}
                  className="bg-input border border-border text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="social">Social</option>
                  <option value="music">Music</option>
                  <option value="events">Events</option>
                  <option value="messaging">Messaging</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="community">Community</option>
                </select>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleAddPlatform}
                  disabled={!newName.trim() || !newUrl.trim() || !!crawlingId}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <RiAddLine className="w-4 h-4 mr-1" />
                  Add & Crawl
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowAddForm(false); setNewName(''); setNewUrl('') }}
                  className="border-border text-muted-foreground"
                >
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
            <RiCheckLine className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filter === cat
                  ? 'bg-primary/20 text-primary'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              {cat === 'all' ? `All (${platforms.length})` : `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${platforms.filter(p => p.category === cat).length})`}
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-border" />

      <ScrollArea className="flex-1 px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((platform) => (
            <Card
              key={platform.id}
              className="bg-card border-border hover:border-primary/30 transition-all duration-200 shadow-[0_2px_10px_rgba(139,92,246,0.08)] group"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: platform.color + '20' }}
                    >
                      {getPlatformIcon(platform.icon, 'w-5 h-5')}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{platform.name}</h3>
                      <Badge
                        variant="secondary"
                        className={`text-xs border-0 mt-0.5 ${CATEGORY_COLORS[platform.category] || 'bg-secondary text-muted-foreground'}`}
                      >
                        {platform.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      platform.status === 'active' ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]' :
                      platform.status === 'crawling' ? 'bg-yellow-400 animate-pulse' :
                      platform.status === 'error' ? 'bg-red-400' : 'bg-muted-foreground'
                    }`} />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5 truncate">
                  <RiGlobalLine className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{platform.url}</span>
                </div>

                {platform.lastCrawled && (
                  <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                    <RiTimeLine className="w-3 h-3 flex-shrink-0" />
                    <span>Last crawled: {new Date(platform.lastCrawled).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}

                <Separator className="bg-border mb-3" />

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRecrawl(platform)}
                    disabled={crawlingId === platform.id || crawlingId === 'all'}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 flex-1"
                  >
                    {crawlingId === platform.id ? (
                      <RiLoader4Line className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <RiRefreshLine className="w-3 h-3 mr-1" />
                    )}
                    {crawlingId === platform.id ? 'Crawling...' : 'Re-crawl'}
                  </Button>
                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary inline-flex items-center gap-1 rounded-md transition-colors"
                  >
                    <RiExternalLinkLine className="w-3 h-3" />
                    Visit
                  </a>
                  {!DEFAULT_RIVALS.find((d) => d.id === platform.id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePlatform(platform.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <RiDeleteBinLine className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <RiEyeLine className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-1">No platforms in this category</h3>
            <p className="text-sm text-muted-foreground">Switch categories or add a new platform.</p>
          </div>
        )}

        <Card className="bg-card/50 border-border mt-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <RiSignalWifiLine className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Nyx Rival Intelligence</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All crawled data feeds directly into your Knowledge Base. Ask Nyx to compare features, analyze strategies, or monitor changes across any tracked platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </ScrollArea>
    </div>
  )
}
