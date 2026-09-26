'use client'

import React from 'react'
import { Eye, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react'
import {
  PromoPlanItem,
  PromoCategory,
  PromoChannel,
  DEFAULT_SUB_CATEGORIES_BY_CATEGORY
} from '@/lib/promo-planner/master-data'

interface MasterSheetTableProps {
  items: PromoPlanItem[]
  inlineEditMode: boolean
  customSubCategories: string[]
  onInlineUpdate: (id: string, changes: Partial<PromoPlanItem>) => void
  onSelectCampaign: (item: PromoPlanItem) => void
  onDeleteItem: (id: string, e?: React.MouseEvent) => void
  renderMarketplaceBadge: (platform: string) => React.ReactNode
}

export function PromoMasterSheetTable({
  items,
  inlineEditMode,
  customSubCategories,
  onInlineUpdate,
  onSelectCampaign,
  onDeleteItem,
  renderMarketplaceBadge
}: MasterSheetTableProps) {
  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ overflowX: 'auto', maxHeight: '720px' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '0.78rem', minWidth: '2350px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ backgroundColor: '#F8FAFC', color: '#334155', fontWeight: 700, borderBottom: '2px solid var(--surface-border)' }}>
              <th style={{ padding: '10px 12px', position: 'sticky', left: 0, backgroundColor: '#F8FAFC', zIndex: 11, borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B' }}>[A]</div>Marketplace
              </th>
              <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B' }}>[B]</div>Kategori
              </th>
              <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B' }}>[C]</div>Sub Kategori
              </th>
              <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B' }}>[D]</div>Periode
              </th>
              <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B' }}>[E]</div>Tanggal
              </th>
              <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B' }}>[F]</div>SKU
              </th>
              <th style={{ padding: '10px 12px', minWidth: '210px', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B' }}>[G]</div>Product Name
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B' }}>[H]</div>Harga Bulanan
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B' }}>[I] MAKS 5%</div>Diskon (%)
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B' }}>[J]</div>Total Diskon
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'right', backgroundColor: '#FEF08A', color: '#854D0E', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#854D0E' }}>[K] HARGA PROMO</div>Harga Promo
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B' }}>[L]</div>Qty
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B' }}>[M] PROMO × QTY</div>Total Promosi
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'center', backgroundColor: '#FEFCE8', color: '#854D0E', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#854D0E' }}>[N]</div>Total Qty 1-15
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'right', backgroundColor: '#FEFCE8', color: '#B45309', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#B45309' }}>[O]</div>Biaya 1-15
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'center', backgroundColor: '#F0FDF4', color: '#166534', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#166534' }}>[P]</div>Total Qty 16-31
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'right', backgroundColor: '#F0FDF4', color: '#15803D', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#15803D' }}>[Q]</div>Biaya 16-31
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'right', backgroundColor: '#EFF6FF', color: '#1D4ED8', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#1D4ED8' }}>[R]</div>Estimasi GMV
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'right', backgroundColor: '#F1F5F9', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#475569' }}>[S]</div>Harga OB
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'right', backgroundColor: '#E2E8F0', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#334155' }}>[T] OB - 3%</div>Bottom Price
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'center', backgroundColor: '#E2E8F0', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#334155' }}>[U]</div>Status Margin
              </th>
              <th style={{ padding: '10px 12px', minWidth: '180px', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B' }}>[V]</div>Campaign Name
              </th>
              <th style={{ padding: '10px 12px', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B' }}>[W]</div>Channel
              </th>
              <th style={{ padding: '10px 12px', minWidth: '180px', borderBottom: '2px solid var(--surface-border)' }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B' }}>[X]</div>Catatan
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '2px solid var(--surface-border)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const isSafe = item.statusMargin === 'AMAN'
              const isDiscValid = item.discountStatus === 'VALID'
              const subCats = [
                ...(DEFAULT_SUB_CATEGORIES_BY_CATEGORY[item.kategori] || []),
                ...customSubCategories
              ]

              return (
                <tr
                  key={item.id}
                  onClick={() => { if (!inlineEditMode) onSelectCampaign(item) }}
                  style={{
                    borderBottom: '1px solid var(--surface-border)',
                    cursor: inlineEditMode ? 'default' : 'pointer',
                    backgroundColor: !isSafe || !isDiscValid ? '#FFF1F2' : '#FFFFFF'
                  }}
                >
                  {/* A: Marketplace */}
                  <td style={{ padding: '8px 12px', position: 'sticky', left: 0, backgroundColor: !isSafe || !isDiscValid ? '#FFF1F2' : '#FFFFFF', zIndex: 5 }}>
                    {renderMarketplaceBadge(item.marketplace)}
                  </td>

                  {/* B: Kategori */}
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                    {inlineEditMode ? (
                      <select
                        value={item.kategori}
                        onChange={e => onInlineUpdate(item.id, { kategori: e.target.value as PromoCategory })}
                        className="filter-select"
                        style={{ fontSize: '0.74rem', padding: '3px 6px' }}
                      >
                        <option value="Campaign">Campaign</option>
                        <option value="Toko">Toko</option>
                        <option value="Live Streaming">Live Streaming</option>
                        <option value="Digital Marketing">Digital Marketing</option>
                        <option value="Brand Membership">Brand Membership</option>
                      </select>
                    ) : (
                      item.kategori
                    )}
                  </td>

                  {/* C: Sub Kategori */}
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                    {inlineEditMode ? (
                      <select
                        value={item.subKategori}
                        onChange={e => onInlineUpdate(item.id, { subKategori: e.target.value })}
                        className="filter-select"
                        style={{ fontSize: '0.74rem', padding: '3px 6px' }}
                      >
                        {Array.from(new Set([item.subKategori, ...subCats])).map(sc => (
                          <option key={sc} value={sc}>{sc}</option>
                        ))}
                      </select>
                    ) : (
                      item.subKategori
                    )}
                  </td>

                  {/* D: Periode */}
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{item.periode}</td>

                  {/* E: Tanggal */}
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    {inlineEditMode ? (
                      <input
                        type="text"
                        value={item.tanggal}
                        onChange={e => onInlineUpdate(item.id, { tanggal: e.target.value })}
                        className="input-field"
                        style={{ width: '130px', fontSize: '0.74rem', padding: '3px 6px' }}
                      />
                    ) : (
                      item.tanggal
                    )}
                  </td>

                  {/* F: SKU */}
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#1E293B' }}>
                    {item.sku}
                  </td>

                  {/* G: Product Name */}
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{item.productName}</td>

                  {/* H: Harga Bulanan */}
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    Rp {item.hargaBulanan.toLocaleString('id-ID')}
                  </td>

                  {/* I: Diskon (%) */}
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    {inlineEditMode ? (
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.5}
                        value={item.diskonPercent}
                        onChange={e => onInlineUpdate(item.id, { diskonPercent: Number(e.target.value) })}
                        className="input-field"
                        style={{
                          width: '62px',
                          textAlign: 'center',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          padding: '3px 4px',
                          borderColor: isDiscValid ? '#CBD5E1' : '#DC2626',
                          color: isDiscValid ? '#0F172A' : '#DC2626'
                        }}
                      />
                    ) : (
                      <span style={{ fontWeight: 800, color: isDiscValid ? '#EA580C' : '#DC2626' }}>
                        {item.diskonPercent}% {!isDiscValid && '⚠️'}
                      </span>
                    )}
                  </td>

                  {/* J: Total Diskon */}
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#D97706', fontWeight: 600 }}>
                    Rp {item.totalDiskon.toLocaleString('id-ID')}
                  </td>

                  {/* K: Harga Promo */}
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, backgroundColor: '#FEF9C3', color: '#854D0E' }}>
                    Rp {item.hargaPromo.toLocaleString('id-ID')}
                  </td>

                  {/* L: Qty */}
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    {inlineEditMode ? (
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={e => onInlineUpdate(item.id, { qty: Number(e.target.value) })}
                        className="input-field"
                        style={{ width: '68px', textAlign: 'center', fontWeight: 700, fontSize: '0.75rem', padding: '3px 4px' }}
                      />
                    ) : (
                      <span style={{ fontWeight: 700 }}>{item.qty}</span>
                    )}
                  </td>

                  {/* M: Total Promosi (Harga Promo * Qty) */}
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#2563EB' }}>
                    Rp {item.totalPromosi.toLocaleString('id-ID')}
                  </td>

                  {/* N: Total Qty 1-15 */}
                  <td style={{ padding: '8px 12px', textAlign: 'center', backgroundColor: '#FEFCE8', fontWeight: 700 }}>
                    {item.qtyP1}
                  </td>

                  {/* O: Biaya 1-15 */}
                  <td style={{ padding: '8px 12px', textAlign: 'right', backgroundColor: '#FEFCE8', color: '#B45309', fontWeight: 600 }}>
                    Rp {item.biayaP1.toLocaleString('id-ID')}
                  </td>

                  {/* P: Total Qty 16-31 */}
                  <td style={{ padding: '8px 12px', textAlign: 'center', backgroundColor: '#F0FDF4', fontWeight: 700 }}>
                    {item.qtyP2}
                  </td>

                  {/* Q: Biaya 16-31 */}
                  <td style={{ padding: '8px 12px', textAlign: 'right', backgroundColor: '#F0FDF4', color: '#15803D', fontWeight: 600 }}>
                    Rp {item.biayaP2.toLocaleString('id-ID')}
                  </td>

                  {/* R: Estimasi GMV */}
                  <td style={{ padding: '8px 12px', textAlign: 'right', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 800 }}>
                    Rp {item.estimasiGmv.toLocaleString('id-ID')}
                  </td>

                  {/* S: Harga OB */}
                  <td style={{ padding: '8px 12px', textAlign: 'right', backgroundColor: '#F8FAFC' }}>
                    Rp {item.hargaOB.toLocaleString('id-ID')}
                  </td>

                  {/* T: Bottom Price */}
                  <td style={{ padding: '8px 12px', textAlign: 'right', backgroundColor: '#F1F5F9', fontWeight: 700 }}>
                    Rp {item.bottomPrice.toLocaleString('id-ID')}
                  </td>

                  {/* U: Status Margin */}
                  <td style={{ padding: '8px 12px', textAlign: 'center', backgroundColor: '#F8FAFC' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      backgroundColor: isSafe && isDiscValid ? '#ECFDF5' : '#FEF2F2',
                      color: isSafe && isDiscValid ? '#047857' : '#DC2626'
                    }}>
                      {isSafe && isDiscValid ? <ShieldCheck size={11} /> : <AlertTriangle size={11} />}
                      {!isDiscValid ? 'DISKON > 5%' : item.statusMargin}
                    </span>
                  </td>

                  {/* V: Campaign Name */}
                  <td style={{ padding: '8px 12px' }}>
                    {inlineEditMode ? (
                      <input
                        type="text"
                        value={item.campaignName}
                        onChange={e => onInlineUpdate(item.id, { campaignName: e.target.value })}
                        className="input-field"
                        style={{ width: '170px', fontSize: '0.74rem', padding: '3px 6px' }}
                      />
                    ) : (
                      <span style={{ fontWeight: 600 }}>{item.campaignName}</span>
                    )}
                  </td>

                  {/* W: Channel */}
                  <td style={{ padding: '8px 12px' }}>
                    {inlineEditMode ? (
                      <select
                        value={item.channel}
                        onChange={e => onInlineUpdate(item.id, { channel: e.target.value as PromoChannel })}
                        className="filter-select"
                        style={{ fontSize: '0.74rem', padding: '3px 6px' }}
                      >
                        <option value="Campaign">Campaign</option>
                        <option value="Toko">Toko</option>
                        <option value="Live Streaming">Live Streaming</option>
                        <option value="Digital Marketing">Digital Marketing</option>
                        <option value="Brand Membership">Brand Membership</option>
                      </select>
                    ) : (
                      <span style={{ fontWeight: 600, color: '#334155' }}>{item.channel}</span>
                    )}
                  </td>

                  {/* X: Catatan */}
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.notes}>
                    {item.notes || '-'}
                  </td>

                  {/* Aksi */}
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button
                        onClick={e => { e.stopPropagation(); onSelectCampaign(item) }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                        title="Lihat Detail"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={e => onDeleteItem(item.id, e)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                        title="Hapus Baris"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
