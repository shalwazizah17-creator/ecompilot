import { getCurrentUser } from "./get-current-user"
import prisma from "@/lib/prisma"

export async function assertBrandAccess(brandId?: string | null) {
  const user = await getCurrentUser()
  if (!user) return null

  if (!brandId) {
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

  return brand
}
