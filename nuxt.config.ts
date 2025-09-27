// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  alias: {
    lib: fileURLToPath(new URL("./lib", import.meta.url)),
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@unocss/nuxt", "nuxt-auth-utils", "@element-plus/nuxt"],
  elementPlus: {},
  typescript: {
    tsConfig: {
      // 确保 types 下的全局声明文件被包含
      compilerOptions: {
        // 避免三方类型或深层推导导致的过深对比
        skipLibCheck: true,
      },
    },
  },
  experimental: {
    // 关闭基于 pages 的强类型路由，避免复杂模板字面量类型导致的栈深错误
    typedPages: false,
  },
  runtimeConfig: {
    public: {
      websiteName: process.env.NUXT_WEB_SITE_NAME,
    },
  },
  nitro: {
    storage: {
      data: {
        driver: "vercelRuntimeCache",
      },
    },
    experimental: {
      tasks: true,
    },
  },
});
