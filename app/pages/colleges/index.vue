<script setup lang="ts">
import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections'

const collections = ref<any[]>([])
const isDatabaseImport = ref(true)
const { databaseConfigList, selectedDb, getAllDatabases,databaseTables,selectedTable,getTablesByDb } = useDatabaseConfig()

const schemaText = ref<string>(`{
  "name": "demo",
  "fields": [
    {"name": "title", "type": "string"},
    {"name": "authors", "type": "string[]", "facet": true},
    {"name": "publication_year", "type": "int32", "facet": true},
    {"name": "ratings_count", "type": "int32"},
    {"name": "average_rating", "type": "float"}
  ],
  "default_sorting_field": "[你的默认排序列]"
}`)

const creating = ref(false)
const createMsg = ref<string>('')

async function createCollection() {
  createMsg.value = ''
  let schema: CollectionCreateSchema
  try {
    schema = JSON.parse(schemaText.value)
  } catch (e) {
    createMsg.value = 'JSON 解析失败'
    return
  }
  creating.value = true
  try {
    const res = await $fetch('/api/collections/create', { method: 'POST', body: schema })
    if ((res as any).success) {
      createMsg.value = '创建成功'
      await refreshList()
    } else if ((res as any).code === 'already_exists') {
      createMsg.value = '已存在：' + (res as any).message
    } else {
      createMsg.value = `创建失败 ${(res as any).message}`
    }
  } finally {
    creating.value = false
  }
}


async function refreshList() {
  const {result: _collections} = await $fetch('/api/collections/all', { method: 'GET' })
  collections.value = _collections
}


function handleDbChange(){
  getTablesByDb().then(() => {
    applyTableToSchema()
  })
}



async function loadTableSchema(tableName: string) {
  let tableColumns:any[] = [];
  if (!tableName) return tableColumns
  try {
    // @ts-ignore
    const resp:{data:any[]} = await $fetch(`/api/database/${encodeURIComponent(selectedDb.value)}/${tableName}`)
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
    const obj = JSON.parse(schemaText.value)
    obj.name = selectedTable.value
    if (tableColumns.length) {
      obj.fields = tableColumns.map((col: any) => ({
        name: col.name,
        type: mapTypeToTypesense(col.type),
        optional: String(col.nullable).toUpperCase() !== 'NO'
      }))
    }
    schemaText.value = JSON.stringify(obj, null, 2)
  } catch (e) {
    // ignore
    console.error(e);
    
  }
}

async function deleteCollege(name: string) {

  await ElMessageBox.confirm(
    `确认删除集合 "${name}"？`,
    '确认删除',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )

  const resp: any = await $fetch(`/api/collections/${name}`, { method: "DELETE" })
  if (resp.success) {
    ElMessage.success('删除成功');
    refreshList();
  }
}

onMounted(() => {
   Promise.race([refreshList(), getAllDatabases()])
})

</script>

