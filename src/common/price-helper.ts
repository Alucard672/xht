/**
 * 金额处理工具类 (单位：分)
 */
export const priceHelper = {
  /**
   * 将分转换为元，保留两位小数
   * @param fen 分
   */
  format(fen: number): string {
    if (!fen) return '0.00';
    return (fen / 100).toFixed(2);
  },

  /**
   * 将元转换为分
   * @param yuan 元
   */
  toFen(yuan: string | number): number {
    if (typeof yuan === 'string') {
      yuan = parseFloat(yuan);
    }
    if (isNaN(yuan)) return 0;
    return Math.round(yuan * 100);
  },

  /**
   * 计算总价 (分)
   */
  calcTotal(priceSmall: number, countSmall: number): number {
    return priceSmall * countSmall;
  }
};

