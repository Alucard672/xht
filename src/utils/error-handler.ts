/**
 * 统一错误处理工具
 */

type ErrorType = 'network' | 'business' | 'system' | 'permission'

interface ErrorOptions {
  showToast?: boolean // 是否显示toast提示
  duration?: number // 提示持续时间
}

/**
 * 处理错误并显示友好提示
 * @param error - 错误对象或消息
 * @param type - 错误类型
 * @param options - 配置选项
 */
export function handleError(
  error: Error | string | unknown,
  type: ErrorType = 'system',
  options: ErrorOptions = {}
) {
  const { showToast = true, duration = 2000 } = options

  // 获取错误消息
  let message = '操作失败'
  if (typeof error === 'string') {
    message = error
  } else if (error instanceof Error) {
    message = error.message || message
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = (error as any).message || message
  }

  // 记录错误日志
  console.error(`[${type.toUpperCase()}]`, error)

  // 显示用户友好的提示
  if (showToast) {
    uni.showToast({
      title: getFriendlyMessage(message, type),
      icon: 'none',
      duration
    })
  }
}

/**
 * 获取用户友好的错误消息
 */
function getFriendlyMessage(message: string, type: ErrorType): string {
  const commonErrors: Record<string, string> = {
    网络异常: '网络连接失败，请检查网络',
    请求超时: '请求超时，请稍后重试',
    未登录: '请先登录',
    登录失效: '登录已过期，请重新登录',
    无权限: '您没有权限执行此操作',
    不存在: '数据不存在或已被删除'
  }

  // 检查常见错误
  for (const [key, friendly] of Object.entries(commonErrors)) {
    if (message.includes(key)) {
      return friendly
    }
  }

  // 根据错误类型返回默认消息
  const defaultMessages: Record<ErrorType, string> = {
    network: '网络连接失败，请检查网络设置',
    business: message || '操作失败，请稍后重试',
    system: '系统错误，请稍后重试',
    permission: '您没有权限执行此操作'
  }

  return defaultMessages[type] || message
}

/**
 * 异步操作包装器，自动处理错误
 * @param asyncFn - 异步函数
 * @param options - 配置选项
 */
export async function withErrorHandling<T>(
  asyncFn: () => Promise<T>,
  options: ErrorOptions = {}
): Promise<T | null> {
  try {
    return await asyncFn()
  } catch (error) {
    handleError(error, 'system', options)
    return null
  }
}

/**
 * 显示加载中的toast
 */
export function showLoading(title = '加载中...') {
  uni.showLoading({ title, mask: true })
}

/**
 * 隐藏加载中的toast
 */
export function hideLoading() {
  uni.hideLoading()
}
