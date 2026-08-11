'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle, Clock, UploadCloud, ChevronRight, FileText, ShoppingCart, Store, Target, Activity } from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'
import * as xlsx from 'xlsx'

export default function DataSourcesPage() {
  const [dataSources, setDataSources] = useState<any[]>([])
  
  // Wizard State
  const [step, setStep] = useState(1) // 1: Upload, 2: Detect, 3: Map, 4: Validate, 5: Confirm
  const [fileData, setFileData] = useState<any>(null)
  const [detectedPlatform, setDetectedPlatform] = useState<string>('')
  const [detectedType, setDetectedType] = useState<string>('')
  const [mappings, setMappings] = useState<any>({})
  const [validation, setValidation] = useState<any>(null)
  const [duplicateAction, setDuplicateAction] = useState<'SKIP'|'REPLACE'>('SKIP')
  const [importStatus, setImportStatus] = useState<string>('')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const res = await fetch(`/api/data-sources`)
    const data = await res.json()
    if (data.dataSources) setDataSources(data.dataSources)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    
    let json: any[] = []
    let headers: string[] = []

    if (file.name.endsWith('.csv')) {
      const text = await file.text()
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
      json = parsed.data
      headers = parsed.meta.fields || []
    } else {
      const buffer = await file.arrayBuffer()
      const workbook = xlsx.read(buffer)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      json = xlsx.utils.sheet_to_json(sheet)
      headers = Object.keys(json[0] || {})
    }

    setFileData({ name: file.name, size: file.size, rows: json, headers })
    
    // Step 2: Auto Detect
    let p = 'UNKNOWN', t = 'SALES'
    const fn = file.name.toLowerCase()
    const hdrs = headers.join(' ').toLowerCase()
    
    if (fn.includes('shopee') || hdrs.includes('order amount')) p = 'Shopee'
    if (fn.includes('tiktok') || hdrs.includes('tiktok')) p = 'TikTok'
    if (fn.includes('tokopedia')) p = 'Tokopedia'
    if (fn.includes('meta') || hdrs.includes('campaign name')) p = 'Meta Ads'
    
    if (fn.includes('affiliate') || hdrs.includes('commission')) t = 'AFFILIATE'
    else if (fn.includes('ads') || hdrs.includes('spend')) t = 'ADS'
    else t = 'SALES'

    setDetectedPlatform(p)
    setDetectedType(t)
    
    // Step 3: Default Mappings
    const defaultMap: any = {}
    headers.forEach(h => {
      const hl = h.toLowerCase()
      if (hl.includes('date')) defaultMap[h] = 'date'
      if (hl.includes('sales') || hl.includes('gmv') || hl.includes('amount')) defaultMap[h] = 'sales'
      if (hl.includes('order')) defaultMap[h] = 'orders'
      if (hl.includes('commission')) defaultMap[h] = 'commission'
      if (hl.includes('click')) defaultMap[h] = 'clicks'
      if (hl.includes('affiliate id') || hl.includes('username')) defaultMap[h] = 'affiliate_id'
      if (hl.includes('affiliate name')) defaultMap[h] = 'affiliate_name'
    })
    setMappings(defaultMap)
    
    setStep(3)
  }

  const runValidation = async () => {
    // Map data
    const mappedRows = fileData.rows.map((row: any) => {
      const newRow: any = {}
      for (const src in mappings) {
        if (mappings[src]) newRow[mappings[src]] = row[src]
      }
      return newRow
    })

    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'validate',
        fileContent: Papa.unparse(fileData.rows),
        brandId: dataSources[0]?.brand_id, // Get brandId from loaded data sources
        platformId: dataSources.find(d => d.platform.name.includes(detectedPlatform))?.platform_id,
        sourceType: detectedType,
        mapping: mappings
      })
    })
    const data = await res.json()
    setValidation(data)
    setStep(4)
  }

  const confirmImport = async () => {
    setImportStatus('UPLOADING')
    
    const platformRec = dataSources.find(d => d.platform.name.includes(detectedPlatform))
    if (!platformRec) {
      setImportStatus('ERROR: Platform not configured')
      return
    }

    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'import',
        fileContent: Papa.unparse(fileData.rows),
        brandId: platformRec.brand_id,
        platformId: platformRec.platform_id,
        sourceType: detectedType,
        mapping: mappings,
        duplicateStrategy: duplicateAction
      })
    })

    const data = await res.json()
    if (res.ok) {
      setStats(data.summary)
      setStep(5)
    } else {
      alert(data.error)
      setImportStatus('FAILED')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px' }}>
      <div>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Import Marketplace & Marketing Data</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Upload reports exported from Shopee, TikTok Shop, Tokopedia, Meta Ads, and Affiliate platforms. EcomPilot will automatically analyze and normalize the data.</p>
      </div>
      </div>

      {step === 1 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Choose your data source</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {[
              { id: 'shopee', title: 'Shopee Seller Center', data: 'Sales, Orders, Products, Traffic, Affiliate', icon: ShoppingCart },
              { id: 'tiktok', title: 'TikTok Shop Seller Center', data: 'GMV, Orders, Products, Affiliate', icon: Store },
              { id: 'tokopedia', title: 'Tokopedia Seller Center', data: 'Sales, Orders, Products', icon: ShoppingCart },
              { id: 'shopee-aff', title: 'Shopee Affiliate', data: 'Commissions, Orders', icon: Target },
              { id: 'tiktok-aff', title: 'TikTok Affiliate', data: 'GMV, Creators', icon: Target },
              { id: 'meta-ads', title: 'Meta Ads', data: 'Spend, Clicks, Purchases, CPA', icon: Activity },
              { id: 'shopee-ads', title: 'Shopee Ads', data: 'Spend, Impressions, Conversions', icon: Activity },
              { id: 'tiktok-ads', title: 'TikTok Ads', data: 'Spend, Conversions', icon: Activity },
              { id: 'tokopedia-ads', title: 'Tokopedia Ads', data: 'Spend, Conversions', icon: Activity },
            ].map(card => (
              <div key={card.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ padding: '10px', backgroundColor: 'var(--surface-border)', borderRadius: '8px' }}>
                    <card.icon size={20} color="var(--primary)" />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{card.title}</h3>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px', flex: 1 }}>
                  Data: {card.data}
                </div>
                <label className="btn-primary" style={{ cursor: 'pointer', textAlign: 'center', display: 'block', width: '100%' }}>
                  Upload Report
                  <input type="file" style={{ display: 'none' }} accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
                </label>
              </div>
            ))}
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '64px 24px', border: '2px dashed var(--surface-border)', marginTop: '24px' }}>
            <UploadCloud size={48} style={{ margin: '0 auto 16px', color: 'var(--text-secondary)' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Drop your marketplace report here</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>EcomPilot will automatically detect the platform and report type. Supports .xlsx, .xls, .csv</p>
            <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-block' }}>
              Browse Files
              <input type="file" style={{ display: 'none' }} accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
            </label>
          </div>
        </>
      )}

      {step === 3 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3>Intelligent Column Mapping</h3>
          <div style={{ backgroundColor: 'var(--background)', padding: '16px', borderRadius: '8px' }}>
            <div>Detected Platform: <strong>{detectedPlatform}</strong></div>
            <div>Detected Report Type: <strong>{detectedType}</strong></div>
          </div>
          
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                <th style={{ padding: '8px' }}>Source Column (Excel)</th>
                <th style={{ padding: '8px' }}>EcomPilot Target Field</th>
              </tr>
            </thead>
            <tbody>
              {fileData.headers.map((h: string) => (
                <tr key={h} style={{ borderBottom: '1px solid var(--background)' }}>
                  <td style={{ padding: '8px' }}>{h}</td>
                  <td style={{ padding: '8px' }}>
                    <select 
                      value={mappings[h] || ''} 
                      onChange={e => setMappings({...mappings, [h]: e.target.value})}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--surface-border)' }}
                    >
                      <option value="">-- Ignore --</option>
                      <option value="date">Date</option>
                      <option value="sales">Sales / GMV</option>
                      <option value="orders">Orders</option>
                      <option value="spend">Spend</option>
                      <option value="commission">Commission</option>
                      <option value="clicks">Clicks</option>
                      <option value="affiliate_id">Affiliate ID / Username</option>
                      <option value="affiliate_name">Affiliate Name</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn-primary" style={{ alignSelf: 'flex-end' }} onClick={runValidation}>Validate Data</button>
        </div>
      )}
      {step === 4 && validation && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3>Validation & Deduplication</h3>
          
          {validation.workspaceMismatch && (
            <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', border: '1px solid var(--danger)' }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} />
                Potential Workspace Mismatch
              </div>
              <div style={{ marginTop: '4px', fontSize: '0.9rem' }}>
                This file appears to belong to another brand or workspace (Detected: <strong>{validation.detectedBrandName}</strong>). 
                It is highly recommended to cancel this import to prevent data contamination.
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{validation.totalRows}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Rows</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--success)' }}>{validation.validRows}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Valid</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--danger)' }}>{validation.invalidRows}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Errors</div>
            </div>
          </div>

          {validation.invalidRows > 0 ? (
            <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px' }}>
              Please fix the errors in your file before importing. (e.g. Missing dates, negative sales)
            </div>
          ) : (
            <>
              <div>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Duplicate Resolution</label>
                <select 
                  value={duplicateAction} 
                  onChange={e => setDuplicateAction(e.target.value as any)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}
                >
                  <option value="SKIP">Skip Duplicates (Recommended)</option>
                  <option value="REPLACE">Replace Existing</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button className="btn-secondary" onClick={() => setStep(3)}>Back</button>
                {validation.workspaceMismatch ? (
                  <button className="btn-primary" disabled style={{ opacity: 0.5 }}>Import Blocked</button>
                ) : (
                  <button 
                    className="btn-primary" 
                    onClick={confirmImport}
                    disabled={importStatus === 'UPLOADING'}
                  >
                    {importStatus === 'UPLOADING' ? 'Importing securely...' : 'Confirm & Import'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
      {step === 5 && stats && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center' }}>
          <CheckCircle size={48} color="var(--success)" />
          <h3>Import Successful!</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Data has been safely committed to the engine.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', width: '100%', marginTop: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{stats.processed}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Processed</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--success)' }}>{stats.created}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Created</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)' }}>{stats.updated}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Updated</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)' }}>{stats.skipped}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Skipped</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/" className="btn-primary" style={{ textDecoration: 'none' }}>View Dashboard</Link>
            <Link href="/marketplace-intelligence" className="btn-secondary" style={{ textDecoration: 'none' }}>View Marketplace Analytics</Link>
            <button className="btn-secondary" onClick={() => { setStep(1); setStats(null); setFileData(null); setValidation(null); }}>Import Another File</button>
          </div>
        </div>
      )}

    </div>
  )
}
