export const useDatabaseConfig = () => {
    // 用 useState 创建 SSR 友好的全局状态
    const databaseConfigList = useState<AnyDatabaseConfig[]>('database-config', () => [])
    const selectedDb = useState<string>('selected-db', () => '')
    const databaseTables = useState<string[]>("databases-tables",() => [])
    const selectedTable = useState<string>('selected-table', () => '')
  
    // 封装获取数据库配置的方法
    const getAllDatabases = async () => {
      try {
        const response = await $fetch("/api/database/configs")
        databaseConfigList.value = response.data as AnyDatabaseConfig[]
      } catch (error) {
        // 错误处理
      }
    }

    const  getTablesByDb = async () => {
        try {
          const response = await $fetch(`/api/database/${selectedDb.value}/tables`, { method: 'GET' })
          const rows = response.data || []
          databaseTables.value = rows.map((r: any) => r.name)
          if (!selectedTable.value && databaseTables.value.length) {
            selectedTable.value = databaseTables.value[0] || ''
          }
        } catch (error) { }
      }
  
    return {
      databaseConfigList,
      selectedDb,
      selectedTable,
      databaseTables,
      getTablesByDb,
      getAllDatabases
    }
  }