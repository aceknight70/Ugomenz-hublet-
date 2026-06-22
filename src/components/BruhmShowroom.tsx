import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, X, Maximize2, Tag, Layers, 
  Tv, Wind, Snowflake, ShoppingBag, Eye, 
  Info, ExternalLink, Sparkles, FileText, Upload, PlusCircle, CheckCircle, Trash2, ArrowDownToLine, Database, RefreshCw,
  Edit3
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Product Interface aligning exactly with the column keys requested by the user
export interface ShowroomProduct {
  Brand: string;
  "Product Code": string;
  Category: string;
  "Description Headline": string;
  "Description Bullets (Customer View)": string;
  "Technical Specs (Full)": string;
  "Price (₦)": string;
  "Front Image (Cloudinary)": string;
  "Side Image (Cloudinary)": string;
  "Back Image (Cloudinary)": string;
  "Top/Extra Image (Cloudinary)": string;
}

// Full default product catalog hardcoded based EXACTLY on the user's columns and specified Bruhm, Tamashi, Beko, Sharp, AUX, Chigo brands.
const INITIAL_SHOWROOM_CATALOG: ShowroomProduct[] = [
  {
    "Brand": "Bruhm",
    "Product Code": "BRH-BAS-09RCEW",
    "Category": "Air Conditioner",
    "Description Headline": "Looking for a reliable 1HP air conditioner for a small room?",
    "Description Bullets (Customer View)": "• R410 gas cooling with full installation kit included\n• Eco energy-saving mode for affordable utility bills\n• Quiet sleep function ensures smooth nocturnal cooling\n• 100% pure copper condenser with rust-resistant fins",
    "Technical Specs (Full)": "1 HP NORMAL 9000BTU Split AC - R410 Gas With Kit, 220-240V/50Hz, Turbo-chill mode, dual dust filters, full LCD remote.",
    "Price (₦)": "345,000",
    "Front Image (Cloudinary)": "BRH-BAS-09RCEW_front",
    "Side Image (Cloudinary)": "BRH-BAS-09RCEW_side",
    "Back Image (Cloudinary)": "BRH-BAS-09RCEW_back",
    "Top/Extra Image (Cloudinary)": "BRH-BAS-09RCEW_top"
  },
  {
    "Brand": "Tamashi",
    "Product Code": "TAM-NA009FA",
    "Category": "Air Conditioner",
    "Description Headline": "Looking for an affordable 1HP air conditioner for a small room?",
    "Description Bullets (Customer View)": "• R410 gas cooling with full installation kit\n• Rapid cooling technology with auto-restart functionality\n• Multi-layer air filtration to trap fine dust particles\n• Low-voltage operational capabilities",
    "Technical Specs (Full)": "1HP NORMAL 9000BTU Split AC - R410 Gas With Kit, 220V power input, High cooling, auto-restart triggers.",
    "Price (₦)": "320,000",
    "Front Image (Cloudinary)": "TAM-NA009FA_front",
    "Side Image (Cloudinary)": "TAM-NA009FA_side",
    "Back Image (Cloudinary)": "TAM-NA009FA_back",
    "Top/Extra Image (Cloudinary)": "TAM-NA009FA_top"
  },
  {
    "Brand": "Beko",
    "Product Code": "BEK-RD-310L",
    "Category": "Refrigerator",
    "Description Headline": "Upgrade your kitchen with Beko's legendary Active Fresh technology.",
    "Description Bullets (Customer View)": "• NeoFrost dual cooling keeps food fresh 2x longer\n• ProSmart Inverter compressor for maximum energy savings\n• Active Odor Filter continuously purifies inside air\n• Reversible door options for flexible kitchen layout",
    "Technical Specs (Full)": "310 Liters Double Door Refrigerator - Frost-Free cooling, Mechanical temperature controls, R600a eco-coolant, removable wire baskets.",
    "Price (₦)": "590,000",
    "Front Image (Cloudinary)": "BEK-RD-310L_front",
    "Side Image (Cloudinary)": "BEK-RD-310L_side",
    "Back Image (Cloudinary)": "BEK-RD-310L_back",
    "Top/Extra Image (Cloudinary)": "BEK-RD-310L_top"
  },
  {
    "Brand": "Sharp",
    "Product Code": "SHP-4K-55UA",
    "Category": "Television",
    "Description Headline": "Cinematic brilliance in your living room with Sharp's 55\" 4K Smart TV.",
    "Description Bullets (Customer View)": "• Sharp X4 Master Engine Pro II upscales images to crystal 4K\n• High Dynamic Range (HDR10) offers high contrast levels\n• Powered by Android TV with Google Assistant voice commands\n• Sleek frameless design with metallic table stand",
    "Technical Specs (Full)": "55-Inch 4K UHD Android TV - Ultra HD 3840x2160, HDR10+, Dolby Audio, Bluetooth, chromecast built-in.",
    "Price (₦)": "410,000",
    "Front Image (Cloudinary)": "SHP-4K-55UA_front",
    "Side Image (Cloudinary)": "SHP-4K-55UA_side",
    "Back Image (Cloudinary)": "SHP-4K-55UA_back",
    "Top/Extra Image (Cloudinary)": "SHP-4K-55UA_top"
  },
  {
    "Brand": "AUX",
    "Product Code": "AUX-INV-12RC",
    "Category": "Air Conditioner",
    "Description Headline": "State-of-the-art 1.5HP full inverter system for ultimate comfort.",
    "Description Bullets (Customer View)": "• Smart Inverter technology reduces electricity usage by up to 60%\n• Ultra-fast Turbo Cooling brings rooms to ideal temp in 30 seconds\n• Self-cleaning mechanics prevent allergen and mold accumulation\n• Gold-fin anti-corrosion coating guarantees extreme durability",
    "Technical Specs (Full)": "1.5 HP DC Inverter Split AC - 12000 BTU, R410 Gas with 3m installation kit, anti-bacterial filter system, silent operation.",
    "Price (₦)": "440,000",
    "Front Image (Cloudinary)": "AUX-INV-12RC_front",
    "Side Image (Cloudinary)": "AUX-INV-12RC_side",
    "Back Image (Cloudinary)": "AUX-INV-12RC_back",
    "Top/Extra Image (Cloudinary)": "AUX-INV-12RC_top"
  },
  {
    "Brand": "Chigo",
    "Product Code": "CHG-S12AC",
    "Category": "Air Conditioner",
    "Description Headline": "Reliable and ultra-powerful 1.5HP cooling designed for heavy duty use.",
    "Description Bullets (Customer View)": "• Oversized heavy duty compressor built for tropical weather\n• High-efficiency dust-proof pre-filter keeps airflow pristine\n• 3D wide-angle air delivery distributes chilled air evenly\n• Low voltage operation stabilizer protection",
    "Technical Specs (Full)": "1.5 HP Split Air Conditioner - 12000 BTU, R410 Eco Gas, 100% Copper Tubes, Multi-layer air wash filters.",
    "Price (₦)": "335,000",
    "Front Image (Cloudinary)": "CHG-S12AC_front",
    "Side Image (Cloudinary)": "CHG-S12AC_side",
    "Back Image (Cloudinary)": "CHG-S12AC_back",
    "Top/Extra Image (Cloudinary)": "CHG-S12AC_top"
  },
  {
    "Brand": "Beko",
    "Product Code": "BEK-WM-8KG",
    "Category": "Washing Machine",
    "Description Headline": "Tackle tough stains easily with Beko's 8kg Steam-Infused Washer.",
    "Description Bullets (Customer View)": "• SteamCure cycle removes 99.9% of dust allergens and stains\n• OptiSense sensor-guided care adjusts water dynamically\n• AquaWave wave-like drum motion guarantees ultra-gentle fabrics\n• Smart memory resume in case of sudden power cuts",
    "Technical Specs (Full)": "8kg Front Load Washing Machine - 1200 RPM Spin Speed, ProSmart Inverter Motor, 15 Custom Wash Programs.",
    "Price (₦)": "480,000",
    "Front Image (Cloudinary)": "BEK-WM-8KG_front",
    "Side Image (Cloudinary)": "BEK-WM-8KG_side",
    "Back Image (Cloudinary)": "BEK-WM-8KG_back",
    "Top/Extra Image (Cloudinary)": "BEK-WM-8KG_top"
  },
  {
    "Brand": "Sharp",
    "Product Code": "SHP-MW-25L",
    "Category": "Microwave Oven",
    "Description Headline": "Fast, convenient meals with Sharp's Japanese-engineered 25L microwave.",
    "Description Bullets (Customer View)": "• Powerful 900W output for immediate heating and cooking\n• 11 distinct power levels to adapt to any culinary need\n• Defrost by weight and auto-menu speed cooking dials\n• Child-safety lock parameters",
    "Technical Specs (Full)": "25L Solo Microwave Oven - 11 Power levels, 6 Auto cook menus, Child safety lock feature, digital LED display timer.",
    "Price (₦)": "110,000",
    "Front Image (Cloudinary)": "SHP-MW-25L_front",
    "Side Image (Cloudinary)": "SHP-MW-25L_side",
    "Back Image (Cloudinary)": "SHP-MW-25L_back",
    "Top/Extra Image (Cloudinary)": "SHP-MW-25L_top"
  },
  {
    "Brand": "Chigo",
    "Product Code": "CHG-CF-150L",
    "Category": "Refrigerator",
    "Description Headline": "Super-efficient 150L Chest Freezer from Chigo.",
    "Description Bullets (Customer View)": "• Rapid freezing feature preserves perishables longer\n• Heavy insulated walls retain cold temperatures up to 72 hours\n• Low noise operation with key lock handle and wheels\n• Fast heat dissipation multi-sides system",
    "Technical Specs (Full)": "150L Single Door Chest Freezer - Fast Freezing technology, Mechanical thermostat controls, R600a eco-coolant.",
    "Price (₦)": "195,000",
    "Front Image (Cloudinary)": "CHG-CF-150L_front",
    "Side Image (Cloudinary)": "CHG-CF-150L_side",
    "Back Image (Cloudinary)": "CHG-CF-150L_back",
    "Top/Extra Image (Cloudinary)": "CHG-CF-150L_top"
  },
  {
    "Brand": "Bruhm",
    "Product Code": "BRH-REF-180D",
    "Category": "Refrigerator",
    "Description Headline": "Upgrade your living room or kitchen with Bruhm's 180L frost-free double door fridge.",
    "Description Bullets (Customer View)": "• Dual climate compartments for separate cooling\n• LED crisp indicator lighting\n• Removable magnetic anti-bacterial door seals",
    "Technical Specs (Full)": "180 Liters Direct Cool Fridge Freezer - LED light, adjustable shelves, durable premium steel cover template.",
    "Price (₦)": "265,000",
    "Front Image (Cloudinary)": "BRH-REF-180D_front",
    "Side Image (Cloudinary)": "BRH-REF-180D_side",
    "Back Image (Cloudinary)": "BRH-REF-180D_back",
    "Top/Extra Image (Cloudinary)": "BRH-REF-180D_top"
  }
];

