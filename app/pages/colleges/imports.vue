<script setup lang="ts">
const collections = ref<any[]>([])
const selectedCollection = ref<string>('')
const uploading = ref(false)
const msg = ref('')
const progress = ref(0)
const uploadAction = computed(() => selectedCollection.value ? `/api/collections/${encodeURIComponent(selectedCollection.value)}/import` : '')


const { databaseConfigList, selectedDb, getAllDatabases,databaseTables,selectedTable,getTablesByDb } = useDatabaseConfig()

async function refreshList(){
  const _collections = await $fetch('/api/collections/all',{method:'GET'})
  collections.value = _collections
  if (!selectedCollection.value && collections.value.length) selectedCollection.value = collections.value[0].name
}

async function onUpload(e: Event){
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !selectedCollection.value) return
  uploading.value = true
  msg.value = ''
  try{
    const fd = new FormData()
    fd.append('file', file)
    const res = await $fetch(`/api/collections/${encodeURIComponent(selectedCollection.value)}/import`, {
      method: 'POST',
      body: fd
    })
    msg.value = '导入成功'
  }catch(e){
    msg.value = '导入失败'
  }finally{
    uploading.value = false;
    (e.target as HTMLInputElement).value = ''
  }
}

// 使用 Element Plus 自定义上传请求以获得更好的交互与样式
function beforeUpload(file: File) {
  if (!selectedCollection.value) {
    msg.value = '请先选择集合'
    return false
  }
  const ok = file.name.endsWith('.jsonl')
  if (!ok) msg.value = '仅支持 .jsonl 文件'
  if (ok) {
    uploading.value = true
    progress.value = 0
    msg.value = ''
  }
  return ok
}

function handleProgress(e: any) {
  if (typeof e?.percent === 'number') {
    progress.value = Math.round(e.percent)
  }
}

function handleSuccess() {
  msg.value = '导入成功'
  uploading.value = false
  refreshList()
  setTimeout(() => { progress.value = 0 }, 800)
}

function handleError() {
  msg.value = '导入失败'
  uploading.value = false
  setTimeout(() => { progress.value = 0 }, 800)
}

async function importFromDb(){
  if(!selectedCollection.value || !selectedTable.value) return
  uploading.value = true
  msg.value = ''
  try{
    const resp = await $fetch(`/api/collections/${encodeURIComponent(selectedCollection.value)}/import-from-db`, {
      method: 'POST',
      body: { table: selectedTable.value,database:selectedDb.value }
    })
    if(resp?.success){
      msg.value = '导入成功（数据库）'
    }else{
      msg.value = `导入失败（数据库）-${resp}`
    }
  }catch(e){
    msg.value = '导入失败（数据库）'
  }finally{
    uploading.value = false
  }
}

const handleDbChange = () => {
  getTablesByDb()
}

const importMethod = ref(true)

onMounted(() => {
  Promise.race([refreshList(), getAllDatabases()])
})
</script>

<template>
  <NuxtLayout>
    <div class="space-y-6">
  <!-- 页面标题和描述 -->
  <div class="flex items-center justify-between">
    <h2 class="text-xl font-semibold text-slate-800">数据导入</h2>
    <div class="text-sm text-slate-500">上传 JSONL 文件到指定集合</div>
  </div>

  <!-- 导入方式选择 -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur p-5 shadow-sm">
      <!-- 选择集合 -->
      <div class="mb-4">
        <div class="mb-1 text-slate-600 text-sm">选择集合</div>
        <ElSelect v-model="selectedCollection" placeholder="选择集合" class="w-full">
          <ElOption v-for="c in collections" :key="c.name" :label="c.name" :value="c.name" />
        </ElSelect>
      </div>

      <!-- 导入方式选择 -->
      <div class="mb-4">
        <div class="mb-1 text-slate-600 text-sm">选择导入方式</div>
        <ElRadioGroup v-model="importMethod" text-color="#626aef" fill="rgb(239, 240, 253)">
          <ElRadioButton :label="true" class="text-sm">文件导入</ElRadioButton>
          <ElRadioButton :label="false" class="text-sm">数据库导入</ElRadioButton>
        </ElRadioGroup>
      </div>

      <!-- 文件导入（如果选择文件导入）-->
      <div v-if="importMethod" class="space-y-4">
        <div>
          <div class="mb-1 text-slate-600 text-sm">上传文件 (.jsonl)</div>
          <ClientOnly>
            <ElUpload
              class="w-full"
              drag
              :disabled="uploading || !selectedCollection"
              :show-file-list="false"
              :before-upload="beforeUpload"
              :on-progress="handleProgress"
              :on-success="handleSuccess"
              :on-error="handleError"
              :action="uploadAction"
              accept=".jsonl"
            >
              <div class="p-6 border-2 border-dashed rounded-xl"
                   :class="(uploading || !selectedCollection) ? 'border-slate-200 bg-slate-50 text-slate-400' : 'border-indigo-200/80 hover:border-indigo-300 bg-indigo-50/40 text-indigo-700'">
                <div class="text-sm">将文件拖拽到此处，或点击选择</div>
                <div class="text-xs mt-1">仅支持 .jsonl 格式</div>
              </div>
            </ElUpload>
            <template #fallback>
              <div class="p-6 border-2 border-dashed rounded-xl border-slate-200 bg-slate-50">
                <div class="h-30"></div>
              </div>
            </template>
          </ClientOnly>
        </div>
        <div v-if="uploading || progress > 0" class="mt-3">
          <ElProgress :percentage="progress" :stroke-width="10" :status="progress === 100 ? 'success' : undefined" />
        </div>
      </div>

      <!-- 数据库导入（如果选择数据库导入）-->
      <div v-if="!importMethod" class="space-y-4">
        <div>
          <div class="mb-1 text-slate-600 text-sm">选择数据库</div>
          <ElSelect v-model="selectedDb" placeholder="选择数据库" class="w-full" @change="handleDbChange">
            <ElOption v-for="t in databaseConfigList" :key="t.id" :label="t.name" :value="t.id" />
          </ElSelect>
        </div>

        <div>
          <div class="mb-1 text-slate-600 text-sm">选择表</div>
          <ElSelect v-model="selectedTable" placeholder="选择表" class="w-full">
            <ElOption v-for="t in databaseTables" :key="t" :label="t" :value="t" />
          </ElSelect>
        </div>
      </div>
      
      <div class="flex gap-3 mt-4">
        <ElButton  type="primary" :disabled="!selectedCollection || !selectedTable" @click="importFromDb">导入数据到集合</ElButton >
      </div>
      <!-- 导入状态消息 -->
      <div class="mt-3 text-sm" :class="msg.includes('成功') ? 'text-emerald-600' : 'text-slate-500'">{{ msg }}</div>
    </div>

    <!-- 集合预览 -->
    <div class="rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur p-5 shadow-sm">
      <div class="mb-3 text-slate-700 font-medium">集合预览</div>
      <div v-if="!collections?.length" class="text-slate-400 text-sm">暂无集合</div>
      <ul v-else class="space-y-2 max-h-72 overflow-auto pr-1">
        <li v-for="c in collections" :key="c.name" class="flex items-center justify-between rounded-lg border border-slate-200/70 px-3 py-2"
            :class="selectedCollection === c.name ? 'bg-indigo-50/60 border-indigo-200' : 'bg-white'">
          <span class="text-sm text-slate-700">{{ c.name }}</span>
          <ElTag size="small" type="info">{{ c.num_documents ?? 0 }} docs</ElTag>
        </li>
      </ul>
    </div>
  </div>
</div>

  </NuxtLayout>
</template>


