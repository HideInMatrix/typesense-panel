import { getTypesenseClient } from 'lib/typesense'

export default defineEventHandler(async () => {
  const client = await getTypesenseClient()
  const list = await client.collections().retrieve()
  return list
})