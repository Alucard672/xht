<template>
  <view class="category-container">
    <view class="header-action">
      <u-button type="primary" icon="plus" text="新增分类" @click="showAddPopup"></u-button>
    </view>

    <unicloud-db
      ref="udb"
      v-slot="{ data, loading, error }"
      collection="wh_categories"
      :where="`tenant_id == '${tenant_id}'`"
      orderby="sort asc"
    >
      <view v-if="loading"><u-loading-icon></u-loading-icon></view>
      <view v-else-if="error">{{ error.message }}</view>
      <view v-else>
        <u-list>
          <u-list-item v-for="item in data.length > 0 ? data : mockCategories" :key="item._id">
            <u-cell :title="item.name" :label="'排序: ' + (item.sort || 0)">
              <template #value>
                <view class="cell-actions">
                  <u-icon
                    name="edit-pen"
                    size="20"
                    color="#2979ff"
                    custom-style="margin-right: 30rpx"
                    @click="editCategory(item)"
                  ></u-icon>
                  <u-icon
                    name="trash"
                    size="20"
                    color="#fa3534"
                    @click="deleteCategory(item._id)"
                  ></u-icon>
                </view>
              </template>
            </u-cell>
          </u-list-item>
        </u-list>
      </view>
    </unicloud-db>

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
            <u-input v-model="modal.form.name" placeholder="请输入分类名称" border="none"></u-input>
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
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const tenant_id = uni.getStorageSync('tenant_id')
const udb = ref<any>(null)

const mockCategories = [
  { _id: 'mc1', name: '酒水饮料', sort: 1 },
  { _id: 'mc2', name: '粮油副食', sort: 2 },
  { _id: 'mc3', name: '方便速食', sort: 3 },
  { _id: 'mc4', name: '日用百货', sort: 4 }
]

const modal = reactive({
  show: false,
  isEdit: false,
  form: {
    _id: '',
    name: '',
    sort: 0
  }
})

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

  const db = uniCloud.database()
  try {
    if (modal.isEdit) {
      await db
        .collection('wh_categories')
        .doc(modal.form._id)
        .update({
          name: modal.form.name,
          sort: parseInt(String(modal.form.sort)) || 0
        })
    } else {
      await db.collection('wh_categories').add({
        tenant_id,
        name: modal.form.name,
        sort: parseInt(String(modal.form.sort)) || 0
      })
    }
    uni.showToast({ title: '保存成功' })
    modal.show = false
    udb.value.refresh()
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

const deleteCategory = (id: string) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除该分类吗？',
    success: async res => {
      if (res.confirm) {
        try {
          await uniCloud.database().collection('wh_categories').doc(id).remove()
          uni.showToast({ title: '删除成功' })
          udb.value.refresh()
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.category-container {
  padding: 20rpx;
  .header-action {
    margin-bottom: 20rpx;
  }
  .cell-actions {
    display: flex;
    align-items: center;
  }
  .modal-content {
    padding: 20rpx 0;
    width: 100%;
  }
}
</style>
