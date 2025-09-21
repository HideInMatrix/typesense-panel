<script setup lang="ts">
import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections'

import {
  Document,
  Edit,
  Delete,
  View,
  Plus,
  Refresh,
  Files,
  Upload
} from '@element-plus/icons-vue'

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

// 字段编辑
const currentField = ref({
  name: '',
  type: 'string',
  facet: false,
  optional: false,
  index: true,
  sort: false,
  locale: '',
  infix: false
})

const fieldDialogVisible = ref(false)
const editingFieldIndex = ref(-1)

// 支持的数据类型
const fieldTypes = [
  { value: 'string', label: '字符串 (string)', description: '文本字段，支持全文搜索' },
  { value: 'int32', label: '32位整数 (int32)', description: '整数类型，支持排序和分面' },
  { value: 'int64', label: '64位整数 (int64)', description: '长整数类型，支持排序和分面' },
  { value: 'float', label: '浮点数 (float)', description: '浮点数类型，支持排序和分面' },
  { value: 'bool', label: '布尔值 (bool)', description: '布尔类型，支持分面' },
  { value: 'string[]', label: '字符串数组 (string[])', description: '字符串数组，支持多值' },
  { value: 'int32[]', label: '整数数组 (int32[])', description: '整数数组，支持多值' },
  { value: 'int64[]', label: '长整数数组 (int64[])', description: '长整数数组，支持多值' },
  { value: 'float[]', label: '浮点数组 (float[])', description: '浮点数组，支持多值' },
  { value: 'bool[]', label: '布尔数组 (bool[])', description: '布尔数组，支持多值' },
  { value: 'geopoint', label: '地理坐标 (geopoint)', description: '地理坐标点，支持地理位置搜索' },
  { value: 'object', label: '对象 (object)', description: '嵌套对象类型' },
  { value: 'object[]', label: '对象数组 (object[])', description: '对象数组类型' }
]

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

// 获取集合详情
async function fetchCollectionDetails(collectionName: string) {
  try {
    const response: { data: any } = (await $fetch(`/api/collections/${collectionName}`)) as any
    return response.data
  } catch (error) {
    console.error('获取集合详情失败:', error)
    return null
  }
}

