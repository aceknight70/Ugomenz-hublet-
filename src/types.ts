export interface Product {
  id: string;
  name: string;
  model?: string;
  price: number;
  promoPrice?: number;
  category: string;
  stockStatus: 'In Stock' | 'Out of Stock';
  description: string;
  // Primary galllery assets
  heroImage: string;
  angle2?: string; // Side View
  angle3?: string; // Back View
  angle4?: string; // Close-up
  angle5?: string; // Detail / Label
  // Variants (up to 6 slots)
  variants: Variant[];
}

export interface Variant {
  id: string;
  colorName: string;
  sku?: string;
  heroImage: string;
  angle2?: string;
  angle3?: string;
  angle4?: string;
  angle5?: string;
}

export interface BankDetails {
  bank: string;
  accountNumber: string;
  accountName: string;
}

export interface Review {
  id: string;
  rating: number; // 1-5
  comment: string;
  customerName: string;
  dateStr: string;
}

export interface GMQuery {
  id: string;
  customerName: string;
  whatsappNumber: string;
  subject: string;
  message: string;
  timestamp: string;
  status: 'Pending' | 'Reviewed' | 'Resolved';
}

export interface ManagerStatus {
  manager: 'Available' | 'Busy';
  financialAdvisor: 'Available' | 'Busy';
  leadTechExpert: 'Available' | 'Busy';
}

export interface AnalyticsData {
  totalVisits: number;
  todayVisits: number;
  roomVisits: Record<string, number>;
  visitTimestamps: string[];
}

export interface CampaignConfig {
  campaignActive: boolean;
  campaignTag: string;
  headline: string;
  subHeadline: string;
  accentColor: string;
  accentHoverColor: string;
  storeName: string;
  storeSubName: string;
  tickerText: string;
  tickerActive: boolean;
  themePreset: 'default' | 'christmas' | 'independence' | 'valentine' | 'blackfriday';
  snowAnimationActive: boolean;
  countdownDeadline?: string;
  promoDiscountPercent?: number;
  supportPhone?: string;
  storeAddress?: string;
  storeOpeningHours?: string;
  brandLogoUrl?: string;
}

