<script setup lang="ts">

import { Plus, Edit, Delete, Connection, Folder } from '@element-plus/icons-vue'
import {DatabaseType} from "~~/enums/database"

const configs = ref<AnyDatabaseConfig[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const editingConfig = ref<AnyDatabaseConfig | null>(null)
const testing = ref<string | null>(null)

// // 表单数据
const form = reactive({
  name: '',
  type: DatabaseType.POSTGRESQL,
  host: '',
  port: 5432,
  database: '',
  username: '',
  password: '',
  ssl: false,
  connectionTimeout: 30,
  // 特定数据库类型的字段
  schema: 'public', // PostgreSQL
  charset: 'utf8mb4', // MySQL/MariaDB
  timezone: 'local', // MySQL/MariaDB
  filePath: '', // SQLite
  db: 0, // Redis
  extra: {}
})

// // 数据库类型选项
const dbTypes = [
  { value: DatabaseType.POSTGRESQL, label: 'PostgreSQL' },
  { value: DatabaseType.MYSQL, label: 'MySQL' },
  { value: DatabaseType.MARIADB, label: 'MariaDB' },
  { value: DatabaseType.SQLITE, label: 'SQLite' },
  { value: DatabaseType.MONGODB, label: 'MongoDB' },
  { value: DatabaseType.REDIS, label: 'Redis' }
]

// // 加载配置列表
async function loadConfigs() {
  loading.value = true
  try {
    const response = await $fetch('/api/database/configs')
    configs.value = response.data as AnyDatabaseConfig[]
  } catch (error) {
    ElMessage.error('加载配置失败')
  } finally {
    loading.value = false
  }
}

// // 重置表单
function resetForm() {
  Object.assign(form, {
    name: '',
    type: DatabaseType.POSTGRESQL,
    host: '',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: false,
    connectionTimeout: 30,
    schema: 'public',
    charset: 'utf8mb4',
    timezone: 'local',
    filePath: '',
    db: 0,
    extra: {}
  })
}

// // 打开创建对话框
function openCreateDialog() {
  resetForm()
  editingConfig.value = null
  dialogVisible.value = true
}

// // 打开编辑对话框
function openEditDialog(config: AnyDatabaseConfig) {
  Object.assign(form, config)
  editingConfig.value = config
  dialogVisible.value = true
}

// // 保存配置
async function saveConfig() {
  try {
    if (editingConfig.value) {
      // 更新配置
      await $fetch(`/api/database/configs/${editingConfig.value.id}`, {
        method: 'PUT',
        body: form
      })
      ElMessage.success('配置更新成功')
    } else {
      // 创建配置
      await $fetch('/api/database/configs', {
        method: 'POST',
        body: form
      })
      ElMessage.success('配置创建成功')
    }
    dialogVisible.value = false
    await loadConfigs()
  } catch (error: any) {
    ElMessage.error(error.data?.message || '保存失败')
  }
}

// // 删除配置
async function deleteConfig(config: AnyDatabaseConfig) {
  try {
    await ElMessageBox.confirm(
      `确认删除数据库配置 "${config.name}"？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await $fetch(`/api/database/configs/${config.id}`, {
      method: 'DELETE'
    })
    ElMessage.success('删除成功')
    await loadConfigs()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// // 测试连接
async function testConnection(config: AnyDatabaseConfig) {
  testing.value = config.id
  try {
    const response = await $fetch(`/api/database/${config.id}/test`, {
      method: 'POST'
    })
    if (response.success) {
      ElMessage.success('连接测试成功')
    } else {
      ElMessage.error(`连接测试失败: ${response.message}`)
    }
  } catch (error: any) {
    ElMessage.error(error.data?.message || '连接测试失败')
  } finally {
    testing.value = null
  }
}

// // 获取数据库类型图标
function getDbIcon(type: DatabaseType) {
  switch (type) {
    case DatabaseType.POSTGRESQL:
      return '🐘'
    case DatabaseType.MYSQL:
    case DatabaseType.MARIADB:
      return '🐬'
    case DatabaseType.SQLITE:
      return '📦'
    case DatabaseType.MONGODB:
      return '🍃'
    case DatabaseType.REDIS:
      return '🔴'
    default:
      return '🗄️'
  }
}

// // 获取数据库类型标签颜色
function getDbTypeColor(type: DatabaseType) {
  switch (type) {
    case DatabaseType.POSTGRESQL:
      return 'primary'
    case DatabaseType.MYSQL:
      return 'success'
    case DatabaseType.MARIADB:
      return 'warning'
    case DatabaseType.SQLITE:
      return 'info'
    case DatabaseType.MONGODB:
      return 'success'
    case DatabaseType.REDIS:
      return 'danger'
    default:
      return 'primary'
  }
}

onMounted(loadConfigs)
</script>

<template>
  <NuxtLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-slate-800">数据库配置</h2>
        <ElButton  type="primary" :icon="Plus" @click="openCreateDialog">
          添加数据库
        </ElButton >
      </div>

      <!-- 配置列表 -->
      <div v-loading="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="config in configs"
          :key="config.id"
          class="rounded-xl border border-slate-200/70 bg-white/90 backdrop-blur p-5 shadow-sm hover:shadow-md transition-all"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-2xl">{{ getDbIcon(config.type) }}</span>
              <div>
                <div class="font-medium text-slate-800">{{ config.name }}</div>
                <ElTag :type="getDbTypeColor(config.type)" size="small">
                  {{ dbTypes.find(t => t.value === config.type)?.label }}
                </ElTag>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <ElButton 
                size="small"
                :icon="Connection"
                :loading="testing === config.id"
                @click="testConnection(config)"
              />
              <ElButton 
                size="small"
                :icon="Edit"
                @click="openEditDialog(config)"
              />
              <ElButton 
                size="small"
                type="danger"
                :icon="Delete"
                @click="deleteConfig(config)"
              />
            </div>
          </div>
          
          <div class="space-y-2 text-sm text-slate-600">
            <div class="flex items-center gap-2">
              <Folder class="w-4 h-4" />
              <span>{{ config.host }}:{{ config.port || 'N/A' }}</span>
            </div>
            <div v-if="config.database" class="text-xs text-slate-500">
              数据库: {{ config.database }}
            </div>
            <div class="text-xs text-slate-400">
              创建于: {{ config?.createdAt ? new Date(config.createdAt).toLocaleDateString() : '-' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && !configs.length" class="text-center py-12">
        <Folder class="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <div class="text-slate-500 mb-4">暂无数据库配置</div>
        <ElButton  type="primary" :icon="Plus" @click="openCreateDialog">
          添加第一个数据库
        </ElButton >
      </div>

      <!-- 创建/编辑对话框 -->
      <ElDialog
        v-model="dialogVisible"
        :title="editingConfig ? '编辑数据库配置' : '添加数据库配置'"
        width="600px"
        :close-on-click-modal="false"
      >
        <ElForm :model="form" label-width="100px" class="space-y-4">
          <ElFormItem label="配置名称" required>
            <ElInput v-model="form.name" placeholder="输入配置名称" />
          </ElFormItem>
          
          <ElFormItem label="数据库类型" required>
            <ElSelect v-model="form.type" class="w-full" @change="resetForm">
              <ElOption
                v-for="type in dbTypes"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              />
            </ElSelect>
          </ElFormItem>

          <!-- PostgreSQL/MySQL/MariaDB/Redis 字段 -->
          <template v-if="[DatabaseType.POSTGRESQL, DatabaseType.MYSQL, DatabaseType.MARIADB, DatabaseType.REDIS].includes(form.type)">
            <ElFormItem label="主机地址" required>
              <ElInput v-model="form.host" placeholder="localhost" />
            </ElFormItem>
            
            <ElFormItem label="端口" required>
              <ElInputNumber v-model="form.port" :min="1" :max="65535" class="w-full" />
            </ElFormItem>
            
            <ElFormItem v-if="form.type !== DatabaseType.REDIS" label="数据库名" required>
              <ElInput v-model="form.database" placeholder="数据库名称" />
            </ElFormItem>
            
            <ElFormItem label="用户名" required>
              <ElInput v-model="form.username" placeholder="用户名" />
            </ElFormItem>
            
            <ElFormItem label="密码" required>
              <ElInput v-model="form.password" type="password" show-password placeholder="密码" />
            </ElFormItem>
          </template>

          <!-- SQLite 字段 -->
          <template v-if="form.type === DatabaseType.SQLITE">
            <ElFormItem label="文件路径" required>
              <ElInput v-model="form.filePath" placeholder="/path/to/database.db" />
            </ElFormItem>
          </template>

          <!-- PostgreSQL 特定字段 -->
          <template v-if="form.type === DatabaseType.POSTGRESQL">
            <ElFormItem label="Schema">
              <ElInput v-model="form.schema" placeholder="public" />
            </ElFormItem>
          </template>

          <!-- MySQL/MariaDB 特定字段 -->
          <template v-if="[DatabaseType.MYSQL, DatabaseType.MARIADB].includes(form.type)">
            <ElFormItem label="字符集">
              <ElInput v-model="form.charset" placeholder="utf8mb4" />
            </ElFormItem>
            
            <ElFormItem label="时区">
              <ElInput v-model="form.timezone" placeholder="local" />
            </ElFormItem>
          </template>

          <!-- Redis 特定字段 -->
          <template v-if="form.type === DatabaseType.REDIS">
            <ElFormItem label="数据库编号">
              <ElInputNumber v-model="form.db" :min="0" :max="15" class="w-full" />
            </ElFormItem>
          </template>

          <!-- 通用字段 -->
          <ElFormItem label="SSL">
            <ElSwitch  v-model="form.ssl" />
          </ElFormItem>
          
          <ElFormItem label="连接超时(秒)">
            <ElInputNumber v-model="form.connectionTimeout" :min="1" :max="300" class="w-full" />
          </ElFormItem>
        </ElForm>

        <template #footer>
          <div class="flex justify-end gap-3">
            <ElButton  @click="dialogVisible = false">取消</ElButton >
            <ElButton  type="primary" @click="saveConfig">
              {{ editingConfig ? '更新' : '创建' }}
            </ElButton >
          </div>
        </template>
      </ElDialog>
    </div>
  </NuxtLayout>
</template>
