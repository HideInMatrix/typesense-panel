import { getTypesenseClient } from 'lib/typesense'

export default defineEventHandler(async (event) => {
  try {
    const name = getRouterParam(event, 'name') as string
    if (!name) throw createError({ statusCode: 400, statusMessage: 'Missing collection name' })
    
    const client = await getTypesenseClient()
    
    // 检查集合是否存在
    try {
      await client.collections(name).retrieve()
    } catch (error: any) {
      if (error?.httpStatus === 404) {
        throw createError({ statusCode: 404, statusMessage: 'Collection not found' })
      }
      throw error
    }
    
    // 删除集合
    const res = await client.collections(name).delete()
    return { success: true, data: res, message: 'Collection deleted successfully' }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error?.message || 'Failed to delete collection' })
  }
})