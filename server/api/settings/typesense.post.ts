import type { ConfigurationOptions } from 'typesense/lib/Typesense/Configuration'

export default defineEventHandler( async (event) => {
  const body = await readBody(event)
  // 只保存必要字段，避免泄露无关数据
  const config = {
    nodes: body?.nodes,
    apiKey: body?.apiKey,
    connectionTimeoutSeconds: body?.connectionTimeoutSeconds
  } as Partial<ConfigurationOptions>

  if (!config?.nodes || !config?.apiKey) {
    throw createError({ statusCode: 400, statusMessage: 'nodes 与 apiKey 必填' })
  }

  const storage = useStorage('data')
  await storage.setItem('typesense:config', config)
  // 标记让客户端在下次获取时重建
  await storage.removeItem('typesense:client:cache')
  return { success: true }
})


