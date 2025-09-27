import { resolve } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const configPath = resolve(process.cwd(), "public/task.config.json");
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const newConfig = {
    nitro: {
      scheduledTasks: {
        "* * * * *": ["cms:test"],
      },
    },
  };
  writeFileSync(configPath, JSON.stringify(newConfig, null, 2));

  return { success: true };
});
