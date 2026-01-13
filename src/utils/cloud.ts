/**
 * 云对象请求封装 - 统一日志拦截
 */

// 拦截器配置
const config = {
  enableLog: true
}

/**
 * 导入云对象并添加日志拦截
 * @param {String} name 云对象名称
 * @returns {Proxy} 代理后的云对象
 */
export function importObject<T = any>(name: string): T {
  const originalCo = uniCloud.importObject(name)

  if (!config.enableLog) {
    return originalCo as T
  }

  return new Proxy(originalCo, {
    get(target, prop: string | symbol) {
      const value = target[prop as keyof typeof target]

      // 如果访问的是函数，则通过 Proxy 拦截调用
      if (typeof value === 'function') {
        return async function (...args: any[]) {
          const startTime = Date.now()
          const requestId = Math.random().toString(36).substring(2, 9)

          console.log(`[CloudReq][${requestId}] 🚀 调用 ${name}.${String(prop)}`, args)

          try {
            const result = await value.apply(this, args)
            const duration = Date.now() - startTime
            console.log(
              `[CloudRes][${requestId}] ✅ 成功 ${name}.${String(prop)} (${duration}ms)`,
              result
            )
            return result
          } catch (error) {
            const duration = Date.now() - startTime
            console.error(
              `[CloudErr][${requestId}] ❌ 失败 ${name}.${String(prop)} (${duration}ms)`,
              error
            )
            throw error
          }
        }
      }

      return value
    }
  }) as T
}
