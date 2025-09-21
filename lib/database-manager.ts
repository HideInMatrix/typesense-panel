import { DatabaseType } from '~~/enums/database'
import type {
  AnyDatabaseConfig,
  DatabaseConnectionResult,
  QueryResult,
  TableInfo,
  ColumnInfo,
  DatabasePlugin,
  PostgreSQLConfig
} from '~~/shared/types/database'
import {Client} from "pg"

// PostgreSQL 实现
class PostgreSQLOperations implements DatabasePlugin {
  private client: any = null
  private config: PostgreSQLConfig

  constructor(config: PostgreSQLConfig) {
    this.config = config
  }

  async connect(): Promise<DatabaseConnectionResult> {
    try {
      this.client = new Client({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: (this.config.connectionTimeout || 30) * 1000
      })
      await this.client.connect()
      return { success: true, message: 'PostgreSQL 连接成功' }
    } catch (error: any) {
      return { success: false, message: 'PostgreSQL 连接失败', error: error.message }
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end()
      this.client = null
    }
  }

  async testConnection(): Promise<DatabaseConnectionResult> {
    try {
      await this.connect()
      await this.disconnect()
      return { success: true, message: 'PostgreSQL 连接测试成功' }
    } catch (error: any) {
      return { success: false, message: 'PostgreSQL 连接测试失败', error: error.message }
    }
  }

