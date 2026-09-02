'use client'

import { useStore, DateRangeOption } from '@/store/useStore'
import { Menu, Calendar, Bell, User } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function TopNav({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { dateRangeOption, setDateRangeOption } = useStore()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (dateRangeOption) params.set('dateOption', dateRangeOption)
    const currentDate = searchParams.get('dateOption')
    if (currentDate !== dateRangeOption) {
      router.push(`${pathname}?${params.toString()}`)
    }
  }, [dateRangeOption, pathname, router])

  const dateOptions: { value: DateRangeOption; label: string }[] = [
    { value: 'TODAY', label: 'Hari Ini' },
    { value: 'YESTERDAY', label: 'Kemarin' },
    { value: 'LAST_7_DAYS', label: '7 Hari Terakhir' },
    { value: 'LAST_30_DAYS', label: '30 Hari Terakhir' },
    { value: 'THIS_MONTH', label: 'Bulan Ini' },
    { value: 'LAST_MONTH', label: 'Bulan Lalu' },
    { value: 'THIS_YEAR', label: 'Tahun Ini' },
  ]

  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'EP'

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--surface-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 9,
        flexShrink: 0,
      }}
    >
      {/* LEFT: Hamburger + mobile logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          className="menu-toggle"
          onClick={onToggleSidebar}
          style={{
            padding: '7px',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            transition: 'background-color 0.15s ease',
            display: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Menu size={20} />
        </button>

        {/* Mobile logo — hidden on desktop via CSS class */}
        <div
          className="mobile-logo"
          style={{
            fontWeight: 700,
            fontSize: '1.05rem',
            letterSpacing: '-0.03em',
            display: 'none',
            color: 'var(--text-primary)',
          }}
        >
          Ecom<span style={{ color: 'var(--primary)' }}>Pilot</span>
        </div>
      </div>

      {/* RIGHT: Date filter + notifications + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Date Picker */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            backgroundColor: 'var(--background)',
            border: '1px solid var(--surface-border-strong)',
            padding: '6px 11px',
            borderRadius: '8px',
          }}
        >
          <Calendar size={14} color="var(--text-muted)" />
          <select
            value={dateRangeOption}
            onChange={(e) => setDateRangeOption(e.target.value as DateRangeOption)}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '0.8125rem',
              outline: 'none',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {dateOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notification Bell */}
        <button
          title="Notifikasi"
          style={{
            padding: '7px',
            borderRadius: '8px',
            color: 'var(--text-muted)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          <Bell size={17} />
        </button>

        {/* User Avatar */}
        <div
          title={session?.user?.email ?? 'User'}
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
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(37, 99, 235, 0.3)',
          }}
        >
          {userInitials}
        </div>
      </div>
    </header>
  )
}
