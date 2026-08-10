'use client'

import { useState, Suspense } from 'react'
import { Sidebar } from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import { GlobalFilters } from '@/components/GlobalFilters'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-container">
      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setSidebarOpen(false)} 
      />

      {/* Sidebar Wrapper */}
      <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="main-content">
        <Suspense fallback={<div style={{ height: '64px' }} />}>
          <TopNav onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
        </Suspense>
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Suspense fallback={<div style={{ padding: '16px' }}>Loading filters...</div>}>
            <GlobalFilters />
          </Suspense>
          <div style={{ padding: '24px' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
