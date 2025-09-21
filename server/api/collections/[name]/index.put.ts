import { getTypesenseClient } from 'lib/typesense'
import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections'

export default defineEventHandler(async (event) => {
    const schema = (await readBody(event)) as CollectionCreateSchema
    try {
        const name = getRouterParam(event, 'name') as string
        if (!name) throw createError({ statusCode: 400, statusMessage: 'Missing collection name' })

        const client = await getTypesenseClient()

        // 检查集合是否存在
        try {
            await client.collections(name).retrieve()
        } catch (error: any) {
            if (error?.httpStatus === 404) {
                throw createError({ statusCode: 404, statusMessage: 'Collection not found' })
            }
            throw error
        }

        // 删除现有集合
        await client.collections(name).delete()

        // 创建新集合
        const created = await client.collections().create(schema as any)

        return { success: true, data: created, message: 'Collection updated successfully' }
    } catch (error: any) {
        if (error?.httpStatus === 409) {
            return { success: false, code: 'already_exists', message: `集合 ${schema.name} 已经存在` }
        }
        throw createError({ statusCode: 500, statusMessage: error?.message || 'Failed to update collection' })
    }
})