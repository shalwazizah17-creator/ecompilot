import { describe, it, expect } from 'vitest'
import {
  THERASKIN_MASTER_CATALOG,
  recalculatePromoItem,
  validatePromoItemBeforeSave,
  generateMonthlyPromoPlan,
  duplicateMonthlyPromoPlan,
  INITIAL_REUSABLE_PROMO_PLANS
} from './master-data'

describe('Promo Planner Master Data & Validation Engine', () => {
  it('ensures all 30 Theraskin Master Catalog items have Bottom Price = 97% of Harga OB and maxSafeDiscount <= 5%', () => {
    expect(THERASKIN_MASTER_CATALOG.length).toBeGreaterThanOrEqual(25)
    for (const product of THERASKIN_MASTER_CATALOG) {
      expect(product.bottomPrice).toBe(Math.round(product.hargaOB * 0.97))
      expect(product.maxSafeDiscount).toBeLessThanOrEqual(5)
      const promoAtMaxDisc = product.hargaBulanan - Math.round((product.hargaBulanan * product.maxSafeDiscount) / 100)
      expect(promoAtMaxDisc).toBeGreaterThanOrEqual(product.bottomPrice)
    }
  })

  it('recalculates Columns A-X accurately and flags discount > 5% or Harga Promo < Bottom Price', () => {
    const safeItem = recalculatePromoItem({
      marketplace: 'Shopee',
      kategori: 'Campaign',
      channel: 'Campaign',
      subKategori: 'Double Date',
      periode: 'Double Date',
      tanggal: '9 - 11 Oktober',
      sku: 'FVD01B0015C',
      productName: 'Theraskin Daily C-Booster Serum',
      hargaBulanan: 58000,
      diskonPercent: 4,
      qty: 100,
      hargaOB: 52000
    })

    expect(safeItem.totalDiskon).toBe(2320)
    expect(safeItem.hargaPromo).toBe(55680)
    expect(safeItem.totalPromosi).toBe(5568000)
    expect(safeItem.estimasiGmv).toBe(5568000)
    expect(safeItem.biayaPromo).toBe(232000)
    expect(safeItem.bottomPrice).toBe(50440)
    expect(safeItem.statusMargin).toBe('AMAN')
    expect(safeItem.discountStatus).toBe('VALID')

    const unsafeItem = recalculatePromoItem({
      ...safeItem,
      diskonPercent: 10
    })
    expect(unsafeItem.discountStatus).toBe('TIDAK VALID')
  })

  it('validates promo items before save and blocks invalid discounts or margin violations', () => {
    const validRes = validatePromoItemBeforeSave({
      marketplace: 'Shopee',
      kategori: 'Toko',
      subKategori: 'Paket Diskon',
      periode: 'BAU',
      tanggal: '12 - 24 Oktober',
      sku: 'FVD01B0015C',
      productName: 'Theraskin Daily C-Booster Serum',
      hargaBulanan: 58000,
      diskonPercent: 4,
      qty: 80,
      hargaOB: 52000
    })
    expect(validRes.isValid).toBe(true)
    expect(validRes.errors).toHaveLength(0)

    const invalidRes = validatePromoItemBeforeSave({
      marketplace: 'Shopee',
      kategori: 'Toko',
      subKategori: 'Paket Diskon',
      periode: 'BAU',
      tanggal: '12 - 24 Oktober',
      sku: 'FVD01B0015C',
      productName: 'Theraskin Daily C-Booster Serum',
      hargaBulanan: 58000,
      diskonPercent: 8,
      qty: 80,
      hargaOB: 52000
    })
    expect(invalidRes.isValid).toBe(false)
    expect(invalidRes.errors.some(e => e.includes('melebihi batas maksimal 5%'))).toBe(true)
  })

  it('generates and duplicates monthly promo plans with 100% AMAN margin and <= 5% discount', () => {
    const oktPlan = generateMonthlyPromoPlan({
      bulan: 'Oktober',
      tahun: 2026,
      marketplaces: ['Shopee', 'TikTok Shop', 'Lazada'],
      channels: ['Campaign', 'Toko', 'Live Streaming', 'Digital Marketing']
    })
    expect(oktPlan.length).toBeGreaterThan(0)
    expect(oktPlan.every(i => i.diskonPercent <= 5 && i.statusMargin === 'AMAN')).toBe(true)

    const novDuplicated = duplicateMonthlyPromoPlan(oktPlan, 'November', 2026)
    expect(novDuplicated.length).toBe(oktPlan.length)
    expect(novDuplicated.every(i => i.bulan === 'November' && i.tanggal.includes('November'))).toBe(true)
    expect(novDuplicated.every(i => i.diskonPercent <= 5 && i.statusMargin === 'AMAN')).toBe(true)
  })

  it('ensures all INITIAL_REUSABLE_PROMO_PLANS across September-Desember 2026 are valid', () => {
    expect(INITIAL_REUSABLE_PROMO_PLANS.length).toBeGreaterThan(20)
    for (const item of INITIAL_REUSABLE_PROMO_PLANS) {
      expect(item.diskonPercent).toBeLessThanOrEqual(5)
      expect(item.statusMargin).toBe('AMAN')
      expect(item.hargaPromo).toBeGreaterThanOrEqual(item.bottomPrice)
    }
  })
})
