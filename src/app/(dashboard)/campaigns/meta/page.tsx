'use client'

import { useStore } from '@/store/useStore'
import { MetaAdsAnalytics } from '@/components/MetaAdsAnalytics'

export default function MetaAdsPage() {
  const { selectedBrandId } = useStore()
  const brandId = selectedBrandId || 'cm0m2xxxx0000000000000000'

  return (
    <div className="fade-in">
      <MetaAdsAnalytics brandId={brandId} />
    </div>
  )
}
