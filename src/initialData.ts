import { Product } from './types';

// Let's create realistic Unsplash images for various devices and angles
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'hp-omnibook',
    name: 'HP Omnibook Ultra Flip 14',
    model: '14-fh0000nia (Flagship)',
    price: 890000,
    promoPrice: 850000,
    category: 'Laptops',
    stockStatus: 'In Stock',
    description: 'The premier AI-engineered convertible laptop with Intel Core Ultra processor, gorgeous 3K OLED touchscreen, and incredible 20-hour battery life. Designed for executives, creators, and developers.',
    heroImage: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80',
    angle2: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80', // Side view
    angle3: 'https://images.unsplash.com/photo-1629131726692-1accd0c53db0?auto=format&fit=crop&w=800&q=80', // Back / Port view
    angle4: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80', // Close up keyboard
    angle5: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=800&q=80', // Lifestyle
    variants: [
      {
        id: 'hp-omni-space-gray',
        colorName: 'Space Gray Metallic',
        sku: 'HP-OMNI-SG14',
        heroImage: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
        angle2: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=800&q=80',
        angle3: 'https://images.unsplash.com/photo-1629131726692-1accd0c53db0?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'hp-omni-amber-gold',
        colorName: 'Amber Luxury Gold',
        sku: 'HP-OMNI-AG14',
         heroImage: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
        angle2: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'hp-envy-x360',
    name: 'HP Envy x360 15.6"',
    model: 'ENVY-15-FE0013DX',
    price: 730000,
    category: 'Laptops',
    stockStatus: 'In Stock',
    description: 'Premium versatile aluminum chassis with 360-degree hinge, AMD Ryzen 7, 16GB RAM, and vibrant Full HD IPS touchscreen. Ideal for multi-tasking professionals on the go.',
    heroImage: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80',
    angle2: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
    angle3: 'https://images.unsplash.com/photo-1496181130204-7552cc14acfc?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'hp-foldable-pc',
    name: 'HP Spectre Foldable PC',
    model: 'Spectre Fold 17',
    price: 0, // Call for Price as per Page 6 ("HP Foldable (Call for Price)")
    category: 'Laptops',
    stockStatus: 'Out of Stock',
    description: 'Groundbreaking 17-inch foldable OLED hybrid device. Can be used as a tablet, an elegant laptop, or an ultimate desktop monitor. Truly the future of computing (Please call or enquire for current pricing).',
    heroImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    angle2: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'jinko-solar-450w',
    name: 'Jinko 450W Bifacial Solar Panel',
    model: 'Tiger Neo N-type 54HL4-BDv',
    price: 680000,
    category: 'Solar',
    stockStatus: 'In Stock',
    description: 'High-efficiency Bifacial dual-glass module. Capitalizes on rear-side reflectance to boost total capacity by up to 25%. Durable, weather-resistant, and comes with a 25-year warranty.',
    heroImage: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    angle2: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=800&q=80',
    angle3: 'https://images.unsplash.com/photo-1620001850159-a13fc57e8082?auto=format&fit=crop&w=800&q=80',
    variants: [
      {
        id: 'jinko-panel-single',
        colorName: 'Single Component 450W',
        sku: 'JK-SL-450-S',
        heroImage: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'jinko-panel-4pack',
        colorName: 'Pre-Wired 4-Pack Array',
        sku: 'JK-SL-450-4P',
        heroImage: 'https://images.unsplash.com/photo-1548611635-b6e78dee00f5?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'felicity-inverter-35kva',
    name: 'Felicity 3.5kVA Pure Sine Wave Inverter',
    model: 'FL-IVP3524-3500VA',
    price: 185000,
    category: 'Solar',
    stockStatus: 'In Stock',
    description: 'High frequency intelligent solar inverter with automatic bypass and built-in lithium battery charger. Delivers flawless clean power for home appliances and office IT equipment.',
    heroImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
    angle2: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'deye-lithium-battery',
    name: 'Deye Lithium Ion LFP Battery 5.12kWh',
    model: 'SE-G5.1Pro-B',
    price: 1200000,
    category: 'Solar',
    stockStatus: 'In Stock',
    description: 'Premium cobalt-free lithium iron phosphate (LFP) battery. Extremely safe, supports floor-standing or heavy wall-mounting, and features automatic cloud cell balancing with live diagnostic apps.',
    heroImage: 'https://images.unsplash.com/photo-1548611635-b6e78dee00f5?auto=format&fit=crop&w=800&q=80',
    angle2: 'https://images.unsplash.com/photo-1597484211029-4e7c7a9cfa2e?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'hp-laserjet-m110w',
    name: 'HP LaserJet M110w Wireless Printer',
    model: 'HP-M110w-Mono',
    price: 95000,
    category: 'Printers',
    stockStatus: 'In Stock',
    description: 'The world’s smallest laser printer in its class. Compact, high-precision, printing at super fast speeds of 21ppm. Supports HP Smart app printing and reliable continuous Wi-Fi.',
    heroImage: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80',
    angle2: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'hp-smarttank-720',
    name: 'HP Smart Tank 720 All-in-One Inkjet',
    model: '720-Duplex-Color',
    price: 140000,
    category: 'Printers',
    stockStatus: 'In Stock',
    description: 'High-capacity cartridge-free smart tank system with dual-band Wi-Fi and automatic double-sided printing. Prints outstanding borderless brochures and crisp multi-page business documents with ultra-low-cost ink refills.',
    heroImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'samsung-55-qled',
    name: 'Samsung 55" QLED 4K Smart TV',
    model: 'QA55Q60CAK-S',
    price: 620000,
    category: 'Monitors',
    stockStatus: 'In Stock',
    description: 'Stunning premium televisions loaded with 100% Color Volume quantum dot filter, Object Tracking Sound Lite, and smart dashboard controls. Perfectly blends into any family room or corporate lounge.',
    heroImage: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80',
    angle2: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'firman-generator-3800w',
    name: 'Firman Rugged Generator 3800W',
    model: 'SPG3800-4-Stroke',
    price: 215000,
    category: 'Solar',
    stockStatus: 'In Stock',
    description: 'High performance heavy-duty copper-wrapped alternator generator. Reliable manual recoil key with heavy-duty steel safety frame, providing persistent auxiliary home or warehouse operations safety.',
    heroImage: 'https://images.unsplash.com/photo-1597484211029-4e7c7a9cfa2e?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'hikvision-cctv-4cam',
    name: 'Hikvision 4-Camera Full HD CCTV Kit',
    model: 'DS-2CE16D0T-IR-4P',
    price: 120000,
    category: 'CCTV',
    stockStatus: 'In Stock',
    description: 'The reference security pack containing 4 weatherproof indoor/outdoor IR bullet cameras, a 4-channel intelligent DVR, 1TB premium security hard disk drive, and full smartphone live-view set.',
    heroImage: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'tp-link-deco-m4',
    name: 'TP-Link Deco M4 Whole Home Mesh Router',
    model: 'Deco-M4-3pack',
    price: 75000,
    category: 'Networking',
    stockStatus: 'In Stock',
    description: 'Three Deco units work seamlessly to blanket your home or office with robust, fast, lag-free Wi-Fi. Automatically steers devices to the fastest router point as you move.',
    heroImage: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'kp3-mini-ups',
    name: 'KP3 Smart Mini DC UPS for Routers',
    model: 'KP3-10000mAh',
    price: 28000,
    category: 'Accessories',
    stockStatus: 'In Stock',
    description: 'Never lose internet power when electricity drops. Smart mini UPS keeps your fiber modems, routers, and IP cameras running safely for up to 8 hours. Fully surge protected.',
    heroImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    variants: []
  }
];

export const INITIAL_SHOWROOM_PHOTOS = [
  {
    id: 'photo-1',
    title: 'MeWe TV Section',
    description: 'Yellow-branded premium TV display area showcasing wide panels.',
    imageUrl: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'photo-2',
    title: 'Main Showroom Portal',
    description: 'Showcasing flagship large household appliances, Samsung, and Beko rigs.',
    imageUrl: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'photo-3',
    title: 'Large Appliances Hall',
    description: 'Heavy duty washing machines, double-door fridges, and gas cookers.',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'photo-4',
    title: 'Cookware Section',
    description: 'Premium heavy non-stick pots, frypans, and custom aluminum sets.',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'
  }
];
