# 乡货通 - 设计系统文档

## 📁 文件结构

```
src/styles/
├── design-tokens.scss    # 核心设计变量（颜色、字体、间距等）
├── mixins.scss           # 通用样式混入（卡片、按钮、布局等）
├── page-design.scss      # 页面级设计混入（高级装饰效果）
├── base.scss             # 基础工具类（可复用的 CSS 类）
└── README.md             # 本文档
```

---

## 🎨 design-tokens.scss - 核心设计变量

### 色彩系统

#### 主色调

```scss
$wh-color-blue: #2d7ff9; // 专业蓝（主色）
$wh-color-blue-light: #e8f4ff; // 浅蓝背景
$wh-color-success-modern: #34c759; // iOS 成功绿
$wh-color-danger-modern: #ff3b30; // iOS 警告红
```

#### 文字颜色

```scss
$wh-text-color-dark: #1a1a1a; // 深色主文字
$wh-text-color-gray: #6e6e73; // iOS 灰（次要文字）
$wh-text-color-light-gray: #aeaeb2; // 浅灰（辅助文字）
```

#### 背景颜色

```scss
$wh-bg-color-card: #ffffff; // 卡片背景
$wh-bg-color-secondary: #f7f8fa; // 次要背景
$wh-bg-color-tertiary: #f0f0f5; // 输入框背景
$wh-bg-color-gradient: linear-gradient(180deg, #f7f8fa 0%, #ffffff 100%);
```

#### 渐变色

```scss
$wh-gradient-primary: linear-gradient(90deg, #07c160 0%, #5ac8fa 100%);
$wh-gradient-blue: linear-gradient(90deg, #2d7ff9 0%, #5ac8fa 100%);
$wh-gradient-price: linear-gradient(135deg, #ff3b30 0%, #ff6b6b 100%);
```

### 字体系统

#### 字号

```scss
$wh-font-size-xs: 20rpx;
$wh-font-size-sm: 24rpx;
$wh-font-size-base: 28rpx;
$wh-font-size-md: 30rpx;
$wh-font-size-lg: 32rpx;
$wh-font-size-xl: 36rpx;
$wh-font-size-2xl: 44rpx;
$wh-font-size-3xl: 48rpx;
```

#### 字重

```scss
$wh-font-weight-normal: 400;
$wh-font-weight-medium: 500;
$wh-font-weight-bold: 600;
$wh-font-weight-semibold: 700;
$wh-font-weight-extrabold: 800;
```

#### 行高

```scss
$wh-line-height-tight: 1.2;
$wh-line-height-snug: 1.3;
$wh-line-height-normal: 1.5;
$wh-line-height-loose: 1.6;
$wh-line-height-relaxed: 1.8;
```

### 间距系统

```scss
$wh-spacing-xxs: 6rpx;
$wh-spacing-xs: 8rpx;
$wh-spacing-sm: 16rpx;
$wh-spacing-md: 24rpx;
$wh-spacing-lg: 32rpx;
$wh-spacing-xl: 48rpx;
$wh-spacing-xxl: 64rpx;
$wh-spacing-3xl: 80rpx;
```

### 圆角系统

```scss
$wh-border-radius-xs: 6rpx;
$wh-border-radius-sm: 8rpx;
$wh-border-radius-md: 12rpx;
$wh-border-radius-lg: 16rpx;
$wh-border-radius-xl: 24rpx;
$wh-border-radius-full: 999rpx;
```

### 阴影系统

```scss
$wh-shadow-xs: 0 1rpx 3rpx rgba(0, 0, 0, 0.04);
$wh-shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
$wh-shadow-md: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
$wh-shadow-lg: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
$wh-shadow-colored: 0 4rpx 16rpx rgba(45, 127, 249, 0.15);
$wh-shadow-bottom-bar: 0 -4rpx 24rpx rgba(0, 0, 0, 0.06);
```

### 动画系统

```scss
$wh-transition-faster: 150ms;
$wh-transition-fast: 0.15s;
$wh-transition-normal: 200ms;
$wh-transition-base: 0.3s;
$wh-transition-slower: 300ms;
$wh-transition-slow: 0.5s;

$wh-easing-base: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 🧩 mixins.scss - 通用样式混入

### 卡片混入

```scss
// 基础卡片
@include card-base;

// 大卡片
@include card-large;

// 现代卡片（带交互）
@include card-modern;

// 装饰性顶部线条
@include card-top-decoration($gradient);

// 左侧装饰条
@include card-side-decoration($width, $gradient);
```

### 文本混入

```scss
// 文本样式
@include text-primary;
@include text-secondary;
@include text-tertiary;
@include text-title;
@include text-heading;
@include text-subheading;

// 价格渐变文字
@include text-gradient-price;
```

### 按钮混入

```scss
// 主按钮
@include button-primary;

// 幽灵按钮
@include button-ghost;

// 现代按钮
@include button-modern($bg-color);
```

### 布局混入

```scss
@include flex-center;
@include flex-between;
@include flex-start;
@include flex-column;
```

### 交互动画

```scss
// 悬停缩放
@include hover-scale($scale);

// 按钮按下
@include button-press($scale);

// 入场动画
@include slide-in-up;
```

### 背景效果

```scss
// 毛玻璃效果
@include glass-effect($blur, $bg-opacity);

// 渐变背景
@include gradient-bg($gradient);

// 规格标签背景
@include spec-tag-bg($color);

