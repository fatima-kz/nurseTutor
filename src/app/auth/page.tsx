import { requireGuest } from "@/lib/auth"
import AuthClient from "./AuthClient"

export default async function AuthPage() {
  // This will redirect to /dashboard if user is already authenticated
  await requireGuest()

  return <AuthClient />
}
