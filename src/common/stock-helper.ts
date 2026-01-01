/**
 * 库存与单位换算工具类
 */
export const stockHelper = {
  /**
   * 格式化库存显示 (例如: 1箱5瓶)
   * @param totalStock 总库存 (最小单位)
   * @param rate 换算率
   * @param unitBigName 大单位名称 (如: 箱)
   * @param unitSmallName 小单位名称 (如: 瓶)
   */
  format(totalStock: number, rate: number, unitBigName: string, unitSmallName: string): string {
    if (!rate || rate <= 1) return `${totalStock}${unitSmallName}`;
    
    const bigQty = Math.floor(totalStock / rate);
    const smallQty = totalStock % rate;
    
    let result = '';
    if (bigQty > 0) result += `${bigQty}${unitBigName}`;
    if (smallQty > 0 || bigQty === 0) result += `${smallQty}${unitSmallName}`;
    
    return result;
  },

  /**
   * 将大/小单位组合转换为最小单位总量
   */
  toSmallest(bigQty: number, smallQty: number, rate: number): number {
    const b = parseInt(String(bigQty)) || 0;
    const s = parseInt(String(smallQty)) || 0;
    const r = parseInt(String(rate)) || 1;
    return b * r + s;
  }
};

