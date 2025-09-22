<script setup lang="ts">
import {
  Document,
  View,
  Edit,
  Delete,
} from '@element-plus/icons-vue'

interface Props {
  collections: any[]
  loading: boolean
}

interface Emits {
  (e: 'refresh'): void
  (e: 'view', collection: any): void
  (e: 'edit', collection: any): void
  (e: 'delete', collection: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 删除集合
async function deleteCollection(collection: any) {
  try {
    await ElMessageBox.confirm(
      `确认删除集合 "${collection.name}"？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    const result: { success: boolean, message: string } = (await $fetch(`/api/collections/${collection.name}`, {
      method: 'DELETE'
    })) as any

    if (result.success) {
      ElMessage.success('删除成功')
      emit('refresh')
    } else {
      ElMessage.error(result.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200/70 shadow-sm">
    <div class="p-6">
      <ElTable :data="collections" :loading="loading" empty-text="暂无集合数据" class="w-full">
        <ElTableColumn prop="name" label="集合名称" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <ElIcon class="text-indigo-600">
                <Document />
              </ElIcon>
              <span class="font-medium text-slate-800">{{ row.name }}</span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="num_documents" label="文档数量" width="120">
          <template #default="{ row }">
            <ElTag type="info" size="small">
              {{ row.num_documents || 0 }}
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="fields" label="字段数量" width="120">
          <template #default="{ row }">
            <ElTag type="success" size="small">
              {{ row.fields?.length || 0 }}
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="default_sorting_field" label="默认排序字段" min-width="150">
          <template #default="{ row }">
            <span v-if="row.default_sorting_field" class="text-slate-600">
              {{ row.default_sorting_field }}
            </span>
            <span v-else class="text-slate-400">未设置</span>
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <ElButton @click="emit('view', row)" size="small" type="primary" plain>
                <ElIcon>
                  <View />
                </ElIcon>
                查看
              </ElButton>
              <ElButton @click="emit('edit', row)" size="small" type="warning" plain>
                <ElIcon>
                  <Edit />
                </ElIcon>
                编辑
              </ElButton>
              <ElButton @click="deleteCollection(row)" size="small" type="danger" plain>
                <ElIcon>
                  <Delete />
                </ElIcon>
                删除
              </ElButton>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </div>
</template>
