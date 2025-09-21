
export default defineEventHandler(async () => {
    const storage = useStorage('data')
    const configs = await storage.getItem('database:configs') as AnyDatabaseConfig[] || []
    return { success: true, data: configs }
  })
  