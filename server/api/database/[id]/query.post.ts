import { DatabaseManager } from 'lib/database-manager'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing config ID' })
  }

  const { tableName} = await readBody(event) as { 
    tableName: string; 
  }
  
  if (!tableName) {
    throw createError({ statusCode: 400, statusMessage: 'Table name and collection name are required' })
  }

  const storage = useStorage('data')
  const configs = await storage.getItem('database:configs') as AnyDatabaseConfig[] || []
  const config = configs.find(c => c.id === id)
  
  if (!config) {
    throw createError({ statusCode: 404, statusMessage: 'Config not found' })
  }

  try {
    // 获取数据库数据
    const operations = await DatabaseManager.getOperations(config)
    const queryResult = await operations.query(`SELECT * FROM ${tableName}`)
    
    if (!queryResult.success) {
      throw createError({ statusCode: 500, statusMessage: queryResult.error || 'Failed to query table data' })
    }

    if (!queryResult.data || queryResult.data.length === 0) {
      return { success: true, message: 'No data found in table', imported: 0 }
    }

    return { 
      success: true, 
      result: queryResult.data
    }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message || 'Import failed' })
  }
})
