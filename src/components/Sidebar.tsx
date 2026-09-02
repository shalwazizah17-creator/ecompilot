'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Clock,
  ShieldCheck,
  TrendingUp,
  Database,
  ChevronDown,
  ChevronRight,
  Wallet,
  Users,
  Search,
  Sparkles,
  Target,
  BarChart3,
  BookOpen,
  Bot,
  HardDrive,
  LogOut,
  Zap,
} from 'lucide-react'

type NavItem = {
  name: string
  href?: string
  icon?: any
  children?: { name: string; href: string; icon?: any }[]
}

const navTree: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Decision History', href: '/decision-history', icon: Clock },
  {
    name: 'Intelligence',
    icon: ShieldCheck,
    children: [
      { name: 'Margin Protection', href: '/margin-protection', icon: ShieldCheck },
      { name: 'Competitor Intelligence', href: '/competitors', icon: BarChart3 },
      { name: 'Inventory Intelligence', href: '/inventory-intelligence', icon: BookOpen },
      { name: 'Customer Intelligence', href: '/customer-intelligence', icon: Users },
    ],
  },
  {
    name: 'Growth',
    icon: TrendingUp,
    children: [
      { name: 'Budget Manager', href: '/budget', icon: Wallet },
      { name: 'Affiliate Intelligence', href: '/affiliate', icon: Users },
      { name: 'Affiliate Discovery', href: '/affiliate/discovery', icon: Search },
      { name: 'AI Advisor', href: '/marketing-advisor', icon: Bot },
    ],
  },
  {
    name: 'Data',
    icon: Database,
    children: [
      { name: 'Data Sources', href: '/data-sources', icon: HardDrive },
      { name: 'Business Targets', href: '/settings/targets', icon: Target },
    ],
  },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Intelligence', 'Growth', 'Data'])

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'EP'

  return (
    <aside
      style={{
        width: '248px',
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* LOGO */}
      <div
        style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid var(--sidebar-border)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
              flexShrink: 0,
            }}
          >
            <Zap size={15} color="white" fill="white" />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: '1.05rem',
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
            }}
          >
            Ecom<span style={{ color: 'var(--primary)' }}>Pilot</span>
          </span>
        </div>
      </div>

      {/* NAV */}
      <nav
        style={{
          flex: 1,
          padding: '10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
        }}
      >
        {navTree.map((item) => {
          if (item.children) {
            const isExpanded = expandedGroups.includes(item.name)
            const hasActiveChild = item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'))

            return (
              <div key={item.name} style={{ marginBottom: '2px' }}>
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(item.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    color: hasActiveChild ? 'var(--primary)' : 'var(--text-muted)',
                    backgroundColor: 'transparent',
                    fontWeight: 600,
                    fontSize: '0.7875rem',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    transition: 'color 0.15s ease, background-color 0.15s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = hasActiveChild ? 'var(--primary)' : 'var(--text-muted)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.icon && <item.icon size={14} />}
                    {item.name}
                  </div>
                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>

                {/* Children */}
                {isExpanded && (
                  <div style={{ paddingLeft: '8px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    {item.children.map((child) => {
                      const isActive = pathname === child.href
                      const ChildIcon = child.icon
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onNavigate}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '9px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            color: isActive ? 'var(--sidebar-active-text)' : 'var(--text-secondary)',
                            backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                            fontWeight: isActive ? 600 : 450,
                            fontSize: '0.875rem',
                            transition: 'all 0.12s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'
                              e.currentTarget.style.color = 'var(--text-primary)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = 'var(--text-secondary)'
                            }
                          }}
                        >
                          {ChildIcon && (
                            <ChildIcon
                              size={15}
                              style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }}
                            />
                          )}
                          {child.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          // Top-level single link
          const isActive = pathname === item.href
          const ItemIcon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href!}
              onClick={onNavigate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 10px',
                borderRadius: '8px',
                color: isActive ? 'var(--sidebar-active-text)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                fontWeight: isActive ? 600 : 450,
                fontSize: '0.875rem',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              {ItemIcon && (
                <ItemIcon
                  size={16}
                  style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }}
                />
              )}
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* USER FOOTER */}
      {session?.user && (
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--sidebar-border)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.7rem',
                flexShrink: 0,
              }}
            >
              {userInitials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {session.user.name || 'Pengguna'}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {session.user.email}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Keluar"
              style={{
                padding: '6px',
                borderRadius: '6px',
                color: 'var(--text-muted)',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--danger-light)'
                e.currentTarget.style.color = 'var(--danger)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
