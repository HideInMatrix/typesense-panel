<script setup lang="ts">
import { Document, Files, Upload, Plus, Edit, Delete } from '@element-plus/icons-vue'

interface Props {
  visible: boolean
  editMode: 'create' | 'edit'
  schemaForm: any
  showDatabaseImport: boolean
  databaseConfigList: Array<{ id: string; name: string }>
  selectedDb: string
  databaseTables: string[]
  selectedTable: string
  getFieldTypeLabel: (type: string) => string
  getFieldTypeDescription: (type: string) => string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'update:schemaForm', value: any): void
  (e: 'update:showDatabaseImport', value: boolean): void
  (e: 'update:selectedDb', value: string): void
  (e: 'update:selectedTable', value: string): void
  (e: 'dbChange'): void
  (e: 'applyTable'): void
  (e: 'addField'): void
  (e: 'editField', field: any, index: number): void
  (e: 'removeField', index: number): void
  (e: 'save'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// v-model wrappers
const visible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v)
})

const schemaName = computed({
  get: () => props.schemaForm?.name || '',
  set: (v: string) => emit('update:schemaForm', { ...props.schemaForm, name: v })
})

const defaultSortingField = computed({
  get: () => props.schemaForm?.default_sorting_field || '',
  set: (v: string) => emit('update:schemaForm', { ...props.schemaForm, default_sorting_field: v })
})

const showDatabaseImport = computed({
  get: () => props.showDatabaseImport,
  set: (v: boolean) => emit('update:showDatabaseImport', v)
})

const selectedDb = computed({
  get: () => props.selectedDb,
  set: (v: string) => emit('update:selectedDb', v)
})

const selectedTable = computed({
  get: () => props.selectedTable,
  set: (v: string) => emit('update:selectedTable', v)
})
</script>

<template>
  <ElDialog v-model="visible" :title="editMode === 'create' ? '新建 Schema' : '编辑 Schema'" width="900px"
    :close-on-click-modal="false">
    <div class="space-y-6">
      <!-- 基本信息 -->
      <div class="bg-slate-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">基本信息</h3>
        <div class="grid grid-cols-1 gap-4">
          <ElFormItem label="集合名称" required>
            <ElInput v-model="schemaName" placeholder="请输入集合名称" :disabled="editMode === 'edit'" />
          </ElFormItem>
          <ElFormItem label="默认排序字段">
            <ElInput v-model="defaultSortingField" placeholder="请输入默认排序字段名" />
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
              <ElSelect v-model="selectedDb" clearable placeholder="选择数据库" class="w-full" @change="() => emit('dbChange')">
                <ElOption v-for="db in databaseConfigList" :key="db.id" :label="db.name" :value="db.id" />
              </ElSelect>
            </div>
            <div>
              <label class="text-sm text-slate-600 mb-2 block">选择表</label>
              <ElSelect v-model="selectedTable" clearable placeholder="选择表" class="w-full" @change="() => emit('applyTable')">
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

      <!-- 字段管理（展示与操作按钮） -->
      <div class="bg-slate-50 rounded-lg p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-800">字段配置</h3>
          <ElButton @click="emit('addField')" type="primary" size="small">
            <ElIcon>
              <Plus />
            </ElIcon>
            手动添加字段
          </ElButton>
        </div>

        <div v-if="!schemaForm?.fields || schemaForm.fields.length === 0" class="text-center py-8 text-slate-500">
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
                <!-- Embed 字段特殊显示 -->
                <div v-if="(field as any).type === 'embed' && (field as any).embed" class="mt-2 space-y-1">
                  <div v-if="(field as any).embed.from && (field as any).embed.from.length > 0" class="text-xs text-blue-600">
                    <span class="font-medium">源字段:</span> {{ (field as any).embed.from.join(', ') }}
                  </div>
                  <div v-if="(field as any).embed.model_config && Object.keys((field as any).embed.model_config).length > 0" class="text-xs text-green-600">
                    <span class="font-medium">模型配置:</span> {{ Object.keys((field as any).embed.model_config).length }} 项
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <ElButton @click="emit('editField', field, index)" size="small" type="primary" plain>
                  <ElIcon>
                    <Edit />
                  </ElIcon>
                </ElButton>
                <ElButton @click="emit('removeField', index)" size="small" type="danger" plain>
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
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton @click="emit('save')" type="primary">
          {{ editMode === 'create' ? '创建' : '保存' }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>


