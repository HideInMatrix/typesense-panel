import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections'

// 字段编辑状态
export const useFieldEditor = () => {
  // 字段编辑
  const currentField = ref({
    name: '',
    type: 'string',
    facet: false,
    optional: false,
    index: true,
    sort: false,
    locale: '',
    infix: false,
    store: false,
    embed: {
      from: [],
      model_config: {},
      num_dim: 512
    }
  })

  const fieldDialogVisible = ref(false)
  const editingFieldIndex = ref(-1)

  // Embed 字段配置
  const embedFromFields = ref<string[]>([])
  const modelConfigItems = ref<Array<{key: string, value: string}>>([])
  const newModelConfigKey = ref('')
  const newModelConfigValue = ref('')

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
    { value: 'object[]', label: '对象数组 (object[])', description: '对象数组类型' },
    { value: 'embed', label: '嵌入向量 (embed)', description: '向量嵌入字段，支持语义搜索' },
    { value: 'image', label: '图片 (image)', description: '图片字段，支持图片检索' }
  ]

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
      infix: false,
      store: false,
      embed: {
        from: [],
        model_config: {},
        num_dim: 512
      }
    }
    embedFromFields.value = []
    modelConfigItems.value = []
    newModelConfigKey.value = ''
    newModelConfigValue.value = ''
    editingFieldIndex.value = -1
    fieldDialogVisible.value = true
  }

  function editField(field: any, index: number) {
    // 如果是后端返回的 embed 字段，通常类型为 float[]，这里映射回 UI 的 embed 类型
    const cloned = { ...field }
    if ((cloned as any).embed && cloned.type === 'float[]') {
      cloned.type = 'embed'
    }
    currentField.value = cloned as any
    editingFieldIndex.value = index
    
    // 初始化 embed 配置
    if (field.embed) {
      embedFromFields.value = [...(field.embed.from || [])]
      modelConfigItems.value = Object.entries(field.embed.model_config || {}).map(([key, value]) => ({
        key,
        value: String(value)
      }))
    } else {
      embedFromFields.value = []
      modelConfigItems.value = []
    }
    newModelConfigKey.value = ''
    newModelConfigValue.value = ''
    
    fieldDialogVisible.value = true
  }

  function saveField(schemaForm: Ref<CollectionCreateSchema>) {
    if (!currentField.value.name.trim()) {
      ElMessage.warning('请输入字段名称')
      return
    }

    if (!currentField.value.type) {
      ElMessage.warning('请选择字段类型')
      return
    }

    const field: any = { ...currentField.value }

    // 处理 embed 字段配置
    if (field.type === 'embed') {
      field.embed = {
        from: [...embedFromFields.value],
        model_config: modelConfigItems.value.reduce((acc, item) => {
          acc[item.key] = item.value
          return acc
        }, {} as Record<string, string>),
        num_dim: currentField.value?.embed?.num_dim ?? 512
      }
      // Typesense 要求 embed 字段的类型必须为 float[]
      field.type = 'float[]'
    }

    if (editingFieldIndex.value >= 0 && schemaForm.value.fields) {
      (schemaForm.value.fields[editingFieldIndex.value] as any) = field
    } else {
      schemaForm.value.fields?.push(field as any)
    }

    fieldDialogVisible.value = false
  }

  function removeField(schemaForm: Ref<CollectionCreateSchema>, index: number) {
    schemaForm.value.fields?.splice(index, 1)
  }

  // Embed 字段配置管理
  function addModelConfigItem() {
    if (!newModelConfigKey.value.trim() || !newModelConfigValue.value.trim()) {
      ElMessage.warning('请输入配置键和值')
      return
    }
    
    if (modelConfigItems.value.some(item => item.key === newModelConfigKey.value)) {
      ElMessage.warning('配置键已存在')
      return
    }
    
    modelConfigItems.value.push({
      key: newModelConfigKey.value,
      value: newModelConfigValue.value
    })
    
    newModelConfigKey.value = ''
    newModelConfigValue.value = ''
  }

  function removeModelConfigItem(index: number) {
    modelConfigItems.value.splice(index, 1)
  }

  function addEmbedFromField() {
    if (embedFromFields.value.length === 0) {
      embedFromFields.value.push('')
    } else {
      embedFromFields.value.push('')
    }
  }

  function removeEmbedFromField(index: number) {
    embedFromFields.value.splice(index, 1)
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

  return {
    // 状态
    currentField,
    fieldDialogVisible,
    editingFieldIndex,
    embedFromFields,
    modelConfigItems,
    newModelConfigKey,
    newModelConfigValue,
    fieldTypes,
    
    // 方法
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
  }
}
