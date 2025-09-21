import { getTypesenseClient } from 'lib/typesense'

export default defineEventHandler(async (event) => {
  try {
    const name = getRouterParam(event, 'name') as string
    if (!name) throw createError({ statusCode: 400, statusMessage: 'Missing collection name' })
    
    const client = await getTypesenseClient()
    
    // 获取集合基本信息
    const collection = await client.collections(name).retrieve()
    
    // 获取文档统计
    const searchParams = {
      q: '*',
      per_page: 0,
      facet_by: '',
      max_facet_values: 0
    }
    
    const searchResult = await client.collections(name).documents().search(searchParams)
    
    return {
      success: true,
      data: {
        collection,
        stats: {
          total_documents: searchResult.found,
          search_time_ms: searchResult.search_time_ms,
          facets: searchResult.facet_counts || []
        }
      }
    }
  } catch (error: any) {
    if (error?.httpStatus === 404) {
      throw createError({ statusCode: 404, statusMessage: 'Collection not found' })
    }
    throw createError({ statusCode: 500, statusMessage: error?.message || 'Failed to get collection stats' })
  }
})