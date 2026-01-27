#!/usr/bin/env node
/**
 * 快速测试验证脚本
 * 用于检查测试基础设施是否正确配置
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 检查测试基础设施...\n')

// 1. 检查 package.json 中的测试脚本
console.log('1️⃣ 检查测试脚本配置...')
const packageJsonPath = path.join(__dirname, '..', 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const testScripts = ['test', 'test:ui', 'test:coverage', 'test:run']
let hasAllScripts = true

testScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`   ✅ ${script}: ${packageJson.scripts[script]}`)
  } else {
    console.log(`   ❌ ${script}: 未配置`)
    hasAllScripts = false
  }
})

if (hasAllScripts) {
  console.log('   ✅ 所有测试脚本已配置\n')
} else {
  console.log('   ⚠️  部分测试脚本缺失\n')
}

// 2. 检查配置文件
console.log('2️⃣ 检查配置文件...')
const configFiles = ['vitest.config.ts', 'test/setup.ts', 'test/utils/render.ts']

configFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`)
  } else {
    console.log(`   ❌ ${file} 不存在`)
  }
})

// 3. 检查测试文件
console.log('\n3️⃣ 统计测试文件...')
const testFiles = []

function findTestFiles(dir, baseDir = '') {
  const files = fs.readdirSync(dir, { withFileTypes: true })

  files.forEach(file => {
    const fullPath = path.join(dir, file.name)
    const relativePath = path.join(baseDir, file.name)

    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      findTestFiles(fullPath, relativePath)
    } else if (file.name.endsWith('.test.ts') || file.name.endsWith('.spec.ts')) {
      testFiles.push(relativePath)
    }
  })
}

findTestFiles(path.join(__dirname, '..'))
console.log(`   📁 找到 ${testFiles.length} 个测试文件`)

// 4. 检查 Mock 数据
console.log('\n4️⃣ 检查 Mock 数据...')
const mockFiles = [
  'test/mocks/data/index.ts',
  'test/mocks/data/goods.ts',
  'test/mocks/data/customers.ts',
  'test/mocks/data/orders.ts'
]

let mockCount = 0
mockFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    mockCount++
    console.log(`   ✅ ${file}`)
  }
})

console.log(`   📊 Mock 数据文件: ${mockCount}/4\n`)

// 5. 诊断建议
console.log('📋 运行测试命令:')
console.log('   npm run test:run          # 运行所有测试')
console.log('   npm run test               # 监听模式')
console.log('   npm run test:ui           # UI 界面')
console.log('   npm run test:coverage     # 覆盖率报告\n')

console.log('🔧 如果测试失败，检查:')
console.log('   1. 是否安装了依赖: npm install --legacy-peer-deps')
console.log('   2. Node 版本是否正确: node -v (推荐 v18+)')
console.log('   3. 是否在正确的目录: pwd')
console.log('   4. 查看错误信息并修复\n')

console.log('✨ 验证完成！')
