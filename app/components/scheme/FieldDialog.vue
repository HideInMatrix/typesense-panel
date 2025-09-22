<script setup lang="ts">
import {
  Delete,
  Plus
} from '@element-plus/icons-vue'

interface Props {
  visible: boolean
  currentField: any
  embedFromFields: string[]
  modelConfigItems: Array<{key: string, value: string}>
  newModelConfigKey: string
  newModelConfigValue: string
  fieldTypes: Array<{value: string, label: string, description: string}>
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'update:currentField', value: any): void
  (e: 'update:embedFromFields', value: string[]): void
  (e: 'update:modelConfigItems', value: Array<{key: string, value: string}>): void
  (e: 'update:newModelConfigKey', value: string): void
  (e: 'update:newModelConfigValue', value: string): void
  (e: 'save'): void
  (e: 'addModelConfigItem'): void
  (e: 'removeModelConfigItem', index: number): void
  (e: 'addEmbedFromField'): void
  (e: 'removeEmbedFromField', index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 计算属性用于双向绑定
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const currentField = computed({
  get: () => props.currentField,
  set: (value) => emit('update:currentField', value)
})

const embedFromFields = computed({
  get: () => props.embedFromFields,
  set: (value) => emit('update:embedFromFields', value)
})

const modelConfigItems = computed({
  get: () => props.modelConfigItems,
  set: (value) => emit('update:modelConfigItems', value)
})

const newModelConfigKey = computed({
  get: () => props.newModelConfigKey,
  set: (value) => emit('update:newModelConfigKey', value)
})

const newModelConfigValue = computed({
  get: () => props.newModelConfigValue,
  set: (value) => emit('update:newModelConfigValue', value)
})
</script>

<template>
  <ElDialog v-model="visible" title="字段配置" width="600px" :close-on-click-modal="false">
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

      <!-- Image 字段配置 -->
      <div v-if="currentField.type === 'image'" class="grid grid-cols-2 gap-4">
        <ElFormItem label="是否存储原图 (store)">
          <ElSwitch v-model="currentField.store" />
        </ElFormItem>
      </div>

      <ElFormItem label="语言环境">
        <ElInput v-model="currentField.locale" placeholder="如: zh, en" />
      </ElFormItem>

      <ElFormItem label="中缀搜索">
        <ElSwitch v-model="currentField.infix" />
      </ElFormItem>

      <!-- Embed 字段配置 -->
      <div v-if="currentField.type === 'embed'" class="space-y-4 border-t pt-4">
        <h4 class="text-md font-semibold text-slate-800">嵌入向量配置</h4>
        
        <ElFormItem label="向量维度 (num_dim)">
          <ElInputNumber v-model="currentField.embed.num_dim" :min="1" :max="8192" :step="1" />
        </ElFormItem>
        
        <!-- From 字段配置 -->
        <ElFormItem label="源字段 (from)">
          <div class="space-y-2">
            <div v-for="(field, index) in embedFromFields" :key="index" class="flex items-center gap-2">
              <ElInput v-model="embedFromFields[index]" placeholder="输入字段名" class="flex-1" />
              <ElButton @click="emit('removeEmbedFromField', index)" type="danger" size="small" plain>
                <ElIcon>
                  <Delete />
                </ElIcon>
              </ElButton>
            </div>
            <ElButton @click="emit('addEmbedFromField')" type="primary" size="small" plain>
              <ElIcon>
                <Plus />
              </ElIcon>
              添加源字段
            </ElButton>
          </div>
        </ElFormItem>

        <!-- Model Config 配置 -->
        <ElFormItem label="模型配置 (model_config)">
          <div class="space-y-3">
            <!-- 现有配置项 -->
            <div v-for="(item, index) in modelConfigItems" :key="index" 
                 class="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <div class="flex-1 grid grid-cols-2 gap-2">
                <ElInput v-model="item.key" placeholder="配置键" readonly />
                <ElInput v-model="item.value" placeholder="配置值" readonly />
              </div>
              <ElButton @click="emit('removeModelConfigItem', index)" type="danger" size="small" plain>
                <ElIcon>
                  <Delete />
                </ElIcon>
              </ElButton>
            </div>

            <!-- 添加新配置项 -->
            <div class="flex items-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-lg">
              <div class="flex-1 grid grid-cols-2 gap-2">
                <ElInput v-model="newModelConfigKey" placeholder="配置键" />
                <ElInput v-model="newModelConfigValue" placeholder="配置值" />
              </div>
              <ElButton @click="emit('addModelConfigItem')" type="primary" size="small">
                <ElIcon>
                  <Plus />
                </ElIcon>
                添加
              </ElButton>
            </div>
          </div>
        </ElFormItem>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton @click="emit('save')" type="primary">保存</ElButton>
      </div>
    </template>
  </ElDialog>
</template>
