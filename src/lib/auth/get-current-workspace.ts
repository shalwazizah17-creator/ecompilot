import { getCurrentUser } from "./get-current-user"
import prisma from "@/lib/prisma"

export async function getCurrentWorkspace() {
  const user = await getCurrentUser()
  if (!user) return null

  // In NextAuth, we attach workspaceId to the session user if they have one
  const workspaceId = (user as any).workspaceId
  if (!workspaceId) return null

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId }
  })

  return workspace
}
