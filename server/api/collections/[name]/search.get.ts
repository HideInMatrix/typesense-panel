import { getTypesenseClient } from "lib/typesense";
import { Jieba } from "@node-rs/jieba";
import { dict } from "@node-rs/jieba/dict";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const tableName = getRouterParam(event, "name") as string;
  const jieba = Jieba.withDict(dict);
  let query_keyword = (query as { q: string }).q;
  let _query = jieba.cut(query_keyword, false);
  query.q = _query.join(",");
  const client = await getTypesenseClient();
  try {
    const results = await client
      .collections(tableName)
      .documents()
      .search({ ...query });
    return results;
  } catch (err: any) {
    if (err?.httpStatus === 404) {
      return { success: false, code: 404, message: `${err}` };
    }
    throw err;
  }
});
