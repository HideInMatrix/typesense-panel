<script setup lang="ts">
import type { ConfigurationOptions } from 'typesense/lib/Typesense/Configuration'
import { testTypesenseConnection } from '~~/lib/typesense'

const form = reactive<Partial<ConfigurationOptions>>({
  nodes: [{ host: '', port: 443, protocol: 'https' } as any],
  apiKey: '',
  connectionTimeoutSeconds: 2
})
const saving = ref(false)
const msg = ref('')
const testing = ref(false)
const testMsg = ref('')

async function load(){
  const saved = await $fetch('/api/settings/typesense')
  if (saved) Object.assign(form, saved)
}

async function save(){
  msg.value = ''
  saving.value = true
  try{
    await $fetch('/api/settings/typesense', { method: 'POST', body: form })
    msg.value = '已保存，后续请求将使用新配置'
  }catch(e:any){
    msg.value = '保存失败'
  }finally{
    saving.value = false
  }
}

async function testConnection(){
  testMsg.value = ''
  testing.value = true
  try{
    const res = await testTypesenseConnection(form as any)
    testMsg.value = res.ok ? '连接成功' : '连接失败：' + res.message
  }catch(e:any){
    testMsg.value = '测试失败'
  }finally{
    testing.value = false
  }
}

onMounted(load)
</script>

<template>
  <NuxtLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-slate-800">连接设置</h2>
        <div class="text-sm text-slate-500">配置 Typesense 节点与密钥</div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur p-6 shadow-sm">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div class="mb-1 text-slate-600 text-sm">Host</div>
              <ElInput v-model="(form.nodes as any)[0].host" placeholder="typesense.example.com" />
            </div>
            <div>
              <div class="mb-1 text-slate-600 text-sm">Port</div>
              <ElInputNumber v-model="(form.nodes as any)[0].port" :min="1" :max="65535" class="w-full" />
            </div>
            <div>
              <div class="mb-1 text-slate-600 text-sm">Protocol</div>
              <ElSelect v-model="(form.nodes as any)[0].protocol" class="w-full">
                <ElOption value="http" label="http" />
                <ElOption value="https" label="https" />
              </ElSelect>
            </div>
            <div class="sm:col-span-3">
              <div class="mb-1 text-slate-600 text-sm">API Key</div>
              <ElInput v-model="form.apiKey" type="password" show-password placeholder="输入 Typesense API Key" />
            </div>
            <div>
              <div class="mb-1 text-slate-600 text-sm">Timeout(s)</div>
              <ElInputNumber v-model="form.connectionTimeoutSeconds as number" :min="1" :max="60" class="w-full" />
            </div>
          </div>
          <div class="mt-5 flex items-center gap-3">
            <ElButton  type="primary" :loading="saving" @click="save">{{ saving ? '保存中...' : '保存' }}</ElButton >
            <ElButton  type="success" :loading="testing" @click="testConnection">{{ testing ? '测试中...' : '测试连接' }}</ElButton >
          </div>
          <div class="mt-3 space-y-1">
            <div class="text-sm" :class="msg.includes('成功') ? 'text-emerald-600' : 'text-slate-500'">{{ msg }}</div>
            <div class="text-sm" :class="testMsg.includes('成功') ? 'text-emerald-600' : testMsg.includes('失败') ? 'text-red-500' : 'text-slate-500'">{{ testMsg }}</div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur p-6 shadow-sm">
          <div class="mb-3 text-slate-700 font-medium">说明</div>
          <ul class="list-disc pl-5 text-sm text-slate-600 space-y-2">
            <li>保存后新请求将使用最新配置。</li>
            <li>如部署在 Docker/K8s，亦可通过环境变量覆盖。</li>
            <li>请妥善保管 API Key，不建议暴露到客户端。</li>
          </ul>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>