<template>
  <NuxtLayout>
    <div class="space-y-8">
      <!-- 标题和描述 -->
      <div class="flex items-center justify-between">
        <h2 class="text-3xl font-semibold text-slate-900">集合管理</h2>
        <div class="text-sm text-slate-600">选择导入方式，按步骤进行操作</div>
      </div>

      <!-- 导入方式切换 -->
      <div class="mb-8">
        <ElRadioGroup v-model="isDatabaseImport" text-color="#626aef" fill="rgb(239, 240, 253)">
          <ElRadioButton :label="true"
            class="">
            数据库导入
          </ElRadioButton>
          <ElRadioButton :label="false"
            class="">
            手动导入
          </ElRadioButton>
        </ElRadioGroup>
      </div>

      <!-- 数据库导入步骤 -->
      <div v-if="isDatabaseImport" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 第一步：选择数据库 -->
        <div class="rounded-xl border border-slate-200/70 bg-white/80 shadow-lg p-6 transition-all hover:shadow-2xl">
          <div class="text-2xl text-slate-700 font-medium mb-4 flex items-center gap-2">
            选择数据库
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
            <div>
              <div class="text-slate-600 text-sm mb-2">选择数据库</div>
              <ElSelect v-model="selectedDb" placeholder="选择库" class="w-full rounded-lg border-slate-300"
                @change="handleDbChange">
                <ElOption v-for="t in databaseConfigList" :key="t.id" :label="t.name" :value="t.id" />
              </ElSelect>
            </div>
          </div>
        </div>

        <!-- 第二步：选择数据库表 -->
        <div class="rounded-xl border border-slate-200/70 bg-white/80 shadow-lg p-6 transition-all hover:shadow-2xl">
          <div class="text-2xl text-slate-700 font-medium mb-4 flex items-center gap-2">
            选择数据库表
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
            <div>
              <div class="text-slate-600 text-sm mb-2">选择数据库表</div>
              <ElSelect v-model="selectedTable" placeholder="选择表" class="w-full rounded-lg border-slate-300"
                @change="applyTableToSchema">
                <ElOption v-for="t in databaseTables" :key="t" :label="t" :value="t" />
              </ElSelect>
            </div>
          </div>
        </div>

        <!-- 第三步：修改配置文件 -->
        <div class="rounded-xl border border-slate-200/70 bg-white/80 shadow-lg p-6 transition-all hover:shadow-2xl">
          <div class="text-2xl text-slate-700 font-medium mb-4 flex items-center gap-2">
            修改配置文件
          </div>
          <ElInput v-model="schemaText" type="textarea" :rows="14"
            placeholder="粘贴或编辑 Typesense Collection Schema (JSON)" class="rounded-lg border-slate-300" />
          <div class="mt-4 flex items-center gap-6">
            <ElButton type="primary" :loading="creating"
              class="transition-all duration-300 px-8 py-3 rounded-lg text-lg" @click="createCollection">
              {{ creating ? '创建中...' : '创建集合' }}
            </ElButton>
            <span class="text-sm text-slate-500">{{ createMsg }}</span>
          </div>
        </div>
      </div>

      <!-- 手动导入步骤 -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 手动填写配置文件 -->
        <div class="rounded-xl border border-slate-200/70 bg-white/80 shadow-lg p-6 transition-all hover:shadow-2xl">
          <div class="text-2xl text-slate-700 font-medium mb-4 flex items-center gap-2">
            手动填写配置文件
          </div>
          <ElInput v-model="schemaText" type="textarea" :rows="14" placeholder="粘贴或编辑手动配置文件 (JSON)"
            class="rounded-lg border-slate-300" />
          <div class="mt-4 flex items-center gap-6">
            <ElButton type="primary" :loading="creating"
              class="transition-all duration-300 px-8 py-3 rounded-lg text-lg" @click="createCollection">
              {{ creating ? '创建中...' : '创建集合' }}
            </ElButton>
            <span class="text-sm text-slate-500">{{ createMsg }}</span>
          </div>
        </div>
      </div>

      <!-- 现有集合显示 -->
      <div class="rounded-xl border border-slate-200/70 bg-white/80 shadow-lg p-6 transition-all hover:shadow-2xl">
        <div class="text-2xl text-slate-700 font-medium mb-4">现有集合</div>
        <div v-if="!collections?.length" class="text-slate-400 text-sm">暂无集合，请先创建。</div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-6 gap-6">
          <div v-for="c in collections" :key="c.name"
            class="rounded-xl border border-slate-200/70 bg-white p-5 hover:border-indigo-200 hover:shadow-xl transition-all">
            <div class="text-slate-800 font-medium">{{ c.name }}</div>
            <div class="text-xs text-slate-500 mt-1">文档数：{{ c.num_documents ?? '-' }}</div>
            <ElButton class="mt-4 w-full" type="danger" @click="deleteCollege(c.name)">
              删除
            </ElButton>
          </div>
        </div>
      </div>
    </div>

  </NuxtLayout>

</template>
