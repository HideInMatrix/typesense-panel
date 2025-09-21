import { DatabaseManager } from 'lib/database-manager'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing config ID' })
  }

  const storage = useStorage('data')
  const configs = await storage.getItem('database:configs') as AnyDatabaseConfig[] || []
  const config = configs.find(c => c.id === id)
  
  if (!config) {
    throw createError({ statusCode: 404, statusMessage: 'Config not found' })
  }

  const result = await DatabaseManager.testConnection(config)
  return result
})
