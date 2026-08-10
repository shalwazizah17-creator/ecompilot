'use client'

import { useStore } from '@/store/useStore'
import { ProductAnalytics } from '@/components/ProductAnalytics'

export default function ProductAnalyticsPage() {
  const { selectedBrandId } = useStore()
  const brandId = selectedBrandId || 'cm0m2xxxx0000000000000000'

  return (
    <div className="fade-in">
      <ProductAnalytics brandId={brandId} />
    </div>
  )
}
