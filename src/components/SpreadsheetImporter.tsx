import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle, AlertTriangle, 
  Settings, Database, Play, Check, X, RefreshCw, Layers 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';

// Interfaces for our dynamic mapping configuration
interface ColumnMapping {
  id: string;
  name: string;
  model: string;
  price: string;
  promoPrice: string;
  category: string;
  brand: string;
  stockStatus: string;
  description: string;
  heroImage: string;
}

interface SpreadsheetImporterProps {
  currentProducts: Product[];
  onCatalogSynced: (updatedList: Product[]) => void;
  categories: string[];
}

export default function SpreadsheetImporter({ currentProducts, onCatalogSynced, categories }: SpreadsheetImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  
  // Header mappings, preset automatically using smart heuristics
  const [mapping, setMapping] = useState<ColumnMapping>({
    id: '',
    name: '',
    model: '',
    price: '',
    promoPrice: '',
    category: '',
    brand: '',
    stockStatus: '',
    description: '',
    heroImage: ''
  });

  // Flow State Control
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'syncing' | 'completed'>('upload');
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, currentName: '' });
  const [importReport, setImportReport] = useState<{ successes: number; errors: string[] }>({ successes: 0, errors: [] });

  // ----------------------------------------------------
  // UTILS: Auto Header Matcher (Smart Heuristics)
  // ----------------------------------------------------
  const findBestHeaderMatch = (allHeaders: string[], searchKeys: string[]): string => {
    for (const key of searchKeys) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = allHeaders.find(h => {
        const normalizedHeader = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedHeader === normalizedKey || normalizedHeader.includes(normalizedKey) || normalizedKey.includes(normalizedHeader);
      });
      if (match) return match;
    }
    return '';
  };

  // ----------------------------------------------------
  // EXCEL FILE PARSING VIA SHEETJS (xlsx)
  // ----------------------------------------------------
  const handleFileParsing = (uploadedFile: File) => {
    setFile(uploadedFile);
    setStep('upload');
    setImportReport({ successes: 0, errors: [] });

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        setSheetNames(workbook.SheetNames);
        const initialSheet = workbook.SheetNames[0];
        setSelectedSheet(initialSheet);
        
        extractSheetRows(workbook, initialSheet);
      } catch (err: any) {
        alert("Parsing Error: Could not parse selected Spreadsheet. Let's make sure it is a valid .xlsx, .xls or .csv file: " + err.message);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const extractSheetRows = (workbook: XLSX.WorkBook, sheetName: string) => {
    const worksheet = workbook.Sheets[sheetName];
    // Read raw data with helper keys
    const jsonRows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });
    
    if (jsonRows.length === 0) {
      alert(`The worksheet "${sheetName}" appears to be empty.`);
      return;
    }

    setRawRows(jsonRows);

    // Filter headers from keys
    const detectedHeaders = Object.keys(jsonRows[0]);
    setHeaders(detectedHeaders);

    // Apply Smart Auto-Mapping Heuristics
    const autodetected: ColumnMapping = {
      id: findBestHeaderMatch(detectedHeaders, ['id', 'sku', 'product code', 'code', 'model code', 'key']),
      name: findBestHeaderMatch(detectedHeaders, ['name', 'product name', 'title', 'display name', 'headline']),
      model: findBestHeaderMatch(detectedHeaders, ['model', 'model no', 'model id', 'sku id', 'device model']),
      price: findBestHeaderMatch(detectedHeaders, ['price', 'retail price', 'base price', 'amount', 'cost', 'price (₦)']),
      promoPrice: findBestHeaderMatch(detectedHeaders, ['promo price', 'discount price', 'promo', 'special price']),
      category: findBestHeaderMatch(detectedHeaders, ['category', 'department', 'group', 'type']),
      brand: findBestHeaderMatch(detectedHeaders, ['brand', 'brand name', 'manufacturer']),
      stockStatus: findBestHeaderMatch(detectedHeaders, ['stock status', 'stock', 'availability', 'rating']),
      description: findBestHeaderMatch(detectedHeaders, ['description', 'summary', 'bullets', 'details']),
      heroImage: findBestHeaderMatch(detectedHeaders, ['hero image', 'image', 'photo url', 'cloudinary', 'image url', 'pic'])
    };
    
    // Fallbacks if ID or Name couldn't be accurately detected
    if (!autodetected.id) autodetected.id = detectedHeaders[0] || '';
    if (!autodetected.name) autodetected.name = detectedHeaders[1] || '';
    if (!autodetected.price) autodetected.price = detectedHeaders.find(h => h.toLowerCase().includes('price')) || '';

    setMapping(autodetected);
    setStep('mapping');
  };

  // Drag & Drop callbacks
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileParsing(e.dataTransfer.files[0]);
    }
  };

  // ----------------------------------------------------
  // PREVIEW CONVERSION & INTEGRITY CHECKS
  // ----------------------------------------------------
  const parsedProductsResult = useMemo(() => {
    if (step === 'upload' || step === 'mapping') return [];

    return rawRows.map((row, index) => {
      // Find row values based on mapping
      const lookupAttr = (field: keyof ColumnMapping) => {
        const headerKey = mapping[field];
        return headerKey ? String(row[headerKey] !== undefined ? row[headerKey] : '').trim() : '';
      };

      // Ensure proper identifier string
      let rawId = lookupAttr('id') || `p-${Date.now()}-${index}`;
      rawId = rawId.toLowerCase().replace(/[^a-z0-9-_]/g, '');

      const rawPrice = lookupAttr('price').replace(/[^0-9]/g, '');
      const parsedPrice = Math.max(0, parseInt(rawPrice, 10) || 0);

      const rawPromo = lookupAttr('promoPrice').replace(/[^0-9]/g, '');
      const parsedPromo = rawPromo ? parseInt(rawPromo, 10) || undefined : undefined;

      const rawStock = lookupAttr('stockStatus').toLowerCase();
      const finalStock: 'In Stock' | 'Out of Stock' = (rawStock.includes('out') || rawStock === 'no' || rawStock === '0') 
        ? 'Out of Stock' 
        : 'In Stock';

      const categoryCandidate = lookupAttr('category') || 'Televisions';
      const cleanCategory = categories.find(c => c.toLowerCase() === categoryCandidate.toLowerCase()) || categoryCandidate;

      const description = lookupAttr('description') || `Bulk Excel imported model registered on ${new Date().toLocaleDateString()}`;

      // Image mapping fallbacks
      const imageVal = lookupAttr('heroImage') || 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80';

      const mappedProduct: Product = {
        id: rawId,
        name: lookupAttr('name') || `Device SKU ${lookupAttr('model') || rawId}`,
        model: lookupAttr('model') || rawId.toUpperCase(),
        price: parsedPrice,
        promoPrice: parsedPromo,
        category: cleanCategory,
        brand: lookupAttr('brand') || 'Others',
        stockStatus: finalStock,
        description,
        heroImage: imageVal,
        variants: []
      };

      // Perform validation checks
      const warnings: string[] = [];
      const errors: string[] = [];

      if (!mappedProduct.id) errors.push("Missing SKU code identifier");
      if (!mappedProduct.name || mappedProduct.name.startsWith("Device SKU")) warnings.push("Fallback auto name applied");
      if (mappedProduct.price <= 0) warnings.push("Base unit Price registered as ₦0");
      if (mappedProduct.promoPrice && mappedProduct.promoPrice >= mappedProduct.price) {
        warnings.push("Promo discount price is greater than base price");
      }

      const idExists = currentProducts.some(p => p.id === mappedProduct.id);

      return {
        product: mappedProduct,
        originalIndex: index + 1,
        errors,
        warnings,
        isOverwrite: idExists
      };
    });
  }, [rawRows, mapping, step, currentProducts, categories]);

  // Determine if mapping has errors that block preview
  const isMappingInvalid = !mapping.id || !mapping.name || !mapping.price;

  // ----------------------------------------------------
  // BULK SYNC OPERATION ON FIRESTORE
  // ----------------------------------------------------
  const handleBulkCatalogFirestoreSync = async () => {
    const activeProducts = parsedProductsResult.filter(pr => pr.errors.length === 0);
    if (activeProducts.length === 0) {
      alert("No valid rows ready to be uploaded. Fix column mapping mapping options.");
      return;
    }

    setStep('syncing');
    setSyncProgress({ current: 0, total: activeProducts.length, currentName: '' });

    let successCount = 0;
    const failures: string[] = [];

    // Copying standard reactive list to perform incremental local upgrades
    let workingCatalogList = [...currentProducts];

    for (let i = 0; i < activeProducts.length; i++) {
      const activeItem = activeProducts[i];
      const targetProduct = activeItem.product;

      setSyncProgress({
        current: i + 1,
        total: activeProducts.length,
        currentName: `${targetProduct.brand} ${targetProduct.name}`
      });

      try {
        // Upload each verified spreadsheet product to Firestore 'products' collection
        await setDoc(doc(db, 'products', targetProduct.id), targetProduct);
        
        // Push or override in local array
        const existingIdx = workingCatalogList.findIndex(p => p.id === targetProduct.id);
        if (existingIdx > -1) {
          workingCatalogList[existingIdx] = targetProduct;
        } else {
          workingCatalogList.push(targetProduct);
        }

        successCount++;
      } catch (err: any) {
        failures.push(`Row ${activeItem.originalIndex} (${targetProduct.id}): ${err.message || err}`);
        try {
          handleFirestoreError(err, OperationType.UPDATE, `products/${targetProduct.id}`);
        } catch (f) {
          // Carry on with next items inside loop
        }
      }
    }

    // Persist final working list back up to the main application local cache
    localStorage.setItem('ug_products_live', JSON.stringify(workingCatalogList));
    onCatalogSynced(workingCatalogList);

    setImportReport({ successes: successCount, errors: failures });
    setStep('completed');
  };

  // ----------------------------------------------------
  // DYNAMIC SPREADSHEET TEMPLATE GENERATOR (.xlsx)
  // ----------------------------------------------------
  const triggerExcelTemplateDownload = () => {
    const templateHeaders = [
      "SKU Code (Unique ID)",
      "Display Product Name",
      "Model Number",
      "Estimated Price (NGN)",
      "Promo Discount Price (Leave blank if none)",
      "Category Department",
      "Manufacture Brand Name",
      "Stock Status (In Stock or Out of Stock)",
      "Detailed Description",
      "Primary Photo Image URL (Optional)"
    ];

    const templateRows = [
      {
        "SKU Code (Unique ID)": "sam-neo-65tv",
        "Display Product Name": "Samsung 65-Inch Neo QLED Smart TV",
        "Model Number": "QA65QN90AAKXXZ",
        "Estimated Price (NGN)": "1450000",
        "Promo Discount Price (Leave blank if none)": "1350000",
        "Category Department": "Televisions",
        "Manufacture Brand Name": "Samsung",
        "Stock Status (In Stock or Out of Stock)": "In Stock",
        "Detailed Description": "Crystal 4K, smart Tizen OS integration, elegant NeoSlim profile, dual-bassed Dolby sound specs.",
        "Primary Photo Image URL (Optional)": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80"
      },
      {
        "SKU Code (Unique ID)": "lg-wave-9kg",
        "Display Product Name": "LG 9kg Smart Inverter Direct Drive Washer",
        "Model Number": "LG-F4V5VYP0W",
        "Estimated Price (NGN)": "680000",
        "Promo Discount Price (Leave blank if none)": "",
        "Category Department": "Washers / Dryers",
        "Manufacture Brand Name": "LG",
        "Stock Status (In Stock or Out of Stock)": "In Stock",
        "Detailed Description": "AI DD smart fabric intelligence, allergy-safe steam washes, rust-free high steel components.",
        "Primary Photo Image URL (Optional)": ""
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateRows, { header: templateHeaders });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Showroom Catalog Template");
    XLSX.writeFile(wb, "Showroom_Bulk_Catalog_Template.xlsx");
  };

  return (
    <div className="bg-[#0A0F1E] border border-zinc-850 rounded-2xl p-6 space-y-6">
      
      {/* Importer Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-white">
            <div className="p-1.5 rounded-lg bg-[#E8600A]/10 text-[#E8600A]">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider font-syne">Excel / Sheets bulk catalog manager</h2>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Upload high-density Excel tables (.xlsx, .xls, .csv) and bulk sync to the core database catalog easily.</p>
        </div>

        {/* Template Button */}
        <button
          type="button"
          onClick={triggerExcelTemplateDownload}
          className="text-[10px] font-mono text-[#E8600A] bg-zinc-900 hover:bg-zinc-850 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-[#E8600A]/30 transition-all flex items-center gap-1.5 cursor-pointer select-none"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Get Excel Catalog Template (.xlsx)</span>
        </button>
      </div>

      {/* ----------------------------------------------------
          STEP 1: UPLOAD & DRAG FILE STAGE
          ---------------------------------------------------- */}
      {step === 'upload' && (
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center space-y-4 ${
            isDragActive ? 'border-[#E8600A] bg-[#E8600A]/5' : 'border-zinc-805 bg-zinc-950/40 hover:bg-zinc-955/20'
          }`}
        >
          <Upload className="w-10 h-10 text-zinc-550 group-hover:scale-105 transition-transform" />
          
          <div className="space-y-1">
            <p className="text-xs font-bold text-zinc-200 uppercase tracking-widest">
              Drag spreadsheet here or click to choose
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">
              Accepts .xlsx, .xls, and standard CSV format tables
            </p>
          </div>

          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) handleFileParsing(picked);
              }}
              id="sheet-direct-loader"
              className="hidden"
            />
            <label
              htmlFor="sheet-direct-loader"
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 hover:text-white cursor-pointer select-none hover:bg-zinc-850 hover:border-zinc-700 transition-all font-sans"
            >
              Select Spreadsheet File
            </label>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          STEP 2: COLUMNS MAPPING CONFIGURATION
          ---------------------------------------------------- */}
      {step === 'mapping' && (
        <div className="space-y-4 animate-scaleIn">
          <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
            <span className="text-xs text-zinc-300 font-mono">
              📂 Parsed workbook file: <strong className="text-white font-semibold">{file?.name}</strong> ({rawRows.length} total rows)
            </span>
            
            {sheetNames.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Active Sheet:</span>
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  className="bg-[#050B18] border border-zinc-800 text-xs rounded text-white p-1 font-mono uppercase font-semibold"
                >
                  {sheetNames.map(sn => <option key={sn} value={sn}>{sn}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-850/80 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-zinc-850 pb-2">
              <Settings className="w-3.5 h-3.5 text-orange-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Configure Columns Mapping</h3>
            </div>
            
            <p className="text-[11px] text-zinc-400">
              Align keys parsed from the spreadsheet header line with the database coordinates. Green indicates matches found, orange indicates a fallback.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Maps required fields */}
              {[
                { key: 'id', label: 'SKU / Unique ID Code *', required: true, desc: 'Primary core reference identifier' },
                { key: 'name', label: 'Display Name *', required: true, desc: 'Searchable marketing title' },
                { key: 'price', label: 'Estimated Retail Price (₦) *', required: true, desc: 'Calculated baseline currency NGN' },
                { key: 'promoPrice', label: 'Promo Discount Price', required: false, desc: 'Promo discounted sticker value' },
                { key: 'category', label: 'Department Category', required: false, desc: 'Group or shelf department placement' },
                { key: 'brand', label: 'Manufacture Brand', required: false, desc: 'System brand selector badge' },
                { key: 'model', label: 'Technical Model Code', required: false, desc: 'Detailed model coordinates' },
                { key: 'stockStatus', label: 'Stock Level Rating', required: false, desc: "Controls 'In Stock' view" },
                { key: 'description', label: 'Brief Description', required: false, desc: 'Bullets text description overview' },
                { key: 'heroImage', label: 'Product Photo URL', required: false, desc: 'Dynamic asset photo link' }
              ].map((field) => {
                const currentVal = mapping[field.key as keyof ColumnMapping];
                const cleanKey = field.key as keyof ColumnMapping;
                
                return (
                  <div key={field.key} className="space-y-1 bg-[#050B18] border border-zinc-850 p-3 rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider block text-zinc-300">
                        {field.label}
                      </span>
                      <span className="text-[9px] text-zinc-550 block leading-tight">{field.desc}</span>
                    </div>

                    <select
                      value={currentVal}
                      onChange={(e) => setMapping(prev => ({ ...prev, [cleanKey]: e.target.value }))}
                      className={`w-full bg-zinc-950 text-xs text-white p-2 rounded border focus:outline-none focus:border-[#E8600A] font-mono mt-2 cursor-pointer ${
                        currentVal ? 'border-emerald-800 bg-emerald-950/10' : field.required ? 'border-amber-900 bg-amber-950/10' : 'border-zinc-800'
                      }`}
                    >
                      <option value="">-- Disregard/Omit Field --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nav buttons */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => {
                setFile(null);
                setStep('upload');
              }}
              className="text-xs text-zinc-400 hover:text-white px-4 py-2 border border-zinc-800 rounded-xl transition-all cursor-pointer"
            >
              Cancel &amp; Change File
            </button>

            <button
              disabled={isMappingInvalid}
              onClick={() => setStep('preview')}
              className="px-5 py-2.5 bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-500 text-white text-xs uppercase font-extrabold tracking-widest rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 select-none"
            >
              <span>Inspect Products Preview</span>
              <Play className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          STEP 3: PARSING REVIEW & QUALITY INSPECTION
          ---------------------------------------------------- */}
      {step === 'preview' && (
        <div className="space-y-5 animate-scaleIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                Data Sanitization &amp; preview validation
              </h3>
              <p className="text-[10px] text-zinc-400">
                Found {parsedProductsResult.length} items. Read columns and verify below before bulk uploading to Firestore.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep('mapping')}
                className="px-3.5 py-1.5 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold select-none transition-all cursor-pointer"
              >
                Modify Mapping
              </button>

              <button
                onClick={handleBulkCatalogFirestoreSync}
                className="px-4 py-1.5 bg-[#E8600A] hover:bg-orange-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider select-none transition-all scroll-smooth cursor-pointer flex items-center gap-1.5 shadow"
              >
                <Database className="w-4 h-4 text-white" />
                <span>Upload {parsedProductsResult.filter(r => r.errors.length === 0).length} valid items</span>
              </button>
            </div>
          </div>

          {/* High density preview grid */}
          <div className="overflow-x-auto rounded-xl border border-zinc-850">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-[#050B18] text-zinc-400 text-[10px] uppercase font-mono border-b border-zinc-800 select-none">
                  <th className="p-3 text-center w-12">Row</th>
                  <th className="p-3 w-32">Unique Code ID</th>
                  <th className="p-3">Matched item Name</th>
                  <th className="p-3 w-28">Main Price</th>
                  <th className="p-3 w-24">Department</th>
                  <th className="p-3 w-24">Brand</th>
                  <th className="p-3 w-20">Stock</th>
                  <th className="p-3 w-48">Validations &amp; Actions</th>
                </tr>
              </thead>
              <tbody>
                {parsedProductsResult.map((result, idx) => {
                  const prVal = result.product;
                  const isBlocked = result.errors.length > 0;
                  const bg = idx % 2 === 0 ? 'bg-zinc-950/20' : 'bg-transparent';
                  
                  return (
                    <tr key={result.originalIndex} className={`border-b border-zinc-900 font-medium ${bg}`}>
                      <td className="p-3 text-center text-zinc-500 font-mono text-[10px]">{result.originalIndex}</td>
                      <td className="p-3 font-mono text-[#E8600A] text-[10px] select-all">{prVal.id}</td>
                      <td className="p-3">
                        <p className="text-white font-semibold truncate" title={prVal.name}>{prVal.name}</p>
                        <p className="text-[9px] text-zinc-550 font-mono truncate select-all">{prVal.model}</p>
                      </td>
                      <td className="p-3 font-mono">
                        <p className="text-emerald-400 font-semibold">₦{prVal.price.toLocaleString()}</p>
                        {prVal.promoPrice && (
                          <p className="text-[10px] text-zinc-500 line-through">₦{prVal.promoPrice.toLocaleString()}</p>
                        )}
                      </td>
                      <td className="p-3 text-zinc-300 font-semibold">{prVal.category}</td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-bold text-zinc-400 font-mono text-[9px]">
                          {prVal.brand}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">
                        <span className={`text-[10px] ${prVal.stockStatus === 'In Stock' ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {prVal.stockStatus}
                        </span>
                      </td>
                      <td className="p-3 text-[10px]">
                        {isBlocked ? (
                          <div className="flex items-center gap-1 text-rose-400 font-bold">
                            <X className="w-3.5 h-3.5 shrink-0" />
                            <span>{result.errors[0]}</span>
                          </div>
                        ) : (
                          <div className="space-y-1 font-semibold">
                            {result.isOverwrite && (
                              <span className="inline-block bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold mr-1">
                                Overwrite ID
                              </span>
                            )}
                            {result.warnings.length > 0 ? (
                              <div className="flex items-center gap-1 text-amber-400 text-[9.5px]">
                                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                                <span className="truncate">{result.warnings[0]}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-emerald-400 text-[9.5px]">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>No warnings</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          STEP 4: BULK ACTION SYNCING LOADER
          ---------------------------------------------------- */}
      {step === 'syncing' && (
        <div className="p-10 text-center space-y-6 bg-zinc-950/40 border border-zinc-850 rounded-2xl animate-pulse">
          <RefreshCw className="w-10 h-10 text-orange-500 animate-spin mx-auto" />
          
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#E8600A]">
              Writing bulk dataset records dynamically...
            </h3>
            
            <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
              Uploading catalog elements safely to database. Real-time protection rules and schema constraints are applied automatically.
            </p>
          </div>

          {/* Bar Loader */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
              <div 
                className="bg-gradient-to-r from-[#E8600A] to-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
              <span>PROGRESS: {syncProgress.current} / {syncProgress.total}</span>
              <span className="truncate max-w-[200px] uppercase font-bold text-zinc-400">{syncProgress.currentName}</span>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          STEP 5: SYNC COMPLETED REPORT DIALOGUE
          ---------------------------------------------------- */}
      {step === 'completed' && (
        <div className="p-6 border border-[#2b85e4]/20 bg-[#1a6fd4]/5 rounded-2xl space-y-4 animate-scaleIn">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
              <CheckCircle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-white leading-relaxed">
                Bulk Spreadsheet Catalogue update complete!
              </h3>
              <p className="text-[11px] text-zinc-400">
                Successfully reconciled rows, registered assets, and synchronized the offline buffer with Firestore.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm pt-2">
            <div className="bg-[#050B18] p-3 rounded-lg border border-zinc-850">
              <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-widest">Successfully Synced</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{importReport.successes}</span>
            </div>
            <div className="bg-[#050B18] p-3 rounded-lg border border-zinc-850">
              <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-widest">Failed Duplicates</span>
              <span className="text-lg font-black text-rose-400 font-mono">{importReport.errors.length}</span>
            </div>
          </div>

          {importReport.errors.length > 0 && (
            <div className="space-y-2 p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl">
              <p className="text-[10px] uppercase font-extrabold text-rose-400 tracking-wider">Failed upload errors:</p>
              <div className="max-h-24 overflow-y-auto no-scrollbar space-y-1 font-mono text-[9px] text-zinc-400">
                {importReport.errors.map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            </div>
          )}

          {/* Reset / Proceed buttons */}
          <div className="pt-2 flex justify-end gap-2 text-xs">
            <button
              onClick={() => {
                setFile(null);
                setRawRows([]);
                setStep('upload');
              }}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg select-none transition-all cursor-pointer font-bold uppercase tracking-wider"
            >
              Sync another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
