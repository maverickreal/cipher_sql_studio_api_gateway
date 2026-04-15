import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import { MongoClient } from "mongodb";
import { envVars } from "../config/index.js";

const client = new MongoClient(envVars.MONGO_URI);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  secret: envVars.BETTER_AUTH_SECRET,
  baseURL: envVars.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
      },
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],
  hooks: {
    before: createAuthMiddleware(async (ctx): Promise<unknown> => {
      if (ctx.path === "/sign-up/email") {
        const adminSecret = (ctx.body as Record<string, unknown>)?.adminSecret;
        if (adminSecret === envVars.ADMIN_SECRET_CODE) {
          return {
            context: {
              ...ctx,
              body: { ...(ctx.body as Record<string, unknown>), role: "admin" },
            },
          };
        }
      }
      return null;
    }),
  },
});