  async listTables(): Promise<QueryResult<TableInfo>> {
    try {
      if (!this.client) await this.connect()

      const schema = this.config.schema || 'public'
      const result = await this.client.query(`
        SELECT table_name, table_type, obj_description(c.oid) as comment
        FROM information_schema.tables t
        LEFT JOIN pg_class c ON c.relname = t.table_name
        WHERE table_schema = $1
        ORDER BY table_name
      `, [schema])

      const tables: TableInfo[] = result.rows.map((row: any) => ({
        name: row.table_name,
        schema,
        type: row.table_type === 'BASE TABLE' ? 'table' : 'view',
        comment: row.comment
      }))
      // 查询完之后关闭连接
      this.disconnect();
      return { success: true, data: tables, count: tables.length }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async describeTable(tableName: string): Promise<QueryResult<ColumnInfo>> {
    try {
      if (!this.client) await this.connect()

      const result = await this.client.query(`
      SELECT column_name,
            data_type,
            character_maximum_length,
            numeric_precision,
            numeric_scale,
            is_nullable,
            column_default
      FROM information_schema.columns
      WHERE table_name = $1 AND table_schema = $2;`, [tableName, this.config.schema || 'public'])

      const columns: ColumnInfo[] = result.rows.map((row: any) => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        defaultValue: row.column_default,
        comment: row.comment,
        maxLength: row.character_maximum_length,
        precision: row.numeric_precision,
        scale: row.numeric_scale
      }))
      // 查询完之后关闭连接
      this.disconnect();
      return { success: true, data: columns, count: columns.length }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    try {
      if (!this.client) await this.connect()
      const result = await this.client.query(sql, params)
      return { success: true, data: result.rows, count: result.rowCount }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async execute(sql: string, params: any[] = []): Promise<QueryResult<any>> {
    return this.query(sql, params)
  }
}

// // MySQL/MariaDB 实现
// class MySQLOperations implements DatabasePlugin {
//   private connection: any = null
//   private config: MySQLConfig | MariaDBConfig

//   constructor(config: MySQLConfig | MariaDBConfig) {
//     this.config = config
//   }

//   async connect(): Promise<DatabaseConnectionResult> {
//     try {
//       const mysql = await import('mysql2/promise').catch(() => {
//         throw new Error('mysql2 package not installed. Please run: pnpm add mysql2')
//       })
//       this.connection = await mysql.createConnection({
//         host: this.config.host,
//         port: this.config.port,
//         user: this.config.username,
//         password: this.config.password,
//         database: this.config.database,
//         charset: this.config.charset || 'utf8mb4',
//         timezone: this.config.timezone || 'local',
//         ssl: this.config.ssl ? {} : false,
//         connectTimeout: (this.config.connectionTimeout || 30) * 1000
//       })
//       return { success: true, message: `${this.config.type} 连接成功` }
//     } catch (error: any) {
//       return { success: false, message: `${this.config.type} 连接失败`, error: error.message }
//     }
//   }

//   async disconnect(): Promise<void> {
//     if (this.connection) {
//       await this.connection.end()
//       this.connection = null
//     }
//   }

//   async testConnection(): Promise<DatabaseConnectionResult> {
//     try {
//       await this.connect()
//       await this.disconnect()
//       return { success: true, message: `${this.config.type} 连接测试成功` }
//     } catch (error: any) {
//       return { success: false, message: `${this.config.type} 连接测试失败`, error: error.message }
//     }
//   }

//   async listTables(): Promise<QueryResult<TableInfo>> {
//     try {
//       if (!this.connection) await this.connect()

//       const [rows] = await this.connection.execute(`
//         SELECT table_name, table_type, table_comment as comment
//         FROM information_schema.tables
//         WHERE table_schema = ?
//         ORDER BY table_name
//       `, [this.config.database])

//       const tables: TableInfo[] = rows.map((row: any) => ({
//         name: row.table_name,
//         type: row.table_type === 'BASE TABLE' ? 'table' : 'view',
//         comment: row.comment
//       }))

//       return { success: true, data: tables, count: tables.length }
//     } catch (error: any) {
//       return { success: false, error: error.message }
//     }
//   }

//   async describeTable(tableName: string): Promise<QueryResult<ColumnInfo>> {
//     try {
//       if (!this.connection) await this.connect()

//       const [rows] = await this.connection.execute(`
//         SELECT 
//           column_name,
//           data_type,
//           is_nullable,
//           column_default,
//           character_maximum_length,
//           numeric_precision,
//           numeric_scale,
//           column_comment as comment,
//           column_key,
//           extra
//         FROM information_schema.columns
//         WHERE table_name = ? AND table_schema = ?
//         ORDER BY ordinal_position
//       `, [tableName, this.config.database])

//       const columns: ColumnInfo[] = rows.map((row: any) => ({
//         name: row.column_name,
//         type: row.data_type,
//         nullable: row.is_nullable === 'YES',
//         defaultValue: row.column_default,
//         comment: row.comment,
//         isPrimaryKey: row.column_key === 'PRI',
//         isForeignKey: row.column_key === 'MUL',
//         maxLength: row.character_maximum_length,
//         precision: row.numeric_precision,
//         scale: row.numeric_scale
//       }))

//       return { success: true, data: columns, count: columns.length }
//     } catch (error: any) {
//       return { success: false, error: error.message }
//     }
//   }

//   async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
//     try {
//       if (!this.connection) await this.connect()
//       const [rows] = await this.connection.execute(sql, params)
//       return { success: true, data: rows, count: rows.length }
//     } catch (error: any) {
//       return { success: false, error: error.message }
//     }
//   }

//   async execute(sql: string, params: any[] = []): Promise<QueryResult<any>> {
//     return this.query(sql, params)
//   }
// }

// // SQLite 实现
// class SQLiteOperations implements DatabasePlugin {
//   private db: any = null
//   private config: SQLiteConfig

//   constructor(config: SQLiteConfig) {
//     this.config = config
//   }

//   async connect(): Promise<DatabaseConnectionResult> {
//     try {
//       const sqlite3 = await import('sqlite3').catch(() => {
//         throw new Error('sqlite3 package not installed. Please run: pnpm add sqlite3')
//       })
//       const { open } = await import('sqlite').catch(() => {
//         throw new Error('sqlite package not installed. Please run: pnpm add sqlite')
//       })

//       this.db = await open({
//         filename: this.config.filePath,
//         driver: sqlite3.Database
//       })
//       return { success: true, message: 'SQLite 连接成功' }
//     } catch (error: any) {
//       return { success: false, message: 'SQLite 连接失败', error: error.message }
//     }
//   }

//   async disconnect(): Promise<void> {
//     if (this.db) {
//       await this.db.close()
//       this.db = null
//     }
//   }

//   async testConnection(): Promise<DatabaseConnectionResult> {
//     try {
//       await this.connect()
//       await this.disconnect()
//       return { success: true, message: 'SQLite 连接测试成功' }
//     } catch (error: any) {
//       return { success: false, message: 'SQLite 连接测试失败', error: error.message }
//     }
//   }

//   async listTables(): Promise<QueryResult<TableInfo>> {
//     try {
//       if (!this.db) await this.connect()

//       const tables = await this.db.all(`
//         SELECT name, type, sql
//         FROM sqlite_master
//         WHERE type IN ('table', 'view')
//         ORDER BY name
//       `)

//       const tableInfos: TableInfo[] = tables.map((table: any) => ({
//         name: table.name,
//         type: table.type === 'table' ? 'table' : 'view',
//         comment: table.sql
//       }))

//       return { success: true, data: tableInfos, count: tableInfos.length }
//     } catch (error: any) {
//       return { success: false, error: error.message }
//     }
//   }

//   async describeTable(tableName: string): Promise<QueryResult<ColumnInfo>> {
//     try {
//       if (!this.db) await this.connect()

//       const columns = await this.db.all(`PRAGMA table_info(${tableName})`)

//       const columnInfos: ColumnInfo[] = columns.map((col: any) => ({
//         name: col.name,
//         type: col.type,
//         nullable: !col.notnull,
//         defaultValue: col.dflt_value,
//         isPrimaryKey: !!col.pk
//       }))

//       return { success: true, data: columnInfos, count: columnInfos.length }
//     } catch (error: any) {
//       return { success: false, error: error.message }
//     }
//   }

//   async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
//     try {
//       if (!this.db) await this.connect()
//       const rows = await this.db.all(sql, params)
//       return { success: true, data: rows, count: rows.length }
//     } catch (error: any) {
//       return { success: false, error: error.message }
//     }
//   }

//   async execute(sql: string, params: any[] = []): Promise<QueryResult<any>> {
//     try {
//       if (!this.db) await this.connect()
//       const result = await this.db.run(sql, params)
//       return { success: true, data: [{ changes: result.changes, lastID: result.lastID }], count: result.changes }
//     } catch (error: any) {
//       return { success: false, error: error.message }
//     }
//   }
// }

// 数据库管理器

export class DatabaseManager {
  private static instances: Map<string, DatabasePlugin> = new Map()

  static async createOperations(config: AnyDatabaseConfig): Promise<DatabasePlugin> {
    const key = `${config.type}-${config.id}`

    if (this.instances.has(key)) {
      return this.instances.get(key)!
    }

    let operations: DatabasePlugin

    switch (config.type) {
      case DatabaseType.POSTGRESQL:
        operations = new PostgreSQLOperations(config as PostgreSQLConfig)
        break
      //   case DatabaseType.MYSQL:
      //   case DatabaseType.MARIADB:
      //     operations = new MySQLOperations(config as MySQLConfig | MariaDBConfig)
      //     break
      //   case DatabaseType.SQLITE:
      //     operations = new SQLiteOperations(config as SQLiteConfig)
      //     break
      default:
        throw new Error(`不支持的数据库类型: ${config.type}`)
    }

    this.instances.set(key, operations)
    return operations
  }

  static async testConnection(config: AnyDatabaseConfig): Promise<DatabaseConnectionResult> {
    const operations = await this.createOperations(config)
    return operations.testConnection()
  }

  static async getOperations(config: AnyDatabaseConfig): Promise<DatabasePlugin> {
    return this.createOperations(config)
  }

  static async disconnect(config: AnyDatabaseConfig): Promise<void> {
    const key = `${config.type}-${config.id}`
    const operations = this.instances.get(key)
    if (operations) {
      await operations.disconnect()
      this.instances.delete(key)
    }
  }

  static async disconnectAll(): Promise<void> {
    const promises = Array.from(this.instances.values()).map(ops => ops.disconnect())
    await Promise.all(promises)
    this.instances.clear()
  }
}
