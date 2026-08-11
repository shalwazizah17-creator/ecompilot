import { getCurrentUser } from "./get-current-user"
import prisma from "@/lib/prisma"

/**
 * Asserts that the authenticated user has access to the specified workspace ID.
 * Returns the WorkspaceMember object if authorized, or null if unauthorized.
 */
export async function assertWorkspaceAccess(workspaceId: string) {
  const user = await getCurrentUser()
  if (!user) return null

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspace_id_user_id: {
        workspace_id: workspaceId,
        user_id: user.id
      }
    }
  })

  return membership
}
