import { getCurrentUser } from "./get-current-user"
import prisma from "@/lib/prisma"

/**
 * Asserts that the authenticated user has access to the specified brand ID.
 * Returns the Brand object (including workspace_id) if authorized, or null if unauthorized.
 */
export async function assertBrandAccess(brandId?: string | null) {
  const user = await getCurrentUser()
  if (!user) return null

  if (!brandId) {
    // If no brandId is provided, get the first brand associated with the user's workspace
    const workspaceId = (user as any).workspaceId
    if (!workspaceId) return null
    
    const brand = await prisma.brand.findFirst({
      where: { workspace_id: workspaceId }
    })
    return brand
  }

  const brand = await prisma.brand.findUnique({
    where: { id: brandId }
  })

  if (!brand) return null

  // Verify the user belongs to the workspace this brand is in
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspace_id_user_id: {
        workspace_id: brand.workspace_id,
        user_id: user.id
      }
    }
  })

  if (!membership) return null

  return brand
}
