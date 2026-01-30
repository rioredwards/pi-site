import { eq } from "drizzle-orm";
import { type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { getDb } from "./db/drizzle";
import { users } from "./db/schema";
import { devLog } from "./lib/utils";

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
    async signIn({ user, account, profile }) {
      // Create or update user in database with OAuth profile data
      if (account && profile) {
        const providerAccountId =
          account.providerAccountId ||
          (profile as any)?.sub ||
          user.id ||
          user.email;

        const adminUserIds =
          process.env.ADMIN_USER_IDS?.split(",").map((id) => id.trim()) || [];
        const rawUserId = `${account.provider}-${providerAccountId}`;
        const userId = adminUserIds.includes(rawUserId) ? "admin" : rawUserId;

        // Extract OAuth profile data
        // GitHub: profile.name, profile.avatar_url
        // Google: profile.name, profile.picture
        const oauthName = (profile as any).name || user.name || null;
        const oauthImage =
          (profile as any).avatar_url || // GitHub
          (profile as any).picture || // Google
          user.image ||
          null;

        try {
          const db = getDb();
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (!existingUser) {
            // Create new user with OAuth data
            await db.insert(users).values({
              id: userId,
              displayName: oauthName,
              profilePicture: oauthImage,
            });
          } else if (
            !existingUser.displayName &&
            !existingUser.profilePicture
          ) {
            // Update existing user if they don't have profile data yet
            await db
              .update(users)
              .set({
                displayName: oauthName,
                profilePicture: oauthImage,
              })
              .where(eq(users.id, userId));
          }
        } catch (error) {
          // Log but don't block sign-in if database operation fails
          devLog("Failed to sync user profile:", error);
        }
      }
      return true;
    },
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
