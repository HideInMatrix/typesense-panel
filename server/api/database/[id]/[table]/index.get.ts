import { DatabaseManager } from 'lib/database-manager'
import { AnyDatabaseConfig } from '~~/shared/types/database'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const tableName = getRouterParam(event, 'table') as string
  
  if (!id || !tableName) {
    throw createError({ statusCode: 400, statusMessage: 'Missing config ID or table name' })
  }

  const storage = useStorage('data')
  const configs = await storage.getItem('database:configs') as AnyDatabaseConfig[] || []
  const config = configs.find(c => c.id === id)
  
  if (!config) {
    throw createError({ statusCode: 404, statusMessage: 'Config not found' })
  }

  try {
    const operations = await DatabaseManager.getOperations(config)

    const result = await operations.describeTable(tableName)
    
    if (!result.success) {
      throw createError({ statusCode: 500, statusMessage: result.error || 'Failed to describe table' })
    }

    return { success: true, data: result.data, count: result.count }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message || 'Database operation failed' })
  }
})
