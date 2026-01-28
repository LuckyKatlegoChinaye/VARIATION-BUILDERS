const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./utils/jwt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create shops
  const shop1 = await prisma.shop.upsert({
    where: { name: 'Downtown Shop' },
    update: {},
    create: {
      name: 'Downtown Shop',
      location: 'Main Street, City Center',
      phone: '+267-71-123456',
      email: 'downtown@shop.com'
    }
  });

  const shop2 = await prisma.shop.upsert({
    where: { name: 'Mall Shop' },
    update: {},
    create: {
      name: 'Mall Shop',
      location: 'Shopping Mall, Wing A',
      phone: '+267-71-654321',
      email: 'mall@shop.com'
    }
  });

  console.log('✓ Created shops:', [shop1.name, shop2.name]);

  // Create users
  const adminPassword = await hashPassword('4040@M');
  const cashierPassword = await hashPassword('cashier123');
  const customerPassword = await hashPassword('customer123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vb.co.bw' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@vb.co.bw',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+267-71-000001',
      address: 'Admin Office'
    }
  });

  const cashier1 = await prisma.user.upsert({
    where: { email: 'cashier1@example.com' },
    update: {},
    create: {
      name: 'John Cashier',
      email: 'cashier1@example.com',
      password: cashierPassword,
      role: 'CASHIER',
      shopId: shop1.id,
      phone: '+267-71-000002',
      address: 'Downtown Shop'
    }
  });

  const cashier2 = await prisma.user.upsert({
    where: { email: 'cashier2@example.com' },
    update: {},
    create: {
      name: 'Jane Cashier',
      email: 'cashier2@example.com',
      password: cashierPassword,
      role: 'CASHIER',
      shopId: shop2.id,
      phone: '+267-71-000003',
      address: 'Mall Shop'
    }
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      name: 'John Customer',
      email: 'customer@example.com',
      password: customerPassword,
      role: 'CUSTOMER',
      phone: '+267-71-000004',
      address: 'Customer Address'
    }
  });

  console.log('✓ Created users:', [admin.name, cashier1.name, cashier2.name, customer.name]);

  // Create products for shop 1
  const products1 = [
    {
      name: 'HP LaserJet Pro Printer',
      description: 'Professional printing solution',
      sku: 'HPLJ001',
      price: 2500.00,
      cost: 1800.00,
      category: 'Electronics',
      shopId: shop1.id
    },
    {
      name: 'Canon Ink Cartridge',
      description: 'Color ink cartridge',
      sku: 'CANIC001',
      price: 180.00,
      cost: 100.00,
      category: 'Supplies',
      shopId: shop1.id
    },
    {
      name: 'A4 White Paper - Ream',
      description: '500 sheets white paper',
      sku: 'PAPER001',
      price: 45.00,
      cost: 25.00,
      category: 'Stationery',
      shopId: shop1.id
    },
    {
      name: 'Desk Lamp LED',
      description: 'Energy efficient desk lamp',
      sku: 'LAMP001',
      price: 350.00,
      cost: 200.00,
      category: 'Furniture',
      shopId: shop1.id
    },
    {
      name: 'Office Chair',
      description: 'Ergonomic office chair',
      sku: 'CHAIR001',
      price: 1200.00,
      cost: 700.00,
      category: 'Furniture',
      shopId: shop1.id
    }
  ];

  const createdProducts1 = [];
  for (const prod of products1) {
    const product = await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {},
      create: prod
    });
    createdProducts1.push(product);

    await prisma.inventory.upsert({
      where: { productId_shopId: { productId: product.id, shopId: shop1.id } },
      update: { quantity: Math.floor(Math.random() * 50) + 20 },
      create: {
        productId: product.id,
        shopId: shop1.id,
        quantity: Math.floor(Math.random() * 50) + 20,
        reorderLevel: 5
      }
    });
  }

  console.log('✓ Created products for Downtown Shop:', createdProducts1.length);

  // Create products for shop 2
  const products2 = [
    {
      name: 'Toner Cartridge - Brother',
      description: 'Black toner cartridge',
      sku: 'TONER001',
      price: 320.00,
      cost: 180.00,
      category: 'Supplies',
      shopId: shop2.id
    },
    {
      name: 'Stapler Set',
      description: 'Office stapler with staples',
      sku: 'STAPLER001',
      price: 85.00,
      cost: 40.00,
      category: 'Stationery',
      shopId: shop2.id
    },
    {
      name: 'Filing Cabinet',
      description: '4-drawer filing cabinet',
      sku: 'CABINET001',
      price: 800.00,
      cost: 450.00,
      category: 'Furniture',
      shopId: shop2.id
    },
    {
      name: 'USB Flash Drive 32GB',
      description: 'High-speed USB drive',
      sku: 'USBDRIVE001',
      price: 150.00,
      cost: 70.00,
      category: 'Electronics',
      shopId: shop2.id
    },
    {
      name: 'Whiteboard Marker Set',
      description: 'Pack of 4 colors',
      sku: 'MARKER001',
      price: 55.00,
      cost: 25.00,
      category: 'Stationery',
      shopId: shop2.id
    }
  ];

  const createdProducts2 = [];
  for (const prod of products2) {
    const product = await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {},
      create: prod
    });
    createdProducts2.push(product);

    await prisma.inventory.upsert({
      where: { productId_shopId: { productId: product.id, shopId: shop2.id } },
      update: { quantity: Math.floor(Math.random() * 40) + 15 },
      create: {
        productId: product.id,
        shopId: shop2.id,
        quantity: Math.floor(Math.random() * 40) + 15,
        reorderLevel: 5
      }
    });
  }

  console.log('✓ Created products for Mall Shop:', createdProducts2.length);

  // Create sample quotation
  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber: `QT-${Date.now()}-SAMPLE`,
      customerId: customer.id,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      subtotal: createdProducts1[0].price * 2,
      tax: (createdProducts1[0].price * 2) * 0.1,
      total: (createdProducts1[0].price * 2) * 1.1,
      items: {
        create: [
          {
            productId: createdProducts1[0].id,
            quantity: 2,
            unitPrice: createdProducts1[0].price,
            total: createdProducts1[0].price * 2
          }
        ]
      }
    }
  });

  console.log('✓ Created sample quotation');

  // Create sample expenses
  await prisma.expense.create({
    data: {
      shopId: shop1.id,
      category: 'UTILITIES',
      description: 'Monthly electricity bill',
      amount: 500.00
    }
  });

  await prisma.expense.create({
    data: {
      shopId: shop2.id,
      category: 'RENT',
      description: 'Monthly rent',
      amount: 2000.00
    }
  });

  console.log('✓ Created sample expenses');

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║            Database Seeding Complete!                          ║
╠════════════════════════════════════════════════════════════════╣
║ Test Credentials:                                              ║
║                                                                ║
║ Admin:                                                         ║
║   Email: admin@vb.co.bw                                       ║
║   Password: 4040@M                                            ║
║                                                                ║
║ Cashier 1:                                                     ║
║   Email: cashier1@example.com                                 ║
║   Password: cashier123                                        ║
║                                                                ║
║ Cashier 2:                                                     ║
║   Email: cashier2@example.com                                 ║
║   Password: cashier123                                        ║
║                                                                ║
║ Customer:                                                      ║
║   Email: customer@example.com                                 ║
║   Password: customer123                                       ║
╚════════════════════════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error('✗ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
