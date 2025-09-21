
// 数据库连接配置基础接口
export interface DatabaseConfig {
  id: string
  name: string
  type: DatabaseType
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
  connectionTimeout?: number
  // 扩展配置
  extra?: Record<string, any>
  createdAt?: string
  updatedAt?: string
}

// 特定数据库类型的连接配置
export interface PostgreSQLConfig extends DatabaseConfig {
  type: DatabaseType.POSTGRESQL
  schema?: string
  sslMode?: 'disable' | 'prefer' | 'require' | 'verify-ca' | 'verify-full'
}

export interface MySQLConfig extends DatabaseConfig {
  type: DatabaseType.MYSQL
  charset?: string
  timezone?: string
  sslMode?: 'disabled' | 'preferred' | 'required' | 'verify_ca' | 'verify_identity'
}

export interface MariaDBConfig extends DatabaseConfig {
  type: DatabaseType.MARIADB
  charset?: string
  timezone?: string
  sslMode?: 'disabled' | 'preferred' | 'required' | 'verify_ca' | 'verify_identity'
}

export interface SQLiteConfig {
  id: string
  name: string
  type: DatabaseType.SQLITE
  filePath: string
  // SQLite 不需要 host, port, username, password, database
  host?: never
  port?: never
  database?: never
  username?: never
  password?: never
  ssl?: never
  connectionTimeout?: number
  extra?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface MongoDBConfig extends DatabaseConfig {
  type: DatabaseType.MONGODB
  authSource?: string
  replicaSet?: string
}

export interface RedisConfig {
  id: string
  name: string
  type: DatabaseType.REDIS
  host: string
  port: number
  // Redis 不需要 database 字段，使用 db 代替
  database?: never
  username: string
  password: string
  ssl?: boolean
  connectionTimeout?: number
  db?: number
  extra?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// 联合类型
export type AnyDatabaseConfig = 
  | PostgreSQLConfig 
  | MySQLConfig 
  | MariaDBConfig 
  | SQLiteConfig 
  | MongoDBConfig 
  | RedisConfig

// 数据库连接结果
export interface DatabaseConnectionResult {
  success: boolean
  message: string
  config?: AnyDatabaseConfig
  error?: string
}

// 查询结果
export interface QueryResult<T = any> {
  success: boolean
  data?: T[]
  count?: number
  message?: string
  error?: string
}

// 表结构信息
export interface TableInfo {
  name: string
  schema?: string
  type: 'table' | 'view'
  comment?: string
}

// 列信息
export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  defaultValue?: any
  comment?: string
  isPrimaryKey?: boolean
  isForeignKey?: boolean
  maxLength?: number
  precision?: number
  scale?: number
}

// 数据库操作接口
export interface DatabasePlugin {
  connect(): Promise<DatabaseConnectionResult>
  disconnect(): Promise<void>
  testConnection(): Promise<DatabaseConnectionResult>
  listTables(): Promise<QueryResult<TableInfo>>
  describeTable(tableName: string): Promise<QueryResult<ColumnInfo>>
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>
  execute(sql: string, params?: any[]): Promise<QueryResult<any>>
}
