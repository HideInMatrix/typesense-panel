<script setup lang="ts">
import { House, Collection, Setting, Document, Folder, Plus } from '@element-plus/icons-vue'

const { user, clear: clearSession } = useUserSession()

const menuItems = [
  { path: '/', label: '首页', icon: House },
  { path: '/colleges', label: '集合', icon: Document, children: [{ path: '/colleges', label: '添加集合', icon: Plus, }, { path: '/colleges/imports', label: '导入数据', icon: Collection },{ path: '/colleges/schemes', label: '方案', icon: Collection }] },
  { path: '/databases', label: '数据库', icon: Folder },
  { path: '/settings', label: 'API Key', icon: Setting }
]


const handleMenuItemClick = (item: any) => {
  // navigateTo(item.index)
}

async function logout() {
  await clearSession()
  await navigateTo('/login')
}
</script>

<template>
  <div
    class="w-full h-screen flex bg-[radial-gradient(1200px_600px_at_0%_0%,#eef2ff_0%,transparent_50%),radial-gradient(1000px_600px_at_100%_100%,#f0fdf4_0%,transparent_45%)]">
    <aside class="flex flex-col w-64 h-full bg-white/85 backdrop-blur-xl border-r border-slate-200/70 shadow-sm">
      <div class="px-5 py-5 flex items-center gap-3 border-b border-slate-200/70">
        <div
          class="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white grid place-items-center shadow-lg">
          TS</div>
        <div>
          <div class="text-[15px] font-semibold text-slate-800">Typesense Panel</div>
          <div class="text-[11px] text-slate-500">数据库管理器</div>
        </div>
      </div>

      <ElScrollbar class="flex-1">
        <ElMenu :router="true" :unique-opened="false">
          <template v-for="menu in menuItems" :key="menu.path">
            <ElSubMenu v-if="menu.children" :index="menu.path">
              <template #title>
                <ElIcon :class="$route.path === (menu.path) ? 'text-indigo-600' : 'text-slate-400'">
                  <component :is="menu.icon" />
                </ElIcon>
                <span class="font-medium">{{ menu.label }}</span>
              </template>
              <ElMenuItemGroup>
                <ElMenuItem v-for="child in menu.children" :key="child.path" :index="child.path"
                  @click="handleMenuItemClick">
                  <template #title>
                    <ElIcon :class="$route.path === (child.path) ? 'text-indigo-600' : 'text-slate-400'">
                      <component :is="menu.icon" />
                    </ElIcon>
                    <span class="font-medium">{{ child.label }}</span>
                  </template>
                </ElMenuItem>
              </ElMenuItemGroup>
            </ElSubMenu>
            <ElMenuItem :index="menu.path" v-else @click="handleMenuItemClick">
              <ElIcon :class="$route.path === (menu.path) ? 'text-indigo-600' : 'text-slate-400'">
                <component :is="menu.icon" />
              </ElIcon>
              <span class="font-medium">{{ menu.label }}</span>
            </ElMenuItem>
          </template>
        </ElMenu>
      </ElScrollbar>

      <div class="p-4 border-t border-slate-200/70 bg-white/70">
        <div
          class="p-3 rounded-xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50 flex items-center gap-3 shadow-sm">
          <div class="h-9 w-9 rounded-full bg-slate-100 grid place-items-center text-slate-600 text-sm font-semibold">
            {{ (user as any)?.name?.[0] || 'U' }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-slate-800 truncate">{{ (user as any)?.name || 'Guest' }}</div>
            <div class="text-[11px] text-slate-500 truncate">{{ (user as any)?.email || 'Not signed in' }}</div>
          </div>
          <ElButton size="small" type="danger" plain @click="logout">退出</ElButton>
        </div>
      </div>
    </aside>

    <main class="flex-1 h-full overflow-auto p-8">
      <div
        class="min-h-full bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/70 shadow-[0_10px_30px_rgba(2,6,23,.04)] p-6">
        <slot />
      </div>
    </main>
  </div>

</template>
