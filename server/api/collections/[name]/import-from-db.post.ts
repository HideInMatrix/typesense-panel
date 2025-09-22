// 从数据库导入数据
import { getTypesenseClient } from 'lib/typesense'
import parseBigInt from "~/utils/parseBigInt"

export default defineEventHandler( async (event) => {
  const name = getRouterParam(event, 'name') as string
  if (!name) throw createError({ statusCode: 400, message: '未指定合集' })

  const body = await readBody(event) as { table: string,database:string }
  const table = body?.table
  const database = body?.database
  if (!table) throw createError({ statusCode: 400, message: '缺少数据库表' })
  
  // 获取数据库数据
  const dbData:any = await $fetch(`/api/database/${encodeURIComponent(database)}/query`,{
    method:"POST",
    body:{
      tableName:table,
      collectionName: name
    }
  })
  const rows = dbData?.result
  if (!Array.isArray(rows)) throw createError({ statusCode: 500, message: '数据结构不对' })

  // 转换为 JSONL
  const jsonl = rows.map((r:any)=> JSON.stringify(r,parseBigInt)).join('\n')
  try{
    const client = await getTypesenseClient()
    await client.collections(name).documents().import(jsonl,{action:'upsert'})
    return { success:true,}
  }catch(error:any){
    throw createError({ statusCode: 500, message: error })
  }
})


