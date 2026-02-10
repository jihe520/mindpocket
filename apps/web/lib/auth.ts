import { expo } from "@better-auth/expo"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { bearer } from "better-auth/plugins/bearer"
import { db } from "@/db/client"

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000",
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000",
    "chrome-extension://*",
    "http://127.0.0.1:3000",
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
  plugins: [nextCookies(), bearer(), expo()],
})
