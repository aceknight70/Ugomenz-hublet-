import { Product } from './types';

// Centered on household electronic appliances & power backups (Hisense, Samsung, Bruhm, Scanfrost, etc.)
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'samsung-65-qled',
    name: 'Samsung 65" QLED 4K Smart TV',
    model: 'QA65Q60C (Quantum Dot)',
    price: 850000,
    promoPrice: 795000,
    category: 'Televisions',
    stockStatus: 'In Stock',
    description: 'Breathtaking 65-inch ultra-thin smart TV with full quantum dot technology displaying 100% color volume. Equipped with Samsung’s Tizen OS, direct YouTube/Netflix integration, and automated active voice amplification.',
    heroImage: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80',
    angle2: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=800&q=80',
    variants: [
      {
        id: 'sam-65-premium',
        colorName: 'Standard Titan Gray Frame',
        sku: 'SAM-QA65-STD',
        heroImage: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 'hisense-55-uled',
    name: 'Hisense 55" Premium ULED Smart TV',
    model: '55U6H Quantum-LED',
    price: 430000,
    promoPrice: 395000,
    category: 'Televisions',
    stockStatus: 'In Stock',
    description: 'Top-tier Hisense TV featuring local dimming zones, Dolby Vision Atmos, and a high-performance VIDAA smart interface. Delivers supreme high-contrast cinematic entertainment for modern living spaces.',
    heroImage: 'https://images.unsplash.com/photo-1552975084-6e027cd345c2?auto=format&fit=crop&w=800&q=80',
    angle2: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'bruhm-43-smart',
    name: 'Bruhm 43" Full HD Smart LED TV',
    model: 'BT-43LED-SM',
    price: 215000,
    category: 'Televisions',
    stockStatus: 'In Stock',
    description: 'Superb 43-inch frameless high-definition smart television. Powered by Android TV with built-in Wi-Fi and HDMI/USB inputs, perfect for general household use, cozy bedrooms, or guest wings.',
    heroImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'samsung-fridge-510l',
    name: 'Samsung 510L Side-by-Side Inverter Refrigerator',
    model: 'RS62R5001M9 Deep-Cold',
    price: 1350000,
    promoPrice: 1290000,
    category: 'Refrigerators',
    stockStatus: 'In Stock',
    description: 'Immersive American double-door side-by-side refrigerator. Outfitted with Samsung digital inverter technology, multi-air flow vents, and sleek fingerprint-resistant metallic finish.',
    heroImage: 'https://images.unsplash.com/photo-1571175432247-fe063c7c4613?auto=format&fit=crop&w=800&q=80',
    angle2: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'hisense-fridge-250l',
    name: 'Hisense 250L Smart Bottom-Mount Refrigerator',
    model: 'RD-25DC Low-Noise',
    price: 360000,
    category: 'Refrigerators',
    stockStatus: 'In Stock',
    description: 'A stylish and energy-efficient bottom-mount refrigerator. Comes with rapid-cooling technologies, dedicated vegetable crisper compartments, and frost-free cooling technology.',
    heroImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'scanfrost-freezer-250l',
    name: 'Scanfrost 250L Supreme Deep Chest Freezer',
    model: 'SFL250ECO Defrost-Master',
    price: 320000,
    category: 'Refrigerators',
    stockStatus: 'In Stock',
    description: 'A heavy-duty chest freezer ideal for long-term food preservation during power fluctuations. Built with a fast-freezing function, premium rust-resistant interior finish, and heavy-duty compressor.',
    heroImage: 'https://images.unsplash.com/photo-1571175432247-fe063c7c4613?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'scanfrost-freezer-150l',
    name: 'Scanfrost 150L Fast-Cooling Chest Freezer',
    model: 'SFL150ECO Inverter-Ready',
    price: 245000,
    category: 'Refrigerators',
    stockStatus: 'In Stock',
    description: 'Compact yet high-efficiency chest freezer with thick wall insulation. Keeps food items frozen for up to 100 hours after power cuts. Extremely durable cabinet casing.',
    heroImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'bruhm-freezer-200l',
    name: 'Bruhm 200L Eco Chest Freezer',
    model: 'BCF-200SD Double-Door',
    price: 265000,
    category: 'Refrigerators',
    stockStatus: 'In Stock',
    description: 'Sleek eco-friendly double-compartment freezer from Bruhm. Engineered for extreme tropical climate conditions, low-power draws, and built-in mechanical door key locks.',
    heroImage: 'https://images.unsplash.com/photo-1571175432247-fe063c7c4613?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'samsung-washer-9kg',
    name: 'Samsung 9kg Inverter Front-Load Washing Machine',
    model: 'WW90T4040CX ecoBubble',
    price: 580000,
    promoPrice: 540000,
    category: 'Washing Machines',
    stockStatus: 'In Stock',
    description: 'Premium front loading washer with steam hygiene circles and smart ecoBubble care that dissolves soap rapidly even in low temperatures, treating garments with absolute prestige.',
    heroImage: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80',
    angle2: 'https://images.unsplash.com/photo-1582735689369-acfe99b574ff?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'scanfrost-washer-8kg',
    name: 'Scanfrost 8kg Semi-Automatic Dual-Tub Washer',
    model: 'SFWMT8 Heavy-Duty',
    price: 175000,
    category: 'Washing Machines',
    stockStatus: 'In Stock',
    description: 'Time-tested semi-automatic dual tub machine allowing simultaneous washing and spin drying. Features robust direct link motors and an elegant plastic anti-rust body frame.',
    heroImage: 'https://images.unsplash.com/photo-1582735689369-acfe99b574ff?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'scanfrost-cooker-4b',
    name: 'Scanfrost 4-Burner Gas Cooker with Electric Oven',
    model: 'SFC5402S Stainless Glass',
    price: 198000,
    category: 'Kitchen Appliances',
    stockStatus: 'In Stock',
    description: 'Perfect kitchen addition with 4 highly-responsive gas burners, a automatic igniter, double gas-insulated glass oven door, and professional stainless steel stove grates.',
    heroImage: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'bruhm-microwave-20l',
    name: 'Bruhm 20L Solo Kitchen Microwave Oven',
    model: 'BGM-20MX Quick-Heat',
    price: 88000,
    category: 'Kitchen Appliances',
    stockStatus: 'In Stock',
    description: 'Highly reliable and compact solo microwave oven with 6 power-draw level adjustments, rapid speed-defrosting triggers, and user-friendly mechanical control dials.',
    heroImage: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'hisense-ac-15hp',
    name: 'Hisense 1.5HP Copper Split Air Conditioner',
    model: 'AS-12TG Super-Cooling',
    price: 310000,
    category: 'Air Conditioners',
    stockStatus: 'In Stock',
    description: 'Advanced 1.5 HP climate control system with 100% pure copper condenser pipelines, intelligent eco energy-saving sleep modes, and real-time smart auto restart protection.',
    heroImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'scanfrost-ac-2hp-standing',
    name: 'Scanfrost 2HP Floor Standing Air Conditioner',
    model: 'SFAC-2000 Pro-Blink',
    price: 660000,
    category: 'Air Conditioners',
    stockStatus: 'In Stock',
    description: 'A powerful, heavy-performing, vertical column standing air conditioner offering far-reaching high air delivery. Perfect for grand halls, electronic warehouses, or official office quarters.',
    heroImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
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
    description: 'High frequency intelligent solar inverter with automatic bypass and built-in lithium battery charger. Delivers flawless clean power to backup household appliances like TVs, fans, and mini-fridges during utility failures.',
    heroImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
    variants: []
  },
  {
    id: 'hikvision-cctv-4cam',
    name: 'Hikvision 4-Camera Full HD CCTV Kit',
    model: 'DS-2CE16D0T-IR-4P',
    price: 120000,
    category: 'CCTV',
    stockStatus: 'In Stock',
    description: 'Supreme business and home security package containing 4 weatherproof indoor/outdoor IR bullet cameras, a 4-channel intelligent DVR, and a full smartphone live-view remote monitoring system.',
    heroImage: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    variants: []
  }
];

export const INITIAL_SHOWROOM_PHOTOS = [
  {
    id: 'photo-1',
    title: 'Flagship TV Lounge Display',
    description: 'Premium Samsung & Hisense TV panels showcasing high fidelity audio visual capabilities.',
    imageUrl: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'photo-2',
    title: 'Main Showroom Entryway',
    description: 'Showcasing the latest double-door smart fridges and domestic air conditioning systems.',
    imageUrl: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'photo-3',
    title: 'Home Appliances Showroom',
    description: 'Heavy duty front-loading washing machines and Scanfrost chest freezer alignments.',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'photo-4',
    title: 'Electric & Gas Cookers Hall',
    description: 'Sleek stainless steel gas hobs, oven components, and tabletop kitchen devices.',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'
  }
];
