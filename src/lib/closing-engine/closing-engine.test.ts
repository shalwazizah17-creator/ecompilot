import { describe, it, expect } from 'vitest'
import {
  calculateClosingGroup,
  processClosingTransactions,
  getClosingPeriod,
  isOrderCancelled,
  RawOrderTransaction
} from './index'

describe('Closing Calculation Engine — Business Rules', () => {

  describe('Rule 1 & Test Case 1: 100 orders, 10 cancelled, same discount, same period', () => {
    it('should calculate valid_orders = 90 and final_closing_qty = 45', () => {
      // 90 orders valid, 10 orders cancelled
      const txs: RawOrderTransaction[] = [
        ...Array.from({ length: 90 }).map((_, i) => ({
          id: `valid-${i}`,
          orderNumber: `ORD-V-${i}`,
          date: '2026-09-05',
          month: 'September',
          period: 'PERIOD_1' as const,
          marketplace: 'Shopee',
          promotionCategory: 'Voucher Toko',
          promotionName: 'Voucher 5K',
          sku: 'SKU-THERASKIN-01',
          price: 50000,
          discountAmount: 5000,
          quantity: 1,
          orderStatus: 'Selesai'
        })),
        ...Array.from({ length: 10 }).map((_, i) => ({
          id: `cancelled-${i}`,
          orderNumber: `ORD-C-${i}`,
          date: '2026-09-06',
          month: 'September',
          period: 'PERIOD_1' as const,
          marketplace: 'Shopee',
          promotionCategory: 'Voucher Toko',
          promotionName: 'Voucher 5K',
          sku: 'SKU-THERASKIN-01',
          price: 50000,
          discountAmount: 5000,
          quantity: 1,
          orderStatus: 'Batal'
        }))
      ]

      const result = calculateClosingGroup(txs)

      expect(result.totalOrders).toBe(100)
      expect(result.cancelledOrders).toBe(10)
      expect(result.validOrders).toBe(90)
      expect(result.hasSameDiscountInPeriod).toBe(true)
      expect(result.appliedRule).toBe('DIVIDE_VALID_ORDERS_BY_2')
      expect(result.finalClosingQty).toBe(45) // (100 - 10) ÷ 2 = 45
      expect(result.totalBiayaPromo).toBe(45 * 5000) // 225,000
      expect(result.formulaDescription).toContain('(100 total - 10 batal) ÷ 2 = 45')
    })
  })

  describe('Test Case 2: 100 orders, 0 cancelled, same discount, same period', () => {
    it('should calculate valid_orders = 100 and final_closing_qty = 50', () => {
      const txs: RawOrderTransaction[] = Array.from({ length: 100 }).map((_, i) => ({
        id: `valid-${i}`,
        orderNumber: `ORD-V-${i}`,
        date: '2026-09-10',
        month: 'September',
        period: 'PERIOD_1' as const,
        marketplace: 'Shopee',
        promotionCategory: 'Voucher Toko',
        promotionName: 'Voucher 5K',
        sku: 'SKU-THERASKIN-01',
        price: 50000,
        discountAmount: 5000,
        quantity: 1,
        orderStatus: 'Selesai'
      }))

      const result = calculateClosingGroup(txs)

      expect(result.totalOrders).toBe(100)
      expect(result.cancelledOrders).toBe(0)
      expect(result.validOrders).toBe(100)
      expect(result.appliedRule).toBe('DIVIDE_VALID_ORDERS_BY_2')
      expect(result.finalClosingQty).toBe(50) // 100 ÷ 2 = 50
    })
  })

  describe('Test Case 3: 100 orders, 10 cancelled, different discount, same period', () => {
    it('should NOT combine or apply divide-by-2 across different discounts', () => {
      // 50 orders at Rp 5.000 (5 cancelled)
      // 50 orders at Rp 10.000 (5 cancelled)
      const txs: RawOrderTransaction[] = [
        ...Array.from({ length: 45 }).map((_, i) => ({
          id: `disc5k-v-${i}`,
          orderNumber: `ORD-5K-${i}`,
          date: '2026-09-08',
          month: 'September',
          period: 'PERIOD_1' as const,
          marketplace: 'Shopee',
          promotionCategory: 'Voucher Toko',
          promotionName: 'Voucher 5K',
          sku: 'SKU-01',
          price: 50000,
          discountAmount: 5000,
          quantity: 1,
          orderStatus: 'Selesai'
        })),
        ...Array.from({ length: 5 }).map((_, i) => ({
          id: `disc5k-c-${i}`,
          orderNumber: `ORD-5K-C-${i}`,
          date: '2026-09-08',
          month: 'September',
          period: 'PERIOD_1' as const,
          marketplace: 'Shopee',
          promotionCategory: 'Voucher Toko',
          promotionName: 'Voucher 5K',
          sku: 'SKU-01',
          price: 50000,
          discountAmount: 5000,
          quantity: 1,
          orderStatus: 'Dibatalkan'
        })),
        ...Array.from({ length: 45 }).map((_, i) => ({
          id: `disc10k-v-${i}`,
          orderNumber: `ORD-10K-${i}`,
          date: '2026-09-08',
          month: 'September',
          period: 'PERIOD_1' as const,
          marketplace: 'Shopee',
          promotionCategory: 'Voucher Toko',
          promotionName: 'Voucher 10K',
          sku: 'SKU-01',
          price: 80000,
          discountAmount: 10000,
          quantity: 1,
          orderStatus: 'Selesai'
        })),
        ...Array.from({ length: 5 }).map((_, i) => ({
          id: `disc10k-c-${i}`,
          orderNumber: `ORD-10K-C-${i}`,
          date: '2026-09-08',
          month: 'September',
          period: 'PERIOD_1' as const,
          marketplace: 'Shopee',
          promotionCategory: 'Voucher Toko',
          promotionName: 'Voucher 10K',
          sku: 'SKU-01',
          price: 80000,
          discountAmount: 10000,
          quantity: 1,
          orderStatus: 'Batal'
        }))
      ]

      const batchResult = processClosingTransactions(txs)

      // Must be 2 separate groups!
      expect(batchResult.groups.length).toBe(2)

      const group5k = batchResult.groups.find(g => g.discountAmount === 5000)!
      const group10k = batchResult.groups.find(g => g.discountAmount === 10000)!

      expect(group5k).toBeDefined()
      expect(group10k).toBeDefined()

      // Group 5k: (50 - 5) ÷ 2 = 22.5
      expect(group5k.totalOrders).toBe(50)
      expect(group5k.cancelledOrders).toBe(5)
      expect(group5k.validOrders).toBe(45)
      expect(group5k.finalClosingQty).toBe(22.5)

      // Group 10k: (50 - 5) ÷ 2 = 22.5
      expect(group10k.totalOrders).toBe(50)
      expect(group10k.cancelledOrders).toBe(5)
      expect(group10k.validOrders).toBe(45)
      expect(group10k.finalClosingQty).toBe(22.5)

      // Ensure they were NOT merged into 1 group with mixed discounts
      expect(batchResult.summary.totalRawOrders).toBe(100)
      expect(batchResult.summary.totalCancelledOrders).toBe(10)
      expect(batchResult.summary.totalValidOrders).toBe(90)
      expect(batchResult.summary.totalFinalClosingQty).toBe(45)
    })
  })

  describe('Test Case 4: 100 orders, 10 cancelled, same discount, different period', () => {
    it('should NOT combine transactions from Period 1 and Period 2', () => {
      // 50 orders in Period 1 (1–15 Sept), 5 cancelled
      // 50 orders in Period 2 (16–30 Sept), 5 cancelled
      const txs: RawOrderTransaction[] = [
        ...Array.from({ length: 45 }).map((_, i) => ({
          id: `p1-v-${i}`,
          orderNumber: `ORD-P1-${i}`,
          date: '2026-09-05', // Period 1
          month: 'September',
          marketplace: 'Shopee',
          promotionCategory: 'Voucher Toko',
          promotionName: 'Voucher 5K',
          sku: 'SKU-01',
          price: 50000,
          discountAmount: 5000,
          quantity: 1,
          orderStatus: 'Selesai'
        })),
        ...Array.from({ length: 5 }).map((_, i) => ({
          id: `p1-c-${i}`,
          orderNumber: `ORD-P1-C-${i}`,
          date: '2026-09-05',
          month: 'September',
          marketplace: 'Shopee',
          promotionCategory: 'Voucher Toko',
          promotionName: 'Voucher 5K',
          sku: 'SKU-01',
          price: 50000,
          discountAmount: 5000,
          quantity: 1,
          orderStatus: 'Cancelled'
        })),
        ...Array.from({ length: 45 }).map((_, i) => ({
          id: `p2-v-${i}`,
          orderNumber: `ORD-P2-${i}`,
          date: '2026-09-20', // Period 2
          month: 'September',
          marketplace: 'Shopee',
          promotionCategory: 'Voucher Toko',
          promotionName: 'Voucher 5K',
          sku: 'SKU-01',
          price: 50000,
          discountAmount: 5000,
          quantity: 1,
          orderStatus: 'Selesai'
        })),
        ...Array.from({ length: 5 }).map((_, i) => ({
          id: `p2-c-${i}`,
          orderNumber: `ORD-P2-C-${i}`,
          date: '2026-09-22',
          month: 'September',
          marketplace: 'Shopee',
          promotionCategory: 'Voucher Toko',
          promotionName: 'Voucher 5K',
          sku: 'SKU-01',
          price: 50000,
          discountAmount: 5000,
          quantity: 1,
          orderStatus: 'Batal'
        }))
      ]

      const batchResult = processClosingTransactions(txs)

      expect(batchResult.groups.length).toBe(2)

      const groupP1 = batchResult.groups.find(g => g.closingPeriod === 'PERIOD_1')!
      const groupP2 = batchResult.groups.find(g => g.closingPeriod === 'PERIOD_2')!

      expect(groupP1).toBeDefined()
      expect(groupP2).toBeDefined()
      expect(groupP1.validOrders).toBe(45)
      expect(groupP1.finalClosingQty).toBe(22.5)
      expect(groupP2.validOrders).toBe(45)
      expect(groupP2.finalClosingQty).toBe(22.5)
    })
  })

  describe('Test Case 5: 100 orders, 10 cancelled, same SKU, different discount', () => {
    it('should NOT combine two different discounts on the same SKU', () => {
      const txs: RawOrderTransaction[] = [
        ...Array.from({ length: 45 }).map((_, i) => ({
          id: `v-disc3k-${i}`,
          orderNumber: `ORD-3K-${i}`,
          date: '2026-09-10',
          month: 'September',
          period: 'PERIOD_1' as const,
          marketplace: 'Shopee',
          promotionCategory: 'Paket Diskon',
          promotionName: 'Paket Hemat 3K',
          sku: 'FPK00000033',
          price: 200000,
          discountAmount: 3000,
          quantity: 1,
          orderStatus: 'Selesai'
        })),
        ...Array.from({ length: 5 }).map((_, i) => ({
          id: `c-disc3k-${i}`,
          orderNumber: `ORD-3K-C-${i}`,
          date: '2026-09-10',
          month: 'September',
          period: 'PERIOD_1' as const,
          marketplace: 'Shopee',
          promotionCategory: 'Paket Diskon',
          promotionName: 'Paket Hemat 3K',
          sku: 'FPK00000033',
          price: 200000,
          discountAmount: 3000,
          quantity: 1,
          orderStatus: 'Retur'
        })),
        ...Array.from({ length: 45 }).map((_, i) => ({
          id: `v-disc7k-${i}`,
          orderNumber: `ORD-7K-${i}`,
          date: '2026-09-10',
          month: 'September',
          period: 'PERIOD_1' as const,
          marketplace: 'Shopee',
          promotionCategory: 'Promo Flash Sale',
          promotionName: 'Flash Sale 7K',
          sku: 'FPK00000033',
          price: 200000,
          discountAmount: 7000,
          quantity: 1,
          orderStatus: 'Selesai'
        })),
        ...Array.from({ length: 5 }).map((_, i) => ({
          id: `c-disc7k-${i}`,
          orderNumber: `ORD-7K-C-${i}`,
          date: '2026-09-10',
          month: 'September',
          period: 'PERIOD_1' as const,
          marketplace: 'Shopee',
          promotionCategory: 'Promo Flash Sale',
          promotionName: 'Flash Sale 7K',
          sku: 'FPK00000033',
          price: 200000,
          discountAmount: 7000,
          quantity: 1,
          orderStatus: 'Batal'
        }))
      ]

      const batchResult = processClosingTransactions(txs)
      expect(batchResult.groups.length).toBe(2)

      const group3k = batchResult.groups.find(g => g.discountAmount === 3000)!
      const group7k = batchResult.groups.find(g => g.discountAmount === 7000)!

      expect(group3k.sku).toBe('FPK00000033')
      expect(group7k.sku).toBe('FPK00000033')
      expect(group3k.discountAmount).toBe(3000)
      expect(group7k.discountAmount).toBe(7000)
      expect(group3k.finalClosingQty).toBe(22.5)
      expect(group7k.finalClosingQty).toBe(22.5)
    })
  })

  describe('Calculation Order Verification: MUST be (Total - Cancelled) ÷ 2', () => {
    it('strictly checks that cancelled orders are subtracted BEFORE dividing by 2', () => {
      const txs: RawOrderTransaction[] = [
        ...Array.from({ length: 90 }).map((_, i) => ({
          id: `v-${i}`,
          orderNumber: `ORD-${i}`,
          date: '2026-09-02',
          month: 'September',
          period: 'PERIOD_1' as const,
          marketplace: 'Shopee',
          promotionCategory: 'Voucher Toko',
          promotionName: 'Voucher 5K',
          sku: 'SKU-01',
          price: 50000,
          discountAmount: 5000,
          quantity: 1,
          orderStatus: 'Selesai'
        })),
        ...Array.from({ length: 10 }).map((_, i) => ({
          id: `c-${i}`,
          orderNumber: `ORD-C-${i}`,
          date: '2026-09-02',
          month: 'September',
          period: 'PERIOD_1' as const,
          marketplace: 'Shopee',
          promotionCategory: 'Voucher Toko',
          promotionName: 'Voucher 5K',
          sku: 'SKU-01',
          price: 50000,
          discountAmount: 5000,
          quantity: 1,
          orderStatus: 'Cancelled'
        }))
      ]

      const result = calculateClosingGroup(txs)

      // Correct: (100 - 10) ÷ 2 = 45
      // WRONG: (100 ÷ 2) - 10 = 40
      expect(result.finalClosingQty).toBe(45)
      expect(result.finalClosingQty).not.toBe(40)
    })
  })

  describe('Period Helper: getClosingPeriod', () => {
    it('correctly categorizes day 1-15 as PERIOD_1 and day 16+ as PERIOD_2', () => {
      expect(getClosingPeriod('2026-09-01')).toBe('PERIOD_1')
      expect(getClosingPeriod('2026-09-15')).toBe('PERIOD_1')
      expect(getClosingPeriod('2026-09-16')).toBe('PERIOD_2')
      expect(getClosingPeriod('2026-09-30')).toBe('PERIOD_2')
      expect(getClosingPeriod('2026-10-31')).toBe('PERIOD_2')
    })
  })

  describe('Cancelled Status Keyword Matcher', () => {
    it('identifies cancelled, batal, and retur statuses', () => {
      expect(isOrderCancelled('Dibatalkan')).toBe(true)
      expect(isOrderCancelled('BATAL')).toBe(true)
      expect(isOrderCancelled('Cancelled by Buyer')).toBe(true)
      expect(isOrderCancelled('Canceled')).toBe(true)
      expect(isOrderCancelled('Pengembalian Barang / Retur')).toBe(true)
      expect(isOrderCancelled('Selesai')).toBe(false)
      expect(isOrderCancelled('Dikirim')).toBe(false)
      expect(isOrderCancelled('Perlu Dikirim')).toBe(false)
    })
  })
})
