export default defineEventHandler(async () => {
  try {
    if (typeof useStorage === "undefined") {
      throw new Error("Storage 未初始化");
    }
    const storage = useStorage("data");
    const config = await storage.getItem("typesense:config");
    return config || null;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: (error as Error).message || "获取配置失败",
    });
  }
});
