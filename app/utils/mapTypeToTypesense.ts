export default function (pgType: string): string {
    const t = (pgType || '').toLowerCase()
    if (t.includes('bigint')) return 'string'
    if (t === 'integer' || t === 'int' || t === 'int4') return 'int32'
    if (t.includes('double') || t.includes('real') || t.includes('numeric') || t.includes('decimal') || t.includes('float')) return 'float'
    if (t === 'boolean' || t === 'bool') return 'bool'
    if (t.includes('timestamp') || t.includes('date') || t.includes('time')) return 'string'
    if (t.includes('text') || t.includes('char') || t.includes('uuid') || t.includes('json')) return 'string'
    return 'string'
  }