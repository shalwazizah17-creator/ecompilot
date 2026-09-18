import { describe, it, expect } from 'vitest'
import {
  calculateClosingGroup,
  processClosingTransactions,
  getClosingPeriod,
  isOrderCancelled,
  getDaysInMonth,
  getDynamicPeriodLabels,
  generateMasterClosingTSV,
  generateStandardMasterClosingTSV,
  generatePatokanValuesTSV,
  detectMarketplacePlatform,
  normalizeRawOrder,
  RawOrderTransaction
} from './index'

describe('Closing Calculation Engine — Business Rules', () => {

  describe('Rule 1 & Test Case 1: 100 orders, 10 cancelled, same discount, same period', () => {
    it('should calculate valid_orders = 90 and final_closing_qty = 45 when duplicate promo exists', () => {
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

  describe('Rule 3: Duplicate Discount Rule vs Unique Promo', () => {
    it('applies divide-by-2 when duplicate promo exists in the same period', () => {
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
        orderStatus: 'Selesai',
        isDuplicatePromo: true
      }))

      const result = calculateClosingGroup(txs, undefined, true)
      expect(result.appliedRule).toBe('DIVIDE_VALID_ORDERS_BY_2')
      expect(result.finalClosingQty).toBe(50) // 100 ÷ 2 = 50
    })

    it('keeps Final QTY = Valid QTY when promo is UNIQUE (no duplicate promo in period)', () => {
      const txs: RawOrderTransaction[] = [
        ...Array.from({ length: 80 }).map((_, i) => ({
          id: `valid-${i}`,
          orderNumber: `ORD-V-${i}`,
          date: '2026-09-10',
          month: 'September',
          period: 'PERIOD_1' as const,
          marketplace: 'Shopee',
          promotionCategory: 'Promo Flash Sale',
          promotionName: 'Flash Sale Unique',
          sku: 'SKU-THERASKIN-02',
          price: 60000,
          discountAmount: 10000,
          quantity: 1,
          orderStatus: 'Selesai',
          isDuplicatePromo: false
        })),
        ...Array.from({ length: 8 }).map((_, i) => ({
          id: `cancelled-${i}`,
          orderNumber: `ORD-C-${i}`,
          date: '2026-09-10',
          month: 'September',
          period: 'PERIOD_1' as const,
          marketplace: 'Shopee',
          promotionCategory: 'Promo Flash Sale',
          promotionName: 'Flash Sale Unique',
          sku: 'SKU-THERASKIN-02',
          price: 60000,
          discountAmount: 10000,
          quantity: 1,
          orderStatus: 'Batal',
          isDuplicatePromo: false
        }))
      ]

      const result = calculateClosingGroup(txs, undefined, false)

      // When unique: Final QTY = Valid QTY = 80
      expect(result.totalOrders).toBe(88)
      expect(result.cancelledOrders).toBe(8)
      expect(result.validOrders).toBe(80)
      expect(result.appliedRule).toBe('STANDARD_NO_SPLIT')
      expect(result.finalClosingQty).toBe(80)
      // Formula Biaya Promosi Brand (Sesuai Google Sheet Patokan): Biaya = Final QTY × Total Diskon = 80 × 10.000 = 800.000
      expect(result.biaya).toBe(80 * 10000)
    })
  })

  describe('Dynamic End of Month Calculations', () => {
    it('correctly calculates days in month and period labels', () => {
      // September: 30 days
      expect(getDaysInMonth(2026, 'September')).toBe(30)
      const sepLabels = getDynamicPeriodLabels(2026, 'September')
      expect(sepLabels.p1Label).toBe('Periode 1 (1–15 Sep)')
      expect(sepLabels.p2Label).toBe('Periode 2 (16–30 Sep)')
      expect(sepLabels.p1Header).toBe('QTY 1-15 Sep')
      expect(sepLabels.p2Header).toBe('QTY 16-30 Sep')

      // October: 31 days
      expect(getDaysInMonth(2026, 'Oktober')).toBe(31)
      const oktLabels = getDynamicPeriodLabels(2026, 'Oktober')
      expect(oktLabels.p2Label).toBe('Periode 2 (16–31 Okt)')
      expect(oktLabels.p2Header).toBe('QTY 16-31 Okt')

      // February 2026 (non-leap year): 28 days
      expect(getDaysInMonth(2026, 'Februari')).toBe(28)
      const febLabels = getDynamicPeriodLabels(2026, 'Februari')
      expect(febLabels.p2Label).toBe('Periode 2 (16–28 Feb)')
      expect(febLabels.p2Header).toBe('QTY 16-28 Feb')

      // February 2024 (leap year): 29 days
      expect(getDaysInMonth(2024, 'Februari')).toBe(29)
    })
  })

  describe('1-Click Copy Format for Master Closing', () => {
    it('generates exact 6-column tab-separated format: Platform \\t Kode Promosi \\t Nama Promosi \\t SKU \\t Quantity \\t Biaya', () => {
      const txs: RawOrderTransaction[] = Array.from({ length: 20 }).map((_, i) => ({
        id: `tx-${i}`,
        orderNumber: `ORD-${i}`,
        date: '2026-09-05',
        month: 'September',
        period: 'PERIOD_1' as const,
        marketplace: 'Shopee Pusat',
        promotionCategory: 'Voucher Toko',
        promotionName: 'Voucher Diskon 5K',
        sku: 'FPK00000033',
        price: 85000,
        discountAmount: 5000,
        quantity: 1,
        orderStatus: 'Selesai'
      }))

      const group = calculateClosingGroup(txs, undefined, true) // 20 orders / 2 = 10 pcs
      // Biaya Promosi Brand (Sesuai Google Sheet): 10 × 5000 = 50,000

      const tsv = generateMasterClosingTSV([group])
      const parts = tsv.split('\t')

      expect(parts.length).toBe(6)
      expect(parts[0]).toBe('Shopee Pusat')
      expect(parts[1]).toBe('Voucher Toko')
      expect(parts[2]).toBe('Voucher Diskon 5K')
      expect(parts[3]).toBe('FPK00000033')
      expect(parts[4]).toBe('10')
      expect(parts[5]).toBe('50000')
    })

    it('generates exact Column O to T TSV format for direct paste into Google Sheet cell O2', () => {
      // Simulate row with P1 and P2
      const row = {
        qtyP1: 28,
        biayaP1: 140000,
        qtyP2: 0,
        biayaP2: 0,
        grandTotalQty: 28,
        grandTotalBiaya: 140000
      } as any

      const tsv = generatePatokanValuesTSV([row])
      expect(tsv).toBe('28\t140000\t0\t0\t28\t140000')
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
      // Indonesian marketplace export format (DD/MM/YYYY HH:mm:ss, e.g. 14/09/2026 23:47:20)
      expect(getClosingPeriod('14/09/2026 23:47:20')).toBe('PERIOD_1')
      expect(getClosingPeriod('15/09/2026 12:00:00')).toBe('PERIOD_1')
      expect(getClosingPeriod('16/09/2026 01:30:00')).toBe('PERIOD_2')
      expect(getClosingPeriod('20/09/2026 18:25:27')).toBe('PERIOD_2')
    })
  })

  describe('Shopee Multi-Cabang Support', () => {
    it('segregates transactions for Shopee Pusat, Semarang, Bali, and Surabaya into distinct groups', () => {
      const branches = ['Shopee Pusat', 'Shopee Semarang', 'Shopee Bali', 'Shopee Surabaya']
      const txs: RawOrderTransaction[] = branches.map((branch, i) => ({
        id: `branch-tx-${i}`,
        orderNumber: `ORD-${branch.slice(7)}-01`,
        date: '2026-09-05',
        month: 'September',
        period: 'PERIOD_1' as const,
        marketplace: branch,
        promotionCategory: 'Voucher Toko',
        promotionName: 'Voucher Cabang 5K',
        sku: 'FPK00000033',
        price: 85000,
        discountAmount: 5000,
        quantity: 10,
        orderStatus: 'Selesai'
      }))

      const batchResult = processClosingTransactions(txs)
      expect(batchResult.groups.length).toBe(4)

      const semarangGroup = batchResult.groups.find(g => g.marketplace === 'Shopee Semarang')!
      const baliGroup = batchResult.groups.find(g => g.marketplace === 'Shopee Bali')!
      const surabayaGroup = batchResult.groups.find(g => g.marketplace === 'Shopee Surabaya')!
      const pusatGroup = batchResult.groups.find(g => g.marketplace === 'Shopee Pusat')!

      expect(semarangGroup).toBeDefined()
      expect(semarangGroup.branchCity).toBe('Semarang')
      expect(baliGroup).toBeDefined()
      expect(baliGroup.branchCity).toBe('Bali')
      expect(surabayaGroup).toBeDefined()
      expect(surabayaGroup.branchCity).toBe('Surabaya')
      expect(pusatGroup).toBeDefined()
      expect(pusatGroup.branchCity).toBe('Pusat')
    })
  })

  describe('Closingan Reguler vs Closingan Campaign (Beda Harga)', () => {
    it('separates regular promo and campaign promo on the same SKU with different pricing into distinct groups', () => {
      // 1 SKU (FPK00000033):
      // Transaction A: Regular store promo (Voucher Toko 5K, Harga Normal 85K, Net 80K)
      // Transaction B: Campaign promo (Mega Campaign 9.9, Diskon 17K, Net 68K)
      const txs: RawOrderTransaction[] = [
        {
          id: 'tx-reg-1',
          orderNumber: 'ORD-REG-01',
          date: '2026-09-08',
          month: 'September',
          period: 'PERIOD_1',
          marketplace: 'Shopee Pusat',
          promotionCategory: 'Voucher Toko',
          promotionName: 'Voucher Toko Reguler 5K',
          sku: 'FPK00000033',
          price: 85000,
          discountAmount: 5000,
          quantity: 20,
          orderStatus: 'Selesai'
        },
        {
          id: 'tx-camp-1',
          orderNumber: 'ORD-CAMP-01',
          date: '2026-09-09',
          month: 'September',
          period: 'PERIOD_1',
          marketplace: 'Shopee Pusat',
          promotionCategory: 'Promo Flash Sale',
          promotionName: 'Mega Campaign 9.9 Flash Sale Glow Serum',
          sku: 'FPK00000033',
          price: 85000,
          discountAmount: 17000, // Harga Campaign Net = 68,000
          quantity: 50,
          orderStatus: 'Selesai'
        }
      ]

      const batchResult = processClosingTransactions(txs)
      expect(batchResult.groups.length).toBe(2)

      const regGroup = batchResult.groups.find(g => g.closingType === 'REGULER')!
      const campGroup = batchResult.groups.find(g => g.closingType === 'CAMPAIGN')!

      expect(regGroup).toBeDefined()
      expect(campGroup).toBeDefined()

      // Reguler: priceAfterDiscount = 80,000
      expect(regGroup.priceAfterDiscount).toBe(80000)
      // Campaign: priceAfterDiscount = 68,000 (Harga Spesial Campaign)
      expect(campGroup.priceAfterDiscount).toBe(68000)

      // Test TSV copy filtering
      const tsvRegOnly = generateMasterClosingTSV(batchResult.groups, 'REGULER')
      expect(tsvRegOnly).toContain('Voucher Toko Reguler 5K')
      expect(tsvRegOnly).not.toContain('Mega Campaign 9.9')

      const tsvCampOnly = generateMasterClosingTSV(batchResult.groups, 'CAMPAIGN')
      expect(tsvCampOnly).toContain('Mega Campaign 9.9')
      expect(tsvCampOnly).not.toContain('Voucher Toko Reguler 5K')
    })
  })

  describe('Marketplace Signature Detection & Normalization', () => {
    // 1. TikTok Shop signature
    it('accurately identifies TikTok Shop export from column signatures', () => {
      const tiktokRow = {
        'Order ID': '586072309974861411',
        'Order Status': 'Dikirim',
        'Order Substatus': 'Sedang transit',
        'Seller SKU': 'TWINSUNAGEPROTECTIONDC',
        'Product Name': 'Twinpack Sun Protector Age Revival Protection Day Cream',
        'Quantity': '1',
        'SKU Unit Original Price': '145000',
        'SKU Subtotal Before Discount': '145000',
        'SKU Platform Discount': '0',
        'SKU Seller Discount': '67816',
        'SKU Subtotal After Discount': '77184',
        'Created Time': '14/09/2026 19:25:27'
      }

      const detection = detectMarketplacePlatform(tiktokRow, 'OrderSKUList.xlsx', 'OrderSKUList')
      expect(detection.platform).toBe('TIKTOK')
      expect(detection.suggestedTargetMarketplace).toBe('TikTok Shop')

      const normalized = normalizeRawOrder(tiktokRow, 'TIKTOK')
      expect(normalized.platform).toBe('TikTok Shop')
      expect(normalized.sku).toBe('TWINSUNAGEPROTECTIONDC')
      expect(normalized.netPricePerUnit).toBe(77184)
      expect(normalized.period).toBe('PERIOD_1') // 14/09/2026 -> Periode 1
      expect(normalized.isCancelled).toBe(false)
    })

    // 2. Shopee signature
    it('accurately identifies Shopee export from column signatures and extracts branch', () => {
      const shopeeRow = {
        'No. Pesanan': '260914SMG12345',
        'Status Pesanan': 'Selesai',
        'Waktu Pesanan Dibuat': '2026-09-14 10:20:00',
        'Nomor Referensi SKU': 'PAK033POT010PCS',
        'Nama Produk': 'THERASKIN Age Revival Protection Day Cream Pot New 10 g Shrink',
        'Jumlah': '2',
        'Harga Awal': '40200',
        'Potongan Penjual': '1608',
        'Harga Setelah Diskon': '38592'
      }

      const detection = detectMarketplacePlatform(shopeeRow, 'Order.shopee_semarang.20260901_20260914.xlsx')
      expect(detection.platform).toBe('SHOPEE')
      expect(detection.suggestedTargetMarketplace).toBe('Shopee Semarang')

      const normalized = normalizeRawOrder(shopeeRow, 'SHOPEE', 'Shopee Semarang')
      expect(normalized.platform).toBe('Shopee')
      expect(normalized.branchCity).toBe('Semarang')
      expect(normalized.sku).toBe('PAK033POT010PCS')
      expect(normalized.quantity).toBe(2)
      expect(normalized.netPricePerUnit).toBe(38592)
      expect(normalized.period).toBe('PERIOD_1')
      expect(normalized.isCancelled).toBe(false)
    })

    // 3. Lazada signature
    it('accurately identifies Lazada export from column signatures', () => {
      const lazadaRow = {
        'orderItemId': '78912345678',
        'orderNumber': 'ORD-LAZ-9912',
        'createTime': '14/09/2026 11:30:00',
        'status': 'delivered',
        'sellerSku': 'PAK032T010C',
        'itemName': 'THERASKIN Age Revival Gentle Cleanser Tube 100 ml',
        'unitPrice': '41300',
        'paidPrice': '39648'
      }

      const detection = detectMarketplacePlatform(lazadaRow, 'orders_lazada_20260914.xlsx')
      expect(detection.platform).toBe('LAZADA')
      expect(detection.suggestedTargetMarketplace).toBe('Lazada')

      const normalized = normalizeRawOrder(lazadaRow, 'LAZADA')
      expect(normalized.platform).toBe('Lazada')
      expect(normalized.sku).toBe('PAK032T010C')
      expect(normalized.netPricePerUnit).toBe(39648)
      expect(normalized.period).toBe('PERIOD_1')
      expect(normalized.isCancelled).toBe(false)
    })

    // 4. Quantity division on line subtotal
    it('divides SKU Subtotal After Discount by quantity when quantity > 1', () => {
      const tiktokRowQty2 = {
        'Order ID': '586072309974861420',
        'Order Status': 'Dikirim',
        'Seller SKU': 'PAK034POT010CS',
        'Product Name': 'Theraskin Age Revival Moisture Lock Night Cream',
        'Quantity': '2',
        'SKU Subtotal After Discount': '79680', // 2 x 39,840
        'Created Time': '14/09/2026 21:40:52'
      }

      const normalized = normalizeRawOrder(tiktokRowQty2, 'TIKTOK')
      expect(normalized.quantity).toBe(2)
      expect(normalized.netPricePerUnit).toBe(39840) // 79,680 / 2 = 39,840
      expect(normalized.period).toBe('PERIOD_1')
    })

    // 5. Test real rows from screenshot: Theraskin Perfect Glow Basic Skin & AHA Cleanser
    it('accurately parses real rows from user TikTok screenshot and maps to Period 1', () => {
      const row1 = {
        'Order ID': '586072309974861411',
        'Order Status': 'Dikirim',
        'Seller SKU': 'FPK00000042',
        'Product Name': 'Theraskin Perfect Glow Basic Skin',
        'Quantity': '1',
        'SKU Subtotal After Discount': '151524',
        'Created Time': '14/09/2026 23:47:20'
      }

      const norm1 = normalizeRawOrder(row1, 'TIKTOK')
      expect(norm1.platform).toBe('TikTok Shop')
      expect(norm1.sku).toBe('FPK00000042')
      expect(norm1.netPricePerUnit).toBe(151524)
      expect(norm1.period).toBe('PERIOD_1') // 14/09 -> Period 1 (Qty 1-15 Sep)
      expect(norm1.isCancelled).toBe(false)

      const row2 = {
        'Order ID': '586072294970481411',
        'Order Status': 'Dikirim',
        'Seller SKU': 'FAW02L0010CG',
        'Product Name': 'Theraskin AHA Cleanser 100ml -',
        'Quantity': '1',
        'SKU Subtotal After Discount': '37810',
        'Created Time': '14/09/2026 23:36:30'
      }

      const norm2 = normalizeRawOrder(row2, 'TIKTOK')
      expect(norm2.platform).toBe('TikTok Shop')
      expect(norm2.sku).toBe('FAW02L0010CG')
      expect(norm2.netPricePerUnit).toBe(37810)
      expect(norm2.period).toBe('PERIOD_1')
      expect(norm2.isCancelled).toBe(false)
    })
  })
})