// 图片占位符
@include image-placeholder;
```

---

## 📄 page-design.scss - 页面级设计混入

### 页面容器

```scss
// 现代页面容器
@include page-container-modern;

// 页面容器（带顶部间距）
@include page-container-with-top($top-padding);
```

### 区块装饰

```scss
// 带顶部装饰条的区块
@include section-with-top-bar($gradient, $height);

// 带标签装饰的区块
@include section-with-label($dot-color);
```

### 商品卡片

```scss
// 商品卡片基础
@include goods-card-base;

// 商品卡片悬停效果
@include goods-card-hover;

// 商品卡片带左侧装饰条
@include goods-card-with-decoration;
```

### 价格文字

```scss
// 小号价格
@include price-text-small;

// 中号价格
@include price-text-medium;

// 大号价格
@include price-text-large;
```

### 特殊组件

```scss
// 客户选择器
@include customer-selector;

// 空状态区块
@include empty-state-with-border($border-color);

// 规格标签
@include spec-tag;

// 小计显示
@include subtotal-display;

// 添加按钮
@include add-more-button;

// 文本域
@include modern-textarea;

// 底部栏
@include bottom-bar;

// 弹窗样式
@include popup-header;
@include popup-content;
@include goods-preview-card;
@include total-preview-section;
```

---

## 💡 使用方法

### 1. 在 Vue 组件中导入

```vue
<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

// 使用设计变量
.my-component {
  color: $wh-text-color-dark;
  font-size: $wh-font-size-lg;
  padding: $wh-spacing-md;
  border-radius: $wh-border-radius-lg;
  box-shadow: $wh-shadow-sm;
}

// 使用混入
.my-card {
  @include card-modern;
  @include card-top-decoration($wh-gradient-blue);
}
</style>
```

### 2. 使用工具类（base.scss）

```html
<view class="text-primary text-lg font-bold">标题文本</view>
<view class="flex-center p-md">居中内容</view>
```

---

## 🎯 设计原则

### 1. 色彩使用规范

- **主色**：使用 `$wh-color-blue` 作为主要操作和品牌色
- **成功**：使用 `$wh-color-success-modern` 表示成功状态
- **警告**：使用 `$wh-color-danger-modern` 表示警告和价格
- **文字**：严格遵守三级灰度系统（dark/gray/light-gray）

### 2. 间距使用规范

- **超小**：6rpx - 极细微的间距
- **小**：8rpx - 紧密元素的间距
- **标准**：16rpx - 默认间距
- **中等**：24rpx - 卡片内边距
- **大**：32rpx - 区块间距
- **超大**：48rpx+ - 页面级间距

### 3. 字体使用规范

- **标题**：32-36rpx，字重 600-700
- **正文**：28rpx，字重 400-500
- **辅助**：24rpx，字重 400
- **价格**：使用渐变文字混入，字重 800

### 4. 交互规范

- **快速**：150ms - 按钮点击反馈
- **标准**：200ms - 卡片悬停、过渡动画
- **慢速**：300ms - 弹窗展开、页面切换

### 5. 圆角使用规范

- **小元素**：6-8rpx（标签、小按钮）
- **卡片**：12rpx（标准卡片）
- **大卡片**：16rpx（区块容器）
- **超大卡片**：24rpx（特殊区块）

---

## 📊 设计系统优势

### 1. 一致性

- 所有页面使用统一的设计变量
- 确保色彩、间距、字体的统一性

### 2. 可维护性

- 设计变量集中管理
- 修改一处，全局生效

### 3. 可复用性

- 丰富的混入库
- 减少重复代码

### 4. 可扩展性

- 模块化的文件结构
- 易于添加新的设计变量和混入

### 5. 开发效率

- 快速构建页面
- 专注于业务逻辑

---

## 🔄 更新日志

### v2.0.0 (2025-01-27)

- ✅ 扩展 design-tokens.scss，添加现代设计变量
- ✅ 新增 page-design.scss，页面级高级混入
- ✅ 重构 mixins.scss，添加更多装饰效果
- ✅ 更新开单页面，使用独立设计系统

### v1.0.0 (2025-01-15)

- ✅ 初始化设计系统
- ✅ 创建基础设计变量
- ✅ 建立通用混入库

---

## 📝 示例代码

### 创建一个现代卡片

```scss
.my-card {
  @include card-modern;
  @include card-top-decoration($wh-gradient-blue);
  @include hover-scale(0.98);

  .card-title {
    @include text-heading;
    @include label-dot($wh-color-blue);
  }

  .card-price {
    @include price-text-medium;
  }
}
```

### 创建一个客户选择器

```scss
.customer-selector {
  @include customer-selector;
}
```

### 创建一个商品卡片

```scss
.goods-card {
  @include goods-card-with-decoration;
  @include slide-in-up;

  .goods-image {
    @include goods-image-style;
  }

  .goods-spec {
    @include spec-tag;
  }

  .subtotal {
    @include subtotal-display;
  }
}
```

---

## 🎨 设计理念

本设计系统采用 **现代、专业、温暖** 的视觉风格：

1. **色彩**：专业的蓝色系为主，搭配温暖的辅助色
2. **字体**：清晰的字重层级，强调信息层次
3. **间距**：宽松舒适的呼吸感
4. **圆角**：柔和的圆角系统，亲和力强
5. **阴影**：细腻的阴影层次，增强立体感
6. **动效**：流畅自然的过渡动画

---

**设计团队**: Claude Code
**最后更新**: 2025-01-27
