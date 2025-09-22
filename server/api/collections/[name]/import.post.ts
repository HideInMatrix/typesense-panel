// 文件读取上传数据
import { getTypesenseClient } from 'lib/typesense'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name') as string
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Missing collection name' })

  const form = await readMultipartFormData(event)
  const file = form?.find(f => f.name === 'file')
  if (!file || !file.data) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file' })
  }

  const content = file.data.toString('utf8')
  const client = await getTypesenseClient()
  const result = await client
    .collections(name)
    .documents()
    .import(content,{action:'upsert'})
  return { ok: true, result }
})


