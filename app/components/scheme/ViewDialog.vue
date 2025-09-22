<script setup lang="ts">
import {
  Document
} from '@element-plus/icons-vue'

interface Props {
  visible: boolean
  selectedCollection: any
  getFieldTypeLabel: (type: string) => string
  getFieldTypeDescription: (type: string) => string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})
</script>

<template>
  <ElDialog v-model="visible" title="Schema 详情" width="800px">
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
                <!-- Embed 字段详细信息 -->
                <div v-if="(field as any).type === 'embed' && (field as any).embed" class="mt-3 space-y-2">
                  <div v-if="(field as any).embed.from && (field as any).embed.from.length > 0" class="text-sm">
                    <span class="font-medium text-blue-700">源字段:</span>
                    <div class="mt-1 flex flex-wrap gap-1">
                      <ElTag v-for="fromField in (field as any).embed.from" :key="fromField" type="primary" size="small">
                        {{ fromField }}
                      </ElTag>
                    </div>
                  </div>
                  <div v-if="(field as any).embed.model_config && Object.keys((field as any).embed.model_config).length > 0" class="text-sm">
                    <span class="font-medium text-green-700">模型配置:</span>
                    <div class="mt-1 space-y-1">
                      <div v-for="(value, key) in (field as any).embed.model_config" :key="key" 
                           class="flex items-center gap-2 text-xs bg-slate-100 px-2 py-1 rounded">
                        <span class="font-medium text-slate-700">{{ key }}:</span>
                        <span class="text-slate-600">{{ value }}</span>
                      </div>
                    </div>
                  </div>
                </div>
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
        <ElButton @click="visible = false">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>
