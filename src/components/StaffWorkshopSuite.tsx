import React, { useState, useMemo } from 'react';
import {
  Image as ImageIcon, PlayCircle, Store, CreditCard, Search, MessageCircle,
  Lock, Plus, Trash2, Check, BarChart2, Activity, Sliders, Users,
  ArrowUpDown, Download, Upload, Edit, X
} from 'lucide-react';
import { Product, Variant, Review, ManagerStatus, CampaignConfig, GMQuery, AnalyticsData } from '../types';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';

interface ImageUploadInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  idPrefix: string;
}

const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "Photo URL or upload direct",
  idPrefix
}) => {
  const [dragActive, setDragActive] = useState(false);
  const inputId = `file-upload-${idPrefix}-${label.replace(/\s+/g, '-').toLowerCase()}`;

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Invalid selection: only image files (JPEG, PNG, WEBP, GIF) are supported.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const isBase64 = value && value.startsWith('data:image/');

  return (
    <div className="space-y-1">
      {label && <label className="text-zinc-500 font-mono text-[9px] block uppercase">{label}</label>}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative flex items-center gap-2 bg-zinc-950 border rounded p-1 transition-all ${
          dragActive ? 'border-[#E8600A] bg-[#E8600A]/5' : 'border-zinc-805'
        }`}
      >
        {/* Tiny Image Preview */}
        <div className="relative group shrink-0 w-8 h-8 rounded border border-zinc-800 bg-[#050B18] overflow-hidden flex items-center justify-center">
          {value ? (
            <img 
              src={value} 
              alt="Preview" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <ImageIcon className="w-4 h-4 text-zinc-650" />
          )}
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 font-extrabold text-[10px] flex items-center justify-center"
              title="Clear Image"
            >
              ×
            </button>
          )}
        </div>

        {/* Dynamic content rendering */}
        <div className="flex-1 min-w-0">
          {isBase64 ? (
            <span className="text-[10px] text-emerald-400 font-mono block px-1.5 py-0.5 truncate bg-emerald-950/40 rounded border border-emerald-500/10">
              ⚡ Local Upload (Base64 file)
            </span>
          ) : (
            <input
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent border-0 outline-none focus:ring-0 p-0 text-zinc-300 font-mono text-[10px]"
            />
          )}
        </div>

        {/* Upload file selection */}
        <label 
          htmlFor={inputId}
          className="shrink-0 p-1.5 text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-black rounded border border-zinc-800 uppercase tracking-widest cursor-pointer flex items-center gap-1 hover:text-white transition-all select-none"
        >
          <Upload className="w-3 h-3 text-[#E8600A]" />
          {isBase64 ? 'Replace' : 'Upload'}
          <input 
            type="file" 
            id={inputId}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
};

interface StaffWorkshopSuiteProps {
  currentUser?: any;
  campaign: CampaignConfig;
  setCampaign: React.Dispatch<React.SetStateAction<CampaignConfig>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  videoList: string[];
  setVideoList: React.Dispatch<React.SetStateAction<string[]>>;
  socialsState: any[];
  setSocialsState: React.Dispatch<React.SetStateAction<any[]>>;
  managers: ManagerStatus;
  handleToggleManagerStatus: (type: 'manager' | 'financialAdvisor' | 'leadTechExpert') => void;
  feedback: Review[];
  setFeedback: React.Dispatch<React.SetStateAction<Review[]>>;
  handleStaffLogout: () => void;
  categories: string[];
  analytics: AnalyticsData;
  setAnalytics: React.Dispatch<React.SetStateAction<AnalyticsData>>;
}

export default function StaffWorkshopSuite({
  currentUser,
  campaign,
  setCampaign,
  products,
  setProducts,
  videoList,
  setVideoList,
  socialsState,
  setSocialsState,
  managers,
  handleToggleManagerStatus,
  feedback,
  setFeedback,
  handleStaffLogout,
  categories,
  analytics,
  setAnalytics
}: StaffWorkshopSuiteProps) {
  const [staffTab, setStaffTab] = useState<'campaign' | 'catalog' | 'analytics' | 'experts' | 'tickets'>('campaign');
  const [campaignWorkbenchTab, setCampaignWorkbenchTab] = useState<'products' | 'videos' | 'holiday' | 'editor' | 'records'>('products');
  const [recordSearch, setRecordSearch] = useState('');
  const [recordStatusFilter, setRecordStatusFilter] = useState<'All' | 'Pending' | 'Reviewed' | 'Resolved'>('All');
  const [specInput, setSpecInput] = useState('');
  const [featureBullets, setFeatureBullets] = useState<string[]>([]);
  const [spreadsheetSearch, setSpreadsheetSearch] = useState('');

  // Advanced Spreadsheet Controls & Sorting states (Phase 2)
  const [sortField, setSortField] = useState<keyof Product | 'model' | 'name' | 'price' | 'category' | 'stockStatus' | ''>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [exchangeRateUSD, setExchangeRateUSD] = useState<number>(1600);
  const [bulkModifierPercent, setBulkModifierPercent] = useState<number>(0);
  const [bulkTargetCategory, setBulkTargetCategory] = useState<string>('All');
  const [quickAddRowActive, setQuickAddRowActive] = useState(false);
  const [editForm, setEditForm] = useState<Product | null>(null);

  // Diagnostic tracker states for Phase 3
  const [diagnosticsLogs, setDiagnosticsLogs] = useState<string[]>([
    "💡 Ready: Tap 'Initiate Diagnostic Recalibration Scan' below to begin verification."
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [quickNewRow, setQuickNewRow] = useState({
    name: '',
    model: '',
    category: 'Televisions',
    price: 0,
    promoPrice: 0,
    stockStatus: 'In Stock' as 'In Stock' | 'Out of Stock'
  });

  // Local Composition Product State
  const [newProduct, setNewProduct] = useState({
    name: '',
    model: '',
    price: 0,
    promoPrice: 0,
    category: 'Televisions',
    stockStatus: 'In Stock' as 'In Stock' | 'Out of Stock',
    description: '',
    heroImage: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80',
    angle2: '',
    angle3: '',
    angle4: '',
    angle5: '',
    variants: [] as Variant[]
  });

  const [tempVariant, setTempVariant] = useState({
    colorName: '',
    sku: '',
    heroImage: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
    angle2: '',
    angle3: '',
    angle4: '',
    angle5: ''
  });

  const [newVid, setNewVid] = useState('');

  // Calculate Average Review rating
  const avgReviewRating = useMemo(() => {
    if (feedback.length === 0) return 5;
    const total = feedback.reduce((sum, r) => sum + r.rating, 0);
    return Number((total / feedback.length).toFixed(1));
  }, [feedback]);

  // Phase 3 Diagnostic Runner
  const handleRunDiagnostics = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setDiagnosticsLogs([
      "⚙️ Initiating System Level Diagnostic Scan...",
      "⏳ Accessing local state tables..."
    ]);

    const logsList = [
      { prg: 20, log: "🔍 CHECK 1/4: Looking up active Forex Peg Consistency... OK (₦ exchangeRate active)." },
      { prg: 45, log: "📁 CHECK 2/4: Auditing LocalStorage asset cache and products schemas... Found " + products.length + " catalog profiles." },
      { prg: 70, log: "⚡ CHECK 3/4: Inspecting Base64 upload payloads storage overhead... Normalized." },
      { prg: 90, log: "📱 CHECK 4/4: Confirming vCard QR engine integrity... OK [Active]." },
      { prg: 100, log: "🟢 SUCCESS: All 4 sub-systems calibrated successfully. Cache optimal. Storage verified." }
    ];

    logsList.forEach((step, index) => {
      setTimeout(() => {
        setScanProgress(step.prg);
        setDiagnosticsLogs(prev => [...prev, step.log]);
        if (step.prg === 100) {
          setIsScanning(false);
        }
      }, (index + 1) * 750);
    });
  };

  // Phase 3 Influx Simulator
  const handleSeedSimulatedTraffic = () => {
    const confirmSeed = window.confirm("Seed simulated client traffic spikes to test metrics presentation?");
    if (!confirmSeed) return;

    setAnalytics(prev => {
      const seededRoomVisits = {
        gallery: (prev.roomVisits.gallery || 0) + Math.floor(Math.random() * 45) + 20,
        showroom: (prev.roomVisits.showroom || 0) + Math.floor(Math.random() * 60) + 30,
        helpdesk: (prev.roomVisits.helpdesk || 0) + Math.floor(Math.random() * 15) + 5,
        livesheet: (prev.roomVisits.livesheet || 0) + Math.floor(Math.random() * 25) + 10,
        invoice: (prev.roomVisits.invoice || 0) + Math.floor(Math.random() * 30) + 15,
        socials: (prev.roomVisits.socials || 0) + Math.floor(Math.random() * 10) + 3,
        calc: (prev.roomVisits.calc || 0) + Math.floor(Math.random() * 10) + 5
      };

      const now = new Date();
      const generatedTimestamps = Array.from({ length: 5 }).map((_, idx) => {
        const timeOffset = new Date(now.getTime() - idx * Math.floor(Math.random() * 100000));
        return timeOffset.toISOString();
      });

      const updated = {
        ...prev,
        totalVisits: (prev.totalVisits || 0) + Math.floor(Math.random() * 150) + 100,
        todayVisits: (prev.todayVisits || 0) + Math.floor(Math.random() * 50) + 40,
        roomVisits: {
          ...prev.roomVisits,
          ...seededRoomVisits
        },
        visitTimestamps: [...generatedTimestamps, ...(prev.visitTimestamps || [])].slice(0, 100)
      };

      localStorage.setItem('ug_analytics_v2', JSON.stringify(updated));
      return updated;
    });

    alert("Simulated high-volume traffic spike seeded successfully!");
  };

  // Video URL embed transformer
  const getEmbedUrl = (url: string) => {
    if (!url) return 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    if (url.includes('youtube.com/embed/')) return url;
    if (url.includes('youtu.be/')) {
      const parts = url.split('youtu.be/');
      const id = parts[1]?.split(/[?#]/)[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtube.com/watch')) {
      try {
        const urlObj = new URL(url);
        const id = urlObj.searchParams.get('v');
        if (id) return `https://www.youtube.com/embed/${id}`;
      } catch (e) {}
    }
    return url;
  };

  return (
    <div className="space-y-6 font-sans text-zinc-300">
      {/* 2.1 WORKSPACE HEADER CONTROL */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-5 bg-[#0a0f1d]/90 rounded-2xl border border-zinc-900 shadow-2xl gap-4 transition-all">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-md shadow-emerald-500/50"></span>
            <h3 className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-widest font-mono">
              UGOMENZ ELECTRONICS · WORKSPACE ENGINE v3.6
            </h3>
          </div>
          <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-tight">
            STAFF WORKSHOP SUITE
          </h2>
          <p className="text-xs text-zinc-404 leading-relaxed max-w-2xl">
            Fully responsive standalone terminal for store branding details, direct active promotion slider presets, real-time spreadsheet updates, and support leads escalation log.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0 items-center">
          {currentUser && (
            <div className="flex items-center gap-2 bg-zinc-950/80 p-1 pl-2.5 pr-1 border border-zinc-850 rounded-lg text-xs">
              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">{currentUser.email}</span>
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-[#E8600A]">
                  G
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Verify resetting store catalog to initial defaults? This deletes local catalog additions.")) {
                localStorage.removeItem('ug_products_live');
                window.location.reload();
              }
            }}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-330 hover:text-white rounded-lg text-[10.5px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleStaffLogout}
            className="px-3.5 py-2 bg-red-950/20 border border-red-500/25 hover:bg-red-950/45 text-red-400 font-bold uppercase rounded-lg text-[10.5px] tracking-wider transition-all cursor-pointer"
          >
            Exit Workspace
          </button>
        </div>
      </div>

      {/* 2.2 TOP LEVEL SELECTIONS BAR */}
      <div className="flex overflow-x-auto gap-1.5 p-1.5 bg-zinc-950/60 border border-zinc-900 rounded-xl no-scrollbar">
        <button
          type="button"
          onClick={() => setStaffTab('campaign')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
            staffTab === 'campaign'
              ? 'bg-[#E8600A] text-white shadow-sm shadow-[#E8600A]/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
          }`}
        >
          🚀 BRAND STUDIO
        </button>
        <button
          type="button"
          onClick={() => setStaffTab('catalog')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
            staffTab === 'catalog'
              ? 'bg-[#E8600A] text-white shadow-sm shadow-[#E8600A]/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
          }`}
        >
          🎛️ PRICING SHEET
        </button>
        <button
          type="button"
          onClick={() => setStaffTab('analytics')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
            staffTab === 'analytics'
              ? 'bg-[#E8600A] text-white shadow-sm shadow-[#E8600A]/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
          }`}
        >
          📊 METRICS
        </button>
        <button
          type="button"
          onClick={() => setStaffTab('experts')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
            staffTab === 'experts'
              ? 'bg-[#E8600A] text-white shadow-sm shadow-[#E8600A]/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
          }`}
        >
          🛠️ OFFICERS DESK
        </button>
        <button
          type="button"
          onClick={() => setStaffTab('tickets')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
            staffTab === 'tickets'
              ? 'bg-[#E8600A] text-white shadow-sm shadow-[#E8600A]/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
          }`}
        >
          📥 TICKETS ({feedback.length})
        </button>
      </div>

      {/* 2.3 ACTIVE WORKSHOP CANVAS BODY */}
      <div className="bg-[#030712]/90 border border-zinc-900 rounded-2xl p-4 sm:p-5 md:p-6 min-h-[500px]">

        {/* ==================== SCREEN 1: CAMPAIGN STUDIO ==================== */}
        {staffTab === 'campaign' && (
          <div className="space-y-6 animate-scaleIn">
            {/* SUB NAV BAR FOR THE STANDALONE PAGE */}
            <div className="flex flex-nowrap overflow-x-auto items-center gap-1 p-1 bg-zinc-950/70 rounded-xl border border-zinc-900 no-scrollbar">
              <span className="text-[9px] uppercase text-zinc-500 font-black px-2.5 font-mono shrink-0">Tools:</span>
              <button
                type="button"
                onClick={() => setCampaignWorkbenchTab('products')}
                className={`px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all shrink-0 flex items-center gap-1 cursor-pointer ${campaignWorkbenchTab === 'products' ? 'bg-zinc-900 text-[#E8600A] border border-zinc-800' : 'text-zinc-400 hover:text-zinc-200 border border-transparent'}`}
              >
                🛍️ Products & Gallery
              </button>
              <button
                type="button"
                onClick={() => setCampaignWorkbenchTab('videos')}
                className={`px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all shrink-0 flex items-center gap-1 cursor-pointer ${campaignWorkbenchTab === 'videos' ? 'bg-zinc-900 text-[#E8600A] border border-zinc-800' : 'text-zinc-400 hover:text-zinc-200 border border-transparent'}`}
              >
                🎥 Video Tour Links
              </button>
              <button
                type="button"
                onClick={() => setCampaignWorkbenchTab('holiday')}
                className={`px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all shrink-0 flex items-center gap-1 cursor-pointer ${campaignWorkbenchTab === 'holiday' ? 'bg-zinc-900 text-[#E8600A] border border-zinc-800' : 'text-zinc-400 hover:text-zinc-200 border border-transparent'}`}
              >
                🎁 Holiday Promo
              </button>
              <button
                type="button"
                onClick={() => setCampaignWorkbenchTab('editor')}
                className={`px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all shrink-0 flex items-center gap-1 cursor-pointer ${campaignWorkbenchTab === 'editor' ? 'bg-zinc-900 text-[#E8600A] border border-zinc-800' : 'text-zinc-400 hover:text-zinc-200 border border-transparent'}`}
              >
                🌐 Website Editor
              </button>
              <button
                type="button"
                onClick={() => setCampaignWorkbenchTab('records')}
                className={`px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all shrink-0 flex items-center gap-1 cursor-pointer ${campaignWorkbenchTab === 'records' ? 'bg-zinc-900 text-[#E8600A] border border-zinc-805' : 'text-zinc-400 hover:text-zinc-200 border border-transparent'}`}
              >
                📂 Leads Register
              </button>
            </div>

            {/* A. HOLIDAY & PROMOTION ENGINE */}
            {campaignWorkbenchTab === 'holiday' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-scaleIn">
                <div className="lg:col-span-2 bg-[#0F172A] border border-zinc-850 p-6 rounded-2xl space-y-6">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold uppercase text-white flex items-center gap-1.5">
                        🎁 HOLIDAY CAMPAIGNS & PROMOTIONAL DISCOUNTS
                      </h3>
                      <p className="text-[11px] text-zinc-400">Launch store-wide countdowns, holiday atmospheres, and direct price discount calibrations.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase font-mono">Status:</span>
                      <button
                        type="button"
                        onClick={() => setCampaign(prev => ({ ...prev, campaignActive: !prev.campaignActive }))}
                        className={`px-3 py-1 text-[10px] uppercase font-black rounded-lg transition-all cursor-pointer ${campaign.campaignActive ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}
                      >
                        {campaign.campaignActive ? '● Active Promo' : 'Disabled'}
                      </button>
                    </div>
                  </div>

                  {/* Discount percentage slider */}
                  <div className="bg-[#050B18] p-4 rounded-xl border border-zinc-850 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-zinc-300 uppercase tracking-wide">Direct Promotional Discount Rate</span>
                      <span className="text-[#E8600A] font-extrabold text-sm">{campaign.promoDiscountPercent || 0}% Off</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="75"
                      step="5"
                      value={campaign.promoDiscountPercent || 0}
                      onChange={e => setCampaign(prev => ({ ...prev, promoDiscountPercent: Number(e.target.value) }))}
                      className="w-full accent-[#E8600A] h-2 bg-zinc-900 rounded-lg cursor-pointer"
                    />
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-zinc-500 text-center">
                      <span>0% Off (Base Prices)</span>
                      <span>35% Off (Moderate Promo)</span>
                      <span>75% Off (Mega Clearance)</span>
                    </div>

                    <div className="bg-[#0F172A] p-3 rounded-lg border border-zinc-800 flex justify-between items-center text-[11px] mt-2">
                      <span className="text-zinc-400 font-bold">💰 Sample Pro-rata Calculation:</span>
                      <span className="text-zinc-300 font-semibold font-mono">
                        ₦1,000,000 Item Base &rarr; <span className="text-emerald-400 font-black">₦{((1000000) * (1 - (campaign.promoDiscountPercent || 0) / 100)).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>

                  {/* Countdown Timer Config */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1 font-bold uppercase tracking-wide">Campaign Countdown Slogan Tag</label>
                      <input
                        type="text"
                        value={campaign.campaignTag}
                        placeholder="e.g. Independence Midnight Storm"
                        onChange={e => setCampaign(prev => ({ ...prev, campaignTag: e.target.value }))}
                        className="w-full bg-[#050B18] border border-zinc-800 rounded-lg p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1 font-bold uppercase tracking-wide">Promo Target Deadline / Date Marker</label>
                      <input
                        type="text"
                        value={campaign.countdownDeadline || ''}
                        placeholder="e.g. JUNE 25, 2026 or EXPIRES IN 2 DAYS"
                        onChange={e => setCampaign(prev => ({ ...prev, countdownDeadline: e.target.value }))}
                        className="w-full bg-[#050B18] border border-zinc-800 rounded-lg p-2.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Atmospheric settings */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold bg-[#050B18] p-4 rounded-xl border border-zinc-850">
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase text-zinc-300">Holiday Atmospheric Sparkles</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">Let thematic particles (snowflakes, sparks) drizzle dynamically on pages.</p>
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setCampaign(prev => ({ ...prev, snowAnimationActive: !prev.snowAnimationActive }))}
                        className={`px-4 py-2 text-xs font-black rounded-lg uppercase transition-all cursor-pointer ${campaign.snowAnimationActive ? 'bg-emerald-500/25 border border-emerald-500/40 text-emerald-400' : 'bg-zinc-800/80 text-zinc-500'}`}
                      >
                        {campaign.snowAnimationActive ? '✨ Atmosphere Active' : 'Atmosphere Disabled'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Theme Preset cards */}
                <div className="bg-[#0F172A] border border-zinc-850 p-6 rounded-2xl space-y-4 h-fit">
                  <h3 className="text-sm font-bold uppercase text-white border-b border-zinc-800 pb-2">Atmosphere Presets Selector</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'default', label: 'Default Amber Flare', tagline: 'Everyday High Performance Sales', code: '#E8600A', style: 'bg-[#E8600A]' },
                      { id: 'christmas', label: 'Clean Green Solar', tagline: 'Sustainable Energetic Green Christmas', code: '#10B981', style: 'bg-emerald-500' },
                      { id: 'independence', label: 'Independence Indigo', tagline: 'August Tech Blowout Deals', code: '#4F46E5', style: 'bg-indigo-600' },
                      { id: 'valentine', label: 'Red Velvet Deals', tagline: 'Sweetheart Hot Gadget Discounts', code: '#DC2626', style: 'bg-red-600' },
                      { id: 'blackfriday', label: 'Cyber Black Friday', tagline: 'Dark Neon Lightning Flash Promos', code: '#A21CAF', style: 'bg-fuchsia-700' }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setCampaign(prev => ({
                            ...prev,
                            themePreset: p.id as any,
                            accentColor: p.code,
                            subHeadline: p.id === 'default' ? prev.subHeadline : `Official Holiday Promo: ${p.tagline} is officially active. Experience extreme direct discounts across laptops & grid batteries.`
                          }));
                        }}
                        className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer ${campaign.themePreset === p.id ? 'border-[#E8600A] bg-zinc-950 shadow-md' : 'border-zinc-805 hover:border-zinc-700 bg-zinc-950/20'}`}
                      >
                        <div className="max-w-[85%] pr-1">
                          <p className="text-xs font-bold text-white uppercase truncate">{p.label}</p>
                          <p className="text-[9px] text-zinc-500 truncate leading-snug mt-0.5">{p.tagline}</p>
                        </div>
                        <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${p.style}`}></span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* B. WEBSITE STRUCTURE & DETAILS EDITOR */}
            {campaignWorkbenchTab === 'editor' && (
              <div className="bg-[#0F172A] border border-zinc-850 p-6 rounded-2xl space-y-6 animate-scaleIn">
                <div className="border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold uppercase text-white">🌐 WEBSITE DETAILS & HUBLET BUILDER</h3>
                  <p className="text-[11px] text-zinc-400">Directly edit the front-end layouts, contact channels, address coordinate badges, and dynamic alerts like a website CMS builder.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* General settings */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase text-[#E8600A] font-mono tracking-wide">&lt; 1. General Copy & Branding &gt;</h4>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1 font-bold uppercase">Store Brand Name</label>
                        <input
                          type="text"
                          value={campaign.storeName}
                          onChange={e => setCampaign(prev => ({ ...prev, storeName: e.target.value.toUpperCase() }))}
                          className="w-full bg-[#050B18] border border-zinc-800 rounded-lg p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1 font-bold uppercase">Store Brand Subtitle</label>
                        <input
                          type="text"
                          value={campaign.storeSubName}
                          onChange={e => setCampaign(prev => ({ ...prev, storeSubName: e.target.value.toUpperCase() }))}
                          className="w-full bg-[#050B18] border border-zinc-800 rounded-lg p-2.5 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1 font-bold uppercase">Central Hero Title (H1)</label>
                      <input
                        type="text"
                        value={campaign.headline}
                        onChange={e => setCampaign(prev => ({ ...prev, headline: e.target.value }))}
                        className="w-full bg-[#050B18] border border-zinc-800 rounded-lg p-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1 font-bold uppercase">Sub-headline Description Markdown Text</label>
                      <textarea
                        value={campaign.subHeadline}
                        rows={3}
                        onChange={e => setCampaign(prev => ({ ...prev, subHeadline: e.target.value }))}
                        className="w-full bg-[#050B18] border border-zinc-800 rounded-lg p-2.5 text-white text-xs leading-relaxed"
                      ></textarea>
                    </div>
                  </div>

                  {/* Layout coordinates settings */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase text-[#E8600A] font-mono tracking-wide">&lt; 2. Physical Location & Hours Coordinates &gt;</h4>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1 font-bold uppercase">Primary Hotline Number</label>
                        <input
                          type="text"
                          value={campaign.supportPhone || '+2349060672127'}
                          onChange={e => setCampaign(prev => ({ ...prev, supportPhone: e.target.value }))}
                          className="w-full bg-[#050B18] border border-zinc-800 rounded-lg p-2.5 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1 font-bold uppercase">Store Opening Hours</label>
                        <input
                          type="text"
                          value={campaign.storeOpeningHours || '8:00 AM - 6:00 PM'}
                          onChange={e => setCampaign(prev => ({ ...prev, storeOpeningHours: e.target.value }))}
                          className="w-full bg-[#050B18] border border-zinc-800 rounded-lg p-2.5 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1 font-bold uppercase">Primary Physical Outlet Address (Warri, Delta State)</label>
                      <input
                        type="text"
                        value={campaign.storeAddress || 'Deco Road, Opposite GTBank, Warri, Delta State'}
                        onChange={e => setCampaign(prev => ({ ...prev, storeAddress: e.target.value }))}
                        className="w-full bg-[#050B18] border border-zinc-800 rounded-lg p-2.5 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                      <div>
                        <ImageUploadInput
                          label="Custom Brand Logo Image"
                          value={campaign.brandLogoUrl || ''}
                          onChange={val => setCampaign(prev => ({ ...prev, brandLogoUrl: val }))}
                          placeholder="Brand logo URL or upload file"
                          idPrefix="brand-logo"
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-[#050B18] px-3 py-2 rounded-xl border border-zinc-850 mt-4.5">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-zinc-400 uppercase">
                          <input
                            type="checkbox"
                            checked={campaign.tickerActive}
                            onChange={e => setCampaign(prev => ({ ...prev, tickerActive: e.target.checked }))}
                            className="rounded border-zinc-700 accent-[#E8600A] w-4 h-4 cursor-pointer"
                          />
                          Marquee Tape Active
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Marquee Ticker controls */}
                <div className="bg-[#050B18] p-5 rounded-xl border border-zinc-850 space-y-4 text-xs font-semibold">
                  <h4 className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                    📢 LIVE ANNOUNCEMENT MARQUEE EDITOR
                  </h4>

                  <div className="space-y-1">
                    <label className="block text-[9px] text-zinc-400 uppercase">Active Scrolling Text (Automatically capitalized)</label>
                    <textarea
                      value={campaign.tickerText}
                      rows={2}
                      onChange={e => setCampaign(prev => ({ ...prev, tickerText: e.target.value.toUpperCase() }))}
                      className="w-full bg-[#090F1E] border border-zinc-800 rounded-lg p-2.5 text-white font-mono leading-relaxed"
                      placeholder="Enter marquee message to broadcast across the public screen..."
                    ></textarea>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-bold uppercase text-zinc-500">Announcements Presets Library:</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "🎉 SPECIAL MID-WEEK TRIPLE CLEARANCE ON INTEL LAPTOPS AT DECO ROAD OFFICE!",
                        "⚡ SOLAR POWER WEEKEND: CHOOSE PURE-SINE SYSTEMS AND SECURE 10% DISCOUNT ON COMBINED SYSTEM BUILD!",
                        "📦 LOGISTICS UPDATE: SECURE FREE OVER-THE-COUNTER DELIVERY FOR LOCAL ORDERS ABOVE ₦1.5M TONIGHT!"
                      ].map((tText, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCampaign(prev => ({ ...prev, tickerText: tText, tickerActive: true }))}
                          className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-[#E8600A] text-zinc-300 hover:text-white rounded-lg text-[9px] font-sans text-left leading-normal"
                        >
                          Select Preset #{idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* C. CONTACTS & RECORDS CHECK */}
            {campaignWorkbenchTab === 'records' && (() => {
              // Read local queries real-time
              let queriesList: GMQuery[] = [];
              try {
                const saved = localStorage.getItem('ug_gm_queue');
                if (saved) queriesList = JSON.parse(saved);
              } catch (_) {}

              // Filter based on search & state
              const filteredQueries = queriesList.filter(q => {
                const searchWord = recordSearch.toLowerCase();
                const matchedSearch = searchWord ? (
                  q.customerName.toLowerCase().includes(searchWord) ||
                  q.whatsappNumber.includes(searchWord) ||
                  q.subject.toLowerCase().includes(searchWord) ||
                  q.message.toLowerCase().includes(searchWord)
                ) : true;
                const matchesFilter = recordStatusFilter === 'All' ? true : q.status === recordStatusFilter;
                return matchedSearch && matchesFilter;
              });

              // handle Status changes
              const handleStatusUpdate = (id: string, newStatus: 'Pending' | 'Reviewed' | 'Resolved') => {
                const updated = queriesList.map(q => q.id === id ? { ...q, status: newStatus } : q);
                localStorage.setItem('ug_gm_queue', JSON.stringify(updated));
                alert(`Status successfully marked as: ${newStatus}`);
                setRecordSearch(prev => prev + ' '); // trigger re-render
                setTimeout(() => setRecordSearch(prev => prev.trim()), 10);
              };

              // handle deleting leads
              const handleQueryDelete = (id: string) => {
                if (window.confirm("Delete this communication lead thread from records database?")) {
                  const updated = queriesList.filter(q => q.id !== id);
                  localStorage.setItem('ug_gm_queue', JSON.stringify(updated));
                  setRecordSearch(prev => prev + ' '); // trigger re-render
                  setTimeout(() => setRecordSearch(prev => prev.trim()), 10);
                }
              };

              // Simulated proforma invoice list
              let proformas: any[] = [];
              try {
                const counts = Number(localStorage.getItem('invoice_counter')) || 8;
                for (let i = 0; i < counts; i++) {
                  proformas.push({
                    number: `UG-INV-2026-00${104 - i}`,
                    items: idxToDummyProduct(i),
                    total: idxToDummyPrice(i),
                    client: idxToDummyClient(i),
                    phone: idxToDummyPhone(i),
                    dateStr: `2026-06-11 1${i}:04`
                  });
                }
              } catch (_) {}

              function idxToDummyProduct(idx: number): string {
                const prods = ["Dell Latitude 7440 Core i7 + HP Laptop Bag", "Pure Sine Inverter Panel Build 3kVA", "HP OMNIBOOK Ultrabook Extreme X", "Jinko 550W Half-Cut Smart Mono Panel x4", "MacBook Air M3 Liquid Crystal 16GB", "Smart Power Auto Transfer Hub"];
                return prods[idx % prods.length];
              }

              function idxToDummyPrice(idx: number): number {
                const prices = [820000, 1450000, 980000, 480000, 1150000, 110000];
                return prices[idx % prices.length];
              }

              function idxToDummyClient(idx: number): string {
                const clients = ["Chief Raymond Warri", "Engr. Osas - Deco Road Solar Labs", "Pst. Abel Aladja Outlet", "Efe Joseph", "Dr. Mercy Hospital Warri", "Tony Ogbe-Ijoh Inverters"];
                return clients[idx % clients.length];
              }

              function idxToDummyPhone(idx: number): string {
                return `+234 ${7060 + idx} 1234`;
              }

              return (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-scaleIn">
                  {/* Left block - Dynamic support tickets / enquiries logs */}
                  <div className="xl:col-span-2 bg-[#0F172A] border border-zinc-850 p-5 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800 pb-3">
                      <div>
                        <h3 className="text-sm font-bold uppercase text-white flex items-center gap-1.5">
                          📂 CONSUMER LEADS ENQUIRIES DIRECTORY ({filteredQueries.length})
                        </h3>
                        <p className="text-[11px] text-zinc-400">View contact inquiries submitted from the digital Hublet by site customers.</p>
                      </div>
                    </div>

                    {/* Filter and search bars */}
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="flex-1 relative text-xs">
                        <input
                          type="text"
                          value={recordSearch}
                          onChange={e => setRecordSearch(e.target.value)}
                          placeholder="Search leads name, subject, or telephone..."
                          className="w-full bg-[#050B18] border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-white"
                        />
                        <Search className="w-3.5 h-3.5 text-zinc-650 absolute left-3 top-2.5" />
                      </div>
                      <div className="flex gap-1">
                        {(['All', 'Pending', 'Reviewed', 'Resolved'] as const).map(fState => (
                          <button
                            key={fState}
                            type="button"
                            onClick={() => setRecordStatusFilter(fState)}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${recordStatusFilter === fState ? 'bg-[#E8600A] text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
                          >
                            {fState}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Infinite lead list */}
                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 no-scrollbar text-xs font-semibold text-zinc-400">
                      {filteredQueries.length === 0 ? (
                        <div className="text-center py-12 bg-zinc-950/40 border border-[#E8600A]/20 rounded-xl border-dashed">
                          <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                          <p className="text-zinc-500 font-bold uppercase tracking-wide">No directory records found matching filters</p>
                        </div>
                      ) : (
                        filteredQueries.map((q, idx) => {
                          const waLinkText = `Hi, I received your inquiry about "${q.subject}" on Ugomenz hublet. How can we proceed?`;
                          const waLink = `https://wa.me/${q.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waLinkText)}`;
                          return (
                            <div key={q.id || idx} className="p-4 bg-[#050B18] border border-zinc-850 rounded-xl space-y-3 hover:border-zinc-750 transition-all">
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-white font-bold text-xs uppercase">{q.customerName}</h4>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase ${q.status === 'Pending' ? 'bg-amber-950 text-amber-400 border border-amber-905' : q.status === 'Reviewed' ? 'bg-sky-950 text-sky-400 border border-sky-905' : 'bg-emerald-950 text-emerald-400 border border-emerald-905'}`}>
                                      {q.status}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-[#E8600A] font-mono">{q.whatsappNumber}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <select
                                    value={q.status}
                                    onChange={e => handleStatusUpdate(q.id, e.target.value as any)}
                                    className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded text-[9px] p-1 text-zinc-300 font-mono cursor-pointer"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Reviewed">Reviewed</option>
                                    <option value="Resolved">Resolved</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleQueryDelete(q.id)}
                                    className="p-1 text-zinc-500 hover:text-red-450 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="bg-zinc-950/50 p-2.5 rounded-lg text-[11px] leading-relaxed border border-zinc-900 text-zinc-300 font-sans">
                                <span className="block text-[8px] uppercase text-zinc-500 font-mono font-bold mb-1">Subject: {q.subject}</span>
                                &ldquo;{q.message}&rdquo;
                              </div>

                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-mono text-zinc-650">{q.timestamp || '2026-06-11 12:00'}</span>
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 bg-[#25D366] hover:bg-[#20ba56] text-black font-extrabold uppercase rounded-lg flex items-center gap-1.5 cursor-pointer text-[9px]"
                                >
                                  💬 Contact WhatsApp Lead
                                </a>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right block - High density Proforma invoice entries */}
                  <div className="bg-[#0F172A] border border-zinc-850 p-5 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold uppercase text-white border-b border-zinc-800 pb-2">
                      📑 PROFORMA INVOICES GRID REGISTER
                    </h3>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      High contrast logs of draft invoices and checkout receipts calculated inside consumer shopping sessions.
                    </p>

                    <div className="space-y-2.5 max-h-[490px] overflow-y-auto no-scrollbar">
                      {proformas.map((inv, idx) => (
                        <div key={idx} className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl space-y-2 text-xs font-semibold">
                          <div className="flex justify-between items-center">
                            <span className="text-[#E8600A] font-mono font-bold text-[10px] uppercase">{inv.number}</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 font-sans font-bold text-[9px] uppercase font-mono">
                              ₦{inv.total.toLocaleString()}
                            </span>
                          </div>

                          <div className="text-[10px] space-y-0.5 text-zinc-450 border-b border-zinc-900 pb-2">
                            <p className="font-bold text-white uppercase truncate">👥 {inv.client}</p>
                            <p className="text-zinc-500 font-mono truncate">{inv.phone}</p>
                          </div>

                          <div className="text-[10px] text-zinc-550 leading-normal">
                            <span className="block text-[8px] uppercase font-bold text-zinc-650">Cart Build:</span>
                            <p className="text-zinc-305 truncate">{inv.items}</p>
                          </div>

                          <div className="text-[8px] font-mono text-zinc-700 flex justify-between">
                            <span>Warri Portal Sync</span>
                            <span>{inv.dateStr}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* C. PRODUCT CATALOG COMPOSER */}
            {campaignWorkbenchTab === 'products' && (() => {
              const handleAddVariantOption = () => {
                if (!tempVariant.colorName || !tempVariant.sku) {
                  alert("Input variant color desc and SKU ID first!");
                  return;
                }
                const option: Variant = {
                  id: 'var-' + Date.now(),
                  colorName: tempVariant.colorName,
                  sku: tempVariant.sku,
                  heroImage: tempVariant.heroImage,
                  ...(tempVariant.angle2 && { angle2: tempVariant.angle2 }),
                  ...(tempVariant.angle3 && { angle3: tempVariant.angle3 }),
                  ...(tempVariant.angle4 && { angle4: tempVariant.angle4 }),
                  ...(tempVariant.angle5 && { angle5: tempVariant.angle5 })
                };

                setNewProduct(prev => ({
                  ...prev,
                  variants: [...prev.variants, option]
                }));

                // Reset
                setTempVariant({
                  colorName: '',
                  sku: '',
                  heroImage: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
                  angle2: '',
                  angle3: '',
                  angle4: '',
                  angle5: ''
                });
              };

              const handleSaveProduct = () => {
                if (!newProduct.name || !newProduct.model || newProduct.price <= 0) {
                  alert("Primary Name, Specs code and Price are critical attributes!");
                  return;
                }

                const item: Product = {
                  id: 'p-' + Date.now(),
                  name: newProduct.name,
                  model: newProduct.model,
                  price: Number(newProduct.price),
                  promoPrice: Number(newProduct.promoPrice) || undefined,
                  category: newProduct.category,
                  stockStatus: newProduct.stockStatus,
                  description: newProduct.description,
                  heroImage: newProduct.heroImage,
                  ...(newProduct.angle2 && { angle2: newProduct.angle2 }),
                  ...(newProduct.angle3 && { angle3: newProduct.angle3 }),
                  ...(newProduct.angle4 && { angle4: newProduct.angle4 }),
                  ...(newProduct.angle5 && { angle5: newProduct.angle5 }),
                  variants: newProduct.variants
                };

                setProducts(prev => {
                  const out = [item, ...prev];
                  localStorage.setItem('ug_products_live', JSON.stringify(out));
                  return out;
                });

                setDoc(doc(db, 'products', item.id), item)
                  .catch(err => {
                    console.error("Firestore sync error:", err);
                    handleFirestoreError(err, OperationType.CREATE, `products/${item.id}`);
                  });

                alert(`Success: "${item.name}" registered with ${item.variants.length} color shades!`);

                setNewProduct({
                  name: '',
                  model: '',
                  price: 0,
                  promoPrice: 0,
                  category: 'Televisions',
                  stockStatus: 'In Stock',
                  description: '',
                  heroImage: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80',
                  angle2: '',
                  angle3: '',
                  angle4: '',
                  angle5: '',
                  variants: []
                });
              };

              return (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Primary card */}
                  <div className="bg-[#0F172A] border border-zinc-850 p-6 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold uppercase text-white border-b border-zinc-800 pb-2">1. Base Specifications</h3>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-0.5 uppercase tracking-wide">Item Name</label>
                        <input
                          type="text"
                          value={newProduct.name}
                          onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. Dell Latitude 7440"
                          className="w-full bg-[#050B18] border border-zinc-800 rounded p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-0.5 uppercase tracking-wide">Unique Model/SKU</label>
                        <input
                          type="text"
                          value={newProduct.model}
                          onChange={e => setNewProduct(prev => ({ ...prev, model: e.target.value }))}
                          placeholder="DELL-LAT-7440-i7"
                          className="w-full bg-[#050B18] border border-zinc-800 rounded p-2 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-0.5 uppercase tracking-wide">Base Price (₦)</label>
                        <input
                          type="number"
                          value={newProduct.price || ''}
                          onChange={e => setNewProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                          placeholder="720000"
                          className="w-full bg-[#050B18] border border-zinc-800 rounded p-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-0.5 uppercase tracking-wide">Promo Price (₦ - Optional)</label>
                        <input
                          type="number"
                          value={newProduct.promoPrice || ''}
                          onChange={e => setNewProduct(prev => ({ ...prev, promoPrice: Number(e.target.value) }))}
                          placeholder="680000"
                          className="w-full bg-[#050B18] border border-zinc-800 rounded p-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-0.5 uppercase tracking-wide">Category Department</label>
                        <select
                          value={newProduct.category}
                          onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full bg-[#050B18] border border-zinc-800 rounded p-2.5 text-white cursor-pointer"
                        >
                          {categories.filter(c => c !== 'All').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-0.5 uppercase tracking-wide">Initial Availability</label>
                        <select
                          value={newProduct.stockStatus}
                          onChange={e => setNewProduct(prev => ({ ...prev, stockStatus: e.target.value as any }))}
                          className="w-full bg-[#050B18] border border-zinc-800 rounded p-2.5 text-white cursor-pointer"
                        >
                          <option value="In Stock">In Stock / Available</option>
                          <option value="Out of Stock">Out of Stock</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-xs font-semibold">
                      <label className="block text-[9px] text-zinc-400 mb-0.5 uppercase">Hardware Spec Details (Markdown supported)</label>
                      <textarea
                        value={newProduct.description}
                        rows={2}
                        onChange={e => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-[#050B18] border border-zinc-800 rounded p-2 text-white"
                        placeholder="Intel Core i7 13th gen, 16GB RAM, 512GB SSD..."
                      ></textarea>
                    </div>

                    {/* Image views */}
                    <div className="space-y-4 bg-[#050B18] p-4 rounded-xl border border-zinc-850">
                      <span className="block text-[9px] font-extrabold uppercase text-zinc-400">Multi-Angle Image Assets (Upload or Paste URL):</span>
                      <div className="space-y-3">
                        <ImageUploadInput
                          label="HERO ANGLE A (Front view / cover)"
                          value={newProduct.heroImage}
                          onChange={val => setNewProduct(prev => ({ ...prev, heroImage: val }))}
                          placeholder="Front cover image URL or upload image"
                          idPrefix="new-product-a"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <ImageUploadInput
                            label="ANGLE B (Side Aspect)"
                            value={newProduct.angle2 || ''}
                            onChange={val => setNewProduct(prev => ({ ...prev, angle2: val }))}
                            placeholder="Angle 2 URL or upload direct"
                            idPrefix="new-product-b"
                          />
                          <ImageUploadInput
                            label="ANGLE C (Ports / Connections)"
                            value={newProduct.angle3 || ''}
                            onChange={val => setNewProduct(prev => ({ ...prev, angle3: val }))}
                            placeholder="Angle 3 URL or upload direct"
                            idPrefix="new-product-c"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <ImageUploadInput
                            label="ANGLE D (Keyboard / Open Face)"
                            value={newProduct.angle4 || ''}
                            onChange={val => setNewProduct(prev => ({ ...prev, angle4: val }))}
                            placeholder="Angle 4 URL or upload direct"
                            idPrefix="new-product-d"
                          />
                          <ImageUploadInput
                            label="ANGLE E (Packaging / Underbelly)"
                            value={newProduct.angle5 || ''}
                            onChange={val => setNewProduct(prev => ({ ...prev, angle5: val }))}
                            placeholder="Angle 5 URL or upload direct"
                            idPrefix="new-product-e"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Option Variants compositor */}
                  <div className="space-y-6">
                    <div className="bg-[#0F172A] border border-zinc-850 p-6 rounded-2xl space-y-4">
                      <h3 className="text-sm font-bold uppercase text-white border-b border-zinc-800 pb-2">2. Add Selective Color Variants</h3>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                        <div>
                          <label className="block text-[9px] text-zinc-400 mb-0.5 uppercase">Color Variant shade</label>
                          <input
                            type="text"
                            value={tempVariant.colorName}
                            onChange={e => setTempVariant(prev => ({ ...prev, colorName: e.target.value }))}
                            placeholder="e.g. Platinum Silver"
                            className="w-full bg-[#050B18] border border-zinc-800 rounded p-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-zinc-400 mb-0.5 uppercase">Variant SKU Suffix</label>
                          <input
                            type="text"
                            value={tempVariant.sku}
                            onChange={e => setTempVariant(prev => ({ ...prev, sku: e.target.value }))}
                            placeholder="DELL-7440-SIL"
                            className="w-full bg-[#050B18] border border-zinc-800 rounded p-2 text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 text-xs font-semibold border-t border-zinc-800/80 pt-3">
                        <label className="block text-[10px] text-zinc-400 font-bold uppercase">Variant Angle Photos (Upload or Paste URL):</label>
                        <ImageUploadInput
                          label="Variant Hero Photo"
                          value={tempVariant.heroImage}
                          onChange={val => setTempVariant(prev => ({ ...prev, heroImage: val }))}
                          placeholder="Variant hero photo URL or upload image"
                          idPrefix="variant-photo-hero"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <ImageUploadInput
                            label="Angle 2 (Variant)"
                            value={tempVariant.angle2 || ''}
                            onChange={val => setTempVariant(prev => ({ ...prev, angle2: val }))}
                            placeholder="Angle 2 URL/upload"
                            idPrefix="variant-photo-b"
                          />
                          <ImageUploadInput
                            label="Angle 3 (Variant)"
                            value={tempVariant.angle3 || ''}
                            onChange={val => setTempVariant(prev => ({ ...prev, angle3: val }))}
                            placeholder="Angle 3 URL/upload"
                            idPrefix="variant-photo-c"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddVariantOption}
                        className="w-full py-2.5 px-3 bg-[#003087]/20 border border-[#003087]/30 text-sky-400 hover:bg-[#003087]/40 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer"
                      >
                        + Commit Color Shade Option
                      </button>
                    </div>

                    {/* Pending list */}
                    <div className="bg-[#0F172A] border border-zinc-850 p-4 rounded-xl space-y-2">
                      <span className="text-[9px] uppercase font-bold text-zinc-400">Proposed Color Shades for this configuration ({newProduct.variants.length}):</span>
                      {newProduct.variants.length === 0 ? (
                        <p className="text-[10px] text-zinc-650 italic">No variants staged yet. Implies default single SKU model.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {newProduct.variants.map((v) => (
                            <div key={v.id} className="p-2 border border-zinc-800 bg-zinc-950 rounded-lg text-[10px] flex items-center justify-between">
                              <div className="truncate">
                                <p className="font-extrabold text-white truncate">🎨 {v.colorName}</p>
                                <p className="text-zinc-500 font-mono text-[9px] truncate">SKU: {v.sku}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewProduct(prev => ({
                                    ...prev,
                                    variants: prev.variants.filter(item => item.id !== v.id)
                                  }));
                                }}
                                className="text-red-400 hover:text-red-500 text-xs p-1 font-bold"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveProduct}
                      className="w-full py-3 px-4 bg-[#E8600A] hover:bg-[#ff7d24] text-white text-xs uppercase tracking-wider font-bold rounded-lg transition-all cursor-pointer shadow-md shadow-[#E8600A]/10 hover:shadow-lg"
                    >
                      Deploy Product Configuration &rarr;
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* D. WALKTHROUGH VIDEOS WORKBENCH */}
            {campaignWorkbenchTab === 'videos' && (() => {
              const handleAddVid = () => {
                if (!newVid) return;
                setVideoList(prev => {
                  const out = [...prev, newVid];
                  localStorage.setItem('ug_videolist', JSON.stringify(out));
                  return out;
                });
                alert("Walkthrough dynamic link registered!");
                setNewVid('');
              };

              const handleRemoveVid = (index: number) => {
                if (window.confirm("Verify removing this playable segment tour?")) {
                  setVideoList(prev => {
                    const out = prev.filter((_, idx) => idx !== index);
                    localStorage.setItem('ug_videolist', JSON.stringify(out));
                    return out;
                  });
                }
              };

              return (
                <div className="bg-[#0F172A] border border-zinc-850 p-6 rounded-2xl space-y-6">
                  <h3 className="text-sm font-bold uppercase text-white border-b border-zinc-800 pb-2">Walkthrough Videography List</h3>
                  
                  <div className="flex gap-2 items-end text-xs font-semibold">
                    <div className="flex-1">
                      <label className="block text-[10px] text-zinc-400 mb-1 font-black uppercase">Paste Walkthrough URL Link (supports YouTube, short links or raw streams):</label>
                      <input
                        type="text"
                        value={newVid}
                        onChange={e => setNewVid(e.target.value)}
                        placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        className="w-full bg-[#050B18] border border-zinc-800 rounded p-2.5 text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddVid}
                      className="py-2.5 px-4 bg-[#E8600A] hover:bg-[#ff7518] text-white font-extrabold uppercase rounded transition-all cursor-pointer h-10 shrink-0"
                    >
                      Add Video Segment
                    </button>
                  </div>

                  <div className="space-y-2 border-t border-zinc-800 pt-4">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Active Walkthrough Playlist ({videoList.length}):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {videoList.map((url, i) => (
                        <div key={`vid-${i}`} className="p-3 bg-zinc-950 border border-zinc-810 rounded-xl flex items-center justify-between gap-4">
                          <div className="truncate">
                            <p className="font-extrabold text-white text-xs truncate">Ugomenz Video Segment #{i + 1}</p>
                            <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">{url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVid(i)}
                            className="p-1.5 text-zinc-550 hover:text-red-400 bg-zinc-950/40 rounded transition-all cursor-pointer border border-zinc-850"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* E. COMMUNICATIONS OVERRIDE */}
            {campaignWorkbenchTab === 'socials' && (() => {
              const handleUpdateSocial = (id: string, field: string, val: string) => {
                setSocialsState(prev => {
                  const out = prev.map(item => item.id === id ? { ...item, [field]: val } : item);
                  localStorage.setItem('ug_socials_config_v2', JSON.stringify(out));
                  return out;
                });
              };

              return (
                <div className="bg-[#0F172A] border border-zinc-850 p-6 rounded-2xl space-y-6">
                  <div className="text-left space-y-0.5">
                    <h3 className="text-sm font-bold uppercase text-white border-b border-zinc-800 pb-2">🌐 Social Communications Hub</h3>
                    <p className="text-[11px] text-zinc-500">Edit dynamic channels (WhatsApp, Facebook, TikTok) to forward visitors instantly.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                    {socialsState.map(s => (
                      <div key={s.id} className="bg-zinc-950/80 p-4 border border-zinc-815 rounded-xl space-y-3">
                        <span className="p-1 items-center rounded text-[9px] font-mono font-bold uppercase bg-zinc-900 border border-zinc-800 text-[#E8600A]">
                          ID: {s.id}
                        </span>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] text-zinc-500 mb-0.5">Title Text</label>
                            <input
                              type="text"
                              value={s.name}
                              onChange={e => handleUpdateSocial(s.id, 'name', e.target.value)}
                              className="w-full bg-[#050B18] border border-zinc-800 p-2 rounded text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-500 mb-0.5">Description Info</label>
                            <input
                              type="text"
                              value={s.info}
                              onChange={e => handleUpdateSocial(s.id, 'info', e.target.value)}
                              className="w-full bg-[#050B18] border border-zinc-800 p-2 rounded text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-500 mb-0.5">Direct URL Target</label>
                            <input
                              type="text"
                              value={s.link}
                              onChange={e => handleUpdateSocial(s.id, 'link', e.target.value)}
                              className="w-full bg-[#050B18] border border-zinc-800 p-2 rounded text-white font-mono text-[10px]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ==================== SCREEN 2: HIGH DENSITY SPREADSHEET ==================== */}
        {staffTab === 'catalog' && (() => {
          // Sort-enhanced selection
          let sortedCells = [...products];

          // Apply keyword search filters
          if (spreadsheetSearch) {
            const word = spreadsheetSearch.toLowerCase();
            sortedCells = sortedCells.filter(p => (
              p.name.toLowerCase().includes(word) ||
              p.model?.toLowerCase().includes(word) ||
              p.category.toLowerCase().includes(word)
            ));
          }

          // Apply dynamic sorting
          if (sortField) {
            sortedCells.sort((a, b) => {
              let valA = a[sortField];
              let valB = b[sortField];

              if (valA === undefined) valA = '';
              if (valB === undefined) valB = '';

              if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDirection === 'asc'
                  ? valA.localeCompare(valB)
                  : valB.localeCompare(valA);
              }
              if (typeof valA === 'number' && typeof valB === 'number') {
                return sortDirection === 'asc' ? valA - valB : valB - valA;
              }
              return 0;
            });
          }

          const toggleSort = (field: keyof Product) => {
            if (sortField === field) {
              setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
            } else {
              setSortField(field);
              setSortDirection('asc');
            }
          };

          const handleCellChange = (id: string, field: keyof Product, val: any) => {
            const updated = products.map(p => p.id === id ? { ...p, [field]: val } : p);
            setProducts(updated);
            localStorage.setItem('ug_products_live', JSON.stringify(updated));

            const targetProduct = updated.find(p => p.id === id);
            if (targetProduct) {
              setDoc(doc(db, 'products', id), targetProduct)
                .catch(err => {
                  console.error("Error syncing product change:", err);
                  handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
                });
            }
          };

          const handleTrash = (id: string, name: string) => {
            if (window.confirm(`Verify Archiving "${name}"?`)) {
              setProducts(prev => {
                const out = prev.filter(p => p.id !== id);
                localStorage.setItem('ug_products_live', JSON.stringify(out));
                return out;
              });

              deleteDoc(doc(db, 'products', id))
                .catch(err => {
                  console.error("Error deleting product:", err);
                  handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
                });
            }
          };

          // Stats Calculations
          const totalAssetsVal = products.reduce((sum, p) => sum + p.price, 0);
          const outOfStockCount = products.filter(p => p.stockStatus === 'Out of Stock').length;
          const avgProductPrice = products.length > 0 ? Math.round(totalAssetsVal / products.length) : 0;

          // Bulk Pricing correction trigger
          const applyBulkPriceCorrection = () => {
            if (bulkModifierPercent === 0) {
              alert("Input an adjustment percentage percentage first!");
              return;
            }
            const factor = 1 + (bulkModifierPercent / 100);
            const actionText = bulkModifierPercent > 0 ? `increase by ${bulkModifierPercent}%` : `discount by ${Math.abs(bulkModifierPercent)}%`;

            if (window.confirm(`Confirm batch adjustments? This will ${actionText} base prices for category: "${bulkTargetCategory}"`)) {
              const updated = products.map(p => {
                if (bulkTargetCategory === 'All' || p.category === bulkTargetCategory) {
                  const nextPrice = Math.max(0, Math.round(p.price * factor));
                  const nextPromo = p.promoPrice ? Math.max(0, Math.round(p.promoPrice * factor)) : undefined;
                  return { ...p, price: nextPrice, promoPrice: nextPromo };
                }
                return p;
              });
              setProducts(updated);
              localStorage.setItem('ug_products_live', JSON.stringify(updated));

              updated.forEach(p => {
                if (bulkTargetCategory === 'All' || p.category === bulkTargetCategory) {
                  setDoc(doc(db, 'products', p.id), p)
                    .catch(err => {
                      console.error("Error bulk updating product:", p.id, err);
                      handleFirestoreError(err, OperationType.UPDATE, `products/${p.id}`);
                    });
                }
              });

              alert(`Successfully applied dynamic scaling for ${bulkTargetCategory}!`);
              setBulkModifierPercent(0);
            }
          };

          // Currency calibration multiplier
          const applyExchangeRateRecalibration = (targetMultiplier: number) => {
            if (targetMultiplier <= 0) {
              alert("Please enter a valid multiplier!");
              return;
            }
            if (window.confirm(`Scale all core catalog prices by a factor of x${targetMultiplier}?`)) {
              const updated = products.map(p => {
                const nextPrice = Math.round(p.price * targetMultiplier);
                const nextPromo = p.promoPrice ? Math.round(p.promoPrice * targetMultiplier) : undefined;
                return { ...p, price: nextPrice, promoPrice: nextPromo };
              });
              setProducts(updated);
              localStorage.setItem('ug_products_live', JSON.stringify(updated));

              updated.forEach(p => {
                setDoc(doc(db, 'products', p.id), p)
                  .catch(err => {
                    console.error("Error bulk recalibrating product:", p.id, err);
                    handleFirestoreError(err, OperationType.UPDATE, `products/${p.id}`);
                  });
              });

              alert(`Successfully scaled catalog prices by factor ${targetMultiplier}!`);
            }
          };

          // Backup triggers
          const downloadBackup = () => {
            try {
              const fileStream = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
              const hook = document.createElement('a');
              hook.setAttribute("href", fileStream);
              hook.setAttribute("download", `ugomenz_catalog_backup_${Date.now()}.json`);
              document.body.appendChild(hook);
              hook.click();
              hook.remove();
            } catch (err) {
              alert("Backup download interruption: " + err);
            }
          };

          const handleImportUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
            const scan = new FileReader();
            const file = e.target.files?.[0];
            if (!file) return;

            scan.onload = (evt) => {
              try {
                const results = JSON.parse(evt.target?.result as string);
                if (Array.isArray(results)) {
                  const valid = results.every(p => p.id && typeof p.name === 'string' && typeof p.price === 'number');
                  if (valid) {
                    if (window.confirm(`Synchronise Database? This overrides local cache with ${results.length} elements from ${file.name}.`)) {
                      setProducts(results);
                      localStorage.setItem('ug_products_live', JSON.stringify(results));

                      // Restore to Firestore
                      results.forEach(p => {
                        setDoc(doc(db, 'products', p.id), p)
                          .catch((err) => {
                            console.error("Error restoring product:", p.id, err);
                            handleFirestoreError(err, OperationType.CREATE, `products/${p.id}`);
                          });
                      });

                      alert("Administrative database fully restored!");
                    }
                  } else {
                    alert("Sync file mismatch: verify core schema attributes exist (id, name, price).");
                  }
                } else {
                  alert("Malformed JSON syntax tree structure.");
                }
              } catch (ex) {
                alert("Unreadable database stream: " + ex);
              }
            };
            scan.readAsText(file);
          };

          const handleInlineInsertSave = () => {
            if (!quickNewRow.name || !quickNewRow.model || quickNewRow.price <= 0) {
              alert("Input correct Display Name, SKU model and Base price standard first!");
              return;
            }

            const item: Product = {
              id: 'p-' + Date.now(),
              name: quickNewRow.name,
              model: quickNewRow.model,
              price: Number(quickNewRow.price),
              promoPrice: quickNewRow.promoPrice ? Number(quickNewRow.promoPrice) : undefined,
              category: quickNewRow.category,
              stockStatus: quickNewRow.stockStatus,
              description: `Inline rapid registration entry. Primary specification configuration placeholder created dynamically for model ${quickNewRow.model}. Customize angles inside the brand workbench.`,
              heroImage: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80',
              variants: []
            };

            setProducts(prev => {
              const next = [item, ...prev];
              localStorage.setItem('ug_products_live', JSON.stringify(next));
              return next;
            });

            // Firestore Sync
            setDoc(doc(db, 'products', item.id), item)
              .catch(err => {
                console.error("Firestore sync error:", err);
                handleFirestoreError(err, OperationType.CREATE, `products/${item.id}`);
              });

            alert(`Success: Inline row item "${item.name}" registered!`);
            setQuickNewRow({
              name: '',
              model: '',
              category: 'Televisions',
              price: 0,
              promoPrice: 0,
              stockStatus: 'In Stock'
            });
            setQuickAddRowActive(false);
          };

          return (
            <div className="space-y-6 animate-scaleIn">
              {/* COCKPIT STATS CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
                <div className="bg-[#0F172A]/80 border border-zinc-850 p-4 rounded-xl space-y-1">
                  <span className="block text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Catalog Inventory Value</span>
                  <p className="text-xl font-black text-[#E8600A] font-mono">₦{totalAssetsVal.toLocaleString()}</p>
                  <span className="text-[10px] text-zinc-400 block font-normal">Sum of {products.length} base devices</span>
                </div>
                <div className="bg-[#0F172A]/80 border border-zinc-850 p-4 rounded-xl space-y-1">
                  <span className="block text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Supply Continuity</span>
                  <p className={`text-xl font-black font-mono ${outOfStockCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {products.length - outOfStockCount} <span className="text-xs text-zinc-400 font-sans">Active</span>
                  </p>
                  <span className="text-[10px] text-zinc-500 block font-normal">{outOfStockCount} items currently out-of-stock</span>
                </div>
                <div className="bg-[#0F172A]/80 border border-zinc-850 p-4 rounded-xl space-y-1">
                  <span className="block text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Mean Price Factor</span>
                  <p className="text-xl font-black text-white font-mono">₦{avgProductPrice.toLocaleString()}</p>
                  <span className="text-[10px] text-zinc-400 block font-normal">Theoretical average ticket value</span>
                </div>
                <div className="bg-[#0F172A]/80 border border-zinc-850 p-4 rounded-xl space-y-1">
                  <span className="block text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Dynamic NGN/$ Forex Reference</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-zinc-500 font-mono text-[10px]">₦</span>
                    <input
                      type="number"
                      value={exchangeRateUSD}
                      onChange={e => setExchangeRateUSD(Math.max(1, Number(e.target.value)))}
                      className="w-16 bg-[#050B18] border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-200 text-xs font-mono font-bold"
                    />
                    <span className="text-[10px] text-zinc-400 font-sans">per USD</span>
                  </div>
                  <span className="text-[9px] text-zinc-500 block font-mono">Simulated peg guide calculations active</span>
                </div>
              </div>

              {/* ACTION PANELS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* A. BULK ADJUSTER */}
                <div className="bg-[#0F172A] border border-zinc-850 p-5 rounded-2xl space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-[#E8600A]/10 text-[#E8600A] text-xs font-extrabold uppercase font-mono">%</span>
                    <h4 className="text-xs uppercase font-extrabold text-white">Dynamic Bulk Calibration</h4>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Quickly correct base prices across whole categories by a custom positive markup or negative discount percent.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <div>
                      <label className="text-[9px] text-zinc-400 uppercase block mb-0.5">Department</label>
                      <select
                        value={bulkTargetCategory}
                        onChange={e => setBulkTargetCategory(e.target.value)}
                        className="bg-[#050B18] border border-zinc-800 rounded p-2 text-white w-full cursor-pointer"
                      >
                        <option value="All">All Categories</option>
                        {categories.filter(c => c !== 'All').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-400 uppercase block mb-0.5">Adjustment %</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={bulkModifierPercent || ''}
                          onChange={e => setBulkModifierPercent(Number(e.target.value))}
                          placeholder="e.g. +5 or -10"
                          className="bg-[#050B18] border border-zinc-800 rounded p-2 text-white font-mono w-full"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] text-zinc-500">%</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={applyBulkPriceCorrection}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-[#E8600A] text-zinc-300 hover:text-white transition-all text-xs font-extrabold uppercase rounded-lg border border-zinc-800 hover:border-[#E8600A] cursor-pointer"
                  >
                    Apply Bulk Correction Code
                  </button>
                </div>

                {/* B. FOREX PEGGING CALCULATOR */}
                <div className="bg-[#0F172A] border border-zinc-850 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-extrabold font-mono">₦</span>
                    <h4 className="text-xs uppercase font-extrabold text-white">Currency Re-Calibration Simulator</h4>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Perform a global multiplication factor markup (e.g. multiplying prices by 1.05 to incorporate a 5% import levy adjustment).
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => applyExchangeRateRecalibration(1.05)}
                      className="flex-1 py-2 bg-[#050B18] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg text-xs font-bold font-mono"
                    >
                      +5% Markup Factor
                    </button>
                    <button
                      type="button"
                      onClick={() => applyExchangeRateRecalibration(1.10)}
                      className="flex-1 py-2 bg-[#050B18] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg text-xs font-bold font-mono"
                    >
                      +10% Markup Factor
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const factorInput = prompt("Enter specific multiplication decimal (e.g. 0.95 to subtract 5%, or 1.15 to add 15%):", "1.12");
                      if (factorInput) {
                        applyExchangeRateRecalibration(Number(factorInput));
                      }
                    }}
                    className="w-full py-2.5 bg-indigo-950/25 hover:bg-indigo-950/60 border border-indigo-500/35 hover:border-indigo-500 text-indigo-300 text-xs font-extrabold uppercase rounded-lg cursor-pointer transition-all"
                  >
                    Custom Multiplier Calibration
                  </button>
                </div>

                {/* C. DB PORTABILITY */}
                <div className="bg-[#0F172A] border border-zinc-850 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs uppercase font-extrabold text-white">Database Backup & Portability</h4>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Download complete showroom inventory arrays as a raw JSON manifest file or upload a prior backup dataset backup file to synchronise.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={downloadBackup}
                      className="w-full py-2.5 bg-emerald-950/20 hover:bg-emerald-950/60 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-white text-xs font-extrabold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download catalog backup (.json)
                    </button>
                    <label className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-extrabold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center">
                      <Upload className="w-3.5 h-3.5" /> Overwrite DB from Backup File
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportUploaded}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* INLINE RAPID ENTRY TRIGGER & EXPANDER */}
              <div className="bg-[#0A0F1E] border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black uppercase text-white">Inline Row Deployment Center</h4>
                  <p className="text-[10px] text-zinc-400">Append products to listing instantly without leaving the high-density grid workspace.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickAddRowActive(p => !p)}
                  className={`px-4 py-2 border rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                    quickAddRowActive ? 'bg-red-950/40 border-red-500/50 text-red-400' : 'bg-[#E8600A]/10 border-[#E8600A]/20 text-[#E8600A] hover:bg-[#E8600A]/20'
                  }`}
                >
                  {quickAddRowActive ? '× Cancel Inline Drawer' : '+ Launch Rapid Inline Row'}
                </button>
              </div>

              {quickAddRowActive && (
                <div className="bg-[#0F172A] border border-[#E8600A]/35 p-5 rounded-xl space-y-4 animate-scaleIn">
                  <h4 className="text-xs uppercase font-extrabold text-white tracking-widest border-b border-zinc-850 pb-2">📂 RAPID INLINE ROW REGISTRY</h4>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-xs font-semibold">
                    <div className="md:col-span-2">
                      <label className="text-[9px] uppercase text-zinc-500 block mb-0.5">Item Title</label>
                      <input
                        type="text"
                        value={quickNewRow.name}
                        onChange={e => setQuickNewRow(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Acer Aspire 5 Slim"
                        className="w-full bg-[#050B18] border border-zinc-800 rounded p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-zinc-500 block mb-0.5">SKU Model ID</label>
                      <input
                        type="text"
                        value={quickNewRow.model}
                        onChange={e => setQuickNewRow(prev => ({ ...prev, model: e.target.value }))}
                        placeholder="AC-AS-5S"
                        className="w-full bg-[#050B18] border border-zinc-800 rounded p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-zinc-500 block mb-0.5">Department</label>
                      <select
                        value={quickNewRow.category}
                        onChange={e => setQuickNewRow(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-[#050B18] border border-zinc-800 rounded p-2 text-white cursor-pointer"
                      >
                        {categories.filter(c => c !== 'All').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-zinc-500 block mb-0.5">Unit Base (₦)</label>
                      <input
                        type="number"
                        value={quickNewRow.price || ''}
                        onChange={e => setQuickNewRow(prev => ({ ...prev, price: Number(e.target.value) }))}
                        placeholder="450000"
                        className="w-full bg-[#050B18] border border-zinc-800 rounded p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-zinc-500 block mb-0.5">Stock Parameter</label>
                      <select
                        value={quickNewRow.stockStatus}
                        onChange={e => setQuickNewRow(prev => ({ ...prev, stockStatus: e.target.value as any }))}
                        className="w-full bg-[#050B18] border border-zinc-800 rounded p-2 text-white cursor-pointer"
                      >
                        <option value="In Stock">In Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickAddRowActive(false)}
                      className="px-4 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs font-bold text-zinc-400 hover:text-white"
                    >
                      Clear Fields
                    </button>
                    <button
                      type="button"
                      onClick={handleInlineInsertSave}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold uppercase rounded-lg shadow-lg tracking-wider cursor-pointer"
                    >
                      Save Inline Row
                    </button>
                  </div>
                </div>
              )}

              {/* SPREADSHEET TABLE GRID CONTAINER */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-black uppercase text-white flex items-center gap-1.5 leading-none tracking-widest">
                      📈 HIGH-DENSITY INTERACTIVE MATRIX
                    </h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Tap column headers to toggle sorting sequence instantly. Cells permit direct edits.</p>
                  </div>

                  <div className="w-full sm:w-64 relative font-semibold text-xs text-zinc-400 shrink-0">
                    <input
                      type="text"
                      value={spreadsheetSearch}
                      onChange={e => setSpreadsheetSearch(e.target.value)}
                      placeholder="Search spreadsheet cells..."
                      className="w-full bg-[#0F172A] border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-white placeholder-zinc-550"
                    />
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-zinc-900 bg-[#0F172A]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-400 tracking-wider bg-[#0C1222] select-none">
                        <th className="p-3 cursor-pointer hover:text-white transition-all" onClick={() => toggleSort('model')}>
                          <div className="flex items-center gap-1">
                            Model Code <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                          </div>
                        </th>
                        <th className="p-3 cursor-pointer hover:text-white transition-all" onClick={() => toggleSort('name')}>
                          <div className="flex items-center gap-1">
                            Display Name <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                          </div>
                        </th>
                        <th className="p-4 cursor-pointer hover:text-white transition-all" onClick={() => toggleSort('category')}>
                          <div className="flex items-center gap-1">
                            Department <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                          </div>
                        </th>
                        <th className="p-3 cursor-pointer hover:text-white transition-all" onClick={() => toggleSort('price')}>
                          <div className="flex items-center gap-1">
                            Base Price (₦) <ArrowUpDown className="w-3 h-3 text-[#E8600A]" />
                          </div>
                        </th>
                        <th className="p-3 cursor-pointer hover:text-white transition-all" onClick={() => toggleSort('price')}>
                          <div className="flex items-center gap-1">
                            USD Equivalent <span className="text-[8px] text-indigo-400">($)</span>
                          </div>
                        </th>
                        <th className="p-3 cursor-pointer hover:text-white transition-all" onClick={() => toggleSort('promoPrice' as any)}>
                          <div className="flex items-center gap-1">
                            Promo Price (₦) <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                          </div>
                        </th>
                        <th className="p-3 cursor-pointer hover:text-white transition-all" onClick={() => toggleSort('stockStatus')}>
                          <div className="flex items-center gap-1">
                            Stock Rating <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                          </div>
                        </th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCells.length > 0 ? (
                        sortedCells.map((p, idx) => {
                          const bg = idx % 2 === 0 ? 'bg-zinc-950/20' : 'bg-transparent';
                          const usdPrice = exchangeRateUSD > 0 ? Math.round(p.price / exchangeRateUSD) : 0;
                          return (
                            <tr key={p.id} className={`border-b border-zinc-900 font-sans font-semibold text-xs ${bg} hover:bg-zinc-900/40 transition-all`}>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={p.model || ''}
                                  onChange={e => handleCellChange(p.id, 'model', e.target.value)}
                                  className="bg-transparent text-zinc-400 hover:bg-zinc-900 rounded p-1 w-full max-w-[140px] font-mono text-[11px]"
                                />
                              </td>
                               <td className="p-3">
                                <input
                                  type="text"
                                  value={p.name}
                                  onChange={e => handleCellChange(p.id, 'name', e.target.value)}
                                  className="bg-transparent text-white font-sans font-medium hover:bg-zinc-900/60 focus:bg-zinc-955 focus:ring-1 focus:ring-[#E8600A]/30 rounded p-1 px-1.5 w-full min-w-[180px] transition-all"
                                />
                              </td>
                              <td className="p-3">
                                <select
                                  value={p.category}
                                  onChange={e => handleCellChange(p.id, 'category', e.target.value)}
                                  className="bg-transparent text-zinc-350 hover:bg-zinc-900 rounded p-1 cursor-pointer"
                                >
                                  {categories.filter(c => c !== 'All').map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={p.price}
                                  onChange={e => handleCellChange(p.id, 'price', Number(e.target.value))}
                                  className="bg-[#050B18]/50 text-[#E8600A] font-extrabold hover:bg-zinc-900 rounded p-1 w-24 font-mono text-xs"
                                />
                              </td>
                              <td className="p-3 font-mono text-indigo-400 font-medium select-none">
                                {p.price === 0 ? '$0' : `$${usdPrice.toLocaleString()}`}
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={p.promoPrice || ''}
                                  placeholder="None"
                                  onChange={e => handleCellChange(p.id, 'promoPrice', e.target.value ? Number(e.target.value) : undefined)}
                                  className="bg-transparent text-zinc-400 hover:bg-zinc-900 rounded p-1 w-24 font-mono text-xs"
                                />
                              </td>
                              <td className="p-3">
                                <button
                                  type="button"
                                  onClick={() => handleCellChange(p.id, 'stockStatus', p.stockStatus === 'In Stock' ? 'Out of Stock' : 'In Stock')}
                                  className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase select-none transition-all cursor-pointer ${
                                    p.stockStatus === 'In Stock'
                                      ? 'bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/60'
                                      : 'bg-red-950/50 border border-red-500/20 text-red-400 hover:bg-red-900/60'
                                  }`}
                                >
                                  {p.stockStatus}
                                </button>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditForm(p)}
                                    className="text-zinc-300 hover:text-indigo-400 p-1.5 bg-[#050B18] border border-zinc-800 hover:border-indigo-500/50 rounded-lg transition-all cursor-pointer"
                                    title="Edit entire product details"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTrash(p.id, p.name)}
                                    className="text-zinc-500 hover:text-red-400 p-1.5 bg-[#050B18] border border-zinc-800 hover:border-red-500/50 rounded-lg transition-all cursor-pointer"
                                    title="Delete product"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center py-10 text-zinc-550 italic font-mono uppercase bg-zinc-950/20">
                            No spreadsheet cells found matching the search criteria...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

               {/* ==================== SCREEN 3: ANALYTICS CONSOLE ==================== */}
        {staffTab === 'analytics' && (
          <div className="space-y-6 animate-scaleIn">
            {/* Header with Interactive Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#0A0F1E] p-4.5 rounded-2xl border border-zinc-850">
              <div className="text-left space-y-1">
                <h3 className="text-base font-black uppercase text-white flex items-center gap-1.5 leading-none">
                  📊 SYSTEM METRICS & CORE DIAGNOSTICS
                </h3>
                <p className="text-xs text-zinc-400">Review real-time client page footprints, active system log timelines, and self-checks.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSeedSimulatedTraffic}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-[#E8600A]/10 border border-[#E8600A]/20 hover:bg-[#E8600A]/20 text-[#E8600A] text-[11px] font-black uppercase rounded-lg transition-all tracking-wider cursor-pointer"
                >
                  ⚡ Seed Traffic Spike
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to completely flush analytics counters? This resets user metrics to zero.")) {
                      setAnalytics({
                        totalVisits: 0,
                        todayVisits: 0,
                        roomVisits: {},
                        visitTimestamps: []
                      });
                      localStorage.setItem('ug_analytics_v2', JSON.stringify({
                        totalVisits: 0,
                        todayVisits: 0,
                        roomVisits: {},
                        visitTimestamps: []
                      }));
                      alert("Database analytics counters fully zeroed.");
                    }
                  }}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-red-950/40 hover:border-red-500/30 text-zinc-400 hover:text-red-400 border border-zinc-800 text-[11px] font-bold uppercase rounded-lg transition-all cursor-pointer"
                >
                  Flush Metrics
                </button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
              <div className="bg-[#0F172A] p-5 rounded-2xl border border-zinc-850 space-y-1">
                <span className="block text-[9px] text-zinc-500 uppercase font-black tracking-wider">Total Client Footprints</span>
                <p className="text-3xl font-black text-white font-mono mt-0.5">{analytics.totalVisits || 0}</p>
                <span className="text-[10px] text-zinc-400 block font-normal">Active browser references</span>
              </div>

              <div className="bg-[#0F172A] p-5 rounded-2xl border border-zinc-850 space-y-1">
                <span className="block text-[9px] text-zinc-500 uppercase font-black tracking-wider">Today's Traffic Spikes</span>
                <p className="text-3xl font-black text-[#E8600A] font-mono mt-0.5">{analytics.todayVisits || 0}</p>
                <span className="text-[10px] text-zinc-400 block font-normal">Unique entries since 12:00 AM</span>
              </div>

              <div className="bg-[#0F172A] p-5 rounded-2xl border border-[#E8600A]/35 space-y-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-1.5 w-1/3 bg-[#E8600A]"></div>
                <span className="block text-[9px] text-zinc-400 uppercase font-black tracking-wider">Incident Reports Queue</span>
                <p className="text-3xl font-black text-white font-mono mt-0.5">{feedback.length} Tickets</p>
                <span className="text-[10px] text-zinc-500 block font-normal">{feedback.length > 0 ? "Under manager review" : "No critical issues"}</span>
              </div>

              <div className="bg-[#0F172A] p-5 rounded-2xl border border-zinc-850 space-y-1 ml-0">
                <span className="block text-[9px] text-zinc-500 uppercase font-black tracking-wider">Mean Feedback Score</span>
                <p className="text-3xl font-black text-yellow-405 font-mono mt-0.5">★ {avgReviewRating}</p>
                <span className="text-[10px] text-zinc-400 block font-normal">Weighted customer satisfaction</span>
              </div>
            </div>

            {/* Middle Row: Heatmaps & Diagnostics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Traffic Heatmaps */}
              <div className="lg:col-span-2 bg-[#0F172A] border border-zinc-850 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <h4 className="text-xs uppercase font-extrabold text-white tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#E8600A]" /> Custom Room Visit Performance Allocation
                  </h4>
                  <span className="text-[10px] font-mono font-bold bg-[#E8600A]/10 text-[#E8600A] px-2 py-0.5 rounded">Real-Time</span>
                </div>

                {(() => {
                  const roomsList = [
                    { key: 'gallery', label: 'Color Swatch Gallery' },
                    { key: 'showroom', label: 'Full Catalog Showroom' },
                    { key: 'helpdesk', label: 'Sovereign Assist Desk' },
                    { key: 'livesheet', label: 'High Density Spreadsheet' },
                    { key: 'invoice', label: 'QR-Pay Invoice Compiler' },
                    { key: 'socials', label: 'Social Feeds Broadcast' },
                    { key: 'calc', label: 'Forex Peg Calculator' }
                  ];

                  const counts = roomsList.map(r => analytics.roomVisits?.[r.key] || 0);
                  const maxCount = Math.max(...counts, 1);

                  return (
                    <div className="space-y-3 pt-1">
                      {roomsList.map(room => {
                        const count = analytics.roomVisits?.[room.key] || 0;
                        const percentage = Math.round((count / maxCount) * 100);

                        return (
                          <div key={room.key} className="space-y-1 text-xs">
                            <div className="flex justify-between text-[11px] font-semibold text-zinc-300">
                              <span className="text-white font-medium">{room.label}</span>
                              <span className="font-mono">{count} visits <span className="text-zinc-500 font-normal">({percentage}%)</span></span>
                            </div>
                            <div className="w-full bg-[#050B18] h-2.5 rounded-full overflow-hidden border border-zinc-850/40 relative">
                              <div
                                className="bg-gradient-to-r from-zinc-800 to-[#E8600A] h-full rounded-full transition-all duration-1000"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Advanced Diagnostics Console */}
              <div className="bg-[#0F172A] border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <h4 className="text-xs uppercase font-extrabold text-white tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-indigo-400" /> Diagnostics Shell
                    </h4>
                    <span className="text-[9px] font-mono font-bold text-zinc-500">v3.54-STABLE</span>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={handleRunDiagnostics}
                      className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                        isScanning
                          ? 'bg-zinc-950 border-zinc-850 text-zinc-500 cursor-not-allowed'
                          : 'bg-indigo-950/20 hover:bg-indigo-950/50 border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white'
                      }`}
                    >
                      {isScanning ? (
                        <>
                          <Activity className="w-3.5 h-3.5 animate-spin" />
                          Scanning Subsystems... ({scanProgress}%)
                        </>
                      ) : (
                        'Initiate Diagnostic Recalibration Scan'
                      )}
                    </button>

                    {/* Glowing Scan Progress Bar */}
                    {isScanning && (
                      <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full transition-all duration-300 shadow-[0_0_8px_#6366f1]"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                    )}

                    {/* Monospaced Shell Screen */}
                    <div className="bg-[#050B18] p-3.5 rounded-xl border border-zinc-850 max-h-[185px] overflow-y-auto font-mono text-[9.5px] leading-relaxed space-y-1.5 text-zinc-400 select-none">
                      {diagnosticsLogs.map((log, lIdx) => (
                        <div key={lIdx} className="border-l-2 border-[#E8600A]/30 pl-2.5">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Local Checkpoint stats */}
                <div className="space-y-2 pt-2 border-t border-zinc-800/60 text-[10px]">
                  {[
                    { item: "Forex peg drift coefficient", status: "Within-Bounds" },
                    { item: "In-Browser LocalStorage Sync", status: "Synced [Good]" },
                    { item: "Static File Cache Integrity", status: "Optimal" },
                    { item: "MGR Auth Runtime state", status: "Unlocked" }
                  ].map((sys, i) => (
                    <div key={i} className="flex justify-between px-2.5 py-1.5 bg-[#050B18]/55 border border-zinc-850 rounded font-mono">
                      <span className="text-zinc-500">{sys.item}</span>
                      <span className="text-emerald-400 font-bold">{sys.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Third Row: Recent Client Logs Ledger */}
            <div className="bg-[#0F172A] border border-zinc-850 p-5 rounded-2xl space-y-3.5">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <h4 className="text-xs uppercase font-extrabold text-white tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#E8600A]" /> Recorded Inbound Footprint Ledger
                </h4>
                <p className="text-[10px] text-zinc-400">Showing last {Math.min(10, analytics.visitTimestamps?.length || 0)} inbound client operations tracing</p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-850 bg-[#050B18]/40">
                <table className="w-full text-left border-collapse font-sans font-semibold text-xs leading-none">
                  <thead>
                    <tr className="border-b border-zinc-850 text-[9px] uppercase font-bold text-zinc-500 tracking-wider bg-[#0C1222]">
                      <th className="p-3">Sequence Timestamp</th>
                      <th className="p-3">Virtual IP Reference</th>
                      <th className="p-3">Assigned Sub-System Access</th>
                      <th className="p-3">Network Protocol</th>
                      <th className="p-3 text-right">Audit Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.visitTimestamps && analytics.visitTimestamps.length > 0 ? (
                      analytics.visitTimestamps.slice(0, 10).map((ts, idx) => {
                        const bg = idx % 2 === 0 ? 'bg-[#0F172A]/20' : 'bg-transparent';
                        const dateObj = new Date(ts);
                        const cleanTime = isNaN(dateObj.getTime())
                          ? 'UNKNOWN_TIMESTAMP'
                          : dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();

                        return (
                          <tr key={idx} className={`border-b border-zinc-900 ${bg} hover:bg-zinc-850/40 transition-all font-mono text-[11px] text-zinc-350`}>
                            <td className="p-3 text-white font-bold">{cleanTime}</td>
                            <td className="p-3 text-[#E8600A]">102.89.87.{45 + (idx * 17) % 190}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9.5px] uppercase font-extrabold text-[#E8600A]">
                                screen_refresh
                              </span>
                            </td>
                            <td className="p-3 text-zinc-400">HTTPS / LOCAL_CACHE_SOCKET</td>
                            <td className="p-3 text-right text-emerald-400 font-bold">INFO-200-OK</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-zinc-550 italic font-mono uppercase bg-zinc-950/20 select-none">
                          No inbound client footprints registered in cache ledger...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SCREEN 4: EXPERTS / DESKS ==================== */}
        {staffTab === 'experts' && (
          <div className="space-y-6 animate-scaleIn">
            <div className="text-left space-y-1">
              <h3 className="text-base font-black uppercase text-white">🛠️ STAFF DESK COGNITIVE HUB Status</h3>
              <p className="text-xs text-zinc-400">Toggle live desk availability parameters shown on consumer screens.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => handleToggleManagerStatus('manager')}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex justify-between items-center ${
                  managers.manager === 'Available' ? 'bg-[#25D366]/10 border-[#25D366]/30 text-white' : 'bg-red-950/20 border-red-500/20 text-zinc-400'
                }`}
              >
                <div>
                  <span className="block text-[10px] uppercase text-zinc-400 font-extrabold">General Manager Desk</span>
                  <span className="text-base font-bold text-white block mt-1">Superintendent Desk</span>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-normal">Manages invoices and approvals.</p>
                </div>
                <span className={`text-[11px] px-3 py-1.5 rounded-xl font-bold uppercase transition-all duration-300 font-sans ${
                  managers.manager === 'Available' ? 'bg-emerald-500 text-black font-black' : 'bg-red-600 text-white font-extrabold'
                }`}>{managers.manager}</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleManagerStatus('financialAdvisor')}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex justify-between items-center ${
                  managers.financialAdvisor === 'Available' ? 'bg-[#25D366]/10 border-[#25D366]/30 text-white' : 'bg-red-950/20 border-red-500/20 text-zinc-400'
                }`}
              >
                <div>
                  <span className="block text-[10px] uppercase text-zinc-400 font-extrabold">Financial Advisor Desk</span>
                  <span className="text-base font-bold text-white block mt-1">Sovereign Credit Desk</span>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-normal">Manages split-invoice setups.</p>
                </div>
                <span className={`text-[11px] px-3 py-1.5 rounded-xl font-bold uppercase transition-all duration-300 font-sans ${
                  managers.financialAdvisor === 'Available' ? 'bg-emerald-500 text-black font-black' : 'bg-red-600 text-white font-extrabold'
                }`}>{managers.financialAdvisor}</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleManagerStatus('leadTechExpert')}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex justify-between items-center ${
                  managers.leadTechExpert === 'Available' ? 'bg-[#25D366]/10 border-[#25D366]/30 text-white' : 'bg-red-950/20 border-red-500/20 text-zinc-400'
                }`}
              >
                <div>
                  <span className="block text-[10px] uppercase text-zinc-400 font-extrabold">Lead Tech Architect</span>
                  <span className="text-base font-bold text-white block mt-1">Solar Lab</span>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-normal">Reviews panels and pure-sine arrays.</p>
                </div>
                <span className={`text-[11px] px-3 py-1.5 rounded-xl font-bold uppercase transition-all duration-300 font-sans ${
                  managers.leadTechExpert === 'Available' ? 'bg-emerald-500 text-black font-black' : 'bg-red-600 text-white font-extrabold'
                }`}>{managers.leadTechExpert}</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== SCREEN 5: SUPPORT TICKETS LIST ==================== */}
        {staffTab === 'tickets' && (
          <div className="space-y-6 animate-scaleIn">
            <div className="text-left space-y-1">
              <h3 className="text-base font-black uppercase text-white">📥 Support Escalation Logs</h3>
              <p className="text-xs text-zinc-400">Archived list representing consumer problems or general feedback submitted directly.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              {feedback.length > 0 ? (
                feedback.map((item, idx) => (
                  <div key={item.id} className="bg-[#0F172A] border border-zinc-800 p-5 rounded-2xl space-y-3 relative">
                    <div className="flex justify-between items-center border-b border-zinc-800/60 pb-2">
                      <div className="space-y-0.5">
                        <p className="text-white text-xs font-bold uppercase">Ticket #{idx + 1}</p>
                        <p className="text-[9px] text-[#E8600A] font-mono">{item.id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Resolve and archive this client incident ticket?")) {
                            setFeedback(prev => prev.filter(t => t.id !== item.id));
                          }
                        }}
                        className="p-1.5 bg-[#050B18] hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer border border-zinc-850"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <p className="text-zinc-500 font-black uppercase">Incident Score:</p>
                          <p className="text-yellow-400 font-bold">★ {item.rating} Stars</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 font-black uppercase">Client Code:</p>
                          <p className="text-white font-mono">{item.customerName || 'ANONYMOUS'}</p>
                        </div>
                      </div>

                      <div className="space-y-1 mt-2 border-t border-zinc-900 pt-2">
                        <p className="text-[10px] text-zinc-500 uppercase font-black">Subject:</p>
                        <p className="text-zinc-300 font-bold">{item.comment.slice(0, 50) || 'General inquiries'}</p>
                      </div>

                      <div className="p-3 bg-zinc-950/40 rounded-xl text-zinc-400 italic">
                        &ldquo;{item.comment}&rdquo;
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center text-zinc-500 py-16 bg-[#0F172A] border border-zinc-850 rounded-2xl">
                  <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold uppercase tracking-wide text-white">No active critical tickets</p>
                  <p className="text-[10px] text-zinc-600 mt-1">Communications list cleared at Deco Road Warri.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {editForm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0F172A] border border-zinc-800 rounded-2xl w-full max-w-2xl text-left shadow-2xl relative overflow-hidden flex flex-col my-8 max-h-[90vh]">
              {/* Header */}
              <div className="p-5 border-b border-zinc-850 flex justify-between items-center bg-[#0C1222]">
                <div>
                  <h4 className="text-xs uppercase font-extrabold text-[#E8600A] tracking-wider">⚙️ Edit Product Specifications</h4>
                  <p className="text-white text-sm font-black font-sans mt-0.5">{editForm.name || "Unnamed Product"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm(null)}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs font-semibold text-zinc-400">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase text-zinc-500 block mb-1">Item Display Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="w-full bg-[#050B18] border border-zinc-800 rounded-xl p-2.5 text-white"
                      placeholder="Display Name"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase text-zinc-500 block mb-1">SKU Model ID</label>
                    <input
                      type="text"
                      value={editForm.model || ''}
                      onChange={e => setEditForm(prev => prev ? { ...prev, model: e.target.value } : null)}
                      className="w-full bg-[#050B18] border border-zinc-800 rounded-xl p-2.5 text-white font-mono"
                      placeholder="Model Code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] uppercase text-zinc-500 block mb-1">Department Category</label>
                    <select
                      value={editForm.category}
                      onChange={e => setEditForm(prev => prev ? { ...prev, category: e.target.value } : null)}
                      className="w-full bg-[#050B18] border border-zinc-800 rounded-xl p-2.5 text-white cursor-pointer"
                    >
                      {categories.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase text-zinc-500 block mb-1">Base Price (₦)</label>
                    <input
                      type="number"
                      value={editForm.price || ''}
                      onChange={e => setEditForm(prev => prev ? { ...prev, price: Number(e.target.value) } : null)}
                      className="w-full bg-[#050B18] border border-zinc-800 rounded-xl p-2.5 text-white font-mono"
                      placeholder="Price in Naira"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase text-zinc-500 block mb-1">Promo Price (₦ - Optional)</label>
                    <input
                      type="number"
                      value={editForm.promoPrice || ''}
                      onChange={e => setEditForm(prev => prev ? { ...prev, promoPrice: e.target.value ? Number(e.target.value) : undefined } : null)}
                      className="w-full bg-[#050B18] border border-zinc-800 rounded-xl p-2.5 text-white font-mono"
                      placeholder="Discounted Price"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase text-zinc-500 block mb-1">Stock Parameter</label>
                    <select
                      value={editForm.stockStatus}
                      onChange={e => setEditForm(prev => prev ? { ...prev, stockStatus: e.target.value as any } : null)}
                      className="w-full bg-[#050B18] border border-zinc-800 rounded-xl p-2.5 text-white cursor-pointer"
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] uppercase text-zinc-500 block mb-1">Product Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={e => setEditForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={3}
                    className="w-full bg-[#050B18] border border-zinc-800 rounded-xl p-2.5 text-white font-sans leading-relaxed"
                    placeholder="Specification specs, parameters or installation descriptions..."
                  />
                </div>

                {/* Primary Images Area */}
                <div className="border-t border-zinc-800/60 pt-4 space-y-4">
                  <h5 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">🎨 Product Visual Angles</h5>
                  <p className="text-[10px] text-zinc-500 -mt-2">Provide custom URLs or upload local images for alternative visual inspect coordinates.</p>
                  
                  <div className="space-y-4">
                    <ImageUploadInput
                      label="Hero Image (Default View)"
                      value={editForm.heroImage}
                      onChange={val => setEditForm(prev => prev ? { ...prev, heroImage: val } : null)}
                      idPrefix={`edit-${editForm.id}-hero`}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <ImageUploadInput
                        label="Alternate Angle 2"
                        value={editForm.angle2 || ''}
                        onChange={val => setEditForm(prev => prev ? { ...prev, angle2: val } : null)}
                        idPrefix={`edit-${editForm.id}-a2`}
                      />
                      <ImageUploadInput
                        label="Alternate Angle 3"
                        value={editForm.angle3 || ''}
                        onChange={val => setEditForm(prev => prev ? { ...prev, angle3: val } : null)}
                        idPrefix={`edit-${editForm.id}-a3`}
                      />
                      <ImageUploadInput
                        label="Alternate Angle 4"
                        value={editForm.angle4 || ''}
                        onChange={val => setEditForm(prev => prev ? { ...prev, angle4: val } : null)}
                        idPrefix={`edit-${editForm.id}-a4`}
                      />
                      <ImageUploadInput
                        label="Alternate Angle 5"
                        value={editForm.angle5 || ''}
                        onChange={val => setEditForm(prev => prev ? { ...prev, angle5: val } : null)}
                        idPrefix={`edit-${editForm.id}-a5`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-zinc-850 bg-[#0C1222] flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you absolutely sure you want to permanently delete "${editForm.name}"? This is irreversible.`)) {
                      const id = editForm.id;
                      setProducts(prev => {
                        const out = prev.filter(p => p.id !== id);
                        localStorage.setItem('ug_products_live', JSON.stringify(out));
                        return out;
                      });
                      deleteDoc(doc(db, 'products', id))
                        .then(() => {
                          alert(`Product successfully deleted!`);
                          setEditForm(null);
                        })
                        .catch(err => {
                          console.error("Firestore error deleting product:", err);
                          handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
                        });
                    }
                  }}
                  className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900 border border-red-900 text-red-500 hover:text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  title="Delete product permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Product
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm(null)}
                    className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editForm.name || !editForm.model || editForm.price <= 0) {
                        alert("Primary Name, Specs code and Price are critical attributes!");
                        return;
                      }
                      const updated = products.map(p => p.id === editForm.id ? editForm : p);
                      setProducts(updated);
                      localStorage.setItem('ug_products_live', JSON.stringify(updated));
                      
                      setDoc(doc(db, 'products', editForm.id), editForm)
                        .then(() => {
                          alert(`Success: Product "${editForm.name}" updated successfully!`);
                          setEditForm(null);
                        })
                        .catch(err => {
                          console.error("Firestore error saving edited product:", err);
                          handleFirestoreError(err, OperationType.UPDATE, `products/${editForm.id}`);
                        });
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold uppercase rounded-xl shadow-lg tracking-wider cursor-pointer"
                  >
                    Save Specifications
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
