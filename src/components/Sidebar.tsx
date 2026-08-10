'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { 
  LayoutDashboard, 
  Wallet, 
  Target, 
  Store, 
  Package, 
  TrendingUp, 
  LineChart, 
  AlertCircle, 
  FileText, 
  Database,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

type NavItem = {
  name: string
  href?: string
  icon?: any
  children?: { name: string, href: string }[]
}

const navTree: NavItem[] = [
  { name: 'Dashboard Overview', href: '/', icon: LayoutDashboard },
  { 
    name: 'Analytics', icon: LineChart,
    children: [
      { name: 'Marketplace Intelligence', href: '/marketplace-intelligence' },
      { name: 'Products', href: '/products' },
      { name: 'Meta Ads', href: '/campaigns/meta' },
      { name: 'Advertising', href: '/marketing-intelligence' },
    ]
  },
  { 
    name: 'Growth', icon: TrendingUp,
    children: [
      { name: 'Budget Manager', href: '/budget' },
      { name: 'Affiliate Intelligence', href: '/affiliate' },
      { name: 'Marketing Advisor', href: '/marketing-advisor' },
    ]
  },
  { 
    name: 'Reports', icon: FileText,
    children: [
      { name: 'Reports', href: '/reports' },
    ]
  },
  { 
    name: 'Data Sources', icon: Database,
    href: '/data-sources'
  },
  { 
    name: 'Tools', icon: Package,
    children: [
      { name: 'Action Center', href: '/actions' }
    ]
  }
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Marketplace', 'Advertising'])

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--sidebar-bg)',
      color: 'var(--sidebar-text)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{ padding: '24px 20px', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.5px' }}>
        <span style={{ color: 'var(--primary)' }}>Ecom</span>Pilot
      </div>
      
      <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {navTree.map((item) => {
          
          if (item.children) {
            const isExpanded = expandedGroups.includes(item.name)
            const hasActiveChild = item.children.some(c => pathname === c.href)
            
            return (
              <div key={item.name}>
                <button 
                  onClick={() => toggleGroup(item.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    color: hasActiveChild ? 'white' : 'var(--text-muted)',
                    backgroundColor: 'transparent',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {item.icon && <item.icon size={18} />}
                    {item.name}
                  </div>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                
                {isExpanded && (
                  <div style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                    {item.children.map(child => {
                      const isActive = pathname === child.href
                      return (
                        <Link 
                          key={child.href} 
                          href={child.href}
                          onClick={onNavigate}
                          style={{
                            display: 'block',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            color: isActive ? 'white' : 'var(--text-muted)',
                            backgroundColor: isActive ? 'var(--sidebar-hover)' : 'transparent',
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          {child.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const isActive = pathname === item.href
          return (
            <Link 
              key={item.name} 
              href={item.href!}
              onClick={onNavigate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '6px',
                color: isActive ? 'white' : 'var(--text-muted)',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
            >
              {item.icon && <item.icon size={18} />}
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Logged in as Admin</div>
      </div>
    </aside>
  )
}
