'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  RiMessage3Line,
  RiDatabase2Line,
  RiHistoryLine,
  RiPushpinLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiLogoutBoxRLine,
  RiHexagonLine,
  RiSpyLine,
  RiBarChartBoxLine,
  RiCalendarEventLine,
} from 'react-icons/ri'

export type ViewType = 'chat' | 'knowledge' | 'history' | 'pinned' | 'rivals' | 'analytics' | 'events'

interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  collapsed: boolean
  onToggleCollapse: () => void
  onLogout: () => void
}

const navItems: { view: ViewType; label: string; icon: React.ReactNode }[] = [
  { view: 'chat', label: 'Dashboard', icon: <RiMessage3Line className="w-5 h-5" /> },
  { view: 'analytics', label: 'Analytics', icon: <RiBarChartBoxLine className="w-5 h-5" /> },
  { view: 'events', label: 'Events', icon: <RiCalendarEventLine className="w-5 h-5" /> },
  { view: 'rivals', label: 'Rival Intel', icon: <RiSpyLine className="w-5 h-5" /> },
  { view: 'knowledge', label: 'Knowledge Base', icon: <RiDatabase2Line className="w-5 h-5" /> },
  { view: 'history', label: 'History', icon: <RiHistoryLine className="w-5 h-5" /> },
  { view: 'pinned', label: 'Pinned', icon: <RiPushpinLine className="w-5 h-5" /> },
]

export default function Sidebar({ activeView, onViewChange, collapsed, onToggleCollapse, onLogout }: SidebarProps) {
  return (
    <div className={`h-screen flex flex-col bg-[hsl(231,18%,12%)] border-r border-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
          <RiHexagonLine className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">HIVE</h1>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
            <span className="text-xs text-muted-foreground">Nyx Online</span>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center pb-3">
          <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
        </div>
      )}

      <Separator className="bg-border" />

      <nav className="flex-1 p-2 space-y-1 mt-2">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeView === item.view ? 'bg-primary/20 text-primary shadow-[0_0_12px_rgba(139,92,246,0.15)]' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'} ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-2 space-y-1">
        <Separator className="bg-border mb-2" />
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <RiMenuUnfoldLine className="w-5 h-5 mx-auto" /> : (
            <>
              <RiMenuFoldLine className="w-5 h-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
          title={collapsed ? 'Logout' : undefined}
        >
          {collapsed ? <RiLogoutBoxRLine className="w-5 h-5 mx-auto" /> : (
            <>
              <RiLogoutBoxRLine className="w-5 h-5" />
              <span>Logout</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
