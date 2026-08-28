const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const brand = await prisma.brand.findFirst();
  if (!brand) return;
  const platform = await prisma.platform.findFirst({where: {name: 'TikTok'}});

  const mockAffiliates = [
    { username: 'tasya_skincare', followers: 245000, engagement_rate: 4.8 },
    { username: 'glowwithme_id', followers: 120000, engagement_rate: 6.2 },
    { username: 'racun_shopee_beauty', followers: 890000, engagement_rate: 2.1 },
  ];

  for (const aff of mockAffiliates) {
    const exists = await prisma.affiliate.findFirst({ where: { username: aff.username, brand_id: brand.id } });
    if (!exists) {
      await prisma.affiliate.create({
        data: {
          brand: { connect: { id: brand.id } },
          platform: { connect: { id: platform.id } },
          username: aff.username,
          external_id: aff.username,
          followers: aff.followers,
          engagement_rate: aff.engagement_rate,
          audience_age_min: 18,
          audience_age_max: 35,
          audience_gender: 'FEMALE',
          metrics: {
            create: [
              { period: 'August 2026', date: new Date(), sales: 50000000, orders: 400, commission: 5000000, clicks: 12000 }
            ]
          }
        }
      });
      console.log(`Created affiliate: ${aff.username}`);
    }
  }

  const user = await prisma.user.findFirst();
  const decisionExists = await prisma.decisionHistory.findFirst({ where: { brand_id: brand.id } });
  if (!decisionExists && user) {
    await prisma.decisionHistory.create({
      data: {
        workspace: { connect: { id: brand.workspace_id } },
        brand: { connect: { id: brand.id } },
        user: { connect: { id: user.id } },
        actionTaken: 'Kurangi budget Meta Ads 15% (Kampanye Payday)',
        expectedOutcome: 'Menghindari kerugian ROI yang turun sejak minggu lalu. Ekspektasi ROI stabil > 4.0.',
        status: 'EXECUTED',
      }
    });
    console.log("Seeded Decision History.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
