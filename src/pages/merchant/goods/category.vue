<template>
  <wh-page-container>
    <view class="category-container">
      <view class="header-action">
        <u-button type="primary" icon="plus" text="新增分类" @click="showAddPopup"></u-button>
      </view>

      <view v-if="loading" class="loading-box"><u-loading-icon></u-loading-icon></view>
      <wh-empty-state
        v-else-if="categories.length === 0"
        icon="/static/empty/list.png"
        text="暂无分类"
      >
        <u-button type="primary" text="去新增" @click="showAddPopup"></u-button>
      </wh-empty-state>
      <view v-else class="category-list">
        <wh-section-card v-for="item in categories" :key="item._id">
          <wh-field-row :label="item.name" :tip="`排序：${item.sort || 0}`">
            <view class="cell-actions">
              <u-icon
                name="edit-pen"
                size="22"
                color="#07c160"
                @click.stop="editCategory(item)"
              ></u-icon>
              <u-icon
                name="trash"
                size="22"
                color="#fa5151"
                @click.stop="deleteCategory(item._id)"
              ></u-icon>
            </view>
          </wh-field-row>
        </wh-section-card>
      </view>

      <!-- 新增/编辑弹窗 -->
      <u-modal
        :show="modal.show"
        :title="modal.isEdit ? '编辑分类' : '新增分类'"
        show-cancel-button
        @confirm="submitCategory"
        @cancel="modal.show = false"
      >
        <view class="modal-content">
          <u-form :model="modal.form" label-width="120rpx">
            <u-form-item label="名称" border-bottom required>
              <u-input
                v-model="modal.form.name"
                placeholder="请输入分类名称"
                border="none"
              ></u-input>
            </u-form-item>
            <u-form-item label="排序" border-bottom>
              <u-input
                v-model="modal.form.sort"
                type="number"
                placeholder="数字越小越靠前"
                border="none"
              ></u-input>
            </u-form-item>
          </u-form>
        </view>
      </u-modal>
    </view>
  </wh-page-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { importObject } from '@/utils/cloud'
import WhPageContainer from '@/components/wh/PageContainer.vue'
import WhSectionCard from '@/components/wh/SectionCard.vue'
import WhFieldRow from '@/components/wh/FieldRow.vue'
import WhEmptyState from '@/components/wh/EmptyState.vue'

const categoryCo = importObject('wh-category-co')
const categories = ref<any[]>([])
const loading = ref(false)

const modal = reactive({
  show: false,
  isEdit: false,
  form: {
    _id: '',
    name: '',
    sort: 0
  }
})

const loadCategories = async () => {
  loading.value = true
  try {
    const res = await categoryCo.getCategoryList()
    if (res.code === 0) {
      categories.value = res.data
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const showAddPopup = () => {
  modal.isEdit = false
  modal.form = { _id: '', name: '', sort: 0 }
  modal.show = true
}

const editCategory = (item: any) => {
  modal.isEdit = true
  modal.form = { _id: item._id, name: item.name, sort: item.sort || 0 }
  modal.show = true
}

const submitCategory = async () => {
  if (!modal.form.name) return uni.showToast({ title: '请输入名称', icon: 'none' })

  try {
    let res
    if (modal.isEdit) {
      res = await categoryCo.updateCategory(modal.form._id, {
        name: modal.form.name,
        sort: modal.form.sort
      })
    } else {
      res = await categoryCo.createCategory({
        name: modal.form.name,
        sort: modal.form.sort
      })
    }

    if (res.code === 0) {
      uni.showToast({ title: res.msg })
      modal.show = false
      loadCategories()
    } else {
      uni.showToast({ title: res.msg || '保存失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  }
}

const deleteCategory = (id: string) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除该分类吗？',
    success: async res => {
      if (res.confirm) {
        try {
          const result = await categoryCo.deleteCategory(id)
          if (result.code === 0) {
            uni.showToast({ title: result.msg })
            loadCategories()
          } else {
            uni.showToast({ title: result.msg || '删除失败', icon: 'none' })
          }
        } catch (e: any) {
          uni.showToast({ title: e.message || '删除失败', icon: 'none' })
        }
      }
    }
  })
}

onMounted(() => {
  loadCategories()
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';
@import '@/styles/mixins.scss';
@import '@/styles/page-design.scss';

.category-container {
  padding: $wh-spacing-md;

  .header-action {
    margin-bottom: $wh-spacing-lg;
    padding: 0 $wh-spacing-sm;

    ::v-deep .u-button {
      border-radius: $wh-border-radius-full !important;
      font-weight: $wh-font-weight-semibold !important;
      box-shadow: $wh-shadow-colored !important;
      transition: all $wh-transition-normal !important;

      &:active {
        transform: scale(0.98) !important;
        box-shadow: $wh-shadow-md !important;
      }
    }
  }

  .category-list {
    display: flex;
    flex-direction: column;
    gap: $wh-spacing-md;

    ::v-deep .wh-section-card {
      @include slide-in-up;
      transition: all $wh-transition-normal;

      &:active {
        transform: scale(0.98);
      }
    }
  }

  .cell-actions {
    @include flex-start;
    gap: $wh-spacing-md;

    .u-icon {
      padding: $wh-spacing-sm;
      border-radius: $wh-border-radius-full;
      transition: all $wh-transition-normal;

      &:active {
        transform: scale(0.9);
        opacity: 0.7;
      }
    }
  }

  .modal-content {
    padding: $wh-spacing-lg 0;
    width: 100%;

    ::v-deep .u-form {
      .u-form-item {
        margin-bottom: $wh-spacing-lg;

        .u-form-item__body__left {
          .u-form-item__body__left__content__label {
            @include text-subheading;
            font-size: $wh-font-size-md !important;
          }
        }

        .u-form-item__body__right {
          .u-input {
            background: $wh-bg-color-tertiary !important;
            border-radius: $wh-border-radius-md !important;
            padding: $wh-spacing-sm $wh-spacing-md !important;
            font-size: $wh-font-size-md !important;
            color: $wh-text-color-dark !important;
            transition: all $wh-transition-normal !important;

            &:focus {
              background: $wh-bg-color-card !important;
              border-color: $wh-color-blue !important;
              box-shadow: 0 0 0 6rpx rgba(45, 127, 249, 0.1) !important;
            }
          }
        }
      }
    }
  }
}

.loading-box {
  @include flex-center;
  padding: $wh-spacing-xxl;
}
</style>
