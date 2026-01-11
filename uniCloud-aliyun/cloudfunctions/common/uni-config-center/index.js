const fs = require('fs')
const path = require('path')

/**
 * 兼容 uni-id-common 的 uni-config-center 实现
 *
 * uni-id-common 的调用方式：
 *   const w = require('uni-config-center')({ pluginId: 'uni-id' })
 * 然后它会调用：
 *   w.hasFile('config.json'|'custom-token.js')
 *   w.resolve('custom-token.js')
 *   w.config()
 */
module.exports = function (options = {}) {
  const pluginId = options && typeof options.pluginId === 'string' ? options.pluginId : 'uni-id'

  const baseDir = path.resolve(__dirname, pluginId)

  function getFilePath(fileName) {
    if (typeof fileName !== 'string') {
      throw new TypeError('fileName must be a string')
    }
    return path.resolve(baseDir, fileName)
  }

  return {
    hasFile(fileName) {
      return fs.existsSync(getFilePath(fileName))
    },
    resolve(fileName) {
      return getFilePath(fileName)
    },
    config() {
      const p = getFilePath('config.json')
      if (!fs.existsSync(p)) {
        throw new Error(`config.json not found: ${p}`)
      }
      // 本地调试避免缓存
      try {
        delete require.cache[require.resolve(p)]
      } catch (e) {}
      return require(p)
    }
  }
}
