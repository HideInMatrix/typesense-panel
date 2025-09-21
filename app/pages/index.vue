<script setup lang="ts">


definePageMeta({
  middleware: ['authenticated'],
})


const results = ref<any>(null)
const query = ref<string>('')
const queryBy = ref<string>('') // 用于搜索的字段
const sortBy = ref<string>('')
async function searchBooks() {

  results.value = await $fetch('/api/collections/comments/search', {
    params: { q: query.value, query_by: `content`, }
  })
}
const updateTask = async() => {
  $fetch("/api/settings/task",{method:"POST"})
}
</script>

<template>
  <NuxtLayout>
    <div>
      <ClientOnly>
        <div>
          <input v-model="query" placeholder="搜索内容" />
          <input v-model="queryBy" placeholder="查询字段(如: title)" />
          <input v-model="sortBy" placeholder="排序(如: ratings_count:desc)" />
          <button @click="searchBooks">搜索</button>
          <button @click="updateTask">更新配置</button>
        </div>
        <pre v-if="results">{{ results }}</pre>
      </ClientOnly>
    </div>
  </NuxtLayout>
</template>
