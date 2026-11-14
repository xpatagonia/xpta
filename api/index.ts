import "dotenv/config";
import { createApiApp } from "../src/server/createApp.ts";

const { app } = createApiApp();

export default app;
