import Typesense, { Client as TypesenseClient } from "typesense"
import type { ConfigurationOptions } from 'typesense/lib/Typesense/Configuration'

async function loadConfig(): Promise<ConfigurationOptions> {
  // 服务器端读取持久化配置；客户端调用时走服务端 API
  if (import.meta.server) {
    const storage = useStorage('data')
    const saved = await storage.getItem('typesense:config') as any
    if (saved?.nodes && saved?.apiKey) return saved as ConfigurationOptions
  }
  // 默认回退（可空）
  return {
    nodes: [{ host: '', port: 443, protocol: 'https' }],
    apiKey: '',
    connectionTimeoutSeconds: 2
  }
}

let cachedClient: TypesenseClient | null = null
export async function getTypesenseClient(): Promise<TypesenseClient> {
  if (cachedClient) return cachedClient
  const config = await loadConfig()
  if(!cachedClient){
    const client = new Typesense.Client(config)
    cachedClient = client
  }
  return cachedClient
}

export async function testTypesenseConnection(config: ConfigurationOptions): Promise<{ ok: boolean; message: string }> {
  try {
    const client = new Typesense.Client(config)
    await client.health.retrieve()
    return { ok: true, message: '连接成功' }
  } catch (err: any) {
    return { ok: false, message: err?.message || '连接失败' }
  }
}

export default getTypesenseClient()