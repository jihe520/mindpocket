import { expo } from "@better-auth/expo"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { APIError } from "better-auth/api"
import { nextCookies } from "better-auth/next-js"
import { bearer } from "better-auth/plugins/bearer"
import { deviceAuthorization } from "better-auth/plugins/device-authorization"
import { count } from "drizzle-orm"
import { db } from "@/db/client"
import { user as userTable } from "@/db/schema/auth"

const DEFAULT_APP_URL = "http://127.0.0.1:3000"
const CLI_CLIENT_ID = "mindpocket-cli"

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL,
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL,
    "chrome-extension://*",
    DEFAULT_APP_URL,
    "http://127.0.0.1:8081",
    "http://localhost:8081",
    "mindpocket://",
    "exp://",
    "exp://**",
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    async sendResetPassword(_data, _request) {
      // Send an email to the user with a link to reset their password
    },
  },
  // socialProviders: {
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID!,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  //   },
  //   github: {
  //     clientId: process.env.GITHUB_CLIENT_ID!,
  //     clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  //   },
  // },
  databaseHooks: {
    user: {
      create: {
        before: async () => {
          const result = await db.select({ count: count() }).from(userTable)
          const userCount = result[0]?.count || 0
          if (userCount > 0) {
            throw new APIError("FORBIDDEN", {
              message: "注册已关闭",
            })
          }
        },
      },
    },
  },
  plugins: [
    nextCookies(),
    bearer(),
    expo(),
    deviceAuthorization({
      expiresIn: "15m",
      interval: "5s",
      verificationUri: "/device",
      validateClient(clientId) {
        return clientId === CLI_CLIENT_ID
      },
    }),
  ],
})
