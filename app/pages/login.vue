<script setup lang="ts">
import {Lock,User } from '@element-plus/icons-vue'

const config = useRuntimeConfig()
const websiteName = config.public.websiteName


const { fetch: refreshSession } = useUserSession()
const credentials = reactive({
  email: '',
  password: '',
})
async function login() {
  $fetch('/api/login', {
    method: 'POST',
    body: credentials
  })
    .then(async () => {
      // Refresh the session on client-side and redirect to the home page
      await refreshSession()
      await navigateTo('/')
    })
    .catch(() => alert('Bad credentials'))
}
</script>

<template>
  <NuxtLayout name="login">
    <div class="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <div class="w-full max-w-4xl flex-grow flex shadow-lg rounded-lg overflow-hidden m-4">
        <div class="hidden md:flex w-1/2 bg-gradient-to-br from-purple-500 to-indigo-600 p-12 flex-col justify-between">
          <div>
            <h1 class="text-white text-4xl font-bold mb-4">欢迎回来</h1>
            <p class="text-white text-lg">登录以继续您的精彩旅程。</p>
          </div>
          <div class="mt-auto">
            <p class="text-white text-sm">© 2025 {{ websiteName }}. All Rights Reserved.</p>
          </div>
        </div>

        <div class="w-full md:w-1/2 bg-white p-8 md:p-12">
          <h2 class="text-3xl font-bold text-gray-800 mb-8 text-center">用户登录</h2>

          <ElForm ref="loginFormRef" :model="credentials" size="large" @submit.prevent="login">
            <ElFormItem prop="username">
              <ElInput v-model="credentials.email" type="email" placeholder="邮箱">
                <template #prefix>
                  <ElIcon>
                    <User />
                  </ElIcon>
                </template>
              </ElInput>
            </ElFormItem>

            <ElFormItem prop="password">
              <ElInput v-model="credentials.password" type="password" show-password placeholder="密码">
                <template #prefix>
                  <ElIcon>
                    <Lock />
                  </ElIcon>
                </template>
              </ElInput>
            </ElFormItem>

            <!-- <div class="flex justify-between items-center mb-6">
              <ElCheckbox>记住我</ElCheckbox>
              <ElLink type="primary">忘记密码？</ElLink>
            </div> -->

            <ElFormItem>
              <ElButton  type="primary" native-type="submit" class="w-full">
                立即登录
              </ElButton >
            </ElFormItem>

          </ElForm>
        </div>
      </div>
    </div>

  </NuxtLayout>
</template>
