import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "./mongodb";
import { normalizePhone } from "./phone";
import { adminAuth } from "./firebase-admin";
import User from "@/models/User";
import "@/models/Permission";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        idToken: { label: "ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;

        try {
          // Verify Firebase ID token
          const decoded = await adminAuth.verifyIdToken(credentials.idToken);
          if (!decoded.phone_number) return null;

          // Normalize phone: strip +91 prefix
          const phone = normalizePhone(
            decoded.phone_number.replace(/^\+91/, "")
          );

          await connectDB();

          let user = await User.findOne({ phone }).populate("permissions");

          if (!user) {
            // Auto-create new user with no permissions (end user)
            user = await User.create({
              name: phone,
              phone,
              permissions: [],
            });
            user = await User.findById(user._id).populate("permissions");
          }

          if (!user.isActive) return null;

          const permissionKeys = user.permissions.map(
            (p: { key: string }) => p.key
          );

          return {
            id: user._id.toString(),
            name: user.name,
            email: phone, // NextAuth requires email field; we use phone
            phone: user.phone,
            permissions: permissionKeys,
          };
        } catch (err) {
          console.error("Auth error:", err);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.phone = user.phone;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.phone = token.phone;
      session.user.permissions = token.permissions;
      return session;
    },
  },
};
