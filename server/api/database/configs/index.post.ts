import { DatabaseManager } from 'lib/database-manager'

export default defineEventHandler(async (event) => {
  const config = (await readBody(event)) as Omit<AnyDatabaseConfig, 'id' | 'createdAt' | 'updatedAt'>
  
  // 生成唯一ID和时间戳
  const id = `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  const fullConfig: any = {
    ...config,
    id,
    createdAt: now,
    updatedAt: now
  }

  // 测试连接
  const testResult = await DatabaseManager.testConnection(fullConfig)
  if (!testResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: `连接测试失败: ${testResult.message}`
    })
  }

  // 保存配置
  const storage = useStorage('data')
  const configs = await storage.getItem('database:configs') as AnyDatabaseConfig[] || []
  configs.push(fullConfig)
  await storage.setItem('database:configs', configs)

  return { success: true, data: fullConfig, message: '数据库配置保存成功' }
})
