import { DatabaseManager } from 'lib/database-manager'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少数据库id' })
  }

  const { sql, params = [] } = await readBody(event) as { sql: string; params?: any[] }
  
  if (!sql) {
    throw createError({ statusCode: 400, statusMessage: '缺少数据库查询语句' })
  }

  const storage = useStorage('data')
  const configs = await storage.getItem('database:configs') as AnyDatabaseConfig[] || []
  const config = configs.find(c => c.id === id)
  
  if (!config) {
    throw createError({ statusCode: 404, statusMessage: '数据库配置未找到' })
  }

  try {
    const operations = await DatabaseManager.getOperations(config)
    const result = await operations.execute(sql, params)
    
    if (!result.success) {
      throw createError({ statusCode: 500, statusMessage: result.error || 'Execute failed' })
    }

    return { success: true, data: result.data, count: result.count }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message || 'Database operation failed' })
  }
})
