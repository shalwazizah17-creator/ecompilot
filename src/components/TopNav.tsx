'use client'

import { useStore, DateRangeOption } from '@/store/useStore'
import { Menu, User, Calendar } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function TopNav({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { selectedBrandId, setSelectedBrandId, dateRangeOption, setDateRangeOption } = useStore()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Sync to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (selectedBrandId) params.set('brandId', selectedBrandId)
    if (dateRangeOption) params.set('dateOption', dateRangeOption)
    
    // Don't push if nothing changed to avoid loop
    const currentBrand = searchParams.get('brandId')
    const currentDate = searchParams.get('dateOption')
    if (currentBrand !== selectedBrandId || currentDate !== dateRangeOption) {
      router.push(`${pathname}?${params.toString()}`)
    }
  }, [selectedBrandId, dateRangeOption, pathname, router])

  const dateOptions: { value: DateRangeOption, label: string }[] = [
    { value: 'TODAY', label: 'Today' },
    { value: 'YESTERDAY', label: 'Yesterday' },
    { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
    { value: 'LAST_30_DAYS', label: 'Last 30 Days' },
    { value: 'THIS_MONTH', label: 'This Month' },
    { value: 'LAST_MONTH', label: 'Previous Month' },
    { value: 'THIS_YEAR', label: 'This Year' },
  ]

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--surface)',
      borderBottom: `1px solid var(--surface-border)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 9,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button 
          className="menu-toggle" 
          onClick={onToggleSidebar}
          style={{ padding: '8px', marginRight: '-8px', color: 'var(--text-secondary)' }}
        >
          <Menu size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'none', '@media (minWidth: 768px)': { display: 'block' } } as any}>Brand:</span>
          <select 
            value={selectedBrandId || ''} 
            onChange={(e) => setSelectedBrandId(e.target.value)}
            style={{
              padding: '6px 32px 6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--surface-border)',
              backgroundColor: 'var(--background)',
              fontWeight: 600,
              color: 'var(--foreground)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">Select Brand</option>
            <option value="brand1">Beauty Brand A</option>
            <option value="brand2">Fashion Brand B</option>
          </select>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--background)', padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--surface-border)' }}>
          <Calendar size={16} color="var(--text-muted)" />
          <select 
            value={dateRangeOption}
            onChange={(e) => setDateRangeOption(e.target.value as DateRangeOption)}
            style={{ 
              padding: '4px 0', 
              border: 'none', 
              background: 'transparent',
              fontSize: '0.85rem', 
              outline: 'none',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {dateOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <User size={18} />
        </div>
      </div>
    </header>
  )
}
