'use client'

import { useStore } from '@/store/useStore'
import { MarketingAdvisor } from '@/components/MarketingAdvisor'

export default function MarketingAdvisorPage() {
  const { selectedBrandId } = useStore()
  const brandId = selectedBrandId || 'cm0m2xxxx0000000000000000'

  return (
    <div className="fade-in">
      <MarketingAdvisor brandId={brandId} />
    </div>
  )
}
