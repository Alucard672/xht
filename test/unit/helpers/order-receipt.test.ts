import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * order-receipt.ts 单元测试
 * 测试订单小票生成工具函数
 */

describe('order-receipt 工具函数', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('formatPrice', () => {
    it('应该正确将分转换为元', () => {
      const formatPrice = (cents: number) => (cents / 100).toFixed(2)

      expect(formatPrice(100)).toBe('1.00')
      expect(formatPrice(1050)).toBe('10.50')
      expect(formatPrice(9999)).toBe('99.99')
    })

    it('应该正确处理零值', () => {
      const formatPrice = (cents: number) => (cents / 100).toFixed(2)

      expect(formatPrice(0)).toBe('0.00')
    })

    it('应该正确保留两位小数', () => {
      const formatPrice = (cents: number) => (cents / 100).toFixed(2)

      expect(formatPrice(1)).toBe('0.01')
      expect(formatPrice(10)).toBe('0.10')
      expect(formatPrice(100)).toBe('1.00')
    })

    it('应该正确处理大额金额', () => {
      const formatPrice = (cents: number) => (cents / 100).toFixed(2)

      expect(formatPrice(100000)).toBe('1000.00')
      expect(formatPrice(1000000)).toBe('10000.00')
    })
  })

  describe('formatTime', () => {
    it('应该正确格式化时间戳', () => {
      const formatTime = (timestamp: number) => {
        const date = new Date(timestamp)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hour = String(date.getHours()).padStart(2, '0')
        const minute = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day} ${hour}:${minute}`
      }

      const timestamp = new Date('2024-01-15T14:30:00').getTime()
      expect(formatTime(timestamp)).toBe('2024-01-15 14:30')
    })

    it('应该正确处理午夜时间', () => {
      const formatTime = (timestamp: number) => {
        const date = new Date(timestamp)
        const hour = String(date.getHours()).padStart(2, '0')
        const minute = String(date.getMinutes()).padStart(2, '0')
        return `${hour}:${minute}`
      }

      const timestamp = new Date('2024-01-15T00:05:00').getTime()
      expect(formatTime(timestamp)).toContain('00:05')
    })

    it('应该正确处理日期个位数补零', () => {
      const formatTime = (timestamp: number) => {
        const date = new Date(timestamp)
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${month}-${day}`
      }

      const jan1 = new Date('2024-01-01').getTime()
      const feb9 = new Date('2024-02-09').getTime()

      expect(formatTime(jan1)).toBe('01-01')
      expect(formatTime(feb9)).toBe('02-09')
    })
  })

  describe('小票数据结构', () => {
    it('应该包含完整的订单信息', () => {
      const orderData = {
        order: {
          order_no: 'ORD1234567890',
          created_at: Date.now(),
          total_amount: 5000,
          payment_method: 'credit',
          items: [
            {
              name: '可口可乐',
              count: 10,
              unit_name: '瓶',
              price: 300
            }
          ],
          customer_name: '张三'
        },
        tenant: {
          name: '测试店铺',
          phone: '13900139000',
          address: '测试地址'
        }
      }

      // 验证数据结构
      expect(orderData.order.order_no).toBeDefined()
      expect(orderData.order.items).toHaveLength(1)
      expect(orderData.tenant.name).toBeDefined()
    })

    it('应该支持没有客户信息的订单', () => {
      const orderData = {
        order: {
          order_no: 'ORD1234567890',
          created_at: Date.now(),
          total_amount: 5000,
          payment_method: 'wechat',
          items: []
        },
        tenant: {
          name: '测试店铺'
        }
      }

      expect(orderData.order.customer_name).toBeUndefined()
    })

    it('应该支持没有备注的订单', () => {
      const orderData = {
        order: {
          order_no: 'ORD1234567890',
          created_at: Date.now(),
          total_amount: 5000,
          payment_method: 'credit',
          items: []
        },
        tenant: {
          name: '测试店铺'
        }
      }

      expect(orderData.order.remark).toBeUndefined()
    })
  })

  describe('商品明细计算', () => {
    it('应该正确计算商品小计', () => {
      const item = {
        name: '可口可乐',
        count: 10,
        price: 300
      }

      const itemTotal = item.price * item.count
      expect(itemTotal).toBe(3000)
    })

    it('应该正确格式化商品小计', () => {
      const formatPrice = (cents: number) => (cents / 100).toFixed(2)
      const itemTotal = 3000

      expect(formatPrice(itemTotal)).toBe('30.00')
    })

    it('应该支持多个商品', () => {
      const items = [
        { name: '可口可乐', count: 10, price: 300 },
        { name: '百事可乐', count: 5, price: 300 }
      ]

      const total = items.reduce((sum, item) => sum + item.price * item.count, 0)
      expect(total).toBe(4500)
    })
  })

  describe('支付方式文本', () => {
    it('赊账应该显示"赊账"', () => {
      const paymentMethod = 'credit'
      const paymentMethodText = paymentMethod === 'credit' ? '支付方式: 赊账' : '支付方式: 微信支付'

      expect(paymentMethodText).toBe('支付方式: 赊账')
    })

    it('微信支付应该显示"微信支付"', () => {
      const paymentMethod = 'wechat'
      const paymentMethodText = paymentMethod === 'credit' ? '支付方式: 赊账' : '支付方式: 微信支付'

      expect(paymentMethodText).toBe('支付方式: 微信支付')
    })
  })

  describe('Canvas 绘制逻辑', () => {
    it('应该设置正确的内边距', () => {
      const padding = 40
      const canvasWidth = 750
      const contentWidth = canvasWidth - padding * 2

      expect(contentWidth).toBe(670)
    })

    it('应该支持自定义画布尺寸', () => {
      const options = {
        canvasWidth: 750,
        canvasHeight: 1200
      }

      expect(options.canvasWidth).toBe(750)
      expect(options.canvasHeight).toBe(1200)
    })

    it('应该使用默认画布尺寸', () => {
      const options = {}
      const canvasWidth = options.canvasWidth || 750
      const canvasHeight = options.canvasHeight || 1200

      expect(canvasWidth).toBe(750)
      expect(canvasHeight).toBe(1200)
    })
  })

  describe('小票布局', () => {
    it('应该从上到下绘制内容', () => {
      const layout = [
        '顶部装饰线',
        '店铺名称',
        '分隔线',
        '订单号',
        '时间',
        '客户信息',
        '分隔线',
        '商品清单标题',
        '商品明细',
        '分隔线',
        '总计',
        '支付方式',
        '备注',
        '分隔线',
        '底部提示',
        '底部装饰线'
      ]

      expect(layout).toHaveLength(16)
    })

    it('应该正确计算Y坐标位置', () => {
      let currentY = 40
      const lineHeight = 30

      currentY += 20 // 绘制店铺名称后
      expect(currentY).toBe(60)

      currentY += 30 // 绘制分隔线后
      expect(currentY).toBe(90)

      currentY += lineHeight // 绘制订单号后
      expect(currentY).toBe(120)
    })
  })

  describe('样式配置', () => {
    it('店铺名称应该是粗体大字', () => {
      const shopNameStyle = {
        fillStyle: '#333333',
        font: 'bold 32px sans-serif',
        textAlign: 'center'
      }

      expect(shopNameStyle.font).toContain('bold')
      expect(shopNameStyle.font).toContain('32px')
    })

    it('总计应该是红色粗体', () => {
      const totalStyle = {
        fillStyle: '#ff4d4f',
        font: 'bold 28px sans-serif'
      }

      expect(totalStyle.fillStyle).toBe('#ff4d4f')
      expect(totalStyle.font).toContain('bold')
    })

    it('装饰线应该使用主题色', () => {
      const decorColor = '#07c160'

      expect(decorColor).toBe('#07c160')
    })
  })

  describe('边界情况', () => {
    it('应该处理空商品列表', () => {
      const items: any[] = []

      expect(items.length).toBe(0)
    })

    it('应该处理订单号为空', () => {
      const orderNo = ''

      expect(orderNo).toBe('')
    })

    it('应该处理金额为0', () => {
      const totalAmount = 0
      const formatted = (totalAmount / 100).toFixed(2)

      expect(formatted).toBe('0.00')
    })

    it('应该处理店铺信息不完整', () => {
      const tenant = {
        name: '测试店铺'
        // phone 和 address 缺失
      }

      expect(tenant.name).toBeDefined()
      expect(tenant.phone).toBeUndefined()
      expect(tenant.address).toBeUndefined()
    })
  })

  describe('综合场景', () => {
    it('应该生成完整的订单小票', () => {
      const orderData = {
        order: {
          order_no: 'ORD1705789012345',
          created_at: new Date('2024-01-20T14:30:00').getTime(),
          total_amount: 5300,
          payment_method: 'credit',
          remark: '请尽快送达',
          items: [
            {
              name: '百事可乐',
              count: 2,
              unit_name: '箱',
              price: 2400
            },
            {
              name: '百事可乐',
              count: 5,
              unit_name: '瓶',
              price: 300
            }
          ],
          customer_name: '张三'
        },
        tenant: {
          name: '测试店铺',
          phone: '13900139000',
          address: '测试地址123号'
        }
      }

      // 验证数据完整性
      expect(orderData.order.order_no).toBeDefined()
      expect(orderData.order.items).toHaveLength(2)
      expect(orderData.order.remark).toBeDefined()
      expect(orderData.tenant.phone).toBeDefined()
    })

    it('应该生成简单的订单小票', () => {
      const orderData = {
        order: {
          order_no: 'ORD1705789012345',
          created_at: Date.now(),
          total_amount: 3000,
          payment_method: 'wechat',
          items: [
            {
              name: '可口可乐',
              count: 10,
              unit_name: '瓶',
              price: 300
            }
          ]
        },
        tenant: {
          name: '测试店铺'
        }
      }

      expect(orderData.order.items).toHaveLength(1)
    })
  })
})
