/**
 * 订单小票生成工具
 * 使用 Canvas 2D API 绘制订单小票
 */

interface OrderReceiptData {
  order: {
    order_no: string
    created_at: number
    total_fee: number
    total_amount: number
    payment_method: string
    remark?: string
    items: Array<{
      name: string
      count: number
      unit_name: string
      price: number
    }>
    customer_name?: string
  }
  tenant: {
    name: string
    phone?: string
    address?: string
  }
}

interface DrawOptions {
  canvasId: string
  canvasWidth: number
  canvasHeight: number
}

/**
 * 生成订单小票图片
 * @param orderData - 订单数据
 * @param options - Canvas配置
 * @returns Promise<string> - 返回临时文件路径
 */
export async function generateOrderReceipt(
  orderData: OrderReceiptData,
  options: DrawOptions
): Promise<string> {
  const { canvasId, canvasWidth = 750, canvasHeight = 1200 } = options

  return new Promise((resolve, reject) => {
    // 获取canvas上下文
    const query = uni.createSelectorQuery()
    query
      .select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec(res => {
        if (!res || !res[0]) {
          reject(new Error('Canvas节点未找到'))
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        // 设置canvas实际大小
        const dpr = uni.getSystemInfoSync().pixelRatio
        canvas.width = canvasWidth * dpr
        canvas.height = canvasHeight * dpr
        ctx.scale(dpr, dpr)

        try {
          // 绘制小票内容
          drawReceipt(ctx, orderData, canvasWidth, canvasHeight)

          // 导出为临时图片
          uni.canvasToTempFilePath({
            canvasId,
            canvas,
            success: tempFileRes => {
              resolve(tempFileRes.tempFilePath)
            },
            fail: err => {
              reject(new Error(`导出图片失败: ${JSON.stringify(err)}`))
            }
          })
        } catch (e) {
          reject(new Error(`绘制失败: ${e.message}`))
        }
      })
  })
}

/**
 * 绘制小票内容
 */
function drawReceipt(
  ctx: WechatMiniprogram.CanvasRenderingContext,
  data: OrderReceiptData,
  width: number,
  height: number
) {
  const { order, tenant } = data
  const padding = 40
  const contentWidth = width - padding * 2
  let currentY = padding

  // 绘制白色背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // 绘制顶部装饰线
  ctx.fillStyle = '#07c160'
  ctx.fillRect(0, 0, width, 8)

  currentY += 20

  // 绘制店铺名称
  ctx.fillStyle = '#333333'
  ctx.font = 'bold 32px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(tenant.name, width / 2, currentY)

  currentY += 30

  // 绘制分隔线
  drawDashedLine(ctx, padding, currentY, contentWidth)

  currentY += 30

  // 绘制订单号
  ctx.fillStyle = '#666666'
  ctx.font = '24px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`订单号: ${order.order_no}`, padding, currentY)

  currentY += 30

  // 绘制下单时间
  const timeStr = formatTime(order.created_at)
  ctx.fillText(`时间: ${timeStr}`, padding, currentY)

  currentY += 30

  // 绘制客户信息
  if (order.customer_name) {
    ctx.fillText(`客户: ${order.customer_name}`, padding, currentY)
    currentY += 30
  }

  // 绘制分隔线
  drawDashedLine(ctx, padding, currentY, contentWidth)

  currentY += 30

  // 绘制商品列表标题
  ctx.fillStyle = '#333333'
  ctx.font = 'bold 26px sans-serif'
  ctx.fillText('商品清单', padding, currentY)

  currentY += 30

  // 绘制商品明细
  ctx.fillStyle = '#666666'
  ctx.font = '22px sans-serif'

  order.items.forEach((item, index) => {
    const itemTotal = item.price * item.count
    const line1 = `${item.name} x${item.count}`
    const line2 = `  ¥${formatPrice(itemTotal)}`

    // 商品名和数量
    ctx.textAlign = 'left'
    ctx.fillText(line1, padding, currentY)

    // 金额右对齐
    ctx.textAlign = 'right'
    ctx.fillText(line2, width - padding, currentY)

    currentY += 35
  })

  // 绘制分隔线
  currentY += 10
  drawDashedLine(ctx, padding, currentY, contentWidth)

  currentY += 30

  // 绘制总计
  ctx.fillStyle = '#333333'
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('总计', padding, currentY)

  const totalAmount = order.total_amount || order.total_fee
  ctx.textAlign = 'right'
  ctx.fillStyle = '#ff4d4f'
  ctx.fillText(`¥${formatPrice(totalAmount)}`, width - padding, currentY)

  currentY += 40

  // 绘制支付方式
  const paymentMethodText =
    order.payment_method === 'credit' ? '支付方式: 赊账' : '支付方式: 微信支付'
  ctx.fillStyle = '#666666'
  ctx.font = '24px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(paymentMethodText, padding, currentY)

  currentY += 30

  // 绘制备注
  if (order.remark) {
    ctx.fillText(`备注: ${order.remark}`, padding, currentY)
    currentY += 30
  }

  // 绘制底部提示
  currentY += 20
  drawDashedLine(ctx, padding, currentY, contentWidth)

  currentY += 30

  ctx.fillStyle = '#999999'
  ctx.font = '20px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('感谢惠顾，欢迎再次光临！', width / 2, currentY)

  currentY += 25

  if (tenant.phone) {
    ctx.fillText(`联系电话: ${tenant.phone}`, width / 2, currentY)
  }

  currentY += 25

  ctx.fillText('本单据由乡货通生成', width / 2, currentY)

  // 绘制底部装饰线
  const bottomY = currentY + 30
  ctx.fillStyle = '#07c160'
  ctx.fillRect(0, bottomY, width, 8)
}

/**
 * 绘制虚线
 */
function drawDashedLine(
  ctx: WechatMiniprogram.CanvasRenderingContext,
  x: number,
  y: number,
  width: number
) {
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 1
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + width, y)
  ctx.stroke()
  ctx.setLineDash([])
}

/**
 * 格式化价格（分转元）
 */
function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2)
}

/**
 * 格式化时间
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}
