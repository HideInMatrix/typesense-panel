<script setup lang="ts">
import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections'

import {
  Document,
  Plus,
  Refresh,
  Files,
  Upload
} from '@element-plus/icons-vue'

// 使用 composable
const {
  currentField,
  fieldDialogVisible,
  embedFromFields,
  modelConfigItems,
  newModelConfigKey,
  newModelConfigValue,
  fieldTypes,
  addField,
  editField,
  saveField,
  removeField,
  addModelConfigItem,
  removeModelConfigItem,
  addEmbedFromField,
  removeEmbedFromField,
  getFieldTypeDescription,
  getFieldTypeLabel
} = useFieldEditor()

// 响应式数据
const collections = ref<any[]>([])
const loading = ref(false)
const selectedCollection = ref<any>(null)
const showEditDialog = ref(false)
const showViewDialog = ref(false)
const editMode = ref<'create' | 'edit'>('create')

// 数据库相关
const { databaseConfigList, selectedDb, getAllDatabases, databaseTables, selectedTable, getTablesByDb } = useDatabaseConfig()
const showDatabaseImport = ref(false)

// Schema 编辑表单
const schemaForm = ref<CollectionCreateSchema>({
  name: '',
  fields: [],
  default_sorting_field: ''
})

// 获取集合列表
async function fetchCollections() {
  loading.value = true
  try {
    const data = await $fetch('/api/collections/all')
    collections.value = data || []
  } catch (error) {
    ElMessage.error('获取集合列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 打开编辑对话框
async function openEditDialog(collection?: any) {
  if (collection) {
    editMode.value = 'edit'
    schemaForm.value = {
      name: collection.name,
      fields: collection.fields || [],
      default_sorting_field: collection.default_sorting_field || ''
    }
  } else {
    editMode.value = 'create'
    schemaForm.value = {
      name: '',
      fields: [],
      default_sorting_field: ''
    }
  }
  showEditDialog.value = true
}

// 打开查看对话框
async function openViewDialog(collection: any) {
  selectedCollection.value = collection
  showViewDialog.value = true
}

// 保存 Schema
async function saveSchema() {
  if (!schemaForm.value.name.trim()) {
    ElMessage.warning('请输入集合名称')
    return
  }

  if (schemaForm.value?.fields?.length === 0) {
    ElMessage.warning('请至少添加一个字段')
    return
  }

  try {
    if (editMode.value === 'create') {
      const result: { success: boolean, message: string } = (await $fetch('/api/collections/create', {
        method: 'POST',
        body: schemaForm.value
      })) as any

      if (result.success) {
        ElMessage.success('集合创建成功')
        showEditDialog.value = false
        await fetchCollections()
      } else {
        ElMessage.error(result.message || '创建失败')
      }
    } else {
      // 编辑模式 - 更新集合
      const result: { success: boolean, message: string } = (await $fetch(`/api/collections/${schemaForm.value.name}`, {
        method: 'PUT',
        body: schemaForm.value
      })) as any

      if (result.success) {
        ElMessage.success('集合更新成功')
        showEditDialog.value = false
        await fetchCollections()
      } else {
        ElMessage.error(result.message || '更新失败')
      }
    }
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

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
      await fetchCollections()
    } else {
      ElMessage.error(result.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 字段管理 - 使用 composable 中的方法
function handleAddField() {
  addField()
}

function handleEditField(field: any, index: number) {
  editField(field, index)
}

function handleRemoveField(index: number) {
  removeField(schemaForm, index)
}

function handleSaveField() {
  saveField(schemaForm)
}

// 数据库表结构导入
async function loadTableSchema(tableName: string) {
  let tableColumns: any[] = [];
  if (!tableName) return tableColumns
  try {
    const resp: { data: any[] } = (await $fetch(`/api/database/${encodeURIComponent(selectedDb.value)}/${tableName}`)) as any
    tableColumns = resp.data || []
  } catch (e) {
    tableColumns = []
  }
  return tableColumns
}

async function applyTableToSchema() {
  if (!selectedTable.value) return
  const tableColumns = await loadTableSchema(selectedTable.value)
  try {
    if (tableColumns.length) {
      // 清空现有字段
      schemaForm.value.fields = []

      // 添加从数据库表生成的字段
      tableColumns.forEach((col: any) => {
        const field = {
          name: col.name,
          type: mapTypeToTypesense(col.type),
          optional: String(col.nullable).toUpperCase() !== 'NO',
          facet: false,
          index: true,
          sort: false,
          locale: '',
          infix: false
        }
        schemaForm.value.fields?.push(field as any)
      })

      // 设置集合名称为表名
      schemaForm.value.name = selectedTable.value

      ElMessage.success(`已从表 ${selectedTable.value} 导入 ${tableColumns.length} 个字段`)
    }
  } catch (e) {
    ElMessage.error('导入表结构失败')
    console.error(e)
  }
}

function handleDbChange() {
  getTablesByDb().then(() => {
    // 清空选择的表
    selectedTable.value = ''
  })
}

// 初始化
onMounted(() => {
  Promise.race([fetchCollections(), getAllDatabases()])
})
</script>

<template>
  <NuxtLayout>
    <div class="space-y-6">
      <!-- 页面标题 -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <ElIcon class="text-indigo-600" size="28">
              <Document />
            </ElIcon>
            Schema 管理
          </h1>
          <p class="text-slate-600 mt-1">管理 Typesense 集合的 Schema 结构</p>
        </div>
        <div class="flex items-center gap-3">
          <ElButton @click="fetchCollections" :loading="loading" type="primary" plain>
            <ElIcon>
              <Refresh />
            </ElIcon>
            刷新
          </ElButton>
          <ElButton @click="openEditDialog()" type="primary">
            <ElIcon>
              <Plus />
            </ElIcon>
            新建 Schema
          </ElButton>
        </div>
      </div>

      <!-- 集合列表 -->
      <SchemeCollectionList :collections="collections" :loading="loading" @refresh="fetchCollections"
        @view="openViewDialog" @edit="openEditDialog" @delete="deleteCollection" />

      <!-- 编辑对话框（组件化） -->
      <SchemeEditDialog v-model:visible="showEditDialog" :edit-mode="editMode" v-model:schema-form="schemaForm"
        v-model:show-database-import="showDatabaseImport" :database-config-list="databaseConfigList"
        v-model:selected-db="selectedDb" :database-tables="databaseTables" v-model:selected-table="selectedTable"
        :get-field-type-label="getFieldTypeLabel" :get-field-type-description="getFieldTypeDescription"
        @db-change="handleDbChange" @apply-table="applyTableToSchema" @add-field="handleAddField"
        @edit-field="handleEditField" @remove-field="handleRemoveField" @save="saveSchema" />

      <!-- 字段编辑对话框 -->
      <SchemeFieldDialog v-model:visible="fieldDialogVisible" v-model:current-field="currentField"
        v-model:embed-from-fields="embedFromFields" v-model:model-config-items="modelConfigItems"
        v-model:new-model-config-key="newModelConfigKey" v-model:new-model-config-value="newModelConfigValue"
        :field-types="fieldTypes" @save="handleSaveField" @add-model-config-item="addModelConfigItem"
        @remove-model-config-item="removeModelConfigItem" @add-embed-from-field="addEmbedFromField"
        @remove-embed-from-field="removeEmbedFromField" />

      <!-- 查看对话框 -->
      <SchemeViewDialog v-model:visible="showViewDialog" :selected-collection="selectedCollection"
        :get-field-type-label="getFieldTypeLabel" :get-field-type-description="getFieldTypeDescription" />
    </div>
  </NuxtLayout>
</template>
