'use client'

import { useStore } from '@/store/useStore'
import { ActionCenter } from '@/components/ActionCenter'

export default function ActionCenterPage() {
  const { selectedBrandId } = useStore()
  const brandId = selectedBrandId || 'cm0m2xxxx0000000000000000'

  return (
    <div className="fade-in">
      <ActionCenter brandId={brandId} />
    </div>
  )
}
