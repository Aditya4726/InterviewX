import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
     
      domain: "https://mature-wallaby-1149.clerk.accounts.dev",
      applicationID: "convex",
    },
  ]
} satisfies AuthConfig;