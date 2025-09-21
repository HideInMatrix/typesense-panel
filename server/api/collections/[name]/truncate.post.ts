import { getTypesenseClient } from 'lib/typesense'

export default defineEventHandler(async (event) => {
  try {
    const name = getRouterParam(event, 'name') as string
    if (!name) throw createError({ statusCode: 400, statusMessage: 'Missing collection name' })
    const client = await getTypesenseClient()
    const res = await client.collections(name).documents().delete({"truncate":true})
    return {success:true,data:res}
  } catch (error:any) {
    throw createError({ statusCode: 400, message: error })
  }
})


