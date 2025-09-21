import { getTypesenseClient } from 'lib/typesense'
import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections'

export default defineEventHandler(async (event) => {
  const schema = (await readBody(event)) as CollectionCreateSchema
  try {
    const client = await getTypesenseClient()
    const created = await client.collections().create(schema as any)
    return { success: true, data: created }
  } catch (err: any) {
    // Typesense 会在已存在时抛出 409
    if (err?.httpStatus === 409) {
      return { success: false, code: 'already_exists', message: `集合 ${schema.name} 已经存在` }
    }
    return {success:false,code:500,message:`${err}`}
  }
})


