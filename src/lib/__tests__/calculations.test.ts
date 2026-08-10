import { describe, it, expect } from 'vitest'
import { Calculations } from '../calculations'

describe('Centralized Calculation Engine', () => {
  describe('CTR (Click-Through Rate)', () => {
    it('calculates correctly', () => {
      expect(Calculations.ctr(50, 1000)).toBe(5) // (50/1000) * 100
    })
    it('handles zero denominator', () => {
      expect(Calculations.ctr(50, 0)).toBe(0)
    })
  })

  describe('CVR (Conversion Rate)', () => {
    it('calculates correctly', () => {
      expect(Calculations.cvr(10, 500)).toBe(2) // (10/500) * 100
    })
    it('handles zero denominator', () => {
      expect(Calculations.cvr(10, 0)).toBe(0)
    })
  })

  describe('CPC (Cost Per Click)', () => {
    it('calculates correctly', () => {
      expect(Calculations.cpc(1000, 200)).toBe(5)
    })
    it('handles zero clicks', () => {
      expect(Calculations.cpc(1000, 0)).toBe(0)
    })
  })

  describe('CPA (Cost Per Acquisition)', () => {
    it('calculates correctly', () => {
      expect(Calculations.cpa(5000, 25)).toBe(200)
    })
    it('handles zero conversions', () => {
      expect(Calculations.cpa(5000, 0)).toBe(0)
    })
  })

  describe('ROAS (Return on Ad Spend)', () => {
    it('calculates correctly', () => {
      expect(Calculations.roas(15000, 3000)).toBe(5)
    })
    it('handles zero spend', () => {
      expect(Calculations.roas(15000, 0)).toBe(0)
    })
  })

  describe('Net Sales', () => {
    it('calculates sales minus refunds and cancellations', () => {
      expect(Calculations.netSales(10000, 500, 1500)).toBe(8000)
    })
  })

  describe('Profit', () => {
    it('calculates net profit after all deductions', () => {
      // Net Sales (8000) - COGS (2000) - Fees (500) - Affiliate (100) - Ads (1000) - Other (400)
      expect(Calculations.profit(8000, 2000, 500, 100, 1000, 400)).toBe(4000)
    })
  })

  describe('Budget Utilization', () => {
    it('calculates utilization percentage', () => {
      expect(Calculations.budgetUtilization(5000, 10000)).toBe(50)
    })
    it('handles zero allocated budget', () => {
      expect(Calculations.budgetUtilization(5000, 0)).toBe(0)
    })
  })
})
