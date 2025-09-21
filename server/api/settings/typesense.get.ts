export default defineEventHandler(async () => {
  const storage = useStorage('data')
  const config = await storage.getItem('typesense:config')
  return config || null
})


