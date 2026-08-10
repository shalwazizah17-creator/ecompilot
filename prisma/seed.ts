import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create platforms
  const platforms = [
    { name: 'Shopee', is_marketplace: true, is_ad_channel: true },
    { name: 'TikTok Shop', is_marketplace: true, is_ad_channel: true },
    { name: 'Tokopedia', is_marketplace: true, is_ad_channel: true },
    { name: 'Meta', is_marketplace: false, is_ad_channel: true },
  ]

  for (const p of platforms) {
    await prisma.platform.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    })
  }

  // Create admin user
  const password_hash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecompilot.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@ecompilot.com',
      password_hash,
      role: 'ADMIN',
    },
  })

  // Create a brand
  const brand = await prisma.brand.upsert({
    where: { name: 'Beauty Brand A' },
    update: {},
    create: {
      name: 'Beauty Brand A',
    },
  })

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
