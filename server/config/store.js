import bcrypt from 'bcryptjs';

const salt = bcrypt.genSaltSync(10);

export const memoryStore = {
  users: [
    {
      _id: '65f1a0010000000000000001',
      id: '65f1a0010000000000000001',
      name: 'Alexander Admin',
      email: 'admin@aura.store',
      password: bcrypt.hashSync('Admin123!', salt),
      isAdmin: true,
      wishlist: [],
      createdAt: new Date().toISOString(),
    },
    {
      _id: '65f1a0010000000000000002',
      id: '65f1a0010000000000000002',
      name: 'Elena Rostova',
      email: 'customer@aura.store',
      password: bcrypt.hashSync('User123!', salt),
      isAdmin: false,
      wishlist: [],
      createdAt: new Date().toISOString(),
    },
  ],

  categories: [
    { _id: 'cat-01', name: 'Audio', slug: 'audio', description: 'Precision acoustic instruments' },
    { _id: 'cat-02', name: 'Wearables', slug: 'wearables', description: 'Minimalist smart wearables' },
    { _id: 'cat-03', name: 'Desk Setup', slug: 'desk-setup', description: 'Ergonomic workspace accessories' },
    { _id: 'cat-04', name: 'Photography', slug: 'photography', description: 'Optics and mirrorless gear' },
    { _id: 'cat-05', name: 'Home Living', slug: 'home-living', description: 'Stoneware and architectural objects' },
  ],

  products: [
    {
      _id: '65f1b0010000000000000001',
      name: 'Acoustic One Wireless Headphones',
      price: 24999,
      rating: 4.8,
      reviewsCount: 2,
      category: 'Audio',
      description: 'Precision-engineered active noise cancellation headphones with custom neodymium 40mm drivers, 36-hour battery life, and ultra-soft memory foam ear cushions.',
      countInStock: 15,
      featured: true,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      details: [
        'Hybrid Active Noise Cancellation with transparency mode',
        'Lossless 24-bit audio playback via USB-C or Bluetooth 5.3',
        'Aircraft-grade lightweight aluminum frame',
        'Fast charge: 15 minutes gives 6 hours playback'
      ],
      reviews: [
        { _id: 'rev-01', userName: 'Sarah Jenkins', rating: 5, comment: 'Phenomenal clarity and the minimalist matte finish is stunning.', createdAt: '2026-09-15' },
        { _id: 'rev-02', userName: 'Marcus Vance', rating: 4.5, comment: 'Best noise cancellation I have experienced yet. Extremely comfortable.', createdAt: '2026-09-28' }
      ],
    },
    {
      _id: '65f1b0010000000000000002',
      name: 'Chronos Minimalist Smartwatch',
      price: 29999,
      rating: 4.9,
      reviewsCount: 1,
      category: 'Wearables',
      description: 'A timeless titanium timepiece powered by an ultra-efficient AMOLED display, advanced biometrics, 7-day battery life, and sapphire crystal glass.',
      countInStock: 8,
      featured: true,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      details: [
        'Grade 5 titanium aerospace bezel with quick-release leather band',
        'Always-on 1.4-inch LTPO OLED with 1000 nits brightness',
        'Medical-grade heart rate, SpO2, and sleep cycle monitoring',
        '50m water resistance (5 ATM)'
      ],
      reviews: [
        { _id: 'rev-03', userName: 'Alex Rivera', rating: 5, comment: 'Finally a smartwatch that looks like a luxury Swiss watch. Battery lasts 6+ days easily.', createdAt: '2026-10-01' }
      ],
    },
    {
      _id: '65f1b0010000000000000003',
      name: 'ErgoCraft Mechanical Keyboard',
      price: 14999,
      rating: 4.7,
      reviewsCount: 1,
      category: 'Desk Setup',
      description: 'Custom gasket-mounted wireless mechanical keyboard with hot-swappable tactile switches, CNC anodized aluminum chassis, and PBT double-shot keycaps.',
      countInStock: 22,
      featured: true,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
      details: [
        'Hot-swappable 5-pin PCB with south-facing RGB LEDs',
        'Pre-lubed custom tactile switches with dampened sound profile',
        'Tri-mode connectivity: Bluetooth 5.1, 2.4GHz wireless, USB-C',
        'Seamless multi-device switching between Mac and Windows'
      ],
      reviews: [
        { _id: 'rev-04', userName: 'David Chen', rating: 5, comment: 'The sound profile out of the box is incredible. Heavy, premium build.', createdAt: '2026-08-20' }
      ],
    },
    {
      _id: '65f1b0010000000000000004',
      name: 'Lumio Halo Studio Desk Lamp',
      price: 6499,
      rating: 4.6,
      reviewsCount: 1,
      category: 'Desk Setup',
      description: 'Circadian-sync architectural desk lamp with touch-sensitive dimming, 98+ CRI color accuracy, wireless charging base, and dual-pivot counterbalanced arm.',
      countInStock: 18,
      featured: false,
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
      details: [
        'High-CRI (98+) eye-comfort diffused optical panel',
        'Automatic ambient light sensor matching room brightness',
        '15W Qi wireless fast charger built into weighted aluminum base',
        'Step-less temperature control from 2700K warm to 6500K daylight'
      ],
      reviews: [
        { _id: 'rev-05', userName: 'Emily Watson', rating: 4, comment: 'Great light for late night desk work, easy on the eyes.', createdAt: '2026-09-02' }
      ],
    },
    {
      _id: '65f1b0010000000000000005',
      name: 'AeroLens 35mm Prime Camera',
      price: 79999,
      rating: 4.9,
      reviewsCount: 1,
      category: 'Photography',
      description: 'Compact full-frame mirrorless street camera with fixed f/2.0 aspherical lens, retro tactile dials, and cinematic film simulation profiles.',
      countInStock: 4,
      featured: true,
      image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
      details: [
        '40.2 MP X-Trans CMOS sensor with 5-axis in-body image stabilization',
        'Hybrid optical/electronic viewfinder with 3.69M dots',
        'Machined brass shutter button and milled control dials',
        'Internal ND filter and 4K/60p 10-bit video capture'
      ],
      reviews: [
        { _id: 'rev-06', userName: 'Liam Thorne', rating: 5, comment: 'The image quality and colors straight out of camera are unbeatable.', createdAt: '2026-09-11' }
      ],
    },
    {
      _id: '65f1b0010000000000000006',
      name: 'Pulse Pro Wireless ANC Earbuds',
      price: 12999,
      rating: 4.5,
      reviewsCount: 0,
      category: 'Audio',
      description: 'Pocket-sized audiophile true wireless earbuds with spatial audio tracking, custom 11mm ceramic drivers, and 30 hours total battery case.',
      countInStock: 25,
      featured: false,
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
      details: [
        'Adaptive active noise cancellation with wind protection mesh',
        'IP54 dust and splash resistant rating',
        'Seamless multi-point Bluetooth pairing',
        'Qi wireless and USB-C fast charging case'
      ],
      reviews: [],
    },
    {
      _id: '65f1b0010000000000000007',
      name: 'Horizon Matte Ceramic Vessel',
      price: 2499,
      rating: 4.7,
      reviewsCount: 0,
      category: 'Home Living',
      description: 'Handcrafted stoneware vase with architectural geometric silhouettes and an unglazed stone-textured exterior. Designed for minimal floral arrangements.',
      countInStock: 12,
      featured: false,
      image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800&q=80',
      details: [
        'Hand-thrown high-fire stoneware ceramic',
        'Matte natural textured stone finish',
        'Waterproof glazed interior reservoir',
        'Dimensions: 22cm height, 12cm diameter'
      ],
      reviews: [],
    },
    {
      _id: '65f1b0010000000000000008',
      name: 'Vanguard Titanium Fitness Band',
      price: 11999,
      rating: 4.6,
      reviewsCount: 0,
      category: 'Wearables',
      description: 'Screenless health tracker bracelet focused on sleep, recovery, and strain metrics with haptic wake alarms and water-resistant woven strap.',
      countInStock: 30,
      featured: false,
      image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&q=80',
      details: [
        'Continuous skin temperature and HRV monitoring',
        'Ultralight 22g build with titanium clasp',
        'Zero screen distractions - syncs seamlessly to companion app',
        '5-day battery life with slide-on charging pack'
      ],
      reviews: [],
    },
  ],

  orders: [
    {
      _id: '65f1c0010000000000000001',
      orderNumber: 'ORD-729103',
      user: '65f1a0010000000000000002',
      orderItems: [
        {
          product: '65f1b0010000000000000001',
          name: 'Acoustic One Wireless Headphones',
          qty: 1,
          price: 24999,
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        },
      ],
      shippingAddress: {
        name: 'Elena Rostova',
        email: 'customer@aura.store',
        phone: '+91 98765 43210',
        address: '450 Indiranagar, 100 Feet Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
      },
      paymentMethod: 'card',
      subtotal: 24999,
      shippingPrice: 0,
      taxPrice: 1999.92,
      totalPrice: 26998.92,
      status: 'Shipped',
      isPaid: true,
      createdAt: '2026-10-08T10:30:00.000Z',
    },
  ],

  carts: {},
};
