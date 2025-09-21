import { getTypesenseClient } from 'lib/typesense'
import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections'

export default defineEventHandler(async (event) => {
  try {
    const { action, collections } = await readBody(event) as {
      action: 'delete' | 'create'
      collections: string[] | CollectionCreateSchema[]
    }
    
    if (!action || !collections || !Array.isArray(collections)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
    }
    
    const client = await getTypesenseClient()
    const results = []
    
    for (const item of collections) {
      try {
        if (action === 'delete') {
          await client.collections(item as string).delete()
          results.push({ name: item, success: true })
        } else if (action === 'create') {
          const created = await client.collections().create(item as CollectionCreateSchema)
          results.push({ name: (item as CollectionCreateSchema).name, success: true, data: created })
        }
      } catch (error: any) {
        results.push({ 
          name: typeof item === 'string' ? item : (item as CollectionCreateSchema).name, 
          success: false, 
          error: error?.message || 'Unknown error' 
        })
      }
    }
    
    return { success: true, results }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error?.message || 'Batch operation failed' })
  }
})