'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { 
  Sparkles, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShoppingBag, 
  ChevronRight, 
  X, 
  ExternalLink, 
  TrendingUp, 
  DollarSign, 
  Tag, 
  Layers, 
  Check, 
  RotateCcw, 
  Eye, 
  LayoutGrid, 
  List, 
  Kanban, 
  ArrowUpRight, 
  ShieldCheck, 
  HelpCircle,
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  Zap,
  Info,
  SlidersHorizontal,
  Flame,
  ArrowRight
} from 'lucide-react'
import { calculateOpportunityScore } from '@/lib/campaign-opportunity-engine'

export interface CampaignOpportunityItem {
  id: string
  brand_id?: string
  marketplace: string
  campaign_name: string
  campaign_type: string
  status: 'Opportunity' | 'Recommended' | 'Applied' | 'Joined' | 'Skipped' | 'Expired'
  start_date: string
  end_date: string
  registration_start?: string | null
  registration_end?: string | null
  product_type: 'Existing' | 'NPD' | 'Both'
  description?: string | null
  source: string
  source_url?: string | null
  last_checked_at: string
  data_status: string
  eligibility_status: string
  eligible_sku_count: number
  matched_sku_count: number
  required_discount?: number | null
  minimum_stock?: number | null
  estimated_orders?: number | null
  estimated_gmv?: number | null
  estimated_margin?: number | null
  opportunity_score: number
  opportunity_level: 'High' | 'Medium' | 'Low'
  recommendation: 'Recommended' | 'Consider' | 'Low Priority' | 'Skip'
  recommendation_reason?: string | null
  notes?: string | null
}

// Authentic Marketplace Badge Matching Official App Icons
export function MarketplaceBadge({ platform }: { platform: string }) {
  const p = (platform || '').toLowerCase()
  if (p.includes('tiktok')) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 9px',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontWeight: 700,
        backgroundColor: '#000000',
        color: '#ffffff',
        border: '1px solid #27272a',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        whiteSpace: 'nowrap',
        lineHeight: 1.2
      }}>
        <span style={{
          width: '16px',
          height: '16px',
          borderRadius: '4px',
          backgroundColor: '#0a0a0a',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: '1px solid #3f3f46'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.368 0 .717.072 1.037.2v-3.52a6.34 6.34 0 0 0-1.037-.085A6.335 6.335 0 0 0 3 15.672 6.335 6.335 0 0 0 9.344 22a6.335 6.335 0 0 0 6.336-6.328V9.124a8.17 8.17 0 0 0 4.909 1.63v-3.5a4.764 4.764 0 0 1-1-.568z" fill="#25F4EE" transform="translate(-1.4, 0)" />
            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.368 0 .717.072 1.037.2v-3.52a6.34 6.34 0 0 0-1.037-.085A6.335 6.335 0 0 0 3 15.672 6.335 6.335 0 0 0 9.344 22a6.335 6.335 0 0 0 6.336-6.328V9.124a8.17 8.17 0 0 0 4.909 1.63v-3.5a4.764 4.764 0 0 1-1-.568z" fill="#FE2C55" transform="translate(1.4, 0)" />
            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.368 0 .717.072 1.037.2v-3.52a6.34 6.34 0 0 0-1.037-.085A6.335 6.335 0 0 0 3 15.672 6.335 6.335 0 0 0 9.344 22a6.335 6.335 0 0 0 6.336-6.328V9.124a8.17 8.17 0 0 0 4.909 1.63v-3.5a4.764 4.764 0 0 1-1-.568z" fill="#FFFFFF" />
          </svg>
        </span>
        <span style={{ letterSpacing: '-0.01em', color: '#ffffff', fontWeight: 700 }}>TikTok Shop</span>
      </span>
    )
  }

  if (p.includes('shopee')) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontWeight: 700,
        backgroundColor: '#fff1ee',
        color: '#ee4d2d',
        border: '1px solid #fed7aa',
        boxShadow: '0 1px 2px rgba(238,77,45,0.08)',
        whiteSpace: 'nowrap',
        lineHeight: 1.2
      }}>
        <ShoppingBag size={12} color="#ee4d2d" />
        <span>Shopee</span>
      </span>
    )
  }

  if (p.includes('lazada')) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontWeight: 700,
        backgroundColor: '#eef2ff',
        color: '#1e40af',
        border: '1px solid #c7d2fe',
        boxShadow: '0 1px 2px rgba(30,64,175,0.08)',
        whiteSpace: 'nowrap',
        lineHeight: 1.2
      }}>
        <ShoppingBag size={12} color="#1e40af" />
        <span>Lazada</span>
      </span>
    )
  }

  if (p.includes('tokopedia')) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontWeight: 700,
        backgroundColor: '#f0fdf4',
        color: '#15803d',
        border: '1px solid #bbf7d0',
        whiteSpace: 'nowrap',
        lineHeight: 1.2
      }}>
        <span>Tokopedia</span>
      </span>
    )
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 8px',
      borderRadius: '6px',
      fontSize: '0.72rem',
      fontWeight: 700,
      backgroundColor: '#f1f5f9',
      color: '#334155',
      border: '1px solid #cbd5e1',
      whiteSpace: 'nowrap',
      lineHeight: 1.2
    }}>
      <span>{platform}</span>
    </span>
  )
}

