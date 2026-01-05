import { type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // On initial sign-in, create and store the user ID
      if (account && user) {
        // Create a unique user ID from provider account ID
        // Use account.providerAccountId (sub for Google, id for GitHub) combined with provider name
        const providerAccountId =
          account.providerAccountId ||
          (profile as any)?.sub ||
          user.id ||
          user.email;

        // Check if this user is an admin (configured via environment variable)
        // ADMIN_USER_IDS should be a comma-separated list of: provider-accountId
        // Example: "github-123456,google-789012"
        const adminUserIds =
          process.env.ADMIN_USER_IDS?.split(",").map((id) => id.trim()) || [];
        const userId = `${account.provider}-${providerAccountId}`;

        // Set userId to "admin" if user is in the admin list
        token.id = adminUserIds.includes(userId) ? "admin" : userId;
        token.accessToken = account?.access_token;
      }
      // token.id should persist across requests
      return token;
    },
    async session({ session, token }) {
      // Always set the user ID from token if available
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Clean up callback URLs and redirect to base URL after sign-in
      if (url.startsWith(baseUrl)) {
        // Remove nested callbackUrl parameters
        const cleanUrl = new URL(url, baseUrl);
        cleanUrl.searchParams.delete("callbackUrl");
        return cleanUrl.pathname === "/" ? baseUrl : cleanUrl.toString();
      }
      return url.startsWith("/") ? `${baseUrl}${url}` : url;
    },
  },
};
