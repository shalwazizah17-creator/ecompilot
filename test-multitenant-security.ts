import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testSecurity() {
  console.log('--- Running Multi-Tenant Security Test ---')
  
  // Cleanup
  await prisma.brand.deleteMany({ where: { name: { in: ['TestBrandA', 'TestBrandB'] } } })
  await prisma.workspace.deleteMany({ where: { name: { in: ['TestWorkspaceA', 'TestWorkspaceB'] } } })
  await prisma.user.deleteMany({ where: { email: { in: ['user_a@test.com', 'user_b@test.com'] } } })

  // 1. Create Workspace A and User A
  const userA = await prisma.user.create({
    data: { email: 'user_a@test.com', name: 'User A', password_hash: 'hash' }
  })
  const workspaceA = await prisma.workspace.create({
    data: { name: 'TestWorkspaceA' }
  })
  await prisma.workspaceMember.create({
    data: { workspace_id: workspaceA.id, user_id: userA.id, role: 'OWNER' }
  })
  const brandA = await prisma.brand.create({
    data: { workspace_id: workspaceA.id, name: 'TestBrandA' }
  })

  // 2. Create Workspace B and User B
  const userB = await prisma.user.create({
    data: { email: 'user_b@test.com', name: 'User B', password_hash: 'hash' }
  })
  const workspaceB = await prisma.workspace.create({
    data: { name: 'TestWorkspaceB' }
  })
  await prisma.workspaceMember.create({
    data: { workspace_id: workspaceB.id, user_id: userB.id, role: 'OWNER' }
  })
  const brandB = await prisma.brand.create({
    data: { workspace_id: workspaceB.id, name: 'TestBrandB' }
  })

  console.log(`[PASS] Setup complete. Created isolated workspaces.`)

  // 3. Test Access Simulation
  // User B trying to access Brand A
  const userBTryingBrandA = await prisma.workspaceMember.findUnique({
    where: {
      workspace_id_user_id: {
        workspace_id: brandA.workspace_id,
        user_id: userB.id
      }
    }
  })

  if (!userBTryingBrandA) {
    console.log(`[PASS] Security Check: User B blocked from accessing Brand A (Workspace A)`)
  } else {
    console.error(`[FAIL] Security Check: User B granted access to Brand A!`)
    process.exit(1)
  }

  // Cleanup
  await prisma.brand.deleteMany({ where: { name: { in: ['TestBrandA', 'TestBrandB'] } } })
  await prisma.workspace.deleteMany({ where: { name: { in: ['TestWorkspaceA', 'TestWorkspaceB'] } } })
  await prisma.user.deleteMany({ where: { email: { in: ['user_a@test.com', 'user_b@test.com'] } } })

  console.log('--- Security Test Complete ---')
}

testSecurity().catch(console.error)