export default function CampaignOpportunityPage() {
  const [opportunities, setOpportunities] = useState<CampaignOpportunityItem[]>([])
  const [summary, setSummary] = useState({
    availableCount: 0,
    recommendedCount: 0,
    expiringSoonCount: 0,
    highOpportunityCount: 0,
    totalCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // View Mode: 'cards' | 'table' | 'board'
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'board'>('cards')

  // Filter States
  const [filterMarketplace, setFilterMarketplace] = useState<string>('ALL')
  const [filterType, setFilterType] = useState<string>('ALL')
  const [filterProductType, setFilterProductType] = useState<string>('ALL')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<'recommended' | 'deadline' | 'score' | 'newest'>('recommended')

  // Drawer Detail State
  const [selectedOpportunity, setSelectedOpportunity] = useState<CampaignOpportunityItem | null>(null)

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    marketplace: 'Shopee',
    campaign_name: '',
    campaign_type: 'Double Date',
    start_date: '2026-10-10',
    end_date: '2026-10-12',
    registration_start: '2026-09-01',
    registration_end: '2026-10-07',
    product_type: 'Existing' as 'Existing' | 'NPD' | 'Both',
    required_discount: 5,
    minimum_stock: 300,
    estimated_gmv: 25000000,
    estimated_orders: 280,
    eligible_sku_count: 6,
    source: 'Manual Marketplace Check',
    source_url: '',
    description: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Load Opportunities from API
  const fetchOpportunities = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/campaign-opportunities')
      if (!res.ok) throw new Error('Gagal memuat data campaign opportunity.')
      const data = await res.json()
      setOpportunities(data.opportunities || [])
      if (data.summary) {
        setSummary(data.summary)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Terjadi kesalahan sistem saat memuat data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpportunities()
  }, [])

  // Filtered & Sorted Opportunities
  const filteredList = useMemo(() => {
    const list = opportunities.filter((item) => {
      const matchMkt = filterMarketplace === 'ALL' || item.marketplace.toLowerCase() === filterMarketplace.toLowerCase()
      const matchType = filterType === 'ALL' || item.campaign_type.toLowerCase() === filterType.toLowerCase()
      const matchProd = filterProductType === 'ALL' || item.product_type === filterProductType || item.product_type === 'Both'
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus
      const matchSearch = !searchQuery.trim() ||
        item.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.marketplace.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.campaign_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchMkt && matchType && matchProd && matchStatus && matchSearch
    })

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'recommended') {
        if (a.opportunity_score !== b.opportunity_score) return b.opportunity_score - a.opportunity_score
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      }
      if (sortBy === 'score') return b.opportunity_score - a.opportunity_score
      if (sortBy === 'deadline') {
        const dateA = a.registration_end ? new Date(a.registration_end).getTime() : new Date(a.start_date).getTime()
        const dateB = b.registration_end ? new Date(b.registration_end).getTime() : new Date(b.start_date).getTime()
        return dateA - dateB
      }
      if (sortBy === 'newest') {
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      }
      return 0
    })

    return list
  }, [opportunities, filterMarketplace, filterType, filterProductType, filterStatus, searchQuery, sortBy])

  // Reset Filters
  const handleResetFilters = () => {
    setFilterMarketplace('ALL')
    setFilterType('ALL')
    setFilterProductType('ALL')
    setFilterStatus('ALL')
    setSearchQuery('')
    setSortBy('recommended')
  }

  // Handle Add to Promo Planner
  const handleAddToPromoPlanner = async (item: CampaignOpportunityItem) => {
    try {
      // 1. Mark status as Joined via API
      const patchRes = await fetch('/api/campaign-opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status: 'Joined',
          decisionReason: `Didaftarkan ke Promo Planner: ${item.recommendation_reason || 'Memenuhi target GMV & margin'}`
        })
      })
      if (!patchRes.ok) throw new Error('Gagal memperbarui status opportunity.')

      // 2. Map item data to Promo Planner format and persist to shared storage
      if (typeof window !== 'undefined') {
        const existingPlansStr = localStorage.getItem('ecompilot_added_promo_plans')
        let existingPlans: any[] = []
        if (existingPlansStr) {
          try { existingPlans = JSON.parse(existingPlansStr) } catch (e) {}
        }

        // Avoid duplicate additions
        const alreadyExists = existingPlans.some(p => p.opportunityId === item.id)
        if (!alreadyExists) {
          const startDate = new Date(item.start_date)
          const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
          const monthName = monthNames[startDate.getMonth()] || 'Oktober'

          const newPromoPlan = {
            id: `from-opp-${item.id}`,
            opportunityId: item.id,
            campaignName: item.campaign_name,
            status: 'Scheduled',
            bulan: monthName,
            marketplace: item.marketplace,
            kategori: item.campaign_type === 'Live Streaming' ? 'Live Streaming' : 'Campaign',
            subKategori: item.campaign_type === 'Flash Sale' ? 'Flash Sale' : item.campaign_type === 'NPD' ? 'Voucher NPD' : 'Promo Flash Sale',
            periode: item.campaign_type === 'Double Date' ? 'Twindate 10.10' : item.campaign_type === 'Payday' ? 'Payday' : 'BAU',
            tanggal: `${startDate.getDate()} - ${new Date(item.end_date).getDate()} ${monthName}`,
            closing: 'All',
            sku: item.product_type === 'NPD' ? 'BUNDLING-CBOOSTERSERIES' : 'TWINSUNAGERPROTECTIONDC',
            productName: item.product_type === 'NPD' ? 'Theraskin Daily C-Booster Series' : 'Twinpack Sun Protector Age Revival Protection Day Cream',
            hargaBulanan: item.product_type === 'NPD' ? 97000 : 80400,
            diskonPercent: item.required_discount || 5,
            totalDiskon: Math.round(((item.product_type === 'NPD' ? 97000 : 80400) * (item.required_discount || 5)) / 100),
            hargaPromo: Math.round((item.product_type === 'NPD' ? 97000 : 80400) * (1 - (item.required_discount || 5) / 100)),
            qty: item.estimated_orders || 100,
            totalPromosi: Math.round((item.estimated_orders || 100) * ((item.product_type === 'NPD' ? 97000 : 80400) * (item.required_discount || 5) / 100)),
            hargaOB: item.product_type === 'NPD' ? 88000 : 73000,
            bottomPrice: Math.round((item.product_type === 'NPD' ? 88000 : 73000) * 0.97),
            notes: `Berasal dari Campaign Opportunity. ${item.notes || ''}`
          }

          existingPlans.push(newPromoPlan)
          localStorage.setItem('ecompilot_added_promo_plans', JSON.stringify(existingPlans))
        }
      }

      // 3. Update local state
      setOpportunities(prev => prev.map(o => o.id === item.id ? { ...o, status: 'Joined' } : o))
      if (selectedOpportunity && selectedOpportunity.id === item.id) {
        setSelectedOpportunity(p => p ? { ...p, status: 'Joined' } : null)
      }

      showToast(`Campaign "${item.campaign_name}" berhasil ditambahkan ke Promo Planner.`)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Gagal menambahkan campaign ke Promo Planner.')
    }
  }

  // Handle Mark as Skipped
  const handleSkipOpportunity = async (item: CampaignOpportunityItem) => {
    try {
      await fetch('/api/campaign-opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status: 'Skipped',
          decisionReason: 'Dilewati oleh specialist karena pertimbangan margin/alokasi stok'
        })
      })

      setOpportunities(prev => prev.map(o => o.id === item.id ? { ...o, status: 'Skipped' } : o))
      if (selectedOpportunity && selectedOpportunity.id === item.id) {
        setSelectedOpportunity(p => p ? { ...p, status: 'Skipped' } : null)
      }
      showToast('Campaign ditandai sebagai skipped.')
    } catch (err) {
      console.error(err)
      alert('Gagal memperbarui status campaign.')
    }
  }

  // Handle Submit New Opportunity
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/campaign-opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal membuat campaign opportunity.')

      showToast('Campaign opportunity berhasil dibuat.')
      setShowCreateModal(false)
      // Reset form
      setCreateForm({
        marketplace: 'Shopee',
        campaign_name: '',
        campaign_type: 'Double Date',
        start_date: '2026-10-10',
        end_date: '2026-10-12',
        registration_start: '2026-09-01',
        registration_end: '2026-10-07',
        product_type: 'Existing',
        required_discount: 5,
        minimum_stock: 300,
        estimated_gmv: 25000000,
        estimated_orders: 280,
        eligible_sku_count: 6,
        source: 'Manual Marketplace Check',
        source_url: '',
        description: '',
        notes: ''
      })
      fetchOpportunities()
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan campaign.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper Recommendation Badge
  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'Recommended':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', label: 'RECOMMENDED' }
      case 'Consider':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'CONSIDER' }
      case 'Low Priority':
        return { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', label: 'LOW PRIORITY' }
      default:
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'SKIP' }
    }
  }

  // Helper Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Joined':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', label: 'Joined' }
      case 'Applied':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: 'Applied' }
      case 'Recommended':
        return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'Recommended' }
      case 'Skipped':
        return { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', label: 'Skipped' }
      case 'Expired':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Expired' }
      default:
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'Opportunity' }
    }
  }

  // Expiring Soon List (Registration deadline in next 5 days)
  const expiringSoonList = useMemo(() => {
    const now = new Date().getTime()
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000
    return opportunities.filter(o => {
      if (o.status === 'Expired' || o.status === 'Joined') return false
      if (!o.registration_end) return false
      const regTime = new Date(o.registration_end).getTime()
      return regTime >= now && (regTime - now) <= fiveDaysMs
    })
  }, [opportunities])

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.875rem',
          fontWeight: 600,
          border: '1px solid #334155'
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: HEADER & CTA */}
      {/* ========================================================================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Campaign Opportunity
            </h1>
            <span style={{ 
              fontSize: '0.68rem', 
              padding: '2px 8px', 
              borderRadius: '9999px', 
              backgroundColor: 'rgba(59, 130, 246, 0.1)', 
              color: 'var(--primary)', 
              fontWeight: 700,
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              Decision Center
            </span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Temukan campaign marketplace yang relevan dan tentukan peluang terbaik untuk diikuti.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Sync Button with informative tooltip */}
          <div title="Sinkronisasi API langsung dari Seller Centre memerlukan API credentials pada menu Pengaturan" style={{ display: 'inline-block' }}>
            <button
              disabled
              className="btn-outline"
              style={{
                fontSize: '0.8125rem',
                opacity: 0.65,
                cursor: 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '38px'
              }}
            >
              <RotateCcw size={14} /> Sync Campaign
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '38px',
              boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
            }}
          >
            <Plus size={16} /> Tambah Campaign Opportunity
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: SUMMARY CARDS (FACTUAL AGGREGATED METRICS) */}
      {/* ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px'
      }}>
        <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>Campaign Tersedia</span>
            <Layers size={15} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
            {summary.availableCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Peluang aktif dievaluasi
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>Direkomendasikan</span>
            <CheckCircle2 size={15} color="#059669" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: '#059669' }}>
            {summary.recommendedCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Margin aman &amp; traffic tinggi
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>Segera Berakhir</span>
            <Clock size={15} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: summary.expiringSoonCount > 0 ? '#d97706' : 'var(--text-primary)' }}>
            {summary.expiringSoonCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Deadline pendaftaran &lt; 5 hari
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>High Opportunity</span>
            <Sparkles size={15} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: '#8b5cf6' }}>
            {summary.highOpportunityCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Score kelayakan &ge; 80/100
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: EXPIRING SOON ALERT BANNER (IF ANY) */}
      {/* ========================================================================= */}
      {expiringSoonList.length > 0 && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#92400e' }}>
                Pendaftaran Segera Ditutup:
              </span>{' '}
              <span style={{ fontSize: '0.8125rem', color: '#b45309' }}>
                {expiringSoonList.map(o => `${o.marketplace} ${o.campaign_name}`).join(', ')}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setFilterStatus('ALL')
              setSortBy('deadline')
            }}
            className="btn-outline"
            style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
              color: '#92400e',
              borderColor: '#fcd34d',
              backgroundColor: '#ffffff'
            }}
          >
            Review Deadline
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: FILTER & SEARCH BAR */}
      {/* ========================================================================= */}
      <div className="card" style={{
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', flex: '1', minWidth: '220px', position: 'relative' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text"
              placeholder="Cari campaign, produk, atau tipe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '32px', paddingRight: searchQuery ? '28px' : '10px', fontSize: '0.8125rem', width: '100%', height: '34px' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                title="Hapus pencarian"
                style={{ position: 'absolute', right: '8px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Marketplace */}
          <select
            value={filterMarketplace}
            onChange={(e) => setFilterMarketplace(e.target.value)}
            className="filter-select"
            style={{ minWidth: '135px', fontSize: '0.78rem', height: '34px' }}
          >
            <option value="ALL">Semua Marketplace</option>
            <option value="Shopee">Shopee</option>
            <option value="TikTok Shop">TikTok Shop</option>
            <option value="Lazada">Lazada</option>
            <option value="Tokopedia">Tokopedia</option>
          </select>

          {/* Filter Campaign Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
            style={{ minWidth: '130px', fontSize: '0.78rem', height: '34px' }}
          >
            <option value="ALL">Semua Tipe</option>
            <option value="Double Date">Double Date</option>
            <option value="Payday">Payday</option>
            <option value="Flash Sale">Flash Sale</option>
            <option value="Live Streaming">Live Streaming</option>
            <option value="BAU">BAU (Regular)</option>
            <option value="NPD">NPD (Produk Baru)</option>
            <option value="Brand Membership">Brand Membership</option>
          </select>

          {/* Filter Product Type (NPD vs Existing) */}
          <select
            value={filterProductType}
            onChange={(e) => setFilterProductType(e.target.value)}
            className="filter-select"
            style={{ minWidth: '125px', fontSize: '0.78rem', height: '34px' }}
          >
            <option value="ALL">Semua Produk</option>
            <option value="Existing">Existing Product</option>
            <option value="NPD">NPD (Baru)</option>
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
            style={{ minWidth: '115px', fontSize: '0.78rem', height: '34px' }}
          >
            <option value="ALL">Semua Status</option>
            <option value="Opportunity">Opportunity</option>
            <option value="Recommended">Recommended</option>
            <option value="Joined">Joined</option>
            <option value="Skipped">Skipped</option>
            <option value="Expired">Expired</option>
          </select>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="filter-select"
            style={{ minWidth: '135px', fontSize: '0.78rem', height: '34px', fontWeight: 600 }}
          >
            <option value="recommended">Sort: Direkomendasikan</option>
            <option value="deadline">Sort: Deadline Terdekat</option>
            <option value="score">Sort: Skor Tertinggi</option>
            <option value="newest">Sort: Jadwal Terbaru</option>
          </select>

          {/* View Mode Switcher */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'var(--surface-border)',
            borderRadius: '6px',
            padding: '2px',
            gap: '2px'
          }}>
            <button
              onClick={() => setViewMode('cards')}
              title="Cards View"
              style={{
                padding: '5px 8px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'cards' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'cards' ? 'var(--primary)' : 'var(--text-secondary)'
              }}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              style={{
                padding: '5px 8px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'table' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-secondary)'
              }}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('board')}
              title="Board Kanban View"
              style={{
                padding: '5px 8px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'board' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'board' ? 'var(--primary)' : 'var(--text-secondary)'
              }}
            >
              <Kanban size={14} />
            </button>
          </div>

          {/* Reset Filters */}
          {(filterMarketplace !== 'ALL' || filterType !== 'ALL' || filterProductType !== 'ALL' || filterStatus !== 'ALL' || searchQuery !== '') && (
            <button
              onClick={handleResetFilters}
              className="btn-outline"
              style={{ fontSize: '0.75rem', height: '34px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>

        {/* QUICK FILTER CHIPS */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          fontSize: '0.72rem',
          paddingTop: '2px'
        }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} color="var(--primary)" /> Filter Cepat:
          </span>

          <button
            onClick={() => { setFilterType('Flash Sale'); setSearchQuery(''); }}
            style={{
              padding: '3px 9px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              whiteSpace: 'nowrap',
              backgroundColor: filterType === 'Flash Sale' ? 'var(--primary)' : 'var(--surface)',
              color: filterType === 'Flash Sale' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: filterType === 'Flash Sale' ? 'var(--primary)' : 'var(--surface-border)'
            }}
          >
            ⚡ Flash Sale
          </button>

          <button
            onClick={() => { setFilterProductType('NPD'); setSearchQuery(''); }}
            style={{
              padding: '3px 9px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              whiteSpace: 'nowrap',
              backgroundColor: filterProductType === 'NPD' ? '#8b5cf6' : 'var(--surface)',
              color: filterProductType === 'NPD' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: filterProductType === 'NPD' ? '#8b5cf6' : 'var(--surface-border)'
            }}
          >
            🎟️ NPD (C-Booster &amp; Men)
          </button>

          <button
            onClick={() => { setFilterType('Double Date'); setSearchQuery(''); }}
            style={{
              padding: '3px 9px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              whiteSpace: 'nowrap',
              backgroundColor: filterType === 'Double Date' ? '#0ea5e9' : 'var(--surface)',
              color: filterType === 'Double Date' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: filterType === 'Double Date' ? '#0ea5e9' : 'var(--surface-border)'
            }}
          >
            📅 Double Date 10.10 / 11.11
          </button>

          <button
            onClick={() => { setFilterType('Payday'); setSearchQuery(''); }}
            style={{
              padding: '3px 9px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              whiteSpace: 'nowrap',
              backgroundColor: filterType === 'Payday' ? '#10b981' : 'var(--surface)',
              color: filterType === 'Payday' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: filterType === 'Payday' ? '#10b981' : 'var(--surface-border)'
            }}
          >
            💰 Payday Campaign
          </button>

          <button
            onClick={() => { setFilterStatus('Recommended'); setSearchQuery(''); }}
            style={{
              padding: '3px 9px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              whiteSpace: 'nowrap',
              backgroundColor: filterStatus === 'Recommended' ? '#059669' : 'var(--surface)',
              color: filterStatus === 'Recommended' ? '#ffffff' : 'var(--text-secondary)',
              borderColor: filterStatus === 'Recommended' ? '#059669' : 'var(--surface-border)'
            }}
          >
            🔥 Skor Tinggi &ge; 80
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: CONTENT VIEWS (CARDS / TABLE / BOARD) */}
      {/* ========================================================================= */}
      {loading ? (
        <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #cbd5e1', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <p style={{ marginTop: '12px', fontSize: '0.875rem' }}>Memuat data Campaign Opportunity...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--danger)' }}>
          <AlertTriangle size={28} style={{ margin: '0 auto 10px auto' }} />
          <p style={{ fontWeight: 600 }}>{error}</p>
          <button onClick={fetchOpportunities} className="btn-outline" style={{ marginTop: '10px' }}>
            Coba Lagi
          </button>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
            <Layers size={24} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            Belum ada campaign opportunity yang cocok
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            Silakan sesuaikan filter pencarian atau tambahkan campaign opportunity baru untuk mulai menganalisis.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={handleResetFilters} className="btn-outline" style={{ fontSize: '0.8125rem' }}>
              Reset Filter
            </button>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ fontSize: '0.8125rem' }}>
              + Tambah Opportunity
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* VIEW A: CARDS GRID (PRIMARY MODERN WORKFLOW) */}
          {/* ========================================================================= */}
          {viewMode === 'cards' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px'
            }}>
              {filteredList.map((item) => {
                const recBadge = getRecommendationBadge(item.recommendation)
                const isJoined = item.status === 'Joined'
                const startDateStr = new Date(item.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                const endDateStr = new Date(item.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                const regEndStr = item.registration_end 
                  ? new Date(item.registration_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) 
                  : null

                return (
                  <div
                    key={item.id}
                    className="card"
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: '12px',
                      transition: 'all 0.18s ease',
                      border: '1px solid var(--surface-border)',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.06)'
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                      e.currentTarget.style.borderColor = 'var(--surface-border)'
                    }}
                  >
                    <div>
                      {/* Card Top: Marketplace Badge & Recommendation Pill */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <MarketplaceBadge platform={item.marketplace} />

                        <span style={{
                          fontSize: '0.67rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: recBadge.bg,
                          color: recBadge.color,
                          border: `1px solid ${recBadge.border}`,
                          letterSpacing: '0.02em'
                        }}>
                          {recBadge.label}
                        </span>
                      </div>

                      {/* Campaign Name & Type */}
                      <div style={{ marginBottom: '8px' }}>
                        <h3 style={{
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          margin: '0 0 4px 0',
                          color: 'var(--text-primary)',
                          lineHeight: 1.35
                        }}>
                          {item.campaign_name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            fontWeight: 600
                          }}>
                            {item.campaign_type}
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: item.product_type === 'NPD' ? '#faf5ff' : '#eff6ff',
                            color: item.product_type === 'NPD' ? '#7e22ce' : '#1d4ed8',
                            fontWeight: 600,
                            border: `1px solid ${item.product_type === 'NPD' ? '#e9d5ff' : '#bfdbfe'}`
                          }}>
                            {item.product_type === 'NPD' ? 'NPD Only' : item.product_type === 'Both' ? 'Existing & NPD' : 'Existing Product'}
                          </span>
                        </div>
                      </div>

                      {/* Dates: Campaign Period & Registration */}
                      <div style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '0.74rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} color="var(--primary)" />
                          <span>
                            Periode: <strong>{startDateStr} – {endDateStr}</strong>
                          </span>
                        </div>
                        {regEndStr && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309' }}>
                            <Clock size={13} color="#d97706" />
                            <span>
                              Daftar sebelum: <strong>{regEndStr}</strong>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Metrics: Eligible SKU & Est GMV */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        marginBottom: '12px',
                        paddingBottom: '10px',
                        borderBottom: '1px dashed var(--surface-border)'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Eligible SKU</div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.eligible_sku_count} SKU
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Potensi GMV</div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {item.estimated_gmv ? `Rp ${(item.estimated_gmv / 1000000).toFixed(1)}M` : '-'}
                          </div>
                        </div>
                      </div>

                      {/* Opportunity Score Bar */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '0.72rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Opportunity Score:</span>
                          <span style={{ fontWeight: 800, color: item.opportunity_score >= 80 ? '#059669' : item.opportunity_score >= 60 ? '#d97706' : '#64748b' }}>
                            {item.opportunity_score} / 100 ({item.opportunity_level})
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${item.opportunity_score}%`,
                            height: '100%',
                            backgroundColor: item.opportunity_score >= 80 ? '#10b981' : item.opportunity_score >= 60 ? '#f59e0b' : '#94a3b8',
                            borderRadius: '9999px'
                          }}></div>
                        </div>
                        {item.recommendation_reason && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.3 }}>
                            💡 {item.recommendation_reason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Source Info & Action Buttons */}
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        Sumber: <strong>{item.source}</strong> &bull; Dicek:{' '}
                        {new Date(item.last_checked_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setSelectedOpportunity(item)}
                          className="btn-outline"
                          style={{ flex: 1, fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center', height: '32px' }}
                        >
                          View Detail
                        </button>

                        {isJoined ? (
                          <span style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            backgroundColor: '#ecfdf5',
                            color: '#059669',
                            border: '1px solid #a7f3d0',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            <Check size={13} /> Joined
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddToPromoPlanner(item)}
                            className="btn-primary"
                            style={{ flex: 1, fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center', height: '32px' }}
                          >
                            + Add to Planner
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW B: TABLE VIEW (OPERATIONAL TABULAR LIST) */}
          {/* ========================================================================= */}
          {viewMode === 'table' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', color: '#475569', fontWeight: 600, borderBottom: '1px solid var(--surface-border)' }}>
                      <th style={{ padding: '10px 14px' }}>Marketplace</th>
                      <th style={{ padding: '10px 14px' }}>Campaign &amp; Tipe</th>
                      <th style={{ padding: '10px 14px' }}>Periode</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Eligible SKU</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Potensi GMV</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Opportunity Score</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Rekomendasi</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((item) => {
                      const recBadge = getRecommendationBadge(item.recommendation)
                      const stBadge = getStatusBadge(item.status)
                      const startDateStr = new Date(item.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                      const endDateStr = new Date(item.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

                      return (
                        <tr 
                          key={item.id} 
                          onClick={() => setSelectedOpportunity(item)}
                          style={{ borderBottom: '1px solid var(--surface-border)', cursor: 'pointer' }}
                        >
                          <td style={{ padding: '10px 14px' }}>
                            <MarketplaceBadge platform={item.marketplace} />
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.campaign_name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.campaign_type} &bull; {item.product_type}</div>
                          </td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            {startDateStr} – {endDateStr}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>
                            {item.eligible_sku_count} SKU
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                            {item.estimated_gmv ? `Rp ${(item.estimated_gmv / 1000000).toFixed(1)}M` : '-'}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{ fontWeight: 800, color: item.opportunity_score >= 80 ? '#059669' : '#d97706' }}>
                              {item.opportunity_score}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/100</span>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '9999px',
                              backgroundColor: recBadge.bg,
                              color: recBadge.color,
                              border: `1px solid ${recBadge.border}`
                            }}>
                              {recBadge.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              padding: '2px 7px',
                              borderRadius: '9999px',
                              backgroundColor: stBadge.bg,
                              color: stBadge.color,
                              border: `1px solid ${stBadge.border}`
                            }}>
                              {stBadge.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedOpportunity(item) }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                            >
                              <Eye size={15} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW C: BOARD VIEW (KANBAN PIPELINE) */}
          {/* ========================================================================= */}
          {viewMode === 'board' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '12px',
              alignItems: 'start'
            }}>
              {(['Opportunity', 'Recommended', 'Applied', 'Joined', 'Skipped'] as const).map((stage) => {
                const stageItems = filteredList.filter(i => {
                  if (stage === 'Recommended') return i.recommendation === 'Recommended' && i.status !== 'Joined' && i.status !== 'Skipped'
                  return i.status === stage
                })

                return (
                  <div
                    key={stage}
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid var(--surface-border)',
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                        {stage}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: '#e2e8f0',
                        color: '#475569',
                        padding: '1px 6px',
                        borderRadius: '9999px'
                      }}>
                        {stageItems.length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '100px' }}>
                      {stageItems.length === 0 ? (
                        <div style={{ padding: '24px 10px', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', border: '1px dashed #cbd5e1', borderRadius: '6px' }}>
                          Tidak ada item di tahap ini
                        </div>
                      ) : (
                        stageItems.map(it => (
                          <div
                            key={it.id}
                            onClick={() => setSelectedOpportunity(it)}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '10px',
                              cursor: 'pointer',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <MarketplaceBadge platform={it.marketplace} />
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: it.opportunity_score >= 80 ? '#059669' : '#d97706' }}>
                                {it.opportunity_score} pts
                              </span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                              {it.campaign_name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              {it.eligible_sku_count} SKU &bull; {it.estimated_gmv ? `Rp ${(it.estimated_gmv / 1000000).toFixed(1)}M` : '-'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: CAMPAIGN DETAIL DRAWER (4-TIER DRILLDOWN) */}
      {/* ========================================================================= */}
      {selectedOpportunity && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'flex-end'
        }}
        onClick={() => setSelectedOpportunity(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              height: '100%',
              backgroundColor: 'var(--surface)',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1001,
              animation: 'slideLeft 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--surface-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <MarketplaceBadge platform={selectedOpportunity.marketplace} />
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: getRecommendationBadge(selectedOpportunity.recommendation).bg,
                    color: getRecommendationBadge(selectedOpportunity.recommendation).color,
                    border: `1px solid ${getRecommendationBadge(selectedOpportunity.recommendation).border}`
                  }}>
                    {selectedOpportunity.recommendation}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {selectedOpportunity.campaign_name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOpportunity(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* TIER 1: CAMPAIGN OVERVIEW */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  1. Info Campaign &amp; Jadwal
                </div>
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tipe Campaign:</span>
                    <strong>{selectedOpportunity.campaign_type}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Periode Pelaksanaan:</span>
                    <strong>{new Date(selectedOpportunity.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} – {new Date(selectedOpportunity.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</strong>
                  </div>
                  {selectedOpportunity.registration_end && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b45309' }}>
                      <span>Batas Akhir Pendaftaran:</span>
                      <strong>{new Date(selectedOpportunity.registration_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Sumber Pengecekan:</span>
                    <span>{selectedOpportunity.source}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Terakhir Diverifikasi:</span>
                    <span>{new Date(selectedOpportunity.last_checked_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* TIER 2: ELIGIBILITY & SKU MATCHING */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  2. Kelayakan Produk (Eligibility)
                </div>
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tipe Produk:</span>
                    <strong>{selectedOpportunity.product_type === 'NPD' ? 'NPD (Produk Baru)' : selectedOpportunity.product_type === 'Both' ? 'Existing & NPD' : 'Existing Product'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Pencocokan SKU:</span>
                    <strong>{selectedOpportunity.matched_sku_count} / {selectedOpportunity.eligible_sku_count} SKU Matched</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Syarat Diskon Campaign:</span>
                    <strong style={{ color: '#ea580c' }}>{selectedOpportunity.required_discount ? `${selectedOpportunity.required_discount}%` : 'Diskon Bebas Toko'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Komitmen Stok Minimal:</span>
                    <strong>{selectedOpportunity.minimum_stock ? `${selectedOpportunity.minimum_stock} pcs` : 'Tidak ada batas'}</strong>
                  </div>
                </div>
              </div>

              {/* TIER 3: BUSINESS POTENTIAL & MARGIN */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  3. Analisis Potensi Bisnis &amp; Margin
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Proyeksi Pesanan</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedOpportunity.estimated_orders ? `${selectedOpportunity.estimated_orders} orders` : '-'}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Estimasi GMV</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                      {selectedOpportunity.estimated_gmv ? `Rp ${selectedOpportunity.estimated_gmv.toLocaleString('id-ID')}` : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* TIER 4: OPPORTUNITY SCORE & RATIONALE */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  4. Skor &amp; Alasan Rekomendasi
                </div>
                <div style={{
                  backgroundColor: selectedOpportunity.opportunity_score >= 80 ? '#ecfdf5' : '#fffbeb',
                  border: `1px solid ${selectedOpportunity.opportunity_score >= 80 ? '#a7f3d0' : '#fde68a'}`,
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: selectedOpportunity.opportunity_score >= 80 ? '#065f46' : '#92400e' }}>
                      Opportunity Score: {selectedOpportunity.opportunity_score}/100
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: selectedOpportunity.opportunity_score >= 80 ? '#059669' : '#d97706' }}>
                      {selectedOpportunity.opportunity_level} Opportunity
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: selectedOpportunity.opportunity_score >= 80 ? '#047857' : '#b45309', margin: 0, lineHeight: 1.4 }}>
                    {selectedOpportunity.recommendation_reason || 'Peluang campaign terverifikasi layak untuk diikuti.'}
                  </p>
                </div>
              </div>

              {/* NOTES */}
              {selectedOpportunity.notes && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Catatan Strategi Specialist
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--surface-border)' }}>
                    {selectedOpportunity.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Drawer Bottom Actions */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--surface-border)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              {selectedOpportunity.status === 'Joined' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> Campaign Sudah Diikuti
                  </span>
                  <Link
                    href="/promo-planner"
                    className="btn-outline"
                    style={{ fontSize: '0.75rem', padding: '6px 10px', marginLeft: 'auto' }}
                  >
                    Buka Promo Planner &rarr;
                  </Link>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleSkipOpportunity(selectedOpportunity)}
                    className="btn-outline"
                    style={{ fontSize: '0.8125rem', height: '36px' }}
                  >
                    Skip Opportunity
                  </button>

                  <button
                    onClick={() => handleAddToPromoPlanner(selectedOpportunity)}
                    className="btn-primary"
                    style={{ flex: 1, fontSize: '0.8125rem', height: '36px', justifyContent: 'center' }}
                  >
                    + Add to Promo Planner
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 7: ADD MANUAL OPPORTUNITY MODAL */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: 'var(--surface)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Tambah Campaign Opportunity</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Nama Campaign <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Shopee 11.11 Mega Deals Flash Sale"
                  value={createForm.campaign_name}
                  onChange={(e) => setCreateForm({ ...createForm, campaign_name: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Marketplace <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <select
                    value={createForm.marketplace}
                    onChange={(e) => setCreateForm({ ...createForm, marketplace: e.target.value })}
                    className="filter-select"
                    style={{ width: '100%', fontSize: '0.8125rem' }}
                  >
                    <option value="Shopee">Shopee</option>
                    <option value="TikTok Shop">TikTok Shop</option>
                    <option value="Lazada">Lazada</option>
                    <option value="Tokopedia">Tokopedia</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Tipe Campaign
                  </label>
                  <select
                    value={createForm.campaign_type}
                    onChange={(e) => setCreateForm({ ...createForm, campaign_type: e.target.value })}
                    className="filter-select"
                    style={{ width: '100%', fontSize: '0.8125rem' }}
                  >
                    <option value="Double Date">Double Date</option>
                    <option value="Payday">Payday</option>
                    <option value="Flash Sale">Flash Sale</option>
                    <option value="Live Streaming">Live Streaming</option>
                    <option value="BAU">BAU (Regular)</option>
                    <option value="NPD">NPD (Produk Baru)</option>
                    <option value="Brand Membership">Brand Membership</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Tanggal Mulai <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.start_date}
                    onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', fontSize: '0.8125rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Tanggal Selesai <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.end_date}
                    onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Batas Pendaftaran
                  </label>
                  <input
                    type="date"
                    value={createForm.registration_end}
                    onChange={(e) => setCreateForm({ ...createForm, registration_end: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', fontSize: '0.8125rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Tipe Produk
                  </label>
                  <select
                    value={createForm.product_type}
                    onChange={(e) => setCreateForm({ ...createForm, product_type: e.target.value as any })}
                    className="filter-select"
                    style={{ width: '100%', fontSize: '0.8125rem' }}
                  >
                    <option value="Existing">Existing Product</option>
                    <option value="NPD">NPD (Produk Baru C-Booster/Men)</option>
                    <option value="Both">Both (Existing &amp; NPD)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Syarat Diskon (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    placeholder="Contoh: 5"
                    value={createForm.required_discount}
                    onChange={(e) => setCreateForm({ ...createForm, required_discount: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    style={{ width: '100%', fontSize: '0.8125rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Target GMV (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 25000000"
                    value={createForm.estimated_gmv}
                    onChange={(e) => setCreateForm({ ...createForm, estimated_gmv: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    style={{ width: '100%', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Catatan / Link Campaign Marketplace
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan strategi, kuota produk, atau link Seller Centre..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.8125rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-outline"
                  style={{ fontSize: '0.8125rem' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ fontSize: '0.8125rem' }}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Hitung Skor & Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