export default function BruhmShowroom({ isLightMode = false }: { isLightMode?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ShowroomProduct | null>(null);
  const [editingShowroomProd, setEditingShowroomProd] = useState<ShowroomProduct | null>(null);
  const [activeModalImageAngle, setActiveModalImageAngle] = useState<'front' | 'side' | 'back' | 'top'>('front');

  const handleUpdateProduct = (updatedProduct: ShowroomProduct) => {
    setCustomProducts(prev => {
      const existingIdx = prev.findIndex(p => p["Product Code"].trim().toUpperCase() === updatedProduct["Product Code"].trim().toUpperCase());
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = updatedProduct;
        return next;
      } else {
        return [...prev, updatedProduct];
      }
    });
  };

  // Excel & Spreadsheet Import Mode/States
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [importStatus, setImportStatus] = useState<{type: 'success' | 'error' | 'loading' | null, message: string}>({type: null, message: ''});
  
  // Load custom products imported from LocalStorage
  const [customProducts, setCustomProducts] = useState<ShowroomProduct[]>(() => {
    try {
      const saved = localStorage.getItem('ug_showroom_custom_excel_products');
      if (!saved) return [];
      const parsed = JSON.parse(saved) as ShowroomProduct[];
      const uniqueMap = new Map<string, ShowroomProduct>();
      parsed.forEach(item => {
        if (item && item["Product Code"]) {
          const codeKey = item["Product Code"].trim().toUpperCase();
          uniqueMap.set(codeKey, item);
        }
      });
      return Array.from(uniqueMap.values());
    } catch (e) {
      return [];
    }
  });

  // Sync custom products changes to Local Storage
  useEffect(() => {
    localStorage.setItem('ug_showroom_custom_excel_products', JSON.stringify(customProducts));
  }, [customProducts]);

  // Unified lists of default catalog + any custom imported data 
  const showroomCatalog = useMemo(() => {
    const map = new Map<string, ShowroomProduct>();
    INITIAL_SHOWROOM_CATALOG.forEach(p => {
      const codeKey = (p["Product Code"] || '').trim().toUpperCase();
      if (codeKey) {
        map.set(codeKey, p);
      }
    });
    customProducts.forEach(p => {
      const codeKey = (p["Product Code"] || '').trim().toUpperCase();
      if (codeKey) {
        map.set(codeKey, p);
      }
    });
    return Array.from(map.values());
  }, [customProducts]);

  // Filtered list based on Search query across product codes, category, brand, and titles
  const filteredProducts = useMemo(() => {
    return showroomCatalog.filter(prod => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        prod.Brand.toLowerCase().includes(q) ||
        prod["Product Code"].toLowerCase().includes(q) ||
        prod.Category.toLowerCase().includes(q) ||
        prod["Description Headline"].toLowerCase().includes(q) ||
        prod["Technical Specs (Full)"].toLowerCase().includes(q)
      );
    });
  }, [showroomCatalog, searchQuery]);

  // Dynamically build image URL exactly as specified:
  // https://ugomenz-hublet.vercel.app/images/${product["Product Code"]}_front.jpg
  const getDynamicImageUrl = (prodOrCode: ShowroomProduct | string, angle: 'front' | 'side' | 'back' | 'top') => {
    let product: ShowroomProduct | undefined;
    let code = '';
    if (typeof prodOrCode === 'string') {
      code = prodOrCode;
      product = showroomCatalog?.find(p => p["Product Code"].trim().toUpperCase() === prodOrCode.trim().toUpperCase());
    } else {
      product = prodOrCode;
      code = prodOrCode["Product Code"];
    }

    if (product) {
      const key = angle === 'front' ? "Front Image (Cloudinary)" :
                  angle === 'side' ? "Side Image (Cloudinary)" :
                  angle === 'back' ? "Back Image (Cloudinary)" : "Top/Extra Image (Cloudinary)";
      const override = product[key];
      if (override && (override.startsWith('http://') || override.startsWith('https://') || override.startsWith('data:'))) {
        return override;
      }
    }

    const formattedCode = (code || '').trim().replace(/\s+/g, '');
    return `https://ugomenz-hublet.vercel.app/images/${formattedCode}_${angle}.jpg`;
  };

  // Safe fallback images in case specified file does not exist on manual upload yet
  const getFallbackIcon = (category: string) => {
    switch ((category || '').toLowerCase()) {
      case 'television':
      case 'tv':
        return <Tv className="w-12 h-12 text-zinc-600" />;
      case 'air conditioner':
      case 'air conditioning':
      case 'ac':
        return <Wind className="w-12 h-12 text-zinc-600" />;
      case 'washing machine':
      case 'washer':
        return <Layers className="w-12 h-12 text-zinc-600" />;
      default:
        return <Snowflake className="w-12 h-12 text-zinc-650" />;
    }
  };

  // Maps parsed raw row object keys case-insensitively into perfect ShowroomProduct properties
  const cleanseAndAddRows = (rawRows: any[]) => {
    if (!rawRows || rawRows.length === 0) {
      setImportStatus({type: 'error', message: 'No rows detected in the spreadsheet.'});
      return;
    }

    const cleaned: ShowroomProduct[] = [];
    let errCount = 0;

    rawRows.forEach((row, i) => {
      // Find keys case-insensitively or with fallback spacing differences
      const findVal = (possibleKeys: string[], defaultVal = '') => {
        for (const k of possibleKeys) {
          // Exact match
          if (row[k] !== undefined) return String(row[k]);
          
          // Case-insensitive match or match with stripped spaces
          const foundKey = Object.keys(row).find(
            rk => rk.toLowerCase().trim() === k.toLowerCase().trim() ||
                  rk.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')
          );
          if (foundKey && row[foundKey] !== undefined) {
             return String(row[foundKey]);
          }
        }
        return defaultVal;
      };

      const brand = findVal(['Brand'], 'Bruhm');
      const code = findVal(['Product Code', 'ProductCode', 'Code'], '');
      const category = findVal(['Category'], 'Air Conditioner');
      const headline = findVal(['Description Headline', 'Headline', 'Description'], 'Premium product view');
      const bullets = findVal(['Description Bullets (Customer View)', 'Description Bullets', 'Bullets', 'Customer Description'], '• Premium quality certified\n• Efficient power utilization');
      const technicalSpecs = findVal(['Technical Specs (Full)', 'Technical Specs', 'Specs', 'Full Technical Specs'], 'High-capacity certified specifications');
      const price = findVal(['Price (₦)', 'Price', 'Price(₦)', 'Price (N)', 'Price(N)'], 'Yes');
      const frontImg = findVal(['Front Image (Cloudinary)', 'Front Image', 'FrontImage'], code ? `${code}_front` : '');
      const sideImg = findVal(['Side Image (Cloudinary)', 'Side Image', 'SideImage'], code ? `${code}_side` : '');
      const backImg = findVal(['Back Image (Cloudinary)', 'Back Image', 'BackImage'], code ? `${code}_back` : '');
      const topImg = findVal(['Top/Extra Image (Cloudinary)', 'Top Image', 'TopImage', 'Top/Extra Image'], code ? `${code}_top` : '');

      if (!code) {
        errCount++;
        return; // skip rows missing product code
      }

      cleaned.push({
        Brand: brand,
        "Product Code": code,
        Category: category,
        "Description Headline": headline,
        "Description Bullets (Customer View)": bullets,
        "Technical Specs (Full)": technicalSpecs,
        "Price (₦)": price,
        "Front Image (Cloudinary)": frontImg,
        "Side Image (Cloudinary)": sideImg,
        "Back Image (Cloudinary)": backImg,
        "Top/Extra Image (Cloudinary)": topImg
      });
    });

    if (cleaned.length === 0) {
      setImportStatus({
        type: 'error', 
        message: 'Could not import products. Make sure to specify at least "Product Code" header column.'
      });
      return;
    }

    setCustomProducts(prev => {
      const uniqueMap = new Map<string, ShowroomProduct>();
      prev.forEach(p => {
        const codeKey = (p["Product Code"] || '').trim().toUpperCase();
        if (codeKey) {
          uniqueMap.set(codeKey, p);
        }
      });
      cleaned.forEach(p => {
        const codeKey = (p["Product Code"] || '').trim().toUpperCase();
        if (codeKey) {
          uniqueMap.set(codeKey, p);
        }
      });
      return Array.from(uniqueMap.values());
    });

    setImportStatus({
      type: 'success', 
      message: `Successfully imported ${cleaned.length} products! ${errCount > 0 ? `(${errCount} rows skipped due to missing Product Codes)` : ''}`
    });
  };

  // Local File Upload logic (.xl*, .csv)
  const handleLocalExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus({type: 'loading', message: 'Reading and parsing uploaded spreadsheet file...'});

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<any>(worksheet);
        
        cleanseAndAddRows(rawJson);
      } catch (err: any) {
        setImportStatus({
          type: 'error', 
          message: `File reading failed: ${err.message || 'Please upload a valid .xlsx or .csv formatted excel sheet.'}`
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Google Sheets integration logic (Using Direct CSV conversion stream trick)
  const handleGoogleSheetsImport = async () => {
    if (!googleSheetUrl.trim()) {
      setImportStatus({type: 'error', message: 'Please paste a valid Google Sheets link.'});
      return;
    }

    setImportStatus({type: 'loading', message: 'Connecting to Google Sheets and extracting grid rows...'});

    try {
      // Standard ID extract regex for google sheets URLs
      const match = googleSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        throw new Error('Could not parse Google Sheet ID from URL. Ensure it follows: https://docs.google.com/spreadsheets/d/ID/...');
      }

      const sheetId = match[1];
      // Build Google Sheet direct exports format URL
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error(`Google Sheets responded with code ${response.status}. Ensure your spreadsheet is set to "Anyone with the link can view".`);
      }

      const csvText = await response.text();
      
      // Convert CSV Text to SheetJS workbook for unified mapping
      const workbook = XLSX.read(csvText, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json<any>(worksheet);

      cleanseAndAddRows(rawJson);
      setGoogleSheetUrl('');
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: err.message || 'Failed to sync with Google Sheet. Please double-check file sharing permissions.'
      });
    }
  };

  // Dynamic template generator: Generates a perfectly styled excel template right in the browser!
  const downloadExcelTemplate = () => {
    const headers = [
      "Brand",
      "Product Code",
      "Category",
      "Description Headline",
      "Description Bullets (Customer View)",
      "Technical Specs (Full)",
      "Price (₦)",
      "Front Image (Cloudinary)",
      "Side Image (Cloudinary)",
      "Back Image (Cloudinary)",
      "Top/Extra Image (Cloudinary)"
    ];

    const sampleRows = [
      {
        "Brand": "Bruhm",
        "Product Code": "BRH-BAS-09RCEW",
        "Category": "Air Conditioner",
        "Description Headline": "Premium 1HP air conditioner for rooms",
        "Description Bullets (Customer View)": "• Eco-friendly R410 coolants\n• Self cleaning mechanics\n• Heavy duty coil",
        "Technical Specs (Full)": "1 HP 9000BTU tropicalized condenser, 220V standard",
        "Price (₦)": "345,000",
        "Front Image (Cloudinary)": "BRH-BAS-09RCEW_front",
        "Side Image (Cloudinary)": "BRH-BAS-09RCEW_side",
        "Back Image (Cloudinary)": "BRH-BAS-09RCEW_back",
        "Top/Extra Image (Cloudinary)": "BRH-BAS-09RCEW_top"
      },
      {
        "Brand": "Beko",
        "Product Code": "BEK-WM-8KG",
        "Category": "Washing Machine",
        "Description Headline": "Beko 8kg Premium washing unit",
        "Description Bullets (Customer View)": "• Steam cycle action\n• Smart memory resume parameter",
        "Technical Specs (Full)": "8kg spin capacity, inverter pro smart system",
        "Price (₦)": "480,000",
        "Front Image (Cloudinary)": "BEK-WM-8KG_front",
        "Side Image (Cloudinary)": "BEK-WM-8KG_side",
        "Back Image (Cloudinary)": "BEK-WM-8KG_back",
        "Top/Extra Image (Cloudinary)": "BEK-WM-8KG_top"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Showroom Catalog Template");
    
    // Trigger download
    XLSX.writeFile(wb, "Ugomenz_Showroom_Template.xlsx");
  };

  return (
    <div className="w-full space-y-8 pb-16 font-sans">
        
        {/* Elegant Header Hero Block */}
        <div className={`relative overflow-hidden ${isLightMode ? 'bg-gradient-to-r from-slate-100 to-white/90 border-slate-200 shadow-xl' : 'bg-gradient-to-r from-[#0F172A] to-[#0A0F1E] border-zinc-800 shadow-2xl'} rounded-3xl p-6 sm:p-10 border`}>
          <div className="absolute top-0 right-0 h-1.5 w-1/3 bg-[#E8600A]"></div>
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-[#E8600A]/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-bold uppercase tracking-wider text-[#E8600A]">
                <Sparkles className="w-3.5 h-3.5" />
                Unified Brands showroom
              </div>
              
              <h1 className="text-2xl sm:text-4xl font-extrabold uppercase font-syne tracking-tight text-white leading-tight">
                Bruhm Showroom &amp; Partners
              </h1>
              
              <p className="max-w-2xl text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed">
                Explore our fully cataloged high-definition product range featuring premium electronics from <strong className="text-white">Bruhm</strong>, <strong className="text-white">Tamashi</strong>, <strong className="text-white">Beko</strong>, <strong className="text-white">Sharp</strong>, <strong className="text-white">AUX</strong>, and <strong className="text-white">Chigo</strong>. Inspect detailed system specs, or easily upload custom excel/sheets catalogs!
              </p>
            </div>

            {/* spreadsheet Toggle Controls button */}
            <button
              onClick={() => {
                setShowImportPanel(!showImportPanel);
                setImportStatus({type: null, message: ''});
              }}
              className="px-5 py-3 bg-[#0F172A] hover:bg-[#15203B] border border-zinc-850 rounded-xl text-xs font-syne font-extrabold uppercase tracking-widest text-[#E8600A] transition-all flex items-center gap-2 select-none"
            >
              <Database className="w-4 h-4 text-orange-500" />
              <span>{showImportPanel ? 'Hide Spreadsheet Panel' : 'Spreadsheet & Sheets sync'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Spreadsheet upload & Google Sheets sync panel */}
        {showImportPanel && (
          <div className="bg-[#0F172A] border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-2xl animate-scaleIn transition-all">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-850 pb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#E8600A]" />
                  Spreadsheet Import &amp; sync manager
                </h2>
                <p className="text-xs text-zinc-400">Import bulk products directly using google sheets link or local excel xlsx spreadsheet tables.</p>
              </div>

              {/* Template Download */}
              <button
                onClick={downloadExcelTemplate}
                className="text-xs text-zinc-300 hover:text-white bg-zinc-900 px-3.5 py-2 border border-zinc-800 rounded-xl flex items-center gap-2 font-mono"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-orange-500" />
                <span>Get Excel Template (.xlsx)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Option A: Google Sheet Sync Integration */}
              <div className="space-y-4 p-5 bg-[#050B18] rounded-2xl border border-zinc-850">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">Connect Google Sheets</h3>
                </div>
                
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Make sure your sheet is set to <strong className="text-zinc-300">"Anyone with link can view"</strong> (Share options), paste the viewer/editor URL below, and click verify import.
                </p>

                <div className="space-y-3">
                  <input
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit..."
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                    className="w-full bg-[#0F172A] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-[#E8600A] transition-all font-mono"
                  />
                  
                  <button
                    onClick={handleGoogleSheetsImport}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Verify and Import Sheet Data
                  </button>
                </div>
              </div>

              {/* Option B: Local Spreadsheet Excel Upload */}
              <div className="space-y-4 p-5 bg-[#050B18] rounded-2xl border border-zinc-850 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Local Spreadsheet Upload</h3>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mt-2">
                    Directly drag-and-drop or select any Excel file (.xlsx, .xls) or comma separated table (.csv) with column headers matching template keys.
                  </p>
                </div>

                <div className="relative mt-4">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleLocalExcelUpload}
                    id="excel-file-loader"
                    className="hidden"
                  />
                  <label
                    htmlFor="excel-file-loader"
                    className="w-full flex flex-col items-center justify-center p-6 border border-dashed border-zinc-800 rounded-2xl bg-[#0F172A] hover:bg-[#121c33] cursor-pointer transition-all"
                  >
                    <Upload className="w-6 h-6 text-orange-500 mb-2" />
                    <span className="text-[11px] font-bold text-zinc-300">Choose Spreadsheet File</span>
                    <span className="text-[9px] text-zinc-500 mt-1 uppercase font-mono">Supports .xlsx, .xls, .csv</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Status alerts */}
            {importStatus.type && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                importStatus.type === 'loading' ? 'bg-orange-500/5 border-orange-500/20 text-orange-400' :
                importStatus.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                'bg-red-500/5 border-red-500/20 text-red-400'
              }`}>
                {importStatus.type === 'loading' ? (
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
                ) : importStatus.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {importStatus.type === 'loading' ? 'Processing Sheet...' :
                     importStatus.type === 'success' ? 'Import Succeeded!' : 'Connection/Data Alert'}
                  </p>
                  <p className="text-[11px] text-zinc-300 leading-relaxed font-mono">{importStatus.message}</p>
                </div>
              </div>
            )}

            {/* Custom product inventory control list */}
            {customProducts.length > 0 && (
              <div className="bg-[#050B18] border border-zinc-850 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                    Live Imported Inventories ({customProducts.length} Items)
                  </span>
                  
                  <button
                    onClick={() => {
                      if (window.confirm('Do you really want to clear all imported custom spreadsheet products?')) {
                        setCustomProducts([]);
                        setImportStatus({type: 'success', message: 'Imported products wiped successfully.'});
                      }
                    }}
                    className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase bg-red-950/20 border border-red-900/40 px-2 rounded hover:bg-red-950/50 transition-all select-none"
                  >
                    Clear Spreadsheet Items
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-[10px]">
                  {customProducts.map(p => (
                    <div key={p["Product Code"]} className="bg-[#0F172A] border border-zinc-850 rounded-lg p-2 flex justify-between items-center">
                      <div className="truncate pr-1">
                        <p className="font-bold text-white truncate">{p["Product Code"]}</p>
                        <p className="text-zinc-500 font-mono text-[8px] truncate">{p.Brand} · {p.Category}</p>
                      </div>
                      <button
                        onClick={() => {
                          setCustomProducts(prev => prev.filter(item => item["Product Code"] !== p["Product Code"]));
                        }}
                        className="p-1 hover:bg-zinc-805 text-zinc-500 hover:text-red-400 rounded"
                        title="Delete product"
                      >
                        <Trash2 className="w-3 H-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Unified Search Bar & Status */}
        <div className="bg-[#0F172A] p-4 rounded-2xl border border-zinc-850/80 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search product code, brand, category, specs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#050B18] border border-zinc-800 rounded-xl pl-11 pr-4 py-2.5 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8600A] transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-4 items-center self-stretch justify-between md:justify-end text-[11px] font-mono font-bold text-zinc-500">
            <span>SHOWING <strong className="text-white">{filteredProducts.length}</strong> OF {showroomCatalog.length} ITEMS</span>
            <span className="h-4 w-px bg-zinc-800 hidden sm:inline"></span>
            <span className="hidden sm:inline bg-[#E8600A]/5 border border-[#E8600A]/10 text-[#E8600A] px-2.5 py-1 rounded">ALL BRANDS UNIFIED</span>
          </div>
        </div>

        {/* Unified Cards Grid - No brand separation, custom design */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-[#0F172A] rounded-2xl border border-dashed border-zinc-800 space-y-3">
            <Layers className="w-12 h-12 text-zinc-600 mx-auto" />
            <p className="text-sm font-bold text-zinc-400">No matching electronics found</p>
            <p className="text-xs text-zinc-500">Try modifying your search criteria or clear the query</p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold hover:text-white transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {filteredProducts.map((prod) => {
              const frontUrl = getDynamicImageUrl(prod, 'front');
              const bullets = (prod["Description Bullets (Customer View)"] || '')
                .split('\n')
                .map(b => b.trim().replace(/^•\s*/, ''))
                .filter(Boolean)
                .slice(0, 2);

              return (
                <div
                  key={prod["Product Code"]}
                  onClick={() => {
                    setSelectedProduct(prod);
                    setActiveModalImageAngle('front');
                  }}
                  className={`group ${
                    isLightMode 
                      ? 'bg-white border-slate-200 text-slate-800 shadow-sm' 
                      : 'bg-[#0F172A] border-zinc-850 text-white'
                  } border hover:border-[#E8600A]/50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer relative w-[280px] h-[460px] p-4`}
                >
                  {/* 1. FRONT IMAGE */}
                  <div className={`relative w-full h-48 overflow-hidden rounded-xl flex items-center justify-center select-none shrink-0 border ${
                    isLightMode ? 'bg-slate-50/50 border-slate-150' : 'bg-zinc-950 border-zinc-850'
                  }`}>
                    <img
                      src={frontUrl}
                      alt={prod["Description Headline"]}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallbackNode = parent.querySelector('.fallback-container');
                          if (fallbackNode) fallbackNode.classList.remove('hidden');
                        }
                      }}
                    />
                    
                    {/* Fallback component shown on image error */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(prod);
                        setActiveModalImageAngle('front');
                      }}
                      className={`fallback-container absolute inset-0 flex flex-col items-center justify-center p-3 hidden z-20 cursor-pointer ${
                        isLightMode ? 'bg-slate-100 text-slate-800' : 'bg-[#0C1222] text-white'
                      }`}
                    >
                      {getFallbackIcon(prod.Category)}
                      <span className="text-[10px] text-zinc-450 uppercase mt-4 tracking-wider text-center font-bold mb-2">
                        Image Pending Manual Upload
                      </span>
                      <label 
                        onClick={(e) => e.stopPropagation()} 
                        className="cursor-pointer bg-[#E8600A] hover:bg-orange-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md uppercase tracking-wider transition-all"
                      >
                        <Upload className="w-3 h-3" />
                        Upload Front Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string;
                                if (base64) {
                                  const updated = {
                                    ...prod,
                                    "Front Image (Cloudinary)": base64
                                  };
                                  handleUpdateProduct(updated);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Hover state overlay controls */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(prod);
                        setActiveModalImageAngle('front');
                      }}
                      className="absolute inset-0 bg-[#050B18]/75 opacity-0 group-hover:opacity-100 flex flex-col gap-3 items-center justify-center transition-all duration-300 z-10 cursor-pointer"
                    >
                      <div className="flex gap-2.5" onClick={(e) => e.stopPropagation()}>
                        <div 
                          className="w-10 h-10 bg-[#003087] hover:bg-[#002566] text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer border border-white/10 hover:scale-110 transition-transform"
                          title="View Details"
                          onClick={() => {
                            setSelectedProduct(prod);
                            setActiveModalImageAngle('front');
                          }}
                        >
                          <Maximize2 className="w-4 h-4" />
                        </div>
                        
                        <div 
                          className="w-10 h-10 bg-[#E8600A] hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer border border-white/10 hover:scale-110 transition-transform"
                          title="Edit Product Details & Images"
                          onClick={() => {
                            setEditingShowroomProd(prod);
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </div>
                      </div>
                      
                      <label 
                        onClick={(e) => e.stopPropagation()} 
                        className="cursor-pointer bg-zinc-900 border border-zinc-700 hover:border-[#E8600A] text-zinc-350 hover:text-white text-[9px] font-black tracking-widest px-2.5 py-1.5 rounded-lg flex items-center gap-1 uppercase transition-all shadow-md"
                      >
                        <Upload className="w-3 h-3 text-[#E8600A]" />
                        Quick Upload Front
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string;
                                if (base64) {
                                  const updated = {
                                    ...prod,
                                    "Front Image (Cloudinary)": base64
                                  };
                                  handleUpdateProduct(updated);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* 2 & 3. BRAND AND CATEGORY BADGES */}
                  <div className="mt-3 flex flex-wrap gap-1.5 items-center select-none shrink-0">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E8600A] text-white text-[9px] font-bold uppercase tracking-wider shadow">
                      {prod.Brand}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border text-[8px] font-extrabold uppercase tracking-wide ${
                      isLightMode 
                        ? 'bg-slate-100 border-slate-200 text-zinc-650' 
                        : 'bg-[#050B18]/95 border-zinc-805 text-zinc-300'
                    }`}>
                      {prod.Category}
                    </span>
                  </div>

                  {/* 4. PRODUCT CODE */}
                  <p className={`mt-2 text-[10px] font-mono tracking-wider uppercase text-left shrink-0 ${
                    isLightMode ? 'text-slate-450' : 'text-zinc-500'
                  }`}>
                    CODE: {prod["Product Code"]}
                  </p>

                  {/* 5. DESCRIPTION HEADLINE (SCROLLING/MOVING TEXT) */}
                  <div className="mt-2 w-full overflow-hidden relative whitespace-nowrap shrink-0 h-6 flex items-center bg-zinc-500/5 rounded px-1.5">
                    <span 
                      className={`inline-block animate-marquee text-xs font-bold font-syne group-hover:text-[#E8600A] transition-colors ${
                        isLightMode ? 'text-slate-800' : 'text-white'
                      }`}
                    >
                      {prod["Description Headline"]}
                    </span>
                  </div>

                  {/* 6. DESCRIPTION BULLETS */}
                  <div className="mt-2.5 flex-1 min-h-[50px] flex flex-col justify-center">
                    <ul className="space-y-1 text-[11px] text-left">
                      {bullets.map((bullet, idx) => (
                        <li key={idx} className={`truncate flex items-center gap-1.5 ${
                          isLightMode ? 'text-slate-650' : 'text-zinc-400'
                        }`}>
                          <span className="w-1 h-1 rounded-full bg-[#E8600A] shrink-0" />
                          <span className="truncate">{bullet}</span>
                        </li>
                      ))}
                      {bullets.length === 0 && (
                        <li className="text-zinc-500 italic text-[10px]">No key specifications listed</li>
                      )}
                    </ul>
                  </div>

                  {/* 7 & 8. PRICE AND STOCK STATUS */}
                  <div className={`mt-auto pt-2.5 border-t flex items-center justify-between shrink-0 ${
                    isLightMode ? 'border-slate-100' : 'border-zinc-850/60'
                  }`}>
                    <p className="text-sm font-black text-[#E8600A] font-mono">
                      {(!prod["Price (₦)"] || prod["Price (₦)"].toLowerCase() === 'yes') ? (
                        "Available"
                      ) : (
                        `₦${prod["Price (₦)"]}`
                      )}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">In Stock</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Product Modal (Click to Expand) */}
        <ProductDetailModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          isLightMode={isLightMode}
          getDynamicImageUrl={getDynamicImageUrl}
          getFallbackIcon={getFallbackIcon}
          setEditingShowroomProd={setEditingShowroomProd}
        />

        {/* EDIT SHOWROOM PRODUCT MODAL */}
        {editingShowroomProd && (() => {
          const prod = editingShowroomProd;
          
          return (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-55 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
              <div className={`${isLightMode ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-[#0F172A] border-zinc-800 text-white shadow-2xl'} border rounded-3xl w-full max-w-3xl relative overflow-hidden my-auto flex flex-col`}>
                
                {/* Header */}
                <div className={`p-6 border-b ${isLightMode ? 'border-zinc-100 bg-slate-50' : 'border-zinc-800 bg-[#0C1222]'} flex justify-between items-center`}>
                  <div>
                    <span className="text-[#E8600A] text-[10px] uppercase font-black tracking-widest block mb-1">Ugomenz Customizer</span>
                    <h3 className="text-base sm:text-lg font-black font-syne uppercase">Modify Product: {prod["Product Code"]}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingShowroomProd(null)}
                    className={`p-2 rounded-full transition-all cursor-pointer ${isLightMode ? 'bg-zinc-150 hover:bg-zinc-200 text-zinc-700' : 'bg-[#050B18] hover:bg-zinc-900 border border-zinc-805 text-zinc-400 hover:text-white'}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form fields (Scrollable) */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateProduct(prod);
                    setEditingShowroomProd(null);
                    // Also update selectedProduct view if it was active
                    if (selectedProduct && selectedProduct["Product Code"] === prod["Product Code"]) {
                      setSelectedProduct(prod);
                    }
                  }}
                  className="p-6 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Brand */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#E8600A]">Brand</label>
                      <input
                        type="text"
                        value={prod.Brand}
                        onChange={(e) => setEditingShowroomProd({ ...prod, Brand: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#E8600A] ${isLightMode ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-[#050B18] border-zinc-800 text-white'}`}
                        required
                      />
                    </div>

                    {/* Product Code */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 font-bold">Product Code (Unique ID)</label>
                      <input
                        type="text"
                        value={prod["Product Code"]}
                        disabled
                        className={`w-full p-2.5 rounded-xl border text-xs opacity-60 ${isLightMode ? 'bg-zinc-100 border-zinc-200 text-zinc-400' : 'bg-[#050B18] border-zinc-850 text-zinc-500'}`}
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#E8600A]">Category</label>
                      <input
                        type="text"
                        value={prod.Category}
                        onChange={(e) => setEditingShowroomProd({ ...prod, Category: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#E8600A] ${isLightMode ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-[#050B18] border-zinc-800 text-white'}`}
                        required
                      />
                    </div>

                    {/* Price */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#E8600A]">Price (₦)</label>
                      <input
                        type="text"
                        value={prod["Price (₦)"]}
                        placeholder="e.g. 265,000 or yes"
                        onChange={(e) => setEditingShowroomProd({ ...prod, "Price (₦)": e.target.value })}
                        className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#E8600A] ${isLightMode ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-[#050B18] border-zinc-800 text-white'}`}
                        required
                      />
                    </div>
                  </div>

                  {/* Headline */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#E8600A]">Description Headline</label>
                    <input
                      type="text"
                      value={prod["Description Headline"]}
                      onChange={(e) => setEditingShowroomProd({ ...prod, "Description Headline": e.target.value })}
                      className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#E8600A] ${isLightMode ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-[#050B18] border-[#0C1222]'}`}
                      required
                    />
                  </div>

                  {/* Technical Specs */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#E8600A]">Technical Specs (Full)</label>
                    <textarea
                      rows={2}
                      value={prod["Technical Specs (Full)"]}
                      onChange={(e) => setEditingShowroomProd({ ...prod, "Technical Specs (Full)": e.target.value })}
                      className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#E8600A] ${isLightMode ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-[#050B18] border-zinc-800 text-white'}`}
                      required
                    />
                  </div>

                  {/* Bullets */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#E8600A]">Description Bullets (One Bullet point per line)</label>
                    <textarea
                      rows={3}
                      value={prod["Description Bullets (Customer View)"]}
                      onChange={(e) => setEditingShowroomProd({ ...prod, "Description Bullets (Customer View)": e.target.value })}
                      placeholder="• Bullet 1&#10;• Bullet 2"
                      className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#E8600A] ${isLightMode ? 'bg-white border-zinc-200 text-zinc-800' : 'bg-[#050B18] border-zinc-800 text-white'}`}
                      required
                    />
                  </div>

                  {/* PERSPECTIVE ANGLE IMAGES */}
                  <div className="space-y-3.5 pt-2 text-left animate-slideUp">
                    <h4 className="text-[11px] font-black uppercase text-[#E8600A] tracking-widest border-b border-zinc-800/20 pb-2">
                      Upload Showroom Images / Perspectives
                    </h4>
                    <p className={`text-[10px] ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      Select files to upload custom image replacements (auto-converts to data URI). Reset removes overrides and falls back to primary Deco Road CDN setup.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {([
                        { name: 'Front View', key: 'Front Image (Cloudinary)' as const },
                        { name: 'Side View', key: 'Side Image (Cloudinary)' as const },
                        { name: 'Back View', key: 'Back Image (Cloudinary)' as const },
                        { name: 'Top / Extra View', key: 'Top/Extra Image (Cloudinary)' as const },
                      ]).map((angle) => {
                        const currentSrc = getDynamicImageUrl(prod, angle.key.replace(' Image (Cloudinary)', '').replace('/Extra Image (Cloudinary)', '').toLowerCase() as any);
                        const isCustom = prod[angle.key] && (prod[angle.key].startsWith('data:') || prod[angle.key].startsWith('http'));

                        return (
                          <div key={angle.key} className={`p-3 rounded-xl border ${isLightMode ? 'bg-slate-50 border-zinc-200' : 'bg-[#050B18] border-zinc-850'} flex gap-3 items-center justify-between`}>
                            {/* preview mini */}
                            <div className="w-12 h-12 bg-black/60 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
                              <img
                                src={currentSrc}
                                alt={angle.name}
                                referrerPolicy="no-referrer"
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'text-[9px] font-black text-zinc-650';
                                    fallback.innerText = 'N/A';
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            </div>

                            {/* actions */}
                            <div className="flex-grow space-y-1.5">
                              <p className="text-[10px] font-bold text-zinc-400">{angle.name}</p>
                              <div className="flex gap-1.5">
                                <label className="cursor-pointer bg-zinc-800 border border-zinc-700 hover:border-[#E8600A] text-white text-[9px] font-bold px-2 py-1 rounded select-none uppercase tracking-wide flex items-center gap-1">
                                  <Upload className="w-2.5 h-2.5 text-[#E8600A]" />
                                  Upload
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          const base64 = event.target?.result as string;
                                          if (base64) {
                                            setEditingShowroomProd({
                                              ...prod,
                                              [angle.key]: base64
                                            });
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                                
                                {isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const defaultCodeValue = `${prod["Product Code"]}_${angle.key.replace(' Image (Cloudinary)', '').replace('/Extra Image (Cloudinary)', '').toLowerCase()}`;
                                      setEditingShowroomProd({
                                        ...prod,
                                        [angle.key]: defaultCodeValue
                                      });
                                    }}
                                    className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold rounded hover:bg-red-500/20 uppercase tracking-wide cursor-pointer"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className={`pt-4 border-t ${isLightMode ? 'border-zinc-200' : 'border-zinc-800'} flex justify-end gap-3`}>
                    <button
                      type="button"
                      onClick={() => setEditingShowroomProd(null)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${isLightMode ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700' : 'bg-zinc-900 border border-zinc-800 text-zinc-450 hover:text-white'}`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#E8600A] hover:bg-orange-600 text-white text-xs font-black uppercase rounded-xl shadow-lg transition-all cursor-pointer"
                    >
                      Save Specifications
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

    </div>
  );
}

// ==========================================
// DETAILED PRODUCT SPECIFICATIONS MODAL
// ==========================================
interface ProductDetailModalProps {
  product: ShowroomProduct | null;
  isOpen: boolean;
  onClose: () => void;
  isLightMode: boolean;
  getDynamicImageUrl: (prodOrCode: ShowroomProduct | string, angle: 'front' | 'side' | 'back' | 'top') => string;
  getFallbackIcon: (category: string) => React.ReactNode;
  setEditingShowroomProd: (prod: ShowroomProduct) => void;
}

function ProductDetailModal({
  product,
  isOpen,
  onClose,
  isLightMode,
  getDynamicImageUrl,
  getFallbackIcon,
  setEditingShowroomProd,
}: ProductDetailModalProps) {
  const [activeModalImageAngle, setActiveModalImageAngle] = useState<'front' | 'side' | 'back' | 'top'>('front');

  // Reset angle perspective when selecting a new active product
  useEffect(() => {
    setActiveModalImageAngle('front');
  }, [product]);

  if (!isOpen || !product) return null;

  const activeImageSrc = getDynamicImageUrl(product, activeModalImageAngle);

  // Parse specifications bullet list cleanly splitting by carriage returns
  const bulletList = (product["Description Bullets (Customer View)"] || '')
    .toString()
    .split('\n')
    .map(line => line.replace(/^•\s*/, '').trim())
    .filter(Boolean);

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`border rounded-3xl w-full max-w-4xl shadow-2xl relative overflow-hidden my-auto flex flex-col md:flex-row max-h-[90vh] ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0F172A] border-[#1E293B] text-white'
        }`}
      >
        {/* Close Button ("X") */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 z-20 p-2 rounded-full transition-all cursor-pointer border ${
            isLightMode 
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-250 text-slate-700' 
              : 'bg-[#050B18] hover:bg-zinc-900 border-[#1E293B] text-zinc-400 hover:text-white'
          }`}
          title="Close Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Stage: Perspective gallery display and controls */}
        <div className={`md:w-1/2 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r select-none ${
          isLightMode ? 'bg-slate-50/50 border-slate-150' : 'bg-[#050B18]/50 border-[#1E293B]'
        }`}>
          <div className="aspect-square w-full flex items-center justify-center relative p-4 max-h-[300px] md:max-h-[350px]">
            {/* Active Perspective Photo */}
            <img
              src={activeImageSrc}
              alt={product["Description Headline"] || "Product Image"}
              className="max-h-full max-w-full object-contain"
              referrerPolicy="no-referrer"
              id="modal-active-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallbackNode = parent.querySelector('.modal-fallback');
                  if (fallbackNode) fallbackNode.classList.remove('hidden');
                }
              }}
            />

            {/* fallback wrapper for missing asset links */}
            <div className={`modal-fallback absolute inset-0 flex flex-col items-center justify-center hidden ${
              isLightMode ? 'bg-slate-50' : 'bg-zinc-950'
            }`}>
              {getFallbackIcon(product.Category)}
              <span className={`text-[10px] uppercase mt-4 tracking-widest text-center font-bold ${
                isLightMode ? 'text-zinc-500' : 'text-zinc-400'
              }`}>
                {activeModalImageAngle.toUpperCase()} Image pending
              </span>
            </div>
          </div>

          {/* Perspective Multiangle Thumbnails panel selection */}
          <div className="mt-4">
            <p className={`text-[9.5px] font-bold uppercase tracking-wider mb-2 text-center ${
              isLightMode ? 'text-slate-500' : 'text-zinc-400'
            }`}>
              Select View Angle
            </p>
            <div className="grid grid-cols-4 gap-2">
              {(['front', 'side', 'back', 'top'] as const).map((angle) => {
                const isCurrent = activeModalImageAngle === angle;
                const thumbUrl = getDynamicImageUrl(product, angle);
                
                return (
                  <button
                    key={`modal-thumb-${angle}`}
                    onClick={() => {
                      setActiveModalImageAngle(angle);
                      const img = document.getElementById('modal-active-image') as HTMLImageElement;
                      if (img) img.style.display = 'block';
                      const fall = document.querySelector('.modal-fallback') as HTMLElement;
                      if (fall) fall.classList.add('hidden');
                    }}
                    className={`aspect-square rounded-xl border overflow-hidden p-1 flex items-center justify-center transition-all cursor-pointer ${
                      isCurrent 
                        ? 'border-[#E8600A] ring-2 ring-orange-500/25' 
                        : isLightMode 
                          ? 'bg-white border-slate-200 hover:border-slate-300' 
                          : 'bg-[#050B18] border-[#1E293B] hover:border-zinc-700'
                    }`}
                  >
                    <img
                      src={thumbUrl}
                      alt={angle}
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const placeholder = parent.querySelector('.thumb-placeholder') || document.createElement('div');
                          if (!parent.querySelector('.thumb-placeholder')) {
                            (placeholder as HTMLDivElement).className = `thumb-placeholder text-[10px] font-extrabold uppercase ${
                              isLightMode ? 'text-slate-400' : 'text-zinc-650'
                            }`;
                            (placeholder as HTMLDivElement).innerText = angle.substring(0, 1);
                            parent.appendChild(placeholder);
                          }
                        }
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Stage: Detailed info, descriptions and specification tables */}
        <div className="md:w-1/2 p-6 sm:p-8 space-y-6 overflow-y-auto no-scrollbar max-h-[350px] md:max-h-[500px]">
          
          {/* Brand, category and Stock indicators */}
          <div className="space-y-2 text-left">
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E8600A] text-white text-[9px] font-bold uppercase tracking-wider shadow">
                {product.Brand || "Universal"}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                isLightMode 
                  ? 'bg-slate-100 border-slate-200 text-zinc-650' 
                  : 'bg-[#050B18] border-[#1E293B] text-zinc-300'
              }`}>
                {product.Category || "Misc"}
              </span>
              {/* STOCK STATUS IN MODAL */}
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 border ${
                isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#050B18] border-[#1E293B]'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-500 font-extrabold">In Stock</span>
              </span>
            </div>

            <p className={`text-[10px] font-mono tracking-wider uppercase ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
              CODE: <span className={`font-semibold ${isLightMode ? 'text-slate-900 font-black' : 'text-white'}`}>{product["Product Code"] || "N/A"}</span>
            </p>
          </div>

          {/* Description Headline & Bullet points */}
          <div className="text-left space-y-2">
            <h2 className={`text-base sm:text-lg font-black leading-snug ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {product["Description Headline"] || "Specialized product solution built with optimal durability and quality mechanics."}
            </h2>

            {/* Bullet list */}
            {bulletList.length > 0 ? (
              <ul className="space-y-1.5 pt-2">
                {bulletList.map((bullet, index) => (
                  <li key={index} className={`text-xs sm:text-[13px] flex items-start gap-2.5 leading-relaxed ${
                    isLightMode ? 'text-slate-700' : 'text-zinc-300'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E8600A] mt-1.5 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`text-xs italic ${isLightMode ? 'text-slate-400' : 'text-zinc-550'}`}>No further descriptions available.</p>
            )}
          </div>

          {/* Full Technical specifications */}
          <div className={`space-y-2.5 p-4 rounded-xl font-mono border text-left ${
            isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#050B18] border-[#1E293B]'
          }`}>
            <h3 className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border-b pb-1.5 ${
              isLightMode ? 'text-slate-500 border-slate-150' : 'text-zinc-450 border-[#1E293B]'
            }`}>
              <Info className="w-3.5 h-3.5 text-[#E8600A]" />
              Full Technical Specifications
            </h3>
            <p className={`text-[11px] leading-relaxed whitespace-pre-line ${
              isLightMode ? 'text-slate-705' : 'text-zinc-300'
            }`}>
              {product["Technical Specs (Full)"] || "No direct specifications available for this model layout."}
            </p>
          </div>

          {/* Price valuation and call-to-actions */}
          <div className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-4 border-t ${
            isLightMode ? 'border-slate-100' : 'border-[#1E293B]'
          }`}>
            <div className="text-left">
              <span className={`text-[9.5px] font-bold uppercase tracking-widest ${
                isLightMode ? 'text-zinc-500' : 'text-zinc-450'
              }`}>Showroom Value</span>
              <p className="text-[#E8600A] text-xl font-black font-mono">
                {(!product["Price (₦)"] || product["Price (₦)"].toLowerCase() === 'yes') ? (
                  "Available"
                ) : (
                  `₦${product["Price (₦)"]}`
                )}
              </p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setEditingShowroomProd(product)}
                className={`px-3.5 py-2.5 border text-[11px] font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isLightMode 
                    ? 'bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-700' 
                    : 'bg-zinc-900 hover:bg-zinc-800 border-[#1E293B] text-zinc-300'
                }`}
                title="Edit details"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#E8600A]" />
                Edit
              </button>

              <a 
                href={`https://wa.me/2349060672127?text=Hello%20Ugomenz,%20I'm%20interested%20in%20verifying%20and%2520ordering%2520the%20${product.Brand}%20${product["Product Code"]}%20(${product.Category}).`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-grow sm:flex-grow-0 px-4 py-2.5 bg-[#E8600A] hover:bg-orange-600 transition-all text-[11px] font-black uppercase rounded-lg flex items-center justify-center gap-1.5 shadow-md text-white cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Inquire on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
