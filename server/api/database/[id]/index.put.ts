import {DatabaseManager} from "lib/database-manager"

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing config ID' })
  }

  const updates = (await readBody(event)) as Partial<Omit<AnyDatabaseConfig, 'id' | 'createdAt'>>
  
  const storage = useStorage('data')
  const configs = await storage.getItem('database:configs') as AnyDatabaseConfig[] || []
  const configIndex = configs.findIndex(c => c.id === id)
  
  if (configIndex === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Config not found' })
  }

  const updatedConfig: any = {
    ...configs[configIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  }

  // 测试连接
  const testResult = await DatabaseManager.testConnection(updatedConfig)
  if (!testResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: `连接测试失败: ${testResult.message}`
    })
  }

  // 更新配置
  configs[configIndex] = updatedConfig
  await storage.setItem('database:configs', configs)

  return { success: true, data: updatedConfig, message: '数据库配置更新成功' }
})
