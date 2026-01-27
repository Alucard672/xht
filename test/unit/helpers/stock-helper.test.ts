import { describe, it, expect } from 'vitest'
import { stockHelper } from '@/common/stock-helper'

describe('stockHelper', () => {
  describe('format', () => {
    it('应该正确格式化多单位库存', () => {
      expect(stockHelper.format(48, 24, '箱', '瓶')).toBe('2箱')
      expect(stockHelper.format(53, 24, '箱', '瓶')).toBe('2箱5瓶')
      expect(stockHelper.format(24, 24, '箱', '瓶')).toBe('1箱')
    })

    it('应该正确处理仅小单位的情况', () => {
      expect(stockHelper.format(5, 24, '箱', '瓶')).toBe('5瓶')
      expect(stockHelper.format(0, 24, '箱', '瓶')).toBe('0瓶')
      expect(stockHelper.format(23, 24, '箱', '瓶')).toBe('23瓶')
    })

    it('应该正确处理换算率<=1的情况', () => {
      expect(stockHelper.format(50, 1, '箱', '瓶')).toBe('50瓶')
      expect(stockHelper.format(50, 0, '箱', '瓶')).toBe('50瓶')
      expect(stockHelper.format(50, -1, '箱', '瓶')).toBe('50瓶')
    })

    it('应该正确处理零库存', () => {
      expect(stockHelper.format(0, 24, '箱', '瓶')).toBe('0瓶')
    })

    it('应该正确处理大额库存', () => {
      expect(stockHelper.format(240, 24, '箱', '瓶')).toBe('10箱')
      expect(stockHelper.format(253, 24, '箱', '瓶')).toBe('10箱13瓶')
      expect(stockHelper.format(1000, 24, '箱', '瓶')).toBe('41箱16瓶')
    })

    it('应该正确处理不同的单位名称', () => {
      expect(stockHelper.format(12, 12, '打', '个')).toBe('1打')
      expect(stockHelper.format(15, 12, '打', '个')).toBe('1打3个')
      expect(stockHelper.format(60, 12, '打', '个')).toBe('5打')
    })
  })

  describe('toSmallest', () => {
    it('应该正确计算最小单位总量', () => {
      expect(stockHelper.toSmallest(2, 5, 24)).toBe(53) // 2箱 + 5瓶 = 53瓶
      expect(stockHelper.toSmallest(1, 0, 24)).toBe(24) // 1箱 = 24瓶
      expect(stockHelper.toSmallest(0, 10, 24)).toBe(10) // 10瓶
    })

    it('应该正确处理零值', () => {
      expect(stockHelper.toSmallest(0, 0, 24)).toBe(0)
    })

    it('应该正确处理字符串输入', () => {
      expect(stockHelper.toSmallest('2', '5', '24')).toBe(53)
      expect(stockHelper.toSmallest('1', '0', '24')).toBe(24)
    })

    it('应该正确处理无效输入', () => {
      expect(stockHelper.toSmallest(NaN, 5, 24)).toBe(5) // NaN big qty -> 0, 0*24+5 = 5
      expect(stockHelper.toSmallest(2, NaN, 24)).toBe(48) // NaN small qty -> 0, 2*24+0 = 48
      expect(stockHelper.toSmallest(2, 5, NaN)).toBe(7) // NaN rate -> 1 (default), 2*1+5 = 7
      expect(stockHelper.toSmallest(null as any, 5, 24)).toBe(5) // null -> 0
      expect(stockHelper.toSmallest(2, undefined as any, 24)).toBe(48) // undefined -> 0
    })

    it('应该正确处理换算率为1或0的情况', () => {
      expect(stockHelper.toSmallest(2, 5, 1)).toBe(7) // 2*1 + 5 = 7
      expect(stockHelper.toSmallest(2, 5, 0)).toBe(7) // rate=0 -> 1 (default), 2*1+5 = 7
    })

    it('应该正确处理负数', () => {
      expect(stockHelper.toSmallest(-2, 5, 24)).toBe(-43)
      expect(stockHelper.toSmallest(2, -5, 24)).toBe(43)
    })
  })

  describe('综合场景测试', () => {
    it('应该正确处理商品库存格式化和换算', () => {
      // 场景：百事可乐，1箱=24瓶，当前库存240瓶
      const totalStock = 240
      const rate = 24
      const formatted = stockHelper.format(totalStock, rate, '箱', '瓶')
      expect(formatted).toBe('10箱')
    })

    it('应该正确处理购物车数量换算', () => {
      // 场景：客户选购 2箱 + 5瓶
      const bigQty = 2
      const smallQty = 5
      const rate = 24

      const totalBottles = stockHelper.toSmallest(bigQty, smallQty, rate)
      expect(totalBottles).toBe(53)

      // 验证反向格式化
      const formatted = stockHelper.format(totalBottles, rate, '箱', '瓶')
      expect(formatted).toBe('2箱5瓶')
    })

    it('应该正确处理不同换算率的商品', () => {
      // 场景1：啤酒，1箱=12瓶
      expect(stockHelper.toSmallest(5, 6, 12)).toBe(66)
      expect(stockHelper.format(66, 12, '箱', '瓶')).toBe('5箱6瓶')

      // 场景2：矿泉水，1箱=24瓶
      expect(stockHelper.toSmallest(3, 12, 24)).toBe(84)
      expect(stockHelper.format(84, 24, '箱', '瓶')).toBe('3箱12瓶')

      // 场景3：鸡蛋，1盘=30个
      expect(stockHelper.toSmallest(2, 15, 30)).toBe(75)
      expect(stockHelper.format(75, 30, '盘', '个')).toBe('2盘15个')
    })

    it('应该正确处理库存不足的情况', () => {
      // 场景：库存仅剩 3 瓶，不足 1 箱
      const lowStock = 3
      const formatted = stockHelper.format(lowStock, 24, '箱', '瓶')
      expect(formatted).toBe('3瓶')
    })

    it('应该正确处理精确整箱的库存', () => {
      // 场景：库存正好是整箱
      const exactStock = 240 // 10箱
      const formatted = stockHelper.format(exactStock, 24, '箱', '瓶')
      expect(formatted).toBe('10箱')
    })

    it('应该正确处理大数量计算', () => {
      // 场景：批发订单，100箱 + 12瓶
      const bigQty = 100
      const smallQty = 12
      const rate = 24

      const total = stockHelper.toSmallest(bigQty, smallQty, rate)
      expect(total).toBe(2412)

      const formatted = stockHelper.format(total, rate, '箱', '瓶')
      expect(formatted).toBe('100箱12瓶')
    })
  })
})
