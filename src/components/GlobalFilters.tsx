'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useStore, DateRangeOption } from '../store/useStore'

export function GlobalFilters() {
  const {
    dateRangeOption, setDateRangeOption,
    selectedMarketplace, setSelectedMarketplace,
    selectedAdChannel, setSelectedAdChannel,
    selectedBrandId,
  } = useStore()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const pMp = searchParams.get('marketplace')
    const pCh = searchParams.get('channel')
    if (pMp && pMp !== selectedMarketplace) setSelectedMarketplace(pMp)
    if (pCh && pCh !== selectedAdChannel) setSelectedAdChannel(pCh)
  }, [searchParams])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('marketplace', selectedMarketplace)
    params.set('channel', selectedAdChannel)
    params.set('dateOption', dateRangeOption)
    router.push(`${pathname}?${params.toString()}`)
  }, [selectedBrandId, selectedMarketplace, selectedAdChannel, dateRangeOption, pathname, router])

  const dateOptions: { value: DateRangeOption; label: string }[] = [
    { value: 'TODAY', label: 'Hari Ini' },
    { value: 'YESTERDAY', label: 'Kemarin' },
    { value: 'LAST_7_DAYS', label: '7 Hari Terakhir' },
    { value: 'LAST_30_DAYS', label: '30 Hari Terakhir' },
    { value: 'THIS_MONTH', label: 'Bulan Ini' },
    { value: 'LAST_MONTH', label: 'Bulan Lalu' },
    { value: 'THIS_QUARTER', label: 'Kuartal Ini' },
    { value: 'THIS_YEAR', label: 'Tahun Ini' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '10px 20px',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--surface-border)',
        alignItems: 'center',
      }}
    >
      <select
        value={dateRangeOption}
        onChange={(e) => setDateRangeOption(e.target.value as DateRangeOption)}
        className="filter-select"
      >
        {dateOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select
        value={selectedMarketplace}
        onChange={(e) => setSelectedMarketplace(e.target.value)}
        className="filter-select"
      >
        <option value="ALL">Semua marketplace</option>
        <option value="Shopee">Shopee</option>
        <option value="TikTok Shop">TikTok Shop</option>
        <option value="Tokopedia">Tokopedia</option>
        <option value="Lazada">Lazada</option>
      </select>

      <select
        value={selectedAdChannel}
        onChange={(e) => setSelectedAdChannel(e.target.value)}
        className="filter-select"
      >
        <option value="ALL">Semua saluran iklan</option>
        <option value="Meta Ads">Meta Ads</option>
        <option value="Shopee Ads">Shopee Ads</option>
        <option value="TikTok Ads">TikTok Ads</option>
        <option value="Tokopedia Ads">Tokopedia Ads</option>
      </select>
    </div>
  )
}