// 打开编辑对话框
async function openEditDialog(collection?: any) {
  if (collection) {
    editMode.value = 'edit'
    // 获取集合详情
    const details = await fetchCollectionDetails(collection.name)
    if (details) {
      schemaForm.value = {
        name: details.name,
        fields: details.fields || [],
        default_sorting_field: details.default_sorting_field || ''
      }
    } else {
      // 如果获取详情失败，使用基本信息
      schemaForm.value = {
        name: collection.name,
        fields: collection.fields || [],
        default_sorting_field: collection.default_sorting_field || ''
      }
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

// 字段管理
function addField() {
  currentField.value = {
    name: '',
    type: 'string',
    facet: false,
    optional: false,
    index: true,
    sort: false,
    locale: '',
    infix: false
  }
  editingFieldIndex.value = -1
  fieldDialogVisible.value = true
}

function editField(field: any, index: number) {
  currentField.value = { ...field }
  editingFieldIndex.value = index
  fieldDialogVisible.value = true
}

function removeField(index: number) {
  schemaForm.value.fields?.splice(index, 1)
}

function saveField() {
  if (!currentField.value.name.trim()) {
    ElMessage.warning('请输入字段名称')
    return
  }

  if (!currentField.value.type) {
    ElMessage.warning('请选择字段类型')
    return
  }

  const field = { ...currentField.value }

  if (editingFieldIndex.value >= 0 && schemaForm.value.fields) {
    (schemaForm.value.fields[editingFieldIndex.value] as any) = field
  } else {
    schemaForm.value.fields?.push(field as any)
  }

  fieldDialogVisible.value = false
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

// 获取字段类型描述
function getFieldTypeDescription(type: string) {
  const fieldType = fieldTypes.find(ft => ft.value === type)
  return fieldType?.description || ''
}

// 获取字段类型标签
function getFieldTypeLabel(type: string) {
  const fieldType = fieldTypes.find(ft => ft.value === type)
  return fieldType?.label || type
}

// 初始化
onMounted(() => {
  Promise.all([fetchCollections(), getAllDatabases()])
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
      <div class="bg-white rounded-xl border border-slate-200/70 shadow-sm">
        <div class="p-6 border-b border-slate-200/70">
          <h2 class="text-lg font-semibold text-slate-800">集合列表</h2>
          <p class="text-sm text-slate-600 mt-1">管理所有 Typesense 集合的 Schema 结构</p>
        </div>

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
                  <ElButton @click="openViewDialog(row)" size="small" type="primary" plain>
                    <ElIcon>
                      <View />
                    </ElIcon>
                    查看
                  </ElButton>
                  <ElButton @click="openEditDialog(row)" size="small" type="warning" plain>
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

      <!-- 编辑对话框 -->
      <ElDialog v-model="showEditDialog" :title="editMode === 'create' ? '新建 Schema' : '编辑 Schema'" width="900px"
        :close-on-click-modal="false">
        <div class="space-y-6">
          <!-- 基本信息 -->
          <div class="bg-slate-50 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-slate-800 mb-4">基本信息</h3>
            <div class="grid grid-cols-1 gap-4">
              <ElFormItem label="集合名称" required>
                <ElInput v-model="schemaForm.name" placeholder="请输入集合名称" :disabled="editMode === 'edit'" />
              </ElFormItem>
              <ElFormItem label="默认排序字段">
                <ElInput v-model="schemaForm.default_sorting_field" placeholder="请输入默认排序字段名" />
              </ElFormItem>
            </div>
          </div>

          <!-- 数据库导入 -->
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <ElIcon class="text-blue-600">
                  <Files />
                </ElIcon>
                从数据库表导入
              </h3>
              <ElButton @click="showDatabaseImport = !showDatabaseImport" type="primary" plain size="small">
                <ElIcon>
                  <Upload />
                </ElIcon>
                {{ showDatabaseImport ? '隐藏' : '显示' }}数据库导入
              </ElButton>
            </div>
            
            <div v-if="showDatabaseImport" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm text-slate-600 mb-2 block">选择数据库</label>
                  <ElSelect v-model="selectedDb" placeholder="选择数据库" class="w-full" @change="handleDbChange">
                    <ElOption v-for="db in databaseConfigList" :key="db.id" :label="db.name" :value="db.id" />
                  </ElSelect>
                </div>
                <div>
                  <label class="text-sm text-slate-600 mb-2 block">选择表</label>
                  <ElSelect v-model="selectedTable" placeholder="选择表" class="w-full" @change="applyTableToSchema">
                    <ElOption v-for="table in databaseTables" :key="table" :label="table" :value="table" />
                  </ElSelect>
                </div>
              </div>
              <div class="text-sm text-slate-500">
                <p>• 选择数据库和表后，系统会自动生成对应的字段结构</p>
                <p>• 字段类型会根据数据库字段类型自动映射到 Typesense 类型</p>
                <p>• 可以在此基础上手动调整字段属性</p>
              </div>
            </div>
          </div>

          <!-- 字段管理 -->
          <div class="bg-slate-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-slate-800">字段配置</h3>
              <ElButton @click="addField" type="primary" size="small">
                <ElIcon>
                  <Plus />
                </ElIcon>
                手动添加字段
              </ElButton>
            </div>

            <div v-if="schemaForm.fields?.length === 0" class="text-center py-8 text-slate-500">
              <ElIcon size="48" class="mb-2">
                <Document />
              </ElIcon>
              <p>暂无字段，请添加字段或从数据库导入</p>
            </div>

            <div v-else class="space-y-3">
              <div v-for="(field, index) in schemaForm.fields" :key="index"
                class="bg-white rounded-lg p-4 border border-slate-200">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="font-medium text-slate-800">{{ field.name }}</span>
                      <ElTag :type="field.optional ? 'info' : 'success'" size="small">
                        {{ getFieldTypeLabel(field.type) }}
                      </ElTag>
                      <ElTag v-if="field.facet" type="warning" size="small">分面</ElTag>
                      <ElTag v-if="field.optional" type="info" size="small">可选</ElTag>
                    </div>
                    <p class="text-sm text-slate-600">{{ getFieldTypeDescription(field.type) }}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <ElButton @click="editField(field, index)" size="small" type="primary" plain>
                      <ElIcon>
                        <Edit />
                      </ElIcon>
                    </ElButton>
                    <ElButton @click="removeField(index)" size="small" type="danger" plain>
                      <ElIcon>
                        <Delete />
                      </ElIcon>
                    </ElButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <ElButton @click="showEditDialog = false">取消</ElButton>
            <ElButton @click="saveSchema" type="primary">
              {{ editMode === 'create' ? '创建' : '保存' }}
            </ElButton>
          </div>
        </template>
      </ElDialog>

      <!-- 字段编辑对话框 -->
      <ElDialog v-model="fieldDialogVisible" title="字段配置" width="600px" :close-on-click-modal="false">
        <div class="space-y-4">
          <ElFormItem label="字段名称" required>
            <ElInput v-model="currentField.name" placeholder="请输入字段名称" />
          </ElFormItem>

          <ElFormItem label="字段类型" required>
            <ElSelect v-model="currentField.type" placeholder="选择字段类型" class="w-full">
              <ElOption v-for="type in fieldTypes" :key="type.value" :label="type.label" :value="type.value">
                <div>
                  <div class="font-medium">{{ type.label }}</div>
                  <div class="text-sm text-slate-500">{{ type.description }}</div>
                </div>
              </ElOption>
            </ElSelect>
          </ElFormItem>

          <div class="grid grid-cols-2 gap-4">
            <ElFormItem label="是否分面">
              <ElSwitch v-model="currentField.facet" />
            </ElFormItem>
            <ElFormItem label="是否可选">
              <ElSwitch v-model="currentField.optional" />
            </ElFormItem>
            <ElFormItem label="是否索引">
              <ElSwitch v-model="currentField.index" />
            </ElFormItem>
            <ElFormItem label="是否排序">
              <ElSwitch v-model="currentField.sort" />
            </ElFormItem>
          </div>

          <ElFormItem label="语言环境">
            <ElInput v-model="currentField.locale" placeholder="如: zh, en" />
          </ElFormItem>

          <ElFormItem label="中缀搜索">
            <ElSwitch v-model="currentField.infix" />
          </ElFormItem>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <ElButton @click="fieldDialogVisible = false">取消</ElButton>
            <ElButton @click="saveField" type="primary">保存</ElButton>
          </div>
        </template>
      </ElDialog>

      <!-- 查看对话框 -->
      <ElDialog v-model="showViewDialog" title="Schema 详情" width="800px">
        <div v-if="selectedCollection" class="space-y-6">
          <!-- 基本信息 -->
          <div class="bg-slate-50 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-slate-800 mb-4">基本信息</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-slate-600">集合名称</label>
                <p class="font-medium text-slate-800">{{ selectedCollection.name }}</p>
              </div>
              <div>
                <label class="text-sm text-slate-600">文档数量</label>
                <p class="font-medium text-slate-800">{{ selectedCollection.num_documents || 0 }}</p>
              </div>
              <div>
                <label class="text-sm text-slate-600">字段数量</label>
                <p class="font-medium text-slate-800">{{ selectedCollection.fields?.length || 0 }}</p>
              </div>
              <div>
                <label class="text-sm text-slate-600">默认排序字段</label>
                <p class="font-medium text-slate-800">{{ selectedCollection.default_sorting_field || '未设置' }}</p>
              </div>
            </div>
          </div>

          <!-- 字段列表 -->
          <div class="bg-slate-50 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-slate-800 mb-4">字段列表</h3>
            <div v-if="selectedCollection.fields?.length" class="space-y-3">
              <div v-for="(field, index) in selectedCollection.fields" :key="index"
                class="bg-white rounded-lg p-4 border border-slate-200">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="font-medium text-slate-800">{{ field.name }}</span>
                      <ElTag :type="field.optional ? 'info' : 'success'" size="small">
                        {{ getFieldTypeLabel(field.type) }}
                      </ElTag>
                      <ElTag v-if="field.facet" type="warning" size="small">分面</ElTag>
                      <ElTag v-if="field.optional" type="info" size="small">可选</ElTag>
                    </div>
                    <p class="text-sm text-slate-600">{{ getFieldTypeDescription(field.type) }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-slate-500">
              <ElIcon size="48" class="mb-2">
                <Document />
              </ElIcon>
              <p>暂无字段</p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="showViewDialog = false">关闭</ElButton>
          </div>
        </template>
      </ElDialog>
    </div>
  </NuxtLayout>
</template>
