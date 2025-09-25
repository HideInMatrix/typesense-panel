import {DatabaseManager} from "lib/database-manager"

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing config ID' })
  }

  const storage = useStorage('data')
  const configs = await storage.getItem('database:configs') as AnyDatabaseConfig[] || []
  const configIndex = configs.findIndex(c => c.id === id)
  
  if (configIndex === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Config not found' })
  }

  const config = configs[configIndex]
  
  // 断开连接
  await DatabaseManager.disconnect(config)
  
  // 删除配置
  configs.splice(configIndex, 1)
  await storage.setItem('database:configs', configs)

  return { success: true, message: '数据库配置删除成功' }
})
