// // lib/session.ts
// import { getIronSession, SessionOptions } from "iron-session";
// import { cookies } from "next/headers";

// // Define the shape of your session data
// export interface SessionData {
//   question?: any;
//   sessionId?: string;
// }

// // Ensure the session secret is defined
// const SESSION_SECRET = process.env.SESSION_SECRET;
// if (!SESSION_SECRET) {
//   throw new Error("The SESSION_SECRET environment variable is not set.");
// }

// export const sessionOptions: SessionOptions = {
//   password: SESSION_SECRET,
//   cookieName: "nurseid_session",
//   cookieOptions: {
//     secure: process.env.NODE_ENV === "production",
//     httpOnly: true,
//     maxAge: 60 * 60 * 24 * 7, // 7 days
//     sameSite: "lax",
//     path: "/", // Ensure path is set
//   },
// };

// // This is the correct App Router-compatible session getter
// export async function getSession() {
//   try {
//     const cookieStore = await cookies();
//     const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
//     // Initialize session if it doesn't have an ID
//     if (!session.sessionId) {
//       session.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//       await session.save();
//     }
    
//     return session;
//   } catch (error) {
//     console.error("Error getting session:", error);
//     throw error;
//   }
// }