import { getTypesenseClient } from "lib/typesense";

export default defineEventHandler<{}>(
  async () => {
    try {
      const client = await getTypesenseClient();
      const list = await client.collections().retrieve();
      return { success: true, result: list };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message || "获取集合列表失败",
      };
    }
  }
);
