import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Image as ImageIcon, PlayCircle, Store, Bot, Share2, FileText, CreditCard,
  Truck, ShieldAlert, Phone, Star, GraduationCap, Settings, Search,
  MessageCircle, CheckCircle, Calendar, DollarSign, Lock, MapPin,
  Clock, ArrowRight, Copy, Plus, Trash2, ThumbsUp, Check, Loader2, ArrowUpRight,
  QrCode, BarChart2, Sliders, Heart, Pin, Maximize2, ChevronLeft, ChevronRight, X,
  Tv, Snowflake, Flame, RotateCw, Eye, Sun, Layers, ZoomIn, ZoomOut, Wind
} from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Product, Variant, BankDetails, Review, GMQuery, ManagerStatus, AnalyticsData, CampaignConfig } from './types';
import { INITIAL_PRODUCTS, INITIAL_SHOWROOM_PHOTOS } from './initialData';
import StaffWorkshopSuite from './components/StaffWorkshopSuite';
import { auth, db, googleProvider, OperationType, handleFirestoreError } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

// Constants
const MGR_CODE = 'UGOMENZ2025';
const MGR_KEY = 'qw123#@';
const DEFAULT_PIN = '12345';

const DEFAULT_CAMPAIGN: CampaignConfig = {
  campaignActive: true,
  campaignTag: 'Official Business Showroom',
  headline: 'UGOMENZ ELECTRONICS - PREMIUM HOME APPLIANCES',
  subHeadline: 'Unlock top-tier Televisions, Refrigerators, Air Conditioners, and Washing Machines at unbeatable prices. Generate invoices, log secure transactions, and dispatch pickups instantaneously.',
  accentColor: '#1a6fd4',
  accentHoverColor: '#1e83f6',
  storeName: 'UGOMENZ ELECTRONICS',
  storeSubName: 'ELECTRO POINT · PLAZA DECO ROAD DELIVERIES',
  tickerText: '🌍 WELCOME TO UGOMENZ ELECTRONICS! SALES & SERVICES FOR WORLD-CLASS TELEVISIONS, FREEZERS, WASHERS AND CONDITIONERS! 🌍',
  tickerActive: true,
  themePreset: 'default',
  snowAnimationActive: false,
};


export default function App() {
  // ----------------------------------------------------
  // APP STATE & STORAGE INITIALIZATION
  // ----------------------------------------------------
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasEntered, setHasEntered] = useState<boolean>(() => {
    return localStorage.getItem('ug_entered') === 'true';
  });
  const [animationCompleted, setAnimationCompleted] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>(() => {
    return localStorage.getItem('ug_last_tab') || 'gallery';
  });

  const [urlReceiptId, setUrlReceiptId] = useState<string | null>(() => {
    // Look up in hash, pathname, or search query parameters
    const params = new URLSearchParams(window.location.search);
    const rQuery = params.get('r');
    if (rQuery && rQuery.startsWith('RCT-')) return rQuery;
    
    const hashMatch = window.location.hash.match(/#\/r\/(RCT-\d{4}-\d{4})/);
    if (hashMatch) return hashMatch[1];

    const pathMatch = window.location.pathname.match(/\/r\/(RCT-\d{4}-\d{4})/);
    if (pathMatch) return pathMatch[1];

    return null;
  });

  const [urlReceiptData, setUrlReceiptData] = useState<any | null>(null);
  const [loadingUrlReceipt, setLoadingUrlReceipt] = useState<boolean>(false);

  // Watch for changes to URL parameters or active URL receipt ID
  useEffect(() => {
    if (urlReceiptId) {
      setLoadingUrlReceipt(true);
      import('firebase/firestore').then(({ doc, getDoc }) => {
        getDoc(doc(db, 'receipts', urlReceiptId))
          .then((snapshot) => {
            if (snapshot.exists()) {
              setUrlReceiptData(snapshot.data());
            } else {
              const saved = localStorage.getItem(`ug_receipt_${urlReceiptId}`);
              if (saved) setUrlReceiptData(JSON.parse(saved));
            }
          })
          .catch((err) => {
            console.error("Firestore Receipt loading error:", err);
            const saved = localStorage.getItem(`ug_receipt_${urlReceiptId}`);
            if (saved) setUrlReceiptData(JSON.parse(saved));
          })
          .finally(() => {
            setLoadingUrlReceipt(false);
          });
      });
    } else {
      setUrlReceiptData(null);
    }
  }, [urlReceiptId]);

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ug_products_list');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('ug_products_list', JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  });

  const [bank, setBank] = useState<BankDetails>(() => {
    const saved = localStorage.getItem('ug_bank');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.accountName && parsed.accountName.toLowerCase().includes('hitech')) {
        parsed.accountName = 'Ugomenz Electronics';
        localStorage.setItem('ug_bank', JSON.stringify(parsed));
      }
      return parsed;
    }
    const defaultBank = {
      bank: 'GTBank (GTB)',
      accountNumber: '9006163631',
      accountName: 'Ugomenz Electronics'
    };
    localStorage.setItem('ug_bank', JSON.stringify(defaultBank));
    return defaultBank;
  });

  const [managers, setManagers] = useState<ManagerStatus>(() => {
    const saved = localStorage.getItem('ug_mgr_status');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.manager) return parsed;
    }
    const defaultMgr: ManagerStatus = { manager: 'Available', financialAdvisor: 'Available', leadTechExpert: 'Available' };
    localStorage.setItem('ug_mgr_status', JSON.stringify(defaultMgr));
    return defaultMgr;
  });

  const [gmQueue, setGmQueue] = useState<GMQuery[]>(() => {
    const saved = localStorage.getItem('ug_gm_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [feedback, setFeedback] = useState<Review[]>(() => {
    const saved = localStorage.getItem('ug_feedback');
    if (saved) return JSON.parse(saved);
    const defaultReviews: Review[] = [
      { id: '1', rating: 5, comment: 'Exceptional solar bundle customer service! Jinko bifacial panels increased my daily output by 20%!', customerName: 'Dele Falode', dateStr: '2026-06-02' },
      { id: '2', rating: 5, comment: 'Got my HP Omnibook flagship here. Outstanding customer care on WhatsApp.', customerName: 'Chima Obi', dateStr: '2026-06-08' },
      { id: '3', rating: 4, comment: 'Reliable and authentic products. Fast pickup scheduling at Deco Road.', customerName: 'Amara Warri', dateStr: '2026-06-09' }
    ];
    localStorage.setItem('ug_feedback', JSON.stringify(defaultReviews));
    return defaultReviews;
  });

  const [showroomPhotos, setShowroomPhotos] = useState<typeof INITIAL_SHOWROOM_PHOTOS>(() => {
    const saved = localStorage.getItem('ug_extra_photos');
    return saved ? JSON.parse(saved) : INITIAL_SHOWROOM_PHOTOS;
  });

  const [storeHours, setStoreHours] = useState<string>(() => {
    return localStorage.getItem('ug_store_hours') || 'Monday - Saturday: 8:00 AM - 6:00 PM';
  });

  const [campaign, setCampaign] = useState<CampaignConfig>(() => {
    const saved = localStorage.getItem('ug_campaign');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    localStorage.setItem('ug_campaign', JSON.stringify(DEFAULT_CAMPAIGN));
    return DEFAULT_CAMPAIGN;
  });

  const handleUpdateCampaign = (updated: Partial<CampaignConfig>) => {
    setCampaign(prev => {
      const next = { ...prev, ...updated };
      localStorage.setItem('ug_campaign', JSON.stringify(next));
      return next;
    });
  };


  // QR Code generator for vCard contacts
  const [selectedContactForQr, setSelectedContactForQr] = useState<'manager' | 'financialAdvisor' | 'leadTechExpert'>('manager');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let name = "Ugomenz Store Manager";
    let phone = "+2349060672127";
    let title = "Store Manager";
    let note = "Official Store Manager for Ugomenz Electronics Warri.";

    if (selectedContactForQr === 'financialAdvisor') {
      name = "Ugomenz Financial Advisor";
      phone = "+2347068767180";
      title = "Financial Advisor";
      note = "Financial advisor for Ugomenz Electronics. Validates payment transfer credits.";
    } else if (selectedContactForQr === 'leadTechExpert') {
      name = "Ugomenz Lead Tech Expert";
      phone = "+2349060672127";
      title = "Lead Technical Expert";
      note = "Lead expert for solar consultation, inverters, batteries, and device setup.";
    }

    const vcardText = `BEGIN:VCARD
VERSION:3.0
N:${name};;;;
FN:${name}
ORG:Ugomenz Electronics
TITLE:${title}
TEL;TYPE=CELL,VOICE:${phone}
ADR;TYPE=WORK:;;Deco Road, After Robinson Plaza;Warri;Delta State;;Nigeria
NOTE:${note}
URL:https://ais-pre-2j3m3mibeodeknr6bhy27n-391739015113.europe-west2.run.app
END:VCARD`;

    QRCode.toDataURL(vcardText, {
      margin: 2,
      width: 320,
      color: {
        dark: '#030712',
        light: '#ffffff'
      }
    })
    .then(url => {
      setQrDataUrl(url);
    })
    .catch(err => {
      console.error('Failed to generate vCard QR Code:', err);
    });
  }, [selectedContactForQr]);

  // ----------------------------------------------------
  // REAL-TIME FIREBASE SYNC HOOKS
  // ----------------------------------------------------
  useEffect(() => {
    // 0. Auth state changed
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.emailVerified) {
        setIsStaffAuthenticated(true);
        localStorage.setItem('ug_staff_auth', 'true');
      }
    });

    // 1. Subscribe to Products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      let containsOldProducts = false;
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as Product;
        if (item.category === 'Laptops' || item.category === 'Printers' || item.id === 'hp-omnibook') {
          containsOldProducts = true;
        }
        list.push(item);
      });

      if (snapshot.empty || containsOldProducts) {
        // Clear cached local storage keys and trigger clean replacements
        localStorage.removeItem('ug_products_list');
        localStorage.removeItem('ug_products_live');

        if (containsOldProducts) {
          list.forEach((p) => {
            deleteDoc(doc(db, 'products', p.id))
              .catch(e => handleFirestoreError(e, OperationType.DELETE, `products/${p.id}`));
          });
        }

        INITIAL_PRODUCTS.forEach(async (p) => {
          try {
            await setDoc(doc(db, 'products', p.id), p);
          } catch (e) {
            handleFirestoreError(e, OperationType.CREATE, `products/${p.id}`);
          }
        });
      } else {
        setProducts(list);
        localStorage.setItem('ug_products_list', JSON.stringify(list));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    // 2. Subscribe to Feedback / Reviews
    const unsubFeedback = onSnapshot(collection(db, 'feedback'), (snapshot) => {
      if (snapshot.empty) {
        const defaultReviews: Review[] = [
          { id: '1', rating: 5, comment: 'Exceptional solar bundle customer service! Jinko bifacial panels increased my daily output by 20%!', customerName: 'Dele Falode', dateStr: '2026-06-02' },
          { id: '2', rating: 5, comment: 'Got my HP Omnibook flagship here. Outstanding customer care on WhatsApp.', customerName: 'Chima Obi', dateStr: '2026-06-08' },
          { id: '3', rating: 4, comment: 'Reliable and authentic products. Fast pickup scheduling at Deco Road.', customerName: 'Amara Warri', dateStr: '2026-06-09' }
        ];
        defaultReviews.forEach(async (r) => {
          try {
            await setDoc(doc(db, 'feedback', r.id), r);
          } catch (e) {
            handleFirestoreError(e, OperationType.CREATE, `feedback/${r.id}`);
          }
        });
      } else {
        const list: Review[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Review);
        });
        // Sort newest first
        list.sort((a,b) => b.id.localeCompare(a.id));
        setFeedback(list);
        localStorage.setItem('ug_feedback', JSON.stringify(list));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'feedback');
    });

    // 3. Subscribe to GM Queries
    const unsubGmQueue = onSnapshot(collection(db, 'gm_queries'), (snapshot) => {
      const list: GMQuery[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as GMQuery);
      });
      list.sort((a,b) => b.id.localeCompare(a.id));
      setGmQueue(list);
      localStorage.setItem('ug_gm_queue', JSON.stringify(list));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'gm_queries');
    });

    // 4. Subscribe to Store Campaign Settings
    const unsubCampaign = onSnapshot(doc(db, 'settings', 'campaign'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CampaignConfig;
        setCampaign(data);
        localStorage.setItem('ug_campaign', JSON.stringify(data));
      } else {
        // Seed campaign settings
        setDoc(doc(db, 'settings', 'campaign'), DEFAULT_CAMPAIGN)
          .catch(e => handleFirestoreError(e, OperationType.WRITE, 'settings/campaign'));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/campaign');
    });

    // 5. Subscribe to Bank Settings
    const unsubBank = onSnapshot(doc(db, 'settings', 'bank'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as BankDetails;
        setBank(data);
        localStorage.setItem('ug_bank', JSON.stringify(data));
      } else {
        const defaultBank = {
          bank: 'GTBank (GTB)',
          accountNumber: '9006163631',
          accountName: 'Ugomenz Electronics'
        };
        setDoc(doc(db, 'settings', 'bank'), defaultBank)
          .catch(e => handleFirestoreError(e, OperationType.WRITE, 'settings/bank'));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/bank');
    });

    // 6. Subscribe to Managers Status settings
    const unsubManagers = onSnapshot(doc(db, 'settings', 'managers'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as ManagerStatus;
        setManagers(data);
        localStorage.setItem('ug_mgr_status', JSON.stringify(data));
      } else {
        const defaultMgr: ManagerStatus = { manager: 'Available', financialAdvisor: 'Available', leadTechExpert: 'Available' };
        setDoc(doc(db, 'settings', 'managers'), defaultMgr)
          .catch(e => handleFirestoreError(e, OperationType.WRITE, 'settings/managers'));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/managers');
    });

    // 7. Subscribe to Video List
    const unsubVideos = onSnapshot(doc(db, 'settings', 'videoList'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.videos)) {
          setVideoList(data.videos);
          localStorage.setItem('ug_uploaded_videos', JSON.stringify(data.videos));
        }
      } else {
        const defaultVideos = ['https://www.youtube.com/embed/dQw4w9WgXcQ'];
        setDoc(doc(db, 'settings', 'videoList'), { videos: defaultVideos })
          .catch(e => handleFirestoreError(e, OperationType.WRITE, 'settings/videoList'));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/videoList');
    });

    // 8. Subscribe to Socials List
    const unsubSocials = onSnapshot(doc(db, 'settings', 'socials'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.socials)) {
          setSocialsState(data.socials);
          localStorage.setItem('ug_socials_config_v2', JSON.stringify(data.socials));
        }
      } else {
        const defaults = [
          { id: 'wa', name: 'WhatsApp Sales Channel', info: 'Direct link to Manager', iconName: 'ThumbsUp', color: 'bg-emerald-600', link: 'https://wa.me/2349060672127?text=Hello%20Ugomenz%20Electronics%20support%20desk!%20I%20am%2520visiting%20from%20your%20official%20Digital%20Hublet.' },
          { id: 'fb', name: 'Facebook', info: 'Ugomenz Electronics official page', iconName: 'Share2', color: 'bg-blue-600', link: 'https://facebook.com' },
          { id: 'ig', name: 'Instagram', info: '@ugomenzelectronics official showcase', iconName: 'ImageIcon', color: 'bg-gradient-to-tr from-yellow-500 to-purple-600', link: 'https://instagram.com' },
          { id: 'tt', name: 'TikTok', info: '@ugomenzelectronics tech demos', iconName: 'PlayCircle', color: 'bg-zinc-900', link: 'https://tiktok.com' },
          { id: 'yt', name: 'YouTube', info: 'Product demonstrations & unpackings', iconName: 'PlayCircle', color: 'bg-red-600', link: 'https://youtube.com' },
          { id: 'web', name: 'Official Website', info: 'ugomenzelectronics.com (Planned Phase 3)', iconName: 'Store', color: 'bg-indigo-700', link: '#' }
        ];
        setDoc(doc(db, 'settings', 'socials'), { socials: defaults })
          .catch(e => handleFirestoreError(e, OperationType.WRITE, 'settings/socials'));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/socials');
    });

    // 9. Subscribe to Gallery Photos
    const unsubGallery = onSnapshot(doc(db, 'settings', 'gallery'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.photos)) {
          setShowroomPhotos(data.photos);
          localStorage.setItem('ug_extra_photos', JSON.stringify(data.photos));
        }
      } else {
        setDoc(doc(db, 'settings', 'gallery'), { photos: INITIAL_SHOWROOM_PHOTOS })
          .catch(e => handleFirestoreError(e, OperationType.WRITE, 'settings/gallery'));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/gallery');
    });

    // Validate connection to Firestore (CRITICAL limit validation rule in SDK skill)
    const testConnection = async () => {
      try {
        const { doc, getDocFromServer } = await import('firebase/firestore');
        await getDocFromServer(doc(db, 'settings', 'campaign'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    return () => {
      unsubscribeAuth();
      unsubProducts();
      unsubFeedback();
      unsubGmQueue();
      unsubCampaign();
      unsubBank();
      unsubManagers();
      unsubVideos();
      unsubSocials();
      unsubGallery();
    };
  }, []);

  // Analytics tracking structure
  const [analytics, setAnalytics] = useState<AnalyticsData>(() => {
    const saved = localStorage.getItem('ug_analytics_v2');
    if (saved) return JSON.parse(saved);
    return {
      totalVisits: 0,
      todayVisits: 0,
      roomVisits: {},
      visitTimestamps: []
    };
  });

  // Track page entries in landing phase
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationCompleted(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Initialize and update analytics
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastSessionDate = localStorage.getItem('ug_last_visit_date');

    setAnalytics(prev => {
      let updatedTotal = prev.totalVisits;
      let updatedToday = prev.todayVisits;

      // Simple session indicator of new load
      if (!sessionStorage.getItem('ug_session_active')) {
        updatedTotal += 1;
        sessionStorage.setItem('ug_session_active', 'true');
        if (lastSessionDate !== todayStr) {
          updatedToday = 1;
          localStorage.setItem('ug_last_visit_date', todayStr);
        } else {
          updatedToday += 1;
        }
      }

      const updated = {
        ...prev,
        totalVisits: updatedTotal,
        todayVisits: updatedToday,
      };
      localStorage.setItem('ug_analytics_v2', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Track specific room visits
  const recordRoomVisit = (roomId: string) => {
    setAnalytics(prev => {
      const roomCounts = { ...prev.roomVisits };
      roomCounts[roomId] = (roomCounts[roomId] || 0) + 1;

      const updatedTimestamps = [
        new Date().toISOString(),
        ...prev.visitTimestamps
      ].slice(0, 100);

      const updated = {
        ...prev,
        roomVisits: roomCounts,
        visitTimestamps: updatedTimestamps
      };
      localStorage.setItem('ug_analytics_v2', JSON.stringify(updated));
      return updated;
    });
  };

  // Watch tab updates
  useEffect(() => {
    if (hasEntered) {
      localStorage.setItem('ug_last_tab', currentTab);
      recordRoomVisit(currentTab);
    }
  }, [currentTab, hasEntered]);


  // ----------------------------------------------------
  // UTILITIES & WA LINK GENERATOR (Page 10)
  // ----------------------------------------------------
  const waLink = (number: string, message: string) => {
    // Strips non-digit chars from number and encodes message parameter
    const phone = number.replace(/\+/g, '').replace(/\s/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  // ----------------------------------------------------
  // ACTIVE GALLERY VIEW (Room 1)
  // ----------------------------------------------------
  const [activeGalleryCategory, setActiveGalleryCategory] = useState<string>('All');
  const [selectedGalleryProductId, setSelectedGalleryProductId] = useState<string>(products[0]?.id || '');
  const selectedGalleryProduct = useMemo(() => {
    return products.find(p => p.id === selectedGalleryProductId) || products[0];
  }, [products, selectedGalleryProductId]);

  const filteredGalleryProducts = useMemo(() => {
    if (activeGalleryCategory === 'All') return products;
    return products.filter(p => p.category === activeGalleryCategory);
  }, [products, activeGalleryCategory]);

  // Synchronise selected product when category changes in gallery tab
  useEffect(() => {
    if (activeGalleryCategory !== 'All' && selectedGalleryProduct) {
      if (selectedGalleryProduct.category !== activeGalleryCategory) {
        const matching = products.filter(p => p.category === activeGalleryCategory);
        if (matching.length > 0) {
          setSelectedGalleryProductId(matching[0].id);
          setActiveGalleryColorIdx(-1);
        }
      }
    }
  }, [activeGalleryCategory, products, selectedGalleryProduct]);

  // Gallery Sub-states
  const [activeGalleryColorIdx, setActiveGalleryColorIdx] = useState<number>(-1); // -1 is base product
  const [selectedGalleryHeroImage, setSelectedGalleryHeroImage] = useState<string>(() => products[0]?.heroImage || '');
  const [scale, setScale] = useState<number>(1);
  const touchStartRef = useRef<number>(0);

  // Gallery multi-angle auto slideshow states
  const [isAutoplay, setIsAutoplay] = useState<boolean>(true);
  const [isHoveringImage, setIsHoveringImage] = useState<boolean>(false);

  // Helper functions for slide navigation
  const handleNextAngle = () => {
    if (productAngles.length <= 1) return;
    const currentIndex = productAngles.findIndex(angle => angle.url === selectedGalleryHeroImage);
    const nextIndex = (currentIndex + 1) % productAngles.length;
    setSelectedGalleryHeroImage(productAngles[nextIndex].url);
  };

  const handlePrevAngle = () => {
    if (productAngles.length <= 1) return;
    const currentIndex = productAngles.findIndex(angle => angle.url === selectedGalleryHeroImage);
    const prevIndex = currentIndex <= 0 ? productAngles.length - 1 : currentIndex - 1;
    setSelectedGalleryHeroImage(productAngles[prevIndex].url);
  };

  // Set default gallery hero when tab, product or variant updates
  useEffect(() => {
    if (selectedGalleryProduct) {
      if (activeGalleryColorIdx >= 0 && selectedGalleryProduct.variants[activeGalleryColorIdx]) {
        setSelectedGalleryHeroImage(selectedGalleryProduct.variants[activeGalleryColorIdx].heroImage);
      } else {
        setSelectedGalleryHeroImage(selectedGalleryProduct.heroImage);
      }
      setScale(1);
    }
  }, [selectedGalleryProduct, activeGalleryColorIdx]);

  // List of active angles (Hero, Side view, Back view, Close-up, Detail / Label)
  const productAngles = useMemo(() => {
    if (!selectedGalleryProduct) return [];
    const sourceObj = activeGalleryColorIdx >= 0 && selectedGalleryProduct.variants[activeGalleryColorIdx]
      ? selectedGalleryProduct.variants[activeGalleryColorIdx]
      : selectedGalleryProduct;

    return [
      { name: 'Hero Shot', url: sourceObj.heroImage },
      ...(sourceObj.angle2 ? [{ name: 'Side View', url: sourceObj.angle2 }] : []),
      ...(sourceObj.angle3 ? [{ name: 'Back View', url: sourceObj.angle3 }] : []),
      ...(sourceObj.angle4 ? [{ name: 'Close-up', url: sourceObj.angle4 }] : []),
      ...(sourceObj.angle5 ? [{ name: 'Detail / Label', url: sourceObj.angle5 }] : [])
    ];
  }, [selectedGalleryProduct, activeGalleryColorIdx]);

  // Gallery angle auto sliding effect
  useEffect(() => {
    if (!isAutoplay || isHoveringImage || scale > 1 || productAngles.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setSelectedGalleryHeroImage((curr) => {
        const index = productAngles.findIndex(angle => angle.url === curr);
        if (index === -1) {
          return productAngles[0]?.url || '';
        }
        const nextIndex = (index + 1) % productAngles.length;
        return productAngles[nextIndex]?.url || '';
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [isAutoplay, isHoveringImage, scale, productAngles]);

  // ----------------------------------------------------
  // VIDEOS (Room 2)
  // ----------------------------------------------------
  const [videoList, setVideoList] = useState<string[]>(() => {
    const saved = localStorage.getItem('ug_uploaded_videos');
    return saved ? JSON.parse(saved) : ['https://www.youtube.com/embed/dQw4w9WgXcQ']; // Placeholder walkthrough video
  });

  // ----------------------------------------------------
  // SHOWROOM & masonry card filtering (Room 3 & S1 Suggestions)
  // ----------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(() => {
    return localStorage.getItem('ug_showroom_category') || 'All';
  });
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Pinterest Board, Pinning, and Fullscreen lightbox states
  const [activeLightboxPhotoIdx, setActiveLightboxPhotoIdx] = useState<number | null>(null);
  const [myPinnedPhotos, setMyPinnedPhotos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ug_pinned_showroom_photos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleTogglePinPhoto = (photoId: string) => {
    setMyPinnedPhotos((prev) => {
      const isPinned = prev.includes(photoId);
      const next = isPinned ? prev.filter((id) => id !== photoId) : [...prev, photoId];
      localStorage.setItem('ug_pinned_showroom_photos', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    localStorage.setItem('ug_showroom_category', activeCategoryFilter);
  }, [activeCategoryFilter]);

  const categories = ['All', 'Televisions', 'Refrigerators', 'Washing Machines', 'Air Conditioners', 'Kitchen Appliances', 'Solar', 'CCTV'];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = activeCategoryFilter === 'All' || p.category.toLowerCase() === activeCategoryFilter.toLowerCase();
      const matchQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.model && p.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [products, activeCategoryFilter, searchQuery]);

  // ----------------------------------------------------
  // CLIENT AI DESK (Room 4)
  // ----------------------------------------------------
  const [aiHistory, setAiHistory] = useState<{role: string, parts: {text: string}[]}[]>([]);
  const [aiChatMessages, setAiChatMessages] = useState<{sender: 'user' | 'ai', text: string}[]>([
    { sender: 'ai', text: 'Hello! Welcome to the Ugomenz Electronics Digital Assistant Desk. How may we serve you on products, solar installations, GTBank payments, or managers support in Warri today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatMessages]);

  const handleSendAiMessage = async (msgText: string) => {
    if (!msgText.trim()) return;
    setAiChatMessages(prev => [...prev, { sender: 'user', text: msgText }]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/ai-desk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgText,
          history: aiHistory,
          productsList: products.map(p => ({
            name: p.name,
            model: p.model,
            price: p.price === 0 ? 'Call for Price' : `₦${p.price.toLocaleString()}`,
            stockStatus: p.stockStatus,
            category: p.category
          }))
        })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setAiChatMessages(prev => [...prev, { sender: 'ai', text: data.text }]);
        setAiHistory(prev => [
          ...prev,
          { role: 'user', parts: [{ text: msgText }] },
          { role: 'model', parts: [{ text: data.text }] }
        ]);
      } else {
        throw new Error(data.error || 'Server error speaking to Gemini');
      }
    } catch (err: any) {
      // Intelligent Offline Fail-safe / fallback rules-based response engine (makes sure the app remains functional!)
      const query = msgText.toLowerCase();
      let fallbackResponse = "I am ready to help. Our showroom is open Monday through Saturday, 8am to 6pm, located on Deco Road after Robinson Plaza in Warri. You can pay into Ugomenz Electronics GTBank Account: 9006163631. Please tap to chat live with our Manager!";

      if (query.includes('omnibook') || query.includes('hp')) {
        fallbackResponse = `We have outstanding HP options including our flagship HP Omnibook Ultra Flip 14 (₦890,000) and the versatile HP Envy x360 (₦730,000). To confirm direct real-time availability in the showroom, please tap to enquire via WhatsApp!`;
      } else if (query.includes('solar') || query.includes('panel') || query.includes('inverter') || query.includes('battery')) {
        fallbackResponse = `Our complete Solar solutions include the premium Jinko 450W Bifacial panel (₦68,000 per panel), Felicity 3.5kVA Pure Sine Wave Inverters (₦185,000) and high density Deye Lithium Iron LFP batteries. Let us arrange a technical consultation with our team!`;
      } else if (query.includes('pay') || query.includes('account') || query.includes('bank') || query.includes('invoice')) {
        fallbackResponse = `To complete purchases: Transfer into GTBank, Account: ${bank.accountNumber}, Name: ${bank.accountName}. Then proceed to submit your payment slip under the Invoice Room or tap 'I Have Paid' to create digital receipts.`;
      } else if (query.includes('hours') || query.includes('time') || query.includes('open')) {
        fallbackResponse = `Our Warri showroom hours are: ${storeHours}. Feel free to drop by Deco Road after Robinson Plaza!`;
      } else if (query.includes('contact') || query.includes('manager') || query.includes('phone') || query.includes('number') || query.includes('expert')) {
        fallbackResponse = `You can directly reach our Manager at +2349060672127, our Financial Advisor at +2347068767180, or our Lead Tech Expert at +2349060672127.`;
      }

      setAiChatMessages(prev => [
        ...prev,
        { sender: 'ai', text: fallbackResponse }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // ----------------------------------------------------
  // SOCIAL CHANNELS (Room 5)
  // ----------------------------------------------------
  const [socialsState, setSocialsState] = useState(() => {
    const saved = localStorage.getItem('ug_socials_config_v2');
    if (saved) return JSON.parse(saved);
    const defaults = [
      { id: 'wa', name: 'WhatsApp Sales Channel', info: 'Direct link to Manager', iconName: 'ThumbsUp', color: 'bg-emerald-600', link: 'https://wa.me/2349060672127?text=Hello%20Ugomenz%20Electronics%20support%20desk!%20I%20am%2520visiting%20from%20your%20official%20Digital%20Hublet.' },
      { id: 'fb', name: 'Facebook', info: 'Ugomenz Electronics official page', iconName: 'Share2', color: 'bg-blue-600', link: 'https://facebook.com' },
      { id: 'ig', name: 'Instagram', info: '@ugomenzelectronics official showcase', iconName: 'ImageIcon', color: 'bg-gradient-to-tr from-yellow-500 to-purple-600', link: 'https://instagram.com' },
      { id: 'tt', name: 'TikTok', info: '@ugomenzelectronics tech demos', iconName: 'PlayCircle', color: 'bg-zinc-900', link: 'https://tiktok.com' },
      { id: 'yt', name: 'YouTube', info: 'Product demonstrations & unpackings', iconName: 'PlayCircle', color: 'bg-red-600', link: 'https://youtube.com' },
      { id: 'web', name: 'Official Website', info: 'ugomenzelectronics.com (Planned Phase 3)', iconName: 'Store', color: 'bg-indigo-700', link: '#' }
    ];
    localStorage.setItem('ug_socials_config_v2', JSON.stringify(defaults));
    return defaults;
  });

  const getSocialIcon = (iconName: string) => {
    switch (iconName) {
      case 'ThumbsUp': return ThumbsUp;
      case 'Share2': return Share2;
      case 'ImageIcon': return ImageIcon;
      case 'PlayCircle': return PlayCircle;
      case 'GraduationCap': return GraduationCap;
      case 'Store': return Store;
      default: return Share2;
    }
  };

  const SOCIALS = socialsState.map(s => ({
    name: s.name,
    info: s.info,
    icon: getSocialIcon(s.iconName),
    color: s.color,
    link: s.link
  }));

  // ----------------------------------------------------
  // UPGRADED RECEIPT GENERATOR FLOW (Room 7)
  // ----------------------------------------------------
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [receiptPurpose, setReceiptPurpose] = useState('TV');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [balanceOwed, setBalanceOwed] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [receiptGenerated, setReceiptGenerated] = useState<any | null>(null);
  const [receiptsList, setReceiptsList] = useState<any[]>(() => {
    const saved = localStorage.getItem('ug_receipts_list');
    return saved ? JSON.parse(saved) : [];
  });

  // Subscribe and sync receipts in real time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'receipts'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      if (list.length > 0) {
        setReceiptsList(list);
        localStorage.setItem('ug_receipts_list', JSON.stringify(list));
      }
    }, (error) => {
      console.warn("Real-time receipts subscription issue:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(bank.accountNumber);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  const downloadReceiptPDF = (receipt: any) => {
    if (!receipt) return;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [26, 111, 212]; 
    const darkColor = [10, 14, 26];      
    
    // Outer Border Frame
    doc.setFillColor(255, 255, 255);
    doc.rect(10, 10, 190, 277, 'F');
    doc.setDrawColor(215, 225, 240);
    doc.rect(10, 10, 190, 277, 'S');

    // Branding Blue Accent Strip
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, 10, 190, 4, 'F');

    // Corporate Letterhead Header
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text("UGOMENZ ELECTRONICS", 105, 30, { align: "center" });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(95, 105, 120);
    doc.text("Your Trusted Home Electronics & Appliances Store", 105, 36, { align: "center" });
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Official Digital Showroom Plazas · Deco Road Delta", 105, 41, { align: "center" });

    // Header Divider Line
    doc.setDrawColor(220, 230, 245);
    doc.line(20, 48, 190, 48);

    // Receipt Category Title
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("OFFICIAL PAYMENT RECEIPT", 20, 58);

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(11);
    doc.text(`SLIP ID: ${receipt.receiptNo}`, 190, 58, { align: "right" });

    // Left Column: Customer Details Box
    doc.setFillColor(248, 251, 255);
    doc.rect(20, 66, 80, 40, 'F');
    doc.setDrawColor(225, 233, 246);
    doc.rect(20, 66, 80, 40, 'S');

    doc.setTextColor(90, 100, 120);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("CUSTOMER COORDINATES", 24, 72);
    
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(10.5);
    doc.text(receipt.customerName || "N/A", 24, 80);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Phone: ${receipt.customerPhone || "N/A"}`, 24, 88);

    // Right Column: Transaction Metrics
    doc.setFillColor(248, 251, 255);
    doc.rect(110, 66, 80, 40, 'F');
    doc.setDrawColor(225, 233, 246);
    doc.rect(110, 66, 80, 40, 'S');

    doc.setTextColor(90, 100, 120);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("TRANSACTION METRICS", 114, 72);
    
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Date Issued: ${receipt.dateStr || "N/A"}`, 114, 80);
    doc.text(`Receipt Gen: ${receipt.purpose || "N/A"}`, 114, 88);
    doc.text(`Payment Mode: ${receipt.paymentMethod || "N/A"}`, 114, 96);

    // Product Description Table
    doc.setFillColor(245, 249, 255);
    doc.rect(20, 114, 170, 8, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("PRODUCT / SERVICE DESCRIPTION", 25, 119);

    doc.setDrawColor(220, 228, 242);
    doc.rect(20, 114, 170, 48, 'S');
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    
    // Split long descriptions to prevent overflow
    doc.setFont("Courier", "normal");
    doc.setFontSize(10);
    const splitDesc = doc.splitTextToSize(receipt.description || "No description provided", 158);
    doc.text(splitDesc, 25, 131);

    // Ledger Status & Calculation Box
    doc.setFillColor(248, 251, 255);
    doc.rect(20, 172, 170, 32, 'F');
    doc.setDrawColor(225, 233, 246);
    doc.rect(20, 172, 170, 32, 'S');

    doc.setTextColor(90, 100, 120);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text("NET AMOUNT REMITTED:", 25, 185);
    doc.text("LEDGER BALANCE STATUS:", 25, 195);

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14.5);
    doc.text(`N${receipt.amount ? receipt.amount.toLocaleString() : '0'}.00`, 90, 185);

    if (Number(receipt.balance) > 0) {
      doc.setTextColor(215, 45, 45); 
      doc.setFontSize(10.5);
      doc.text(`Owed: N${Number(receipt.balance).toLocaleString()}.00 (Remaining Balance)`, 90, 195);
    } else {
      doc.setTextColor(30, 150, 80); 
      doc.setFontSize(11);
      doc.text("PAID IN FULL", 90, 195);
    }

    // Footers Separation
    doc.setDrawColor(225, 233, 246);
    doc.line(20, 220, 190, 220);

    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Issued By Staff: ${receipt.issuedBy || "Manager"}`, 20, 234);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(110, 120, 140);
    doc.text("Representative: +234 906 067 2127", 20, 240);

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("Thank you for your patronage!", 190, 234, { align: "right" });
    
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(110, 120, 140);
    doc.text(`${bank.bank} · Acct No: ${bank.accountNumber}`, 190, 240, { align: "right" });

    // Official Digital Stamp base strip
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, 281, 190, 2, 'F');

    doc.save(`UGOMENZ_RECEIPT_${receipt.receiptNo}.pdf`);
  };

  const downloadReceiptPNG = (elementId: string, receiptNo: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    html2canvas(element, {
      backgroundColor: '#0a0e1a',
      scale: 2,
      useCORS: true,
      logging: false,
    }).then((canvas) => {
      const link = document.createElement('a');
      link.download = `UGOMENZ_RECEIPT_${receiptNo}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !amountPaid || !productDescription.trim() || !issuedBy.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    const nextCounter = receiptsList.length + 1;
    const formattedCounter = String(nextCounter).padStart(4, '0');
    const newReceiptId = `RCT-2026-${formattedCounter}`;

    const newReceipt = {
      id: newReceiptId,
      receiptNo: newReceiptId,
      purpose: receiptPurpose,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      amount: Number(amountPaid),
      description: productDescription.trim(),
      paymentMethod: paymentMethod,
      balance: balanceOwed ? Number(balanceOwed) : 0,
      issuedBy: issuedBy.trim(),
      dateStr: new Date().toLocaleDateString('en-NG', { dateStyle: 'medium' }),
      createdAt: Date.now(),
      bankDetails: `${bank.bank} · Acct: ${bank.accountNumber}`,
    };

    const updatedList = [newReceipt, ...receiptsList];
    setReceiptsList(updatedList);
    localStorage.setItem('ug_receipts_list', JSON.stringify(updatedList));
    localStorage.setItem(`ug_receipt_${newReceiptId}`, JSON.stringify(newReceipt));

    // Show active receipt
    setReceiptGenerated(newReceipt);

    // Save to Firestore so it can be loadable globally
    try {
      await setDoc(doc(db, 'receipts', newReceiptId), newReceipt);
    } catch (err) {
      console.error("Firestore sync error:", err);
    }

    // Reset customer-specific fields
    setCustomerName('');
    setCustomerPhone('');
    setAmountPaid('');
    setProductDescription('');
    setBalanceOwed('');
  };

  // ----------------------------------------------------
  // PICKUP SCHEDULING (Room 8)
  // ----------------------------------------------------
  const [pickupName, setPickupName] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupProduct, setPickupProduct] = useState('');
  const [pickupMethod, setPickupMethod] = useState('Store Pickup (Deco Road)');
  const [pickupDate, setPickupDate] = useState('');

  const sendPickupScheduleLink = (e: React.FormEvent) => {
    e.preventDefault();
    const message = `UGOMENZ HUBLET PICKUP REQUEST:\n` +
      `- Client: ${pickupName}\n` +
      `- Contact: ${pickupPhone}\n` +
      `- Selected Device: ${pickupProduct}\n` +
      `- Dispatch Mode: ${pickupMethod}\n` +
      `- Planned Date: ${pickupDate}\n`;
    window.open(waLink('+2349060672127', message), '_blank');
  };

  // ----------------------------------------------------
  // WARRANTY CLAIMS (Room 9)
  // ----------------------------------------------------
  const [warrantyProduct, setWarrantyProduct] = useState('');
  const [warrantyDate, setWarrantyDate] = useState('');
  const [warrantySerial, setWarrantySerial] = useState('');
  const [warrantyReason, setWarrantyReason] = useState('');

  const sendWarrantyWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const message = `UGOMENZ WARRANTY REGISTRATION / CLAIM:\n` +
      `- Model / Item: ${warrantyProduct}\n` +
      `- Date Bought: ${warrantyDate}\n` +
      `- S/N or IMEI: ${warrantySerial}\n` +
      `- Issue Description: ${warrantyReason}`;
    window.open(waLink('+2349060672127', message), '_blank');
  };

  // ----------------------------------------------------
  // GENERAL MANAGER QUEUE SYSTEM (Room 10)
  // ----------------------------------------------------
  const [gmQueryName, setGmQueryName] = useState('');
  const [gmQueryPhone, setGmQueryPhone] = useState('');
  const [gmQuerySubject, setGmQuerySubject] = useState('');
  const [gmQueryMsg, setGmQueryMsg] = useState('');
  const [submittedGmStatus, setSubmittedGmStatus] = useState(false);

  const handleSubmitGmQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmQueryName || !gmQueryPhone || !gmQueryMsg) return;

    const newQuery: GMQuery = {
      id: `GMQ-${Date.now()}`,
      customerName: gmQueryName,
      whatsappNumber: gmQueryPhone,
      subject: gmQuerySubject || 'General Inquiry',
      message: gmQueryMsg,
      timestamp: new Date().toLocaleString(),
      status: 'Pending'
    };

    const updated = [newQuery, ...gmQueue];
    setGmQueue(updated);
    localStorage.setItem('ug_gm_queue', JSON.stringify(updated));

    // Cloud Firestore Sync
    try {
      await setDoc(doc(db, 'gm_queries', newQuery.id), newQuery);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `gm_queries/${newQuery.id}`);
    }

    setGmQueryName('');
    setGmQueryPhone('');
    setGmQuerySubject('');
    setGmQueryMsg('');
    setSubmittedGmStatus(true);
    setTimeout(() => setSubmittedGmStatus(false), 5000);
  };

  // ----------------------------------------------------
  // RATINGS & FEEDBACKS (Room 11)
  // ----------------------------------------------------
  const [fbName, setFbName] = useState('');
  const [fbStars, setFbStars] = useState(5);
  const [fbComment, setFbComment] = useState('');

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbName.trim() || !fbComment.trim()) return;

    const newFb: Review = {
      id: `RFB-${Date.now()}`,
      rating: fbStars,
      comment: fbComment,
      customerName: fbName,
      dateStr: new Date().toISOString().split('T')[0]
    };

    const updated = [newFb, ...feedback];
    setFeedback(updated);
    localStorage.setItem('ug_feedback', JSON.stringify(updated));

    // Cloud Firestore Sync
    try {
      await setDoc(doc(db, 'feedback', newFb.id), newFb);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `feedback/${newFb.id}`);
    }

    setFbName('');
    setFbComment('');
    setFbStars(5);
  };

  const avgReviewRating = useMemo(() => {
    if (feedback.length === 0) return 5;
    const total = feedback.reduce((sum, r) => sum + r.rating, 0);
    return Number((total / feedback.length).toFixed(1));
  }, [feedback]);

  // ----------------------------------------------------
  // ADMIN STAFF PORTAL LOCKED (Room 13)
  // ----------------------------------------------------
  const [staffCode, setStaffCode] = useState('');
  const [staffKey, setStaffKey] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('ug_staff_auth') === 'true';
  });

  // Real-time Video List cloud synchronizer
  useEffect(() => {
    if (isStaffAuthenticated && currentUser && videoList.length > 0) {
      setDoc(doc(db, 'settings', 'videoList'), { videos: videoList })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, 'settings/videoList'));
    }
  }, [videoList, isStaffAuthenticated, currentUser]);

  // Real-time Campaign cloud synchronizer
  useEffect(() => {
    if (isStaffAuthenticated && currentUser && campaign) {
      setDoc(doc(db, 'settings', 'campaign'), campaign)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, 'settings/campaign'));
    }
  }, [campaign, isStaffAuthenticated, currentUser]);

  // Real-time Socials cloud synchronizer
  useEffect(() => {
    if (isStaffAuthenticated && currentUser && socialsState.length > 0) {
      setDoc(doc(db, 'settings', 'socials'), { socials: socialsState })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, 'settings/socials'));
    }
  }, [socialsState, isStaffAuthenticated, currentUser]);

  // Real-time Gallery cloud synchronizer
  useEffect(() => {
    if (isStaffAuthenticated && currentUser && showroomPhotos.length > 0) {
      setDoc(doc(db, 'settings', 'gallery'), { photos: showroomPhotos })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, 'settings/gallery'));
    }
  }, [showroomPhotos, isStaffAuthenticated, currentUser]);
  const [staffTab, setStaffTab] = useState<'campaign' | 'catalog' | 'analytics' | 'experts' | 'tickets'>('campaign');
  const [campaignWorkbenchTab, setCampaignWorkbenchTab] = useState<'presets' | 'tickers' | 'products' | 'videos' | 'socials'>('presets');
  const [spreadsheetSearch, setSpreadsheetSearch] = useState('');
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
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedAnglePhotoUrl, setSelectedAnglePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (quickViewProduct) {
      setSelectedVariantId(null);
      setSelectedAnglePhotoUrl(null);
    }
  }, [quickViewProduct]);

  const [staffError, setStaffError] = useState('');

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (staffCode === MGR_CODE && staffKey === MGR_KEY && staffPin === DEFAULT_PIN) {
      try {
        const { signInAnonymously } = await import('firebase/auth');
        await signInAnonymously(auth);
        setIsStaffAuthenticated(true);
        localStorage.setItem('ug_staff_auth', 'true');
        setStaffError('');
      } catch (err: any) {
        console.error("Firebase Anonymous Login Failed: ", err);
        setStaffError('Database authentication error: ' + err.message);
      }
    } else {
      setStaffError('Incorrect Code, Key, or PIN combination. Try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setIsStaffAuthenticated(true);
        localStorage.setItem('ug_staff_auth', 'true');
        setStaffError('');
      }
    } catch (error: any) {
      console.error("Google Login Error: ", error);
      setStaffError("Google authentication failed: " + error.message);
    }
  };

  const handleStaffLogout = async () => {
    setIsStaffAuthenticated(false);
    localStorage.removeItem('ug_staff_auth');
    setStaffCode('');
    setStaffKey('');
    setStaffPin('');
    try {
      await signOut(auth);
    } catch (e) {}
  };

  // Admin overrides helpers
  const handleUpdatePrice = async (prodId: string, newPrice: number) => {
    const updated = products.map(p => {
      if (p.id === prodId) return { ...p, price: newPrice };
      return p;
    });
    setProducts(updated);
    localStorage.setItem('ug_products_list', JSON.stringify(updated));

    // Cloud Firestore Sync
    const targetProduct = updated.find(p => p.id === prodId);
    if (targetProduct) {
      try {
        await setDoc(doc(db, 'products', prodId), targetProduct);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `products/${prodId}`);
      }
    }
  };

  const handleUpdateStock = async (prodId: string, isStock: 'In Stock' | 'Out of Stock') => {
    const updated = products.map(p => {
      if (p.id === prodId) return { ...p, stockStatus: isStock };
      return p;
    });
    setProducts(updated);
    localStorage.setItem('ug_products_list', JSON.stringify(updated));

    // Cloud Firestore Sync
    const targetProduct = updated.find(p => p.id === prodId);
    if (targetProduct) {
      try {
        await setDoc(doc(db, 'products', prodId), targetProduct);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `products/${prodId}`);
      }
    }
  };

  const handleUpdateBank = async (updatedDetails: BankDetails) => {
    setBank(updatedDetails);
    localStorage.setItem('ug_bank', JSON.stringify(updatedDetails));

    // Cloud Firestore Sync
    try {
      await setDoc(doc(db, 'settings', 'bank'), updatedDetails);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/bank');
    }
  };

  const handleToggleManagerStatus = async (role: 'manager' | 'financialAdvisor' | 'leadTechExpert') => {
    const updated = {
      ...managers,
      [role]: managers[role] === 'Available' ? 'Busy' : 'Available'
    };
    setManagers(updated);
    localStorage.setItem('ug_mgr_status', JSON.stringify(updated));

    // Cloud Firestore Sync
    try {
      await setDoc(doc(db, 'settings', 'managers'), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/managers');
    }
  };

  const handleDeleteGmQuery = async (id: string) => {
    const updated = gmQueue.filter(q => q.id !== id);
    setGmQueue(updated);
    localStorage.setItem('ug_gm_queue', JSON.stringify(updated));

    // Cloud Firestore Sync
    try {
      await deleteDoc(doc(db, 'gm_queries', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `gm_queries/${id}`);
    }
  };

  // Real-time photo upload base64 encoding (Page 8)
  const handleAddGalleryPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const newPhotoItem = {
          id: `custom-photo-${Date.now()}`,
          title: `Upload Photo - ${new Date().toLocaleDateString()}`,
          description: 'Uploaded directly by Staff Member.',
          imageUrl: base64String
        };
        const updated = [newPhotoItem, ...showroomPhotos];
        setShowroomPhotos(updated);
        localStorage.setItem('ug_extra_photos', JSON.stringify(updated));
      };
      reader.readAsDataURL(file);
    }
  };

  // Recharts analytic transformations
  const chartRoomData = useMemo(() => {
    return Object.entries(analytics.roomVisits).map(([room, count]) => ({
      room: room.toUpperCase(),
      visits: count
    }));
  }, [analytics]);

  const COLORS = ['#E8600A', '#003087', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];


  // ----------------------------------------------------
  // LANDING PAGE SCREEN (Page 2)
  // ----------------------------------------------------
  if (!hasEntered) {
    return (
      <div id="landing-screen" className="min-h-screen bg-[#060B18] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
        {/* Dynamic backdrop gradient spots & Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,48,135,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,48,135,0.06)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        {/* Moving glowing orbits simulation (Background) */}
        <div className="absolute top-1/4 left-1/4 w-[16rem] sm:w-[24rem] h-[16rem] sm:h-[24rem] rounded-full bg-[#003087]/15 filter blur-[90px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[18rem] sm:w-[26rem] h-[18rem] sm:h-[26rem] rounded-full bg-[#E8600A]/12 filter blur-[110px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full bg-indigo-500/[0.03] filter blur-[140px]"></div>

        {/* Outer subtle decorative frame */}
        <div className="absolute inset-4 border border-white/[0.02] rounded-[2.5rem] pointer-events-none z-0"></div>

        {/* MAIN MATTE GLASSMORPHISM CONTAINER */}
        <div className="z-10 w-full max-w-lg bg-zinc-950/40 backdrop-blur-3xl border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.6)] flex flex-col items-center gap-6 relative overflow-hidden transition-all duration-500 hover:border-white/[0.12]">
          
          {/* Accent decoration line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#E8600A] to-transparent"></div>

          {/* Top Header Label */}
          <div className="text-center space-y-1 mt-1">
            <p className="text-[#E8600A] text-[10px] sm:text-xs tracking-[0.3em] font-syne font-black uppercase text-center">
              Ugomenz Hublet &bull; v2.1
            </p>
            <p className="text-zinc-500 text-[9px] sm:text-[10px] tracking-wider uppercase font-mono">
              ESGMC &bull; Fortune Akioya (FATAP-CT)
            </p>
          </div>

          {/* Central Logo & Orbit Drawing Animation */}
          <div className="relative w-36 sm:w-44 h-36 sm:h-44 flex items-center justify-center my-2 group">
            {/* Pulsating outer laser/glowing ring decor */}
            <div className="absolute inset-0 rounded-full border border-[#E8600A]/20 scale-105 animate-pulse"></div>
            <div className="absolute inset-3 rounded-full border border-dashed border-zinc-800/60 animate-[spin_40s_linear_infinite]"></div>
            
            {/* SVG custom letter 'U' stroke draw */}
            <svg className="w-32 h-32 sm:w-40 sm:h-40 stroke-[#E8600A] fill-none stroke-[7] animate-uGlow relative z-10" viewBox="0 0 100 100">
              <path
                d="M 25 15 L 25 60 A 25 25 0 0 0 75 60 L 75 15"
                strokeLinecap="round"
                className="animate-uDraw"
              />
            </svg>
            
            {/* GOMENZ lettering aligned inside the U-curve */}
            <div className="absolute top-[38%] left-1/2 transform -translate-x-1/2 mt-4 z-20">
              <span className="text-white text-2xl sm:text-3xl font-syne tracking-[0.15em] uppercase font-black animate-fadeUp opacity-0 select-none pointer-events-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" style={{ animationDelay: '1.2s' }}>
                GOMENZ
              </span>
            </div>
          </div>

          {/* Branding Texts */}
          <div className="animate-fadeUp opacity-0 space-y-2 text-center w-full" style={{ animationDelay: '1.6s' }}>
            <h1 className="text-2xl sm:text-3.5xl text-white font-syne tracking-tight font-black uppercase">
              UGOMENZ MALL
            </h1>
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-zinc-800"></span>
              <span className="text-[#E8600A] font-syne text-[10px] sm:text-xs uppercase tracking-[0.2em] font-extrabold">
                Electro Point
              </span>
              <span className="h-px w-10 bg-zinc-800"></span>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm tracking-wider font-medium">
              Premium Electronics &bull; Deco Road, Warri
            </p>
          </div>

          {/* Showcase Building Exterior Panel */}
          <div className="w-full h-28 sm:h-32 rounded-2xl border border-zinc-800/80 bg-[#0c1428] relative overflow-hidden flex items-end p-3 animate-scaleIn opacity-0 shadow-xl group/building" style={{ animationDelay: '1.4s' }}>
            <img
              src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80"
              alt="Ugomenz Showroom Exterior"
              className="absolute inset-0 w-full h-full object-cover opacity-45 grayscale-[20%] transition-transform duration-700 ease-out group-hover/building:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent"></div>
            
            <div className="relative z-10 w-full flex justify-between items-end">
              <div>
                <p className="text-[9px] text-[#E8600A] font-extrabold tracking-widest uppercase">Deco Road Plaza</p>
                <p className="text-xs text-white font-bold font-syne uppercase">Ugomenz Showroom</p>
              </div>
              <div className="flex gap-1 flex-wrap justify-end max-w-[65%]">
                {['Brühm', 'Sharp', 'Tamashi', 'Beko'].map(tag => (
                  <span key={tag} className="text-[8px] bg-[#003087]/65 text-zinc-100 border border-white/[0.08] px-2 py-0.5 rounded font-extrabold tracking-tight">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Interactive Button */}
          <button
            id="enter-button"
            className="w-full py-3.5 sm:py-4 px-6 bg-[#E8600A] text-white font-syne font-black text-xs sm:text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-[#E8600A]/35 hover:bg-[#ff7518] hover:shadow-[#E8600A]/50 hover:scale-[1.02] active:scale-[0.98] transition-all pulse-button cursor-pointer flex items-center justify-center gap-2"
            onClick={() => {
              setHasEntered(true);
              localStorage.setItem('ug_entered', 'true');
            }}
          >
            Enter Ugomenz Hublet
            <ArrowRight className="w-4 h-4 text-white hover:translate-x-1 transition-transform" />
          </button>

        </div>
      </div>
    );
  }

  // Dynamic Receipt Page overlay
  if (urlReceiptId) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col justify-center items-center p-4 md:p-8 font-sans">
        <div className="max-w-xl w-full space-y-6 animate-scaleIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#1a6fd4] animate-ping"></span>
              <span className="font-syne font-black text-xs uppercase tracking-widest text-[#1a6fd4]">Ugomenz Digital Engine</span>
            </div>
            <button
              onClick={() => {
                setUrlReceiptId(null);
                // Clear query params to make routing pristine
                const newurl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
                window.history.pushState({path:newurl}, '', newurl);
              }}
              className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-[#1a6fd4]/30 bg-zinc-900/40 hover:bg-[#1a6fd4] transition-all cursor-pointer font-syne font-extrabold uppercase tracking-widest flex items-center gap-1"
            >
              <ArrowRight className="w-3 h-3 rotate-180 text-white" />
              View Business Page
            </button>
          </div>

          {loadingUrlReceipt ? (
            <div className="bg-[#0F172A] border border-zinc-850 p-12 rounded-3xl flex flex-col items-center justify-center space-y-4 shadow-2xl">
              <Loader2 className="w-8 h-8 text-[#1a6fd4] animate-spin" />
              <p className="text-xs text-zinc-400 font-mono">Synchronizing receipt #{urlReceiptId} from Cloud Storage...</p>
            </div>
          ) : urlReceiptData ? (
            <div className="space-y-4">
              {/* Receipt Visual Card */}
              <div 
                id="url-receipt-card-print" 
                className="bg-gradient-to-b from-[#0F172A] to-[#050B18] border border-zinc-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden text-left"
              >
                <div className="absolute top-0 right-0 h-2 w-1/3 bg-[#1a6fd4]"></div>
                
                {/* Branding Banner */}
                <div className="text-center border-b border-zinc-800/80 pb-6 space-y-1">
                  <h2 className="text-xl md:text-2xl font-syne font-black uppercase text-white tracking-wider">
                    UGOMENZ ELECTRONICS
                  </h2>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
                    Your Trusted Home Electronics & Appliances Store
                  </p>
                  <p className="text-[9px] text-[#1a6fd4] tracking-wider font-mono">
                    Official Digital Showroom Plazas · Deco Road Delta
                  </p>
                </div>

                {/* Receipt Title Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">DOCUMENT CATEGORY</span>
                    <h3 className="text-sm font-syne font-black uppercase text-[#1a6fd4]">
                      OFFICIAL PAYMENT RECEIPT
                    </h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">SLIP ID</span>
                    <p className="text-xs text-emerald-400 font-bold font-mono uppercase">
                      {urlReceiptData.receiptNo}
                    </p>
                  </div>
                </div>

                {/* Recipient Coordinates */}
                <div className="grid grid-cols-2 gap-4 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-905 text-xs">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">CUSTOMER COORDINATES</span>
                    <p className="font-extrabold text-zinc-205 capitalize">{urlReceiptData.customerName}</p>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{urlReceiptData.customerPhone}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">TRANSACTION DETAILS</span>
                    <p className="text-zinc-200"><span className="text-zinc-505">Date:</span> {urlReceiptData.dateStr}</p>
                    <p className="text-zinc-200"><span className="text-zinc-505">Purpose:</span> {urlReceiptData.purpose} Receipt</p>
                    <p className="text-zinc-200"><span className="text-zinc-505">Method:</span> {urlReceiptData.paymentMethod}</p>
                  </div>
                </div>

                {/* Description Box */}
                <div className="space-y-2">
                  <span className="text-[9px] text-zinc-505 uppercase font-bold tracking-wider block">PRODUCT/SERVICE DESCRIPTION</span>
                  <div className="bg-[#050B18] border border-zinc-900 p-4 rounded-xl text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">
                    {urlReceiptData.description}
                  </div>
                </div>

                {/* Ledger Calculations */}
                <div className="border-t border-b border-zinc-800/60 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-widest">AMOUNT REMITTED</p>
                    <p className="text-2xl font-syne font-black text-white mt-1">
                      ₦{urlReceiptData.amount ? urlReceiptData.amount.toLocaleString() : '0'}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] text-zinc-505 font-mono uppercase tracking-widest">LEDGER BALANCE STATUS</p>
                    {Number(urlReceiptData.balance) > 0 ? (
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-950/40 border border-red-500/30 text-red-400 rounded-full font-mono text-xs font-bold mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        Owed: ₦{Number(urlReceiptData.balance).toLocaleString()} (Remaining)
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-full font-mono text-xs font-bold mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 font-mono"></span>
                        PAID IN FULL
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Brand Note & Bank Info */}
                <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[10px] text-zinc-500">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-zinc-400">Issued By: {urlReceiptData.issuedBy}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-zinc-400">Thank you for your patronage!</p>
                    <p className="font-mono text-[9px]">{urlReceiptData.bankDetails || `GTBank · Acct: ${bank.accountNumber}`}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons for View Receipts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => downloadReceiptPDF(urlReceiptData)}
                  className="py-3 px-2.5 bg-gradient-to-r from-blue-600 to-[#1a6fd4] hover:from-blue-700 hover:to-blue-600 text-white rounded-xl text-xs font-syne font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-white" />
                  PDF Copy
                </button>
                
                <button
                  onClick={() => downloadReceiptPNG('url-receipt-card-print', urlReceiptData.receiptNo)}
                  className="py-3 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-syne font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-zinc-400" />
                  PNG Download
                </button>

                <button
                  onClick={() => {
                    const waTxt = `Hello ${urlReceiptData.customerName},\n\nThank you for your payment of ₦${urlReceiptData.amount.toLocaleString()} to UGOMENZ ELECTRONICS.\n\nYour receipt is ready:\n📎 ugomenz.png.recipt/r/${urlReceiptData.receiptNo}\n\nThank you for choosing UGOMENZ ELECTRONICS!`;
                    window.open(waLink(urlReceiptData.customerPhone, waTxt), '_blank');
                  }}
                  className="py-3 px-2.5 bg-[#25D366] hover:bg-[#1fba4f] text-white rounded-xl text-xs font-syne font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/10 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  Send WhatsApp
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#0F172A] border border-zinc-850 p-12 rounded-3xl text-center space-y-4 shadow-2xl">
              <p className="text-red-400 font-syne font-black uppercase text-sm">Receipt Not Found</p>
              <p className="text-xs text-zinc-400 font-mono">The receipt code #{urlReceiptId} is not synchronized or was removed.</p>
              <button
                onClick={() => setUrlReceiptId(null)}
                className="px-6 py-2.5 bg-[#1a6fd4] text-white rounded-xl text-xs font-syne font-black uppercase tracking-wider cursor-pointer"
              >
                Go Back Home
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN CORE APPLICATION (Tabs)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex flex-col relative pb-28 md:pb-32 font-sans select-text">
      {/* Dynamic Theme Styles Override */}
      <style>{`
        :root {
          --accent-primary: ${campaign.accentColor};
          --accent-hover: ${campaign.accentHoverColor};
        }
        .text-\[\#E8600A\] { color: ${campaign.accentColor} !important; }
        .text-orange-500 { color: ${campaign.accentColor} !important; }
        .bg-\[\#E8600A\], .bg-\[\#E8605A\] { background-color: ${campaign.accentColor} !important; }
        .bg-[#E8600A], .bg-[#E8605A] { background-color: ${campaign.accentColor} !important; }
        .bg-orange-600 { background-color: ${campaign.accentColor} !important; }
        .border-\[\#E8600A\] { border-color: ${campaign.accentColor} !important; }
        .border-orange-500 { border-color: ${campaign.accentColor} !important; }
        .focus\:border-\[\#E8600A\]:focus { border-color: ${campaign.accentColor} !important; }
        .focus\:ring-\[\#E8600A\]:focus { --tw-ring-color: ${campaign.accentColor} !important; }
        .hover\:bg-\[\#E8600A\]:hover { background-color: ${campaign.accentColor} !important; }
        .hover\:border-\[\#E8600A\]:hover { border-color: ${campaign.accentColor} !important; }
        .hover\:shadow-\[\#E8600A\]\/5:hover { --tw-shadow-color: ${campaign.accentColor}11 !important; }
        .hover\:bg-\[\#ff7518\]:hover { background-color: ${campaign.accentHoverColor} !important; }
        .bg-\[\#E8600A\]\/10 { background-color: ${campaign.accentColor}1a !important; }
        .bg-\[\#E8600A\]\/20 { background-color: ${campaign.accentColor}33 !important; }
        .border-\[\#E8600A\]\/20 { border-color: ${campaign.accentColor}33 !important; }
        .border-\[\#E8600A\]\/30 { border-color: ${campaign.accentColor}4d !important; }
        .shadow-\[\#E8600A\]\/20 { --tw-shadow: 0 4px 6px -1px ${campaign.accentColor}33, 0 2px 4px -1px ${campaign.accentColor}33 !important; }
        .shadow-\[\#E8600A\]\/35 { --tw-shadow: 0 10px 15px -3px ${campaign.accentColor}59, 0 4px 6px -2px ${campaign.accentColor}59 !important; }
        
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.333%, 0, 0); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }

        /* Holiday Decorations */
        .holiday-particle {
          position: fixed;
          top: -20px;
          pointer-events: none;
          z-index: 9999;
          animation: fall linear infinite;
        }
        @keyframes fall {
          to {
            transform: translateY(105vh) rotate(360deg);
          }
        }
      `}</style>

      {/* Holiday falling decorations engine */}
      {campaign.snowAnimationActive && campaign.themePreset !== 'default' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-20">
          {Array.from({ length: 25 }).map((_, i) => {
            const emojis = {
              christmas: ['❄️', '🎄', '🎁', '✨'],
              independence: ['🇳🇬', '🟢', '⚪', '💚'],
              valentine: ['❤️', '💖', '🌹', '💕'],
              blackfriday: ['⚡', '🛍️', '🔥', '💰'],
            };
            const list = emojis[campaign.themePreset as keyof typeof emojis] || ['❄️'];
            const emoji = list[i % list.length];
            const size = Math.random() * 14 + 10;
            const left = Math.random() * 100;
            const duration = Math.random() * 8 + 6;
            const delay = Math.random() * 8;
            return (
              <span
                key={i}
                className="holiday-particle select-none"
                style={{
                  left: `${left}%`,
                  fontSize: `${size}px`,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                  opacity: Math.random() * 0.6 + 0.4
                }}
              >
                {emoji}
              </span>
            );
          })}
        </div>
      )}

      {/* Dynamic Animated Campaign Marquee Ticker */}
      {campaign.tickerActive && campaign.tickerText && (
        <div className="bg-yellow-400 text-black py-1.5 px-4 text-xs font-bold font-syne select-none overflow-hidden relative border-b border-yellow-500 flex items-center shadow-inner z-55">
          <div className="whitespace-nowrap animate-marquee flex gap-12">
            <span>{campaign.tickerText}</span>
            <span>{campaign.tickerText}</span>
            <span>{campaign.tickerText}</span>
          </div>
        </div>
      )}

      {/* Dynamic Off-line notification panel (Suggestion S10) */}
      <noscript>
        <div className="bg-red-900/80 text-white text-xs px-4 py-2 text-center sticky top-0 z-50">
          For full interactive capability, please enable JavaScript.
        </div>
      </noscript>

      {/* Top Brand bar */}
      <header className="bg-[#003087]/90 backdrop-blur border-b border-zinc-800 text-white py-3 px-4 sm:px-6 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E8600A] text-white flex items-center justify-center font-syne font-extrabold text-xl shadow-md border border-white/10">
              U
            </div>
            <div>
              <h2 className="text-base font-syne tracking-widest font-bold uppercase flex items-center gap-2">
                {campaign.storeName}
              </h2>
              <p className="text-[10px] text-zinc-300 tracking-wider">
                {campaign.storeSubName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <MapPin className="w-3.5 h-3.5 text-[#E8600A]" />
              Deco Road Plaza, Warri
            </span>
            <span className="h-4 w-px bg-zinc-700 hidden sm:inline"></span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-[#E8600A]" />
              Open 8AM - 6PM
            </span>
          </div>
        </div>
      </header>

      {/* Hero promo banner shown on top of Gallery & Showroom */}
      {campaign.campaignActive && (currentTab === 'showroom' || currentTab === 'gallery') && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003087] via-[#05143a] to-[#0A0F1E] border border-zinc-800 p-6 md:p-8 flex flex-col justify-center items-start shadow-xl">
            <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500 to-transparent"></div>
            <span className="bg-[#E8600A] text-white text-[10px] font-syne tracking-widest uppercase px-3 py-1 rounded-full font-bold mb-3">
              {campaign.campaignTag}
            </span>
            <h2 className="text-2xl sm:text-3xl font-syne font-black tracking-tight mb-2 uppercase">
              {campaign.headline}
            </h2>
            <p className="text-zinc-300 text-sm max-w-2xl mb-4 leading-relaxed">
              {campaign.subHeadline}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentTab('infoDesk')}
                className="bg-transparent hover:bg-white/10 text-white border border-white/20 text-xs font-syne font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all"
              >
                Inquire via AI Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary content router */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-4">
        {/* ROOM 1: GALLERY */}
        {currentTab === 'gallery' && (
          <div id="room-gallery" className="space-y-6 animate-scaleIn">
            {/* Unique & Fantastic Category Navigation Block */}
            <div className="bg-[#0F172A] p-6 rounded-2xl border border-zinc-800 space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-1.5 w-1/4 bg-[#E8600A] rounded-tr-2xl"></div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-syne font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#E8600A] animate-pulse"></span>
                    Interactive Product Inspector
                  </h3>
                  <p className="text-xs text-zinc-400">Pinch or scale to inspect multi-angles & variant sets prior to ordering.</p>
                </div>
              </div>

              {/* Unique Visual Category Tabs with Icons */}
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar scroll-smooth pb-2 border-b border-zinc-800/80">
                {categories.map((cat) => {
                  let CategoryIcon = Layers;
                  if (cat === 'Televisions') CategoryIcon = Tv;
                  else if (cat === 'Refrigerators') CategoryIcon = Snowflake;
                  else if (cat === 'Washing Machines') CategoryIcon = RotateCw;
                  else if (cat === 'Air Conditioners') CategoryIcon = Wind;
                  else if (cat === 'Kitchen Appliances') CategoryIcon = Flame;
                  else if (cat === 'Solar') CategoryIcon = Sun;
                  else if (cat === 'CCTV') CategoryIcon = Eye;

                  const isActive = activeGalleryCategory === cat;
                  return (
                    <button
                      key={`gal-cat-${cat}`}
                      type="button"
                      onClick={() => setActiveGalleryCategory(cat)}
                      className={`px-4 py-2.5 rounded-xl border text-[10px] sm:text-xs font-syne font-extrabold uppercase tracking-widest shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-[#E8600A] to-orange-500 border-[#E8600A] text-white shadow-lg shadow-[#E8600A]/10'
                          : 'bg-[#050B18] border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <CategoryIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>

              {/* Horizontal Scrollable Product Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                  <span>Showroom Deck ({filteredGalleryProducts.length} Items found)</span>
                  <span className="text-[9px] text-[#E8600A] animate-pulse">Select an item below to load 3D view &rarr;</span>
                </div>
                
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 pt-1 scroll-smooth">
                  {filteredGalleryProducts.map((p) => {
                    const isSelected = selectedGalleryProductId === p.id;
                    return (
                      <div
                        key={`gal-sel-card-${p.id}`}
                        onClick={() => {
                          setSelectedGalleryProductId(p.id);
                          setActiveGalleryColorIdx(-1);
                        }}
                        className={`min-w-[210px] sm:min-w-[240px] max-w-[250px] p-3 rounded-xl border cursor-pointer transition-all hover:scale-102 flex items-center gap-3 select-none relative ${
                          isSelected
                            ? 'border-[#E8600A] shadow-md shadow-[#E8600A]/5 bg-gradient-to-b from-[#0F172A] to-[#050B18] ring-1 ring-[#E8600A]/30'
                            : 'bg-[#050B18] border-zinc-850 hover:border-zinc-750'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E8600A]" />
                        )}
                        <div className="w-12 h-12 rounded-lg bg-zinc-950 p-1 shrink-0 flex items-center justify-center border border-zinc-800">
                          <img src={p.heroImage} alt={p.name} className="max-h-full max-w-full object-contain rounded" />
                        </div>
                        <div className="min-w-0 flex-grow text-left">
                          <p className={`text-[11px] font-syne font-extrabold uppercase truncate ${isSelected ? 'text-[#E8600A]' : 'text-zinc-300'}`}>
                            {p.name}
                          </p>
                          <p className="text-[9px] text-zinc-500 font-mono truncate">{p.model || p.category}</p>
                          <p className="text-[10px] text-white font-mono mt-0.5 font-black">
                            ₦{p.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {selectedGalleryProduct ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Visual Canvas layout Page 3 (1 Hero + 3-4 Angle Shots) */}
                <div className="lg:col-span-8 space-y-4">
                  <div
                    onMouseEnter={() => setIsHoveringImage(true)}
                    onMouseLeave={() => setIsHoveringImage(false)}
                    className="bg-[#050B18] border border-zinc-800 rounded-2xl overflow-hidden relative group flex items-center justify-center p-3 aspect-video select-none"
                  >
                    {/* The primary gallery image with fade-in on transition */}
                    <img
                      key={`gallery-img-${selectedGalleryHeroImage}`}
                      src={selectedGalleryHeroImage}
                      alt={selectedGalleryProduct.name}
                      style={{ transform: `scale(${scale})` }}
                      className="max-h-full max-w-full object-contain rounded-xl transition-all duration-300 animate-fadeIn"
                    />

                    {/* Navigation Buttons (Left & Right chevrons) visible on hover */}
                    {productAngles.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrevAngle();
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-[#E8600A] text-white border border-zinc-800 opacity-0 group-hover:opacity-100 transition-all duration-250 cursor-pointer flex items-center justify-center z-10 hover:scale-105 active:scale-95"
                          title="Previous Angle"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNextAngle();
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-[#E8600A] text-white border border-zinc-800 opacity-0 group-hover:opacity-100 transition-all duration-250 cursor-pointer flex items-center justify-center z-10 hover:scale-105 active:scale-95"
                          title="Next Angle"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </>
                    )}

                    {/* Scale slider (Simulated Touch pinch and zoom) */}
                    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur rounded-lg p-2 border border-zinc-800 flex items-center gap-2 z-10">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold">Zoom: {scale}x</span>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={scale}
                        onChange={e => setScale(Number(e.target.value))}
                        className="w-20 accent-[#E8600A]"
                      />
                    </div>

                    {/* Autoplay Controls: Sleek Badge Overlay with Pause/Play Indicator */}
                    {productAngles.length > 1 && (
                      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAutoplay(!isAutoplay);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider font-mono flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur ${
                            isAutoplay
                              ? 'bg-[#E8600A]/20 hover:bg-[#E8600A]/30 border-[#E8600A]/40 text-[#E8600A]'
                              : 'bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                          title={isAutoplay ? "Pause Auto-Slide" : "Play Auto-Slide"}
                        >
                          {isAutoplay ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E8600A] animate-pulse" />
                              <span>Auto sliding</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                              <span>Autoplay Paused</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="absolute top-4 left-4 bg-[#E8600A] text-white text-xs font-syne font-extrabold px-3 py-1.5 rounded-lg shadow-md uppercase z-10">
                      ₦{(activeGalleryColorIdx >= 0 && selectedGalleryProduct.variants[activeGalleryColorIdx] ? selectedGalleryProduct.price : selectedGalleryProduct.price).toLocaleString()}
                    </div>

                    {/* Active slide progress line bar indicating autoplay cycle countdown */}
                    {isAutoplay && !isHoveringImage && scale === 1 && productAngles.length > 1 && (
                       <div
                        key={`gallery-bar-${selectedGalleryHeroImage}`}
                        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#E8600A] to-orange-500 animate-slideProgress"
                      />
                    )}
                  </div>

                  {/* VARIANT SQUARES ZONE (6 slots) - Page 3 */}
                  <div className="bg-[#0F172A] p-4 rounded-xl border border-zinc-800 space-y-3">
                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                      VARIANT ZONE — 6 Smaller Slots (Colors / Models / SKUs)
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {/* Active base variant slot */}
                      <button
                        onClick={() => setActiveGalleryColorIdx(-1)}
                        className={`p-1.5 rounded-lg border bg-[#050B18] transition-all flex flex-col items-center justify-center text-center ${activeGalleryColorIdx === -1 ? 'border-[#E8600A] ring-1 ring-[#E8600A]' : 'border-zinc-800 hover:border-zinc-700'}`}
                      >
                        <img src={selectedGalleryProduct.heroImage} alt="Base" className="w-10 h-10 object-contain rounded" />
                        <span className="text-[9px] text-zinc-400 font-semibold mt-1 truncate max-w-full">Default</span>
                      </button>

                      {/* Explicit Variant list */}
                      {selectedGalleryProduct.variants.map((variant, i) => (
                        <button
                          key={variant.id}
                          onClick={() => setActiveGalleryColorIdx(i)}
                          className={`p-1.5 rounded-lg border bg-[#050B18] transition-all flex flex-col items-center justify-center text-center ${activeGalleryColorIdx === i ? 'border-[#E8600A] ring-1 ring-[#E8600A]' : 'border-zinc-800 hover:border-zinc-700'}`}
                        >
                          <img src={variant.heroImage} alt={variant.colorName} className="w-10 h-10 object-contain rounded" />
                          <span className="text-[9px] text-[#E8600A] font-bold mt-1 truncate max-w-full">{variant.colorName}</span>
                        </button>
                      ))}

                      {/* Unset placeholder slots */}
                      {Array.from({ length: Math.max(0, 5 - selectedGalleryProduct.variants.length) }).map((_, placeholderIdx) => (
                        <div
                          key={`unset-${placeholderIdx}`}
                          onClick={() => setCurrentTab('staff')}
                          className="p-1.5 rounded-lg border border-dashed border-zinc-800/80 bg-[#0A0F1E]/50 flex flex-col items-center justify-center text-center text-zinc-600 hover:text-zinc-500 hover:border-zinc-700 cursor-pointer transition-all"
                        >
                          <Plus className="w-5 h-5 mb-1" />
                          <span className="text-[8px] uppercase font-bold tracking-tight">Add Variant</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side Angle panel */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-[#0F172A] p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <div>
                      <span className="text-[10px] text-[#E8600A] font-syne uppercase tracking-widest font-extrabold">{selectedGalleryProduct.category}</span>
                      <h4 className="text-xl font-syne font-black uppercase text-white mt-1">{selectedGalleryProduct.name}</h4>
                      {selectedGalleryProduct.model && (
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">{selectedGalleryProduct.model}</p>
                      )}
                    </div>

                    <div className="border-t border-b border-zinc-800 py-3 flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Stock Availability:</span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${selectedGalleryProduct.stockStatus === 'In Stock' ? 'text-green-400' : 'text-zinc-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${selectedGalleryProduct.stockStatus === 'In Stock' ? 'bg-[#25D366]' : 'bg-zinc-600'}`}></span>
                        {selectedGalleryProduct.stockStatus}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {selectedGalleryProduct.description}
                    </p>

                     {/* ANGLE VIEW ZONE (Page 3) */}
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                        ANGLE CLUSTER — Select view
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {productAngles.map((angle) => (
                          <button
                            key={angle.name}
                            type="button"
                            onClick={() => {
                              setSelectedGalleryHeroImage(angle.url);
                              setIsAutoplay(false);
                            }}
                            className={`p-2 rounded-lg border bg-[#050B18] flex items-center gap-2 text-left transition-all cursor-pointer ${
                              selectedGalleryHeroImage === angle.url
                                ? 'border-[#E8600A] text-[#E8600A] font-bold'
                                : 'border-zinc-800 hover:border-zinc-700 text-zinc-400'
                            }`}
                          >
                            <span className="text-[10px] font-bold uppercase">{angle.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <a
                        href={waLink('+2349060672127', `Hello Ugomenz support, I am interested in checking out the ${selectedGalleryProduct.name} in your showroom.`)}
                        target="_blank"
                        className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-syne uppercase tracking-wider font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Inquire on WhatsApp
                      </a>
                      <button
                        onClick={() => setCurrentTab('invoice')}
                        className="w-full py-3 px-4 bg-[#E8600A] hover:bg-[#ff7518] text-white text-xs font-syne uppercase tracking-wider font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <CreditCard className="w-4 h-4" />
                        Purchase now (Invoice)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-zinc-500 py-12">No products loaded.</p>
            )}
          </div>
        )}

        {/* ROOM 2: VIDEOS */}
        {currentTab === 'videos' && (() => {
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
            <div id="room-videos" className="space-y-6 animate-scaleIn max-w-4xl mx-auto">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-syne font-black uppercase text-white">Ugomenz Store Walkthroughs</h3>
                <p className="text-sm text-zinc-400">Review video inspections of our respective department corners at Deco Road, Warri.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {videoList.map((video, idx) => (
                  <div key={`video-item-${idx}`} className="bg-[#0F172A] border border-zinc-800 p-5 rounded-2xl shadow-xl space-y-4 flex flex-col justify-between">
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-zinc-800 relative">
                      <iframe
                        title={`Ugomenz Store Walkthrough ${idx + 1}`}
                        src={getEmbedUrl(video)}
                        allowFullScreen
                        className="w-full h-full"
                      ></iframe>
                    </div>

                    <div className="border-t border-zinc-800/60 pt-3 flex justify-between items-center text-xs">
                      <div>
                        <h4 className="text-xs font-syne uppercase font-bold text-white">Department Tour Segment #{idx + 1}</h4>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Deco Road Showroom Segment</p>
                      </div>
                      <span className="bg-[#E8600A]/10 text-[#E8600A] text-[9px] font-bold py-1 px-2.5 rounded-full uppercase border border-[#E8600A]/20 font-sans">
                        Live Feed
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={() => setCurrentTab('staff')}
                  className="text-xs text-[#E8600A] font-bold font-syne uppercase border border-[#E8600A]/30 hover:bg-[#E8600A]/10 px-6 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Configure Videography Walkthroughs &rarr;
                </button>
              </div>
            </div>
          );
        })()}

        {/* ROOM 3: SHOWROOM */}
        {currentTab === 'showroom' && (
          <div id="room-[#showroom]" className="space-y-6 animate-scaleIn">
            <div className="space-y-4">
              {/* Category Filter Bar */}
              <div className="sticky top-16 z-30 bg-[#0A0F1E] py-2">
                <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1 border-b border-zinc-800/80">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategoryFilter(cat)}
                      className={`px-4 py-2 text-xs font-syne font-extrabold uppercase tracking-widest rounded-full border shrink-0 transition-all ${activeCategoryFilter === cat ? 'bg-[#E8600A] border-[#E8600A] text-white' : 'border-[#003087] text-zinc-400 hover:text-white hover:border-zinc-700'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4.5 h-4.5" />
                <input
                  type="text"
                  placeholder="Search Samsung TVs, Scanfrost Fridges, Bruhm Freezers, or solar panels..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0F172A] text-white pl-10 pr-4 py-3 text-xs rounded-xl border border-zinc-800 placeholder-zinc-500 focus:outline-none focus:border-[#E8600A] focus:ring-1 focus:ring-[#E8600A] transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs font-bold px-2 py-1 bg-zinc-800 rounded">
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* PINTEREST MASONRY GRID (4 columns, variable heights) - Page 5 */}
            {filteredProducts.length > 0 ? (
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {filteredProducts.map((prod) => {
                  // Real Pinterest-styled dynamic heights reflecting actual appliance/product geometries
                  let heightClass = "aspect-square";
                  if (prod.category === 'Refrigerators' || prod.id === 'jinko-solar-450w' || prod.category === 'Solar') {
                    heightClass = "aspect-[3/4]"; // Taller upright products
                  } else if (prod.category === 'Televisions' || prod.category === 'Air Conditioners') {
                    heightClass = "aspect-video"; // Broad horizontal screens or split ACs
                  } else if (prod.category === 'Washing Machines' || prod.category === 'Kitchen Appliances') {
                    heightClass = "aspect-[4/5]"; // Compact vertical units
                  } else {
                    heightClass = "aspect-square";
                  }

                  return (
                    <div
                      key={`gallery-product-card-${prod.id}`}
                      onClick={() => {
                        setQuickViewProduct(prod);
                        recordRoomVisit(`quick_view_${prod.id}`);
                      }}
                      className="break-inside-avoid bg-[#0F172A] border border-zinc-800/80 hover:border-[#E8600A] hover:shadow-lg hover:shadow-[#E8600A]/5 rounded-2xl overflow-hidden relative group cursor-pointer transition-all flex flex-col mb-4"
                    >
                      {/* Product full-bleed face */}
                      <div className={`relative ${heightClass} bg-[#050B18] overflow-hidden`}>
                        <img
                          src={prod.heroImage}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent"></div>

                        {/* Floating orange price badge bottom-left */}
                        <div className="absolute bottom-3 left-3 bg-[#E8600A] text-white text-xs font-syne font-extrabold px-3 py-1.5 rounded-lg shadow-md">
                          {prod.price === 0 ? 'Call for Price' : `₦${prod.price.toLocaleString()}`}
                        </div>

                        {/* Stock dot */}
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-[10px] text-white px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 font-bold">
                          <span className={`w-1.5 h-1.5 rounded-full ${prod.stockStatus === 'In Stock' ? 'bg-[#25D366]' : 'bg-zinc-600'}`}></span>
                          {prod.stockStatus === 'In Stock' ? 'In Stock' : 'Out of Stock'}
                        </div>
                      </div>

                      {/* Information Overlay */}
                      <div className="p-4 space-y-2 flex-grow flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase">{prod.model || 'Model'}</p>
                          <h4 className="text-white text-sm font-syne uppercase font-bold group-hover:text-[#E8600A] transition-colors">
                            {prod.name}
                          </h4>
                        </div>

                        {/* Fast checkout links */}
                        <div className="flex gap-2 pt-2 border-t border-zinc-800/80">
                          <a
                            href={waLink('+2349060672127', `Hi support, I want to inquire about: ${prod.name} (Price: ₦${prod.price.toLocaleString()}).`)}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            className="bg-zinc-800/80 hover:bg-[#25D366] hover:text-white p-2.5 rounded-xl border border-zinc-700/50 flex-grow text-center text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentTab('invoice');
                            }}
                            className="bg-[#003087] hover:bg-[#E8600A] text-white px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all"
                          >
                            Buy
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-zinc-500 py-12">No products matched your inquiry.</p>
            )}

            {/* Banner of Store walkthrough photos Page 4 - Pinterest styled */}
            <div className="bg-[#050D1D] p-5 rounded-2xl border border-zinc-800 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-sm font-syne uppercase font-bold tracking-widest text-[#E8600A] flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#E8600A] animate-pulse"></span>
                    Showroom Hub Walkthrough Pins
                  </h4>
                  <p className="text-xs text-zinc-400">Actual high-definition walkthrough photographs from Ugomenz Deco Road Mall, Warri.</p>
                </div>
                {myPinnedPhotos.length > 0 && (
                  <div className="bg-[#E8600A]/10 border border-[#E8600A]/30 rounded-full px-3.5 py-1.5 text-[10px] text-white font-bold flex items-center gap-1.5 backdrop-blur-sm self-start">
                    <Pin className="w-3 h-3 text-[#E8600A] fill-[#E8600A]" />
                    <span>My Pinned Hubs ({myPinnedPhotos.length})</span>
                  </div>
                )}
              </div>

              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 pt-2">
                {showroomPhotos.map((ph, i) => {
                  const isPinned = myPinnedPhotos.includes(ph.id || '');
                  // Variable height ratios for elegant Pinterest layout
                  let imageAspect = "aspect-video";
                  if (i % 3 === 0) {
                    imageAspect = "aspect-[3/4]"; // Taller portrait pin
                  } else if (i % 3 === 1) {
                    imageAspect = "aspect-square"; // Balanced square pin
                  } else {
                    imageAspect = "aspect-[4/3]"; // Horizontal split pin
                  }

                  const simulatedLikes = 85 + (i * 23) % 48;
                  const simulatedSaves = 18 + (i * 12) % 32;

                  return (
                    <div
                      key={`showroom-photo-${ph.id || i}`}
                      onClick={() => {
                        setActiveLightboxPhotoIdx(i);
                        recordRoomVisit(`showroom_inspect_${ph.id || i}`);
                      }}
                      className="break-inside-avoid group relative rounded-2xl overflow-hidden border border-zinc-800/80 hover:border-[#E8600A] hover:shadow-xl hover:shadow-[#E8600A]/5 bg-[#0A0F1E] transition-all duration-300 cursor-zoom-in mb-4 flex flex-col"
                    >
                      <div className={`relative ${imageAspect} overflow-hidden w-full`}>
                        <img
                          src={ph.imageUrl}
                          alt={ph.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                        />
                        {/* Semi-transparent dark overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-950/20 to-transparent group-hover:via-zinc-950/45 transition-all duration-305"></div>

                        {/* Top action block: floating Pinterest Save Button, displays on hover */}
                        <div className="absolute top-3 left-3 right-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                          <span className="text-[9px] bg-zinc-950/80 backdrop-blur border border-zinc-700/60 text-zinc-300 px-2 py-1 rounded-full font-bold">
                            Deco Road Hub
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePinPhoto(ph.id || '');
                            }}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-syne uppercase font-extrabold flex items-center gap-1 transition-all ${
                              isPinned
                                ? 'bg-[#E8600A] text-white hover:bg-[#ff7518]'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                            }`}
                          >
                            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-white' : ''}`} />
                            <span>{isPinned ? 'Pinned' : 'Save'}</span>
                          </button>
                        </div>

                        {/* Bottom Metadata & inspect shortcuts */}
                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-10">
                          <div className="max-w-[70%] text-left">
                            <span className="text-[9px] text-[#E8600A] font-bold uppercase tracking-wider">{`Spot ${i + 1}`}</span>
                            <p className="text-white font-syne font-black text-xs uppercase leading-tight mt-0.5 truncate drop-shadow">
                              {ph.title}
                            </p>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePinPhoto(ph.id || '');
                              }}
                              className={`w-7.5 h-7.5 rounded-full flex items-center justify-center border transition-all ${
                                isPinned
                                  ? 'bg-[#E8600A] border-[#E8600A] text-white'
                                  : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-900'
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isPinned ? 'fill-white' : ''}`} />
                            </button>
                            <div className="w-7.5 h-7.5 rounded-full bg-[#E8600A] text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pinterest Description Card underneath */}
                      <div className="p-3 bg-[#0F172A] border-t border-zinc-800/80 space-y-1.5 text-left flex-grow">
                        <p className="text-[11px] text-zinc-400 font-medium leading-relaxed line-clamp-2">
                          {ph.description || "Take an exclusive visual look inside our physical tech & electronics showroom."}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
                          <span>❤️ {simulatedLikes + (isPinned ? 1 : 0)} likes</span>
                          <span>📌 {simulatedSaves + (isPinned ? 1 : 0)} pins</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ROOM 4: AI DESK */}
        {currentTab === 'infoDesk' && (
          <div id="room-infoDesk" className="space-y-4 animate-scaleIn max-w-3xl mx-auto">
            <div className="bg-[#0F172A] border border-zinc-800 p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E8600A]/20 flex items-center justify-center text-[#E8600A]">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-syne font-extrabold uppercase">AI Assistant Support Desk</h3>
                <p className="text-xs text-zinc-400">Powered by server-side Gemini intelligence. Get real-time stock estimates, bank credentials & support hours.</p>
              </div>
            </div>

            {/* Conversation list */}
            <div className="bg-[#050B18] border border-zinc-800 rounded-2xl flex flex-col h-[400px] overflow-hidden">
              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {aiChatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-[#E8600A] text-white rounded-br-none' : 'bg-[#1E293B] text-zinc-150 rounded-bl-none border border-zinc-800'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#1E293B] border border-zinc-800 rounded-2xl rounded-bl-none p-4 flex items-center gap-2 text-xs text-zinc-400">
                      <Loader2 className="w-4 h-4 animate-spin text-[#E8600A]" />
                      Assistant thinking...
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (chatInput.trim()) handleSendAiMessage(chatInput);
                }}
                className="p-3 border-t border-zinc-800 bg-[#0F172A] flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask about Samsung TVs, Scanfrost Fridges, Bruhm Freezers, or business hours..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="flex-grow bg-[#0A0F1E] border border-zinc-700 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-[#E8600A] text-white"
                />
                <button
                  type="submit"
                  disabled={isAiLoading || !chatInput.trim()}
                  className="bg-[#E8600A] hover:bg-[#ff7518] text-white px-4 py-3 rounded-xl text-xs font-syne font-extrabold uppercase tracking-wider transition-all disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </div>

            {/* Context helpers */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest pl-1">Suggestion Queries</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  'What are the specifications of HP Omnibook flagship?',
                  'Recommend a solar panel inverter bundle package',
                  'Show me physical store location and opening hours',
                  'What is the Ugomenz Electronics bank details for transfer?'
                ].map(item => (
                  <button
                    key={item}
                    onClick={() => handleSendAiMessage(item)}
                    className="bg-zinc-800/80 hover:bg-[#003087] hover:text-white text-zinc-300 border border-zinc-700/50 px-3 py-2 rounded-xl text-left font-medium transition-all"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ROOM 5: CHANNEL */}
        {currentTab === 'channel' && (
          <div id="room-[#channel]" className="space-y-6 animate-scaleIn max-w-4xl mx-auto">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-syne font-black uppercase text-white">Ugomenz Official Social Platforms</h3>
              <p className="text-xs text-zinc-400">Join our lists to stay updated about hot arrival price lists in Warri.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {SOCIALS.map((soc) => (
                <a
                  key={soc.name}
                  href={soc.link}
                  target={soc.link !== '#' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="bg-[#0F172A] border border-zinc-800 hover:border-[#E8600A] p-5 rounded-2xl flex flex-col items-center justify-center text-center group transition-all"
                >
                  <div className={`w-12 h-12 rounded-full ${soc.color} text-white flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg`}>
                    <soc.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-syne font-extrabold uppercase text-sm text-white group-hover:text-[#E8600A] transition-colors">{soc.name}</h4>
                  <p className="text-[11px] text-zinc-500 mt-1">{soc.info}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ROOM 6: LIVE SHEET */}
        {currentTab === 'livesheet' && (
          <div id="room-[#livesheet]" className="space-y-6 animate-scaleIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0F172A] p-4 rounded-xl border border-zinc-800">
              <div>
                <h3 className="text-sm font-syne font-extrabold uppercase">Live Price List & Reference coordinates</h3>
                <p className="text-xs text-zinc-400">Synchronized directly with the showroom price manifests.</p>
              </div>
              <a
                href="https://sheets.google.com"
                target="_blank"
                className="bg-[#25D366] hover:bg-[#1eba4e] text-white text-xs font-syne font-extrabold uppercase px-4 py-2.5 rounded-lg flex items-center gap-2 tracking-wider shadow-lg transition-all"
              >
                <FileText className="w-4 h-4" />
                Go to Google spreadsheet
              </a>
            </div>

            <div className="bg-[#050B18] rounded-xl border border-zinc-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#003087]/50 border-b border-zinc-800 text-white font-syne uppercase">
                      <th className="p-4 font-extrabold">Product Name</th>
                      <th className="p-4 font-extrabold">Category</th>
                      <th className="p-4 font-extrabold">Official Price</th>
                      <th className="p-4 font-extrabold">Status</th>
                      <th className="p-4 font-extrabold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={`product-spec-row-${p.id}`} className="border-b border-zinc-800 hover:bg-[#0F172A]/50 transition-colors">
                        <td className="p-4 font-semibold text-white">
                          <div>
                            <p>{p.name}</p>
                            {p.model && <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{p.model}</p>}
                          </div>
                        </td>
                        <td className="p-4 text-zinc-400 capitalize">{p.category}</td>
                        <td className="p-4 font-bold text-[#E8600A]">
                          {p.price === 0 ? 'Call for Price' : `₦${p.price.toLocaleString()}`}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold ${p.stockStatus === 'In Stock' ? 'text-green-400' : 'text-zinc-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.stockStatus === 'In Stock' ? 'bg-[#25D366]' : 'bg-zinc-600'}`}></span>
                            {p.stockStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedGalleryProductId(p.id);
                              setCurrentTab('gallery');
                            }}
                            className="bg-zinc-800 hover:bg-[#003087] text-white px-2.5 py-1 rounded text-[10px] font-syne uppercase font-extrabold transition-all"
                          >
                            View Gallery
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ROOM 7: INVOICE / RECEIPT GENERATOR */}
        {currentTab === 'invoice' && (
          <div id="room-invoice" className="space-y-8 animate-scaleIn">
            
            {/* Payment Coordinates & Header Banner */}
            <div className="bg-[#0F172A] border border-zinc-800 p-6 rounded-3xl relative overflow-hidden shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="absolute top-0 left-0 h-1 md:h-full w-full md:w-1 bg-[#1a6fd4]"></div>
              <div className="space-y-1.5 text-left">
                <span className="text-[10px] text-[#1a6fd4] font-syne uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1a6fd4] animate-pulse"></span>
                  ROOM 7 · OFFICIAL DIGITAL CLEARANCE
                </span>
                <h3 className="text-xl md:text-2xl font-syne font-black uppercase text-white">
                  UGOMENZ ELECTRONICS PAYMENT TERMINAL
                </h3>
                <p className="text-xs text-zinc-400 max-w-2xl">
                  Process customer invoice payments, log secure transactions directly to Firestore Cloud, and generate certified digital receipts.
                </p>
              </div>

              {/* Bank Details Badged Card */}
              <div className="bg-[#050B18] border border-zinc-850 p-4 rounded-2xl flex items-center justify-between gap-6 w-full md:w-auto shrink-0 select-all">
                <div className="text-left font-mono">
                  <p className="text-[9px] text-[#1a6fd4] uppercase font-black tracking-wider">OFFICIAL REPOSIT BANK</p>
                  <p className="text-sm text-white font-bold tracking-widest mt-0.5">{bank.accountNumber}</p>
                  <p className="text-[10px] text-zinc-400 capitalize mt-0.5">{bank.accountName} · {bank.bank}</p>
                </div>
                <button
                  onClick={handleCopyAccount}
                  className="px-3.5 py-2.5 bg-[#1a6fd4] hover:bg-[#1e83f6] text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-syne font-bold uppercase tracking-wider cursor-pointer shrink-0"
                >
                  {copiedInvoice ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                  {copiedInvoice ? 'COPIED' : 'COPY'}
                </button>
              </div>
            </div>

            {/* Core Workspace Side-by-Side: Form and Active Receipt */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Form Generator (xl:col-span-6) */}
              <div className="xl:col-span-6 space-y-6">
                <div className="bg-[#0F172A] border border-zinc-800 p-6 rounded-3xl shadow-xl space-y-6">
                  <div className="border-b border-zinc-800/80 pb-4 text-left">
                    <h4 className="text-base font-syne font-black text-white uppercase tracking-wider">
                      RECEIPT GENERATOR SHEET
                    </h4>
                    <p className="text-xs text-[#1a6fd4] mt-0.5 font-mono">Input coordinates below to build verified slip</p>
                  </div>

                  <form onSubmit={handleReceiptSubmit} className="space-y-4 text-xs font-semibold text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Field 1: Receipt Purpose */}
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Receipt Purpose <span className="text-red-400">*</span></label>
                        <select
                          value={receiptPurpose}
                          onChange={e => setReceiptPurpose(e.target.value)}
                          className="w-full bg-[#050B18] text-white text-xs border border-zinc-700 hover:border-[#1a6fd4]/40 rounded-xl p-3 focus:outline-none focus:border-[#1a6fd4] transition-all cursor-pointer font-syne font-bold"
                        >
                          <option value="TV">TV (Television)</option>
                          <option value="Fridge">Fridge (Refrigerator)</option>
                          <option value="AC">Air Conditioner (AC)</option>
                          <option value="Washing Machine">Washing Machine</option>
                          <option value="Generator">Power Generator</option>
                          <option value="Home Theater">Home Theater System</option>
                          <option value="Sound System">Audio/Sound System</option>
                          <option value="Small Appliance">Small Appliance</option>
                          <option value="Service/Repair">Service & Repairs</option>
                          <option value="Other">Other Items</option>
                        </select>
                      </div>

                      {/* Field 2: Customer Name */}
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Customer Name <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Fortune"
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          className="w-full bg-[#050B18] border border-zinc-700 hover:border-[#1a6fd4]/40 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#1a6fd4] transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Field 3: Phone Number */}
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Phone Number (For WhatsApp) <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. +2348031234567"
                          value={customerPhone}
                          onChange={e => setCustomerPhone(e.target.value)}
                          className="w-full bg-[#050B18] border border-zinc-700 hover:border-[#1a6fd4]/40 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#1a6fd4] transition-all font-mono"
                        />
                      </div>

                      {/* Field 4: Amount Paid */}
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Amount Paid (₦) <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold font-sans">₦</span>
                          <input
                            type="number"
                            required
                            placeholder="e.g. 250000"
                            value={amountPaid}
                            onChange={e => setAmountPaid(e.target.value)}
                            className="w-full bg-[#050B18] border border-zinc-700 hover:border-[#1a6fd4]/40 rounded-xl py-3 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-[#1a6fd4] transition-all font-bold font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Field 5: Payment Method */}
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Payment Mode <span className="text-red-400">*</span></label>
                        <select
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value)}
                          className="w-full bg-[#050B18] text-white text-xs border border-zinc-700 hover:border-[#1a6fd4]/40 rounded-xl p-3 focus:outline-none focus:border-[#1a6fd4] transition-all cursor-pointer font-syne font-bold"
                        >
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash</option>
                          <option value="POS">POS</option>
                          <option value="USSD">USSD</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Field 6: Balance */}
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Balance Owed <span className="text-zinc-500">(Optional)</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold font-sans">₦</span>
                          <input
                            type="number"
                            placeholder="e.g. 0"
                            value={balanceOwed}
                            onChange={e => setBalanceOwed(e.target.value)}
                            className="w-full bg-[#050B18] border border-zinc-700 hover:border-[#1a6fd4]/40 rounded-xl py-3 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-[#1a6fd4] transition-all font-medium font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Field 7: Service/Product Description */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Product/Service Description <span className="text-red-400">*</span></label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Provide details (e.g. LG Smart TV OLED 65' Thin Q, Serial No: Model-OLED-6539)"
                        value={productDescription}
                        onChange={e => setProductDescription(e.target.value)}
                        className="w-full bg-[#050B18] border border-zinc-700 hover:border-[#1a6fd4]/40 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#1a6fd4] transition-all font-mono"
                      />
                    </div>

                    {/* Field 8: Issued By */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Issued By (Staff Name) <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Staff Name"
                        value={issuedBy}
                        onChange={e => setIssuedBy(e.target.value)}
                        className="w-full bg-[#050B18] border border-zinc-700 hover:border-[#1a6fd4]/40 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#1a6fd4] transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 px-4 bg-[#1a6fd4] hover:bg-[#1e83f6] text-white text-xs font-syne uppercase tracking-wider font-extrabold rounded-2xl transition-all cursor-pointer shadow-lg shadow-[#1a6fd4]/15 mt-2 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-white" />
                      Create & Archive Official Receipt
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Active Receipt Live Display (xl:col-span-6) */}
              <div className="xl:col-span-6 space-y-6">
                {receiptGenerated ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-syne font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        PREVIEW OUTLET
                      </span>
                      <button
                        onClick={() => setReceiptGenerated(null)}
                        className="text-[10px] text-zinc-400 hover:text-white px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer transition-all"
                      >
                        Reset Preview
                      </button>
                    </div>

                    {/* Stunning Interactive Receipt Card */}
                    <div 
                      id="room-receipt-card-print" 
                      className="bg-gradient-to-b from-[#0F172A] to-[#050B18] border border-zinc-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden text-left"
                    >
                      <div className="absolute top-0 right-0 h-2 w-1/3 bg-[#1a6fd4]"></div>
                      
                      {/* Branding Banner */}
                      <div className="text-center border-b border-zinc-800/80 pb-6 space-y-1">
                        <h2 className="text-lg md:text-xl font-syne font-black uppercase text-white tracking-wider">
                          UGOMENZ ELECTRONICS
                        </h2>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
                          Your Trusted Home Electronics & Appliances Store
                        </p>
                        <p className="text-[9px] text-[#1a6fd4] tracking-wider font-mono">
                          Official Digital Showroom Plazas · Deco Road Delta
                        </p>
                      </div>

                      {/* Receipt Title Section */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">DOCUMENT CATEGORY</span>
                          <h3 className="text-sm font-syne font-black uppercase text-[#1a6fd4]">
                            OFFICIAL PAYMENT RECEIPT
                          </h3>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">SLIP ID</span>
                          <p className="text-xs text-emerald-400 font-bold font-mono uppercase">
                            {receiptGenerated.receiptNo}
                          </p>
                        </div>
                      </div>

                      {/* Recipient Coordinates */}
                      <div className="grid grid-cols-2 gap-4 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-905 text-xs">
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">CUSTOMER COORDINATES</span>
                          <p className="font-extrabold text-zinc-205 capitalize">{receiptGenerated.customerName}</p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{receiptGenerated.customerPhone}</p>
                          {receiptGenerated.customerEmail && (
                            <p className="text-[10px] text-[#1a6fd4] truncate max-w-full font-mono">{receiptGenerated.customerEmail}</p>
                          )}
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-505 uppercase font-bold tracking-wider block mb-1">TRANSACTION DETAILS</span>
                          <p className="text-zinc-200"><span className="text-zinc-500">Date:</span> {receiptGenerated.dateStr}</p>
                          <p className="text-zinc-200"><span className="text-zinc-500">Purpose:</span> {receiptGenerated.purpose} Receipt</p>
                          <p className="text-zinc-200"><span className="text-zinc-500">Method:</span> {receiptGenerated.paymentMethod}</p>
                        </div>
                      </div>

                      {/* Description Box */}
                      <div className="space-y-2">
                        <span className="text-[9px] text-zinc-550 uppercase font-bold tracking-wider block">PRODUCT/SERVICE DESCRIPTION</span>
                        <div className="bg-[#050B18] border border-zinc-900 p-4 rounded-xl text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">
                          {receiptGenerated.description}
                        </div>
                      </div>

                      {/* Ledger Calculations */}
                      <div className="border-t border-b border-zinc-800/60 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <p className="text-[11px] text-zinc-505 font-mono uppercase tracking-widest">AMOUNT REMITTED</p>
                          <p className="text-xl md:text-2xl font-syne font-black text-white mt-1">
                            ₦{receiptGenerated.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-[11px] text-zinc-505 font-mono uppercase tracking-widest">LEDGER BALANCE STATUS</p>
                          {receiptGenerated.balance > 0 ? (
                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-950/40 border border-red-500/30 text-red-400 rounded-full font-mono text-xs font-bold mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                              Owed: ₦{receiptGenerated.balance.toLocaleString()} (Remaining)
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-full font-mono text-xs font-bold mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              PAID IN FULL
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Brand Note & Bank Info */}
                      <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[10px] text-zinc-550">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-zinc-400">Issued By: {receiptGenerated.issuedBy}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-zinc-400">Thank you for your patronage!</p>
                          <p className="font-mono text-[9px]">{bank.bank} · Acct: {bank.accountNumber}</p>
                        </div>
                      </div>
                    </div>

                    {/* Export Choices Panel */}
                    <div className="bg-[#0f172a] border border-zinc-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold font-syne uppercase">
                      <button
                        onClick={() => downloadReceiptPDF(receiptGenerated)}
                        className="py-3 px-2 bg-gradient-to-r from-blue-600 to-[#1a6fd4] hover:from-blue-700 hover:to-blue-600 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
                      >
                        <FileText className="w-3.5 h-3.5 text-white" />
                        PDF Export
                      </button>

                      <button
                        onClick={() => downloadReceiptPNG('room-receipt-card-print', receiptGenerated.receiptNo)}
                        className="py-3 px-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer border border-zinc-800 hover:border-zinc-700 flex items-center justify-center gap-1.5"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-zinc-550" />
                        PNG Image
                      </button>

                      <button
                        onClick={() => {
                          const waText = `Hello ${receiptGenerated.customerName},

Thank you for your payment of ₦${receiptGenerated.amount.toLocaleString()} to UGOMENZ ELECTRONICS.

Your receipt is ready:
📎 ugomenz.png.recipt/r/${receiptGenerated.receiptNo}

Thank you for choosing UGOMENZ ELECTRONICS!`;
                          window.open(waLink(receiptGenerated.customerPhone, waText), '_blank');
                        }}
                        className="py-3 px-2 bg-[#25D366] hover:bg-[#1fba4f] text-white rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-green-500/10"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-white" />
                        WhatsApp
                      </button>
                    </div>

                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/80 text-[10px] text-zinc-400 flex items-center gap-2 leading-relaxed">
                      <span className="shrink-0 bg-[#1a6fd4] text-white font-mono px-1.5 py-0.5 rounded text-[8px] font-black">Link Option</span>
                      <p className="text-left text-zinc-400">
                        Interactive Public View short URL and cloud storage syncing are fully compiled. Users clicking <code className="text-[#1a6fd4] font-mono">/r/{receiptGenerated.receiptNo}</code> load this dynamically!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0f172a] border border-zinc-850 p-12 rounded-3xl text-center space-y-4 h-full flex flex-col justify-center items-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-[#1a6fd4] flex items-center justify-center animate-pulse">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-syne font-black uppercase text-white">No Receipt Selected</h4>
                      <p className="text-xs text-zinc-400 max-w-xs leading-relaxed mx-auto">
                        Fill in and submit the receipt form on the left, or select an archived receipt below, to render download and export tools.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: ARCHIVED RECEIPTS DATABASE LOG */}
            <div className="bg-[#0F172A] border border-zinc-800 p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-zinc-800/80">
                <div className="text-left col-span-1 border-none pb-0">
                  <h4 className="text-sm font-syne font-black text-white uppercase tracking-wider">
                    ARCHIVED RECEIPTS JOURNAL ({receiptsList.length})
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Secure Firestore database ledger synchronization</p>
                </div>
                
                {/* Search field */}
                <div className="relative w-full sm:w-72">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    id="receipt-search-archive"
                    placeholder="Search by customer name or RCT ID..."
                    className="w-full bg-[#050B18] border border-zinc-800 focus:border-[#1a6fd4] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none transition-all font-mono"
                    onChange={(e) => {
                      const query = e.target.value.toLowerCase();
                      const listElements = document.getElementsByClassName('receipt-history-row');
                      for(let i=0; i<listElements.length; i++) {
                        const row = listElements[i] as HTMLElement;
                        const text = row.getAttribute('data-search')?.toLowerCase() || '';
                        if(text.includes(query)) {
                          row.style.display = '';
                        } else {
                          row.style.display = 'none';
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {receiptsList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-zinc-400 border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                        <th className="py-3 px-4">Receipt ID</th>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">Purpose</th>
                        <th className="py-3 px-4">Remitted Sum</th>
                        <th className="py-3 px-4">Mode</th>
                        <th className="py-3 px-4">Balance</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptsList.map((r, i) => (
                        <tr 
                          key={`arch-${r.receiptNo}-${i}`}
                          className="receipt-history-row hover:bg-zinc-900/40 p-4 rounded-xl border-b border-zinc-900 transition-all"
                          data-search={`${r.receiptNo} ${r.customerName} ${r.purpose}`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">{r.receiptNo}</td>
                          <td className="py-3 px-4 text-white capitalize font-bold">{r.customerName}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-[#1a6fd4]/10 text-[#1a6fd4] rounded font-syne font-extrabold text-[10px] uppercase tracking-wider">
                              {r.purpose}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-extrabold text-white">₦{r.amount.toLocaleString()}</td>
                          <td className="py-3 px-4 font-mono text-[10px]">{r.paymentMethod}</td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {Number(r.balance) > 0 ? (
                              <span className="text-red-400 font-bold">₦{Number(r.balance).toLocaleString()}</span>
                            ) : (
                              <span className="text-emerald-400 font-bold">Paid In Full</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 text-[11px] font-mono">{r.dateStr}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setReceiptGenerated(r)}
                                className="px-2.5 py-1 bg-[#1a6fd4]/20 hover:bg-[#1a6fd4] text-[#1a6fd4] hover:text-white text-[10px] font-syne font-black uppercase rounded-lg tracking-wider transition-all cursor-pointer"
                              >
                                View Load
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500 text-xs italic">
                  No receipts logged in secure ledger yet. Produce a slip above to populate transactions history.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ROOM 8: PICKUP */}
        {currentTab === 'pickup' && (
          <div id="room-[#pickup]" className="max-w-xl mx-auto bg-[#0F172A] border border-zinc-800 p-6 rounded-2xl space-y-6 shadow-xl animate-scaleIn">
            <div className="space-y-1">
              <span className="text-[10px] text-[#E8600A] font-syne uppercase tracking-widest font-extrabold">Room 8 Dispatch & Delivery</span>
              <h3 className="text-xl font-syne font-black uppercase text-white">Arrange Pickup / Delivery schedule</h3>
              <p className="text-xs text-zinc-400">Instruct our dispatch unit on warehousing collection or door-to-door courier.</p>
            </div>

            <form onSubmit={sendPickupScheduleLink} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dele Falode"
                  value={pickupName}
                  onChange={e => setPickupName(e.target.value)}
                  className="w-full bg-[#0A0F1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">WhatsApp / Contact Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +2348012345678"
                    value={pickupPhone}
                    onChange={e => setPickupPhone(e.target.value)}
                    className="w-full bg-[#0A0F1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Planned Date of dispatch</label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={e => setPickupDate(e.target.value)}
                    className="w-full bg-[#0A0F1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Device purchased</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HP Omnibook flagship laptop"
                  value={pickupProduct}
                  onChange={e => setPickupProduct(e.target.value)}
                  className="w-full bg-[#0A0F1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Preferred Collection Method</label>
                <select
                  value={pickupMethod}
                  onChange={e => setPickupMethod(e.target.value)}
                  className="w-full bg-[#0A0F1E] border border-zinc-750 text-white rounded-lg p-2.5 text-xs"
                >
                  <option>Store Pickup (Deco Road, after Robinson Plaza, Warri)</option>
                  <option>Local Courier Dispatch (Warri Central area)</option>
                  <option>Inter-State delivery (external logistics standard)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#1eba4e] text-white text-xs font-syne uppercase tracking-wider font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4.5 h-4.5" />
                Schedule Pickup via WhatsApp support
              </button>
            </form>
          </div>
        )}

        {/* ROOM 9: WARRANTY */}
        {currentTab === 'warranty' && (
          <div id="room-[#warranty]" className="max-w-xl mx-auto bg-[#0F172A] border border-zinc-800 p-6 rounded-2xl space-y-6 shadow-xl animate-scaleIn">
            <div className="space-y-1">
              <span className="text-[10px] text-[#E8600A] font-syne uppercase tracking-widest font-extrabold font-bold">Room 9 WARRANTY CLAIMS</span>
              <h3 className="text-xl font-syne font-black uppercase text-white">Official Warranty Registration</h3>
              <p className="text-xs text-zinc-400">File serial numbers for laptop sets or solar modules to lock up official coverage terms.</p>
            </div>

            <form onSubmit={sendWarrantyWhatsApp} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Product Name & S/N or IMEI code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HP Omnibook Flip - S/N: HP8932483NX"
                  value={warrantyProduct}
                  onChange={e => setWarrantyProduct(e.target.value)}
                  className="w-full bg-[#0A0F1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Date of purchase</label>
                <input
                  type="date"
                  required
                  value={warrantyDate}
                  onChange={e => setWarrantyDate(e.target.value)}
                  className="w-full bg-[#0A0F1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Claim Type or Registration purpose</label>
                <select
                  value={warrantySerial}
                  onChange={e => setWarrantySerial(e.target.value)}
                  className="w-full bg-[#0A0F1E] border border-zinc-750 text-white rounded-lg p-2.5 text-xs animate-scaleIn"
                >
                  <option value="New Device Warranty Registration">New Device Registration (Complimentary cover lock)</option>
                  <option value="Defective Unit Return Claim request">Defective Unit Return Claim (Hardware troubleshooting)</option>
                  <option value="Solar Battery Battery Array Inspection request">Solar Battery Cell balancing service claim</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Detail of claim or feedback comments (If claiming/problem diagnostic)</label>
                <textarea
                  placeholder="e.g. Charging balance diagnostic request or replacement track inquiry."
                  value={warrantyReason}
                  onChange={e => setWarrantyReason(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0A0F1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-[#E8600A] hover:bg-[#ff7518] text-white text-xs font-syne uppercase tracking-wider font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4.5 h-4.5" />
                Register warranty on WhatsApp Support
              </button>
            </form>
          </div>
        )}

        {/* ROOM 10: CONTACT */}
        {currentTab === 'contact' && (
          <div id="room-contact" className="space-y-6 animate-scaleIn">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-syne font-black uppercase text-white">UGOMENZ MANAGER CONTACT SYSTEMS</h3>
              <p className="text-xs text-zinc-400">Submit requests instantly depending on technical roles.</p>
            </div>

            {/* Availability Grid (Page 8) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Manager */}
              <div className="bg-[#0F172A] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-zinc-500 font-mono font-bold">ROLE: TIER 1</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${managers.manager === 'Available' ? 'text-green-400' : 'text-red-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${managers.manager === 'Available' ? 'bg-[#25D366]' : 'bg-red-500'}`}></span>
                      {managers.manager}
                    </span>
                  </div>
                  <h4 className="font-syne font-extrabold uppercase text-base text-white mt-2">Store Manager</h4>
                  <p className="text-xs text-zinc-400 mt-1">Support for device details, store collection times, and customized orders.</p>
                </div>
                <a
                  href={waLink('+2349060672127', 'Hello Manager, I am visiting from your official Digital Hublet and have some queries.')}
                  target="_blank"
                  className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#1eba4e] text-white text-xs font-syne uppercase font-bold tracking-wider rounded-xl text-center flex items-center justify-center gap-2 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Direct WhatsApp tap
                </a>
              </div>

              {/* Financial Advisor */}
              <div className="bg-[#0F172A] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-zinc-500 font-mono font-bold">ROLE: TIER 2</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${managers.financialAdvisor === 'Available' ? 'text-green-400' : 'text-red-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${managers.financialAdvisor === 'Available' ? 'bg-[#25D366]' : 'bg-red-500'}`}></span>
                      {managers.financialAdvisor}
                    </span>
                  </div>
                  <h4 className="font-syne font-extrabold uppercase text-base text-white mt-2">Financial Advisor</h4>
                  <p className="text-xs text-zinc-400 mt-1">Support for bank transaction coordinates, transfer receipt confirmation, and financing.</p>
                </div>
                <a
                  href={waLink('+2347068767180', 'Hello Financial Advisor, I have a query regarding a bank payment receipt.')}
                  target="_blank"
                  className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#1eba4e] text-white text-xs font-syne uppercase font-bold tracking-wider rounded-xl text-center flex items-center justify-center gap-2 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Direct WhatsApp tap
                </a>
              </div>

              {/* Lead Tech Expert */}
              <div className="bg-[#0F172A] border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-zinc-500 font-mono font-bold">ROLE: TIER 3</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${managers.leadTechExpert === 'Available' ? 'text-green-400' : 'text-red-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${managers.leadTechExpert === 'Available' ? 'bg-[#25D366]' : 'bg-red-500'}`}></span>
                      {managers.leadTechExpert}
                    </span>
                  </div>
                  <h4 className="font-syne font-extrabold uppercase text-base text-white mt-2">Lead Tech Expert</h4>
                  <p className="text-xs text-zinc-400 mt-1">Support for solar energy system analysis, warranties, and device installations.</p>
                </div>
                <a
                  href={waLink('+2349060672127', 'Hello Lead Tech Expert, I would like to schedule a solar consultation or ask a technical question.')}
                  target="_blank"
                  className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#1eba4e] text-white text-xs font-syne uppercase font-bold tracking-wider rounded-xl text-center flex items-center justify-center gap-2 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Direct WhatsApp tap
                </a>
              </div>
            </div>

            {/* INTERACTIVE QR CODE GENERATOR (vCard) */}
            <div className="max-w-xl mx-auto bg-[#0F172A] border border-zinc-800 p-6 rounded-2xl space-y-5 shadow-xl">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <div className="p-2.5 bg-[#E8600A]/10 rounded-xl border border-[#E8600A]/20">
                  <QrCode className="w-5 h-5 text-[#E8600A]" />
                </div>
                <div>
                  <h4 className="font-syne font-black uppercase text-white text-sm tracking-wider">OFFICIAL CONTACT QR CODE GENERATOR</h4>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Scan directly to save expert contacts into your phone</p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Choose one of our representative experts below to dynamically render their offline-ready **vCard (v3.0)** contact QR code. Scan it directly using your phone's camera to instantly save details!
              </p>

              {/* Selector buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'manager', label: 'Store Manager', color: 'border-[#E8600A]/30' },
                  { id: 'financialAdvisor', label: 'Finance Advisor', color: 'border-blue-500/30' },
                  { id: 'leadTechExpert', label: 'Tech Expert', color: 'border-emerald-500/30' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedContactForQr(opt.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all text-[11px] font-syne font-bold uppercase cursor-pointer ${
                      selectedContactForQr === opt.id
                        ? 'bg-gradient-to-r from-[#E8600A] to-orange-600 border-transparent text-white shadow-lg shadow-[#E8600A]/20'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Display card containing QR code and info */}
              <div className="flex flex-col md:flex-row gap-5 items-center bg-[#070D19]/60 p-5 border border-zinc-850 rounded-2xl">
                {/* QR Code Canvas/Image */}
                <div className="relative group p-3 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center shrink-0">
                  {qrDataUrl ? (
                    <>
                      <img
                        src={qrDataUrl}
                        alt="vCard QR Code"
                        className="w-40 h-40 object-contain selection:bg-transparent"
                      />
                      <span className="text-[9px] text-zinc-500 font-mono mt-1 font-bold">SCAN CODES TO SAVE</span>
                    </>
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-zinc-400 text-xs text-center font-semibold text-zinc-900">
                      Generating...
                    </div>
                  )}
                </div>

                {/* Meta details showing encoded parameters */}
                <div className="space-y-3 flex-grow w-full text-xs text-zinc-400">
                  <div className="space-y-1">
                    <p className="text-[10px] text-[#E8600A] uppercase font-bold tracking-wider">CURRENT ENCODED INFO</p>
                    <p className="text-sm font-syne font-extrabold text-white uppercase select-all">
                      {selectedContactForQr === 'manager' && 'Ugomenz Store Manager'}
                      {selectedContactForQr === 'financialAdvisor' && 'Ugomenz Financial Advisor'}
                      {selectedContactForQr === 'leadTechExpert' && 'Ugomenz Lead Tech Expert'}
                    </p>
                    <p className="text-xs font-mono text-zinc-350 select-all font-bold">
                      {selectedContactForQr === 'manager' && '+234 906 067 2127'}
                      {selectedContactForQr === 'financialAdvisor' && '+234 706 876 7180'}
                      {selectedContactForQr === 'leadTechExpert' && '+234 906 067 2127'}
                    </p>
                  </div>

                  <div className="text-[11px] leading-relaxed select-all bg-zinc-950/45 p-2 rounded-lg border border-zinc-850 font-mono text-zinc-400 whitespace-pre-line text-[10px]">
                    {selectedContactForQr === 'manager' && (
                      <>
                        Organization: Ugomenz Electronics<br />
                        Note: Official Store Manager for Ugomenz Electronics Warri.<br />
                        Address: Deco Road, Warri, Delta State
                      </>
                    )}
                    {selectedContactForQr === 'financialAdvisor' && (
                      <>
                        Organization: Ugomenz Electronics<br />
                        Note: Financial advisor. Validates payment transfers.<br />
                        Address: Deco Road, Warri, Delta State
                      </>
                    )}
                    {selectedContactForQr === 'leadTechExpert' && (
                      <>
                        Organization: Ugomenz Electronics<br />
                        Note: Solar energy systems, warranties & tech setups.<br />
                        Address: Deco Road, Warri, Delta State
                      </>
                    )}
                  </div>

                  {/* Actions under QR */}
                  <div className="flex gap-2">
                    <a
                      href={qrDataUrl}
                      download={`Ugomenz_${selectedContactForQr}_vCard_QR.png`}
                      className="flex-grow py-2 px-3 bg-zinc-900 border border-zinc-800 hover:border-[#E8600A]/30 text-zinc-100 rounded-lg text-center font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Download Image
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const phone = selectedContactForQr === 'manager' || selectedContactForQr === 'leadTechExpert' ? '+2349060672127': '+2347068767180';
                        navigator.clipboard.writeText(phone);
                        alert('Phone number copied to clipboard!');
                      }}
                      className="py-2 px-3 bg-zinc-900 border border-zinc-800 hover:border-[#E8600A]/30 text-zinc-100 rounded-lg text-center font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Copy Phone
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* GM Queue Submit form */}
            <div id="gm-queue-form-anchor" className="max-w-xl mx-auto bg-[#0F172A] border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h4 className="font-syne font-black uppercase text-[#E8600A] text-sm tracking-wider">UGOMENZ SUBMISSION QUEUE SYSTEM</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">Customers can submit digital tickets down into the queue. Our management staff and experts review this dashboard regularly within the Staff Corner.</p>

              <form onSubmit={handleSubmitGmQuery} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fortune Akioya"
                    value={gmQueryName}
                    onChange={e => setGmQueryName(e.target.value)}
                    className="w-full bg-[#0A0F1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">WhatsApp phone number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +2348065210611"
                    value={gmQueryPhone}
                    onChange={e => setGmQueryPhone(e.target.value)}
                    className="w-full bg-[#0A0F1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Subject of escalation</label>
                  <input
                    type="text"
                    placeholder="e.g. Enterprise solar bundle consultation"
                    value={gmQuerySubject}
                    onChange={e => setGmQuerySubject(e.target.value)}
                    className="w-full bg-[#0A0F1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Describe report details</label>
                  <textarea
                    required
                    placeholder="Detailed query description..."
                    value={gmQueryMsg}
                    onChange={e => setGmQueryMsg(e.target.value)}
                    rows={4}
                    className="w-full bg-[#0A0F1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-[#003087] hover:bg-[#002060] border border-[#ff7518]/20 text-white text-xs font-syne uppercase font-bold tracking-widest rounded-xl transition-all"
                >
                  Submit escalated query to GM Queue
                </button>
              </form>

              {submittedGmStatus && (
                <div className="bg-emerald-950/40 p-4 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5" />
                  Your report has been securely queued for General Manager review. Track updates in your notifications.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ROOM 11: FEEDBACK */}
        {currentTab === 'feedback' && (
          <div id="room-feedback" className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-scaleIn">
            {/* Reviews list */}
            <div className="md:col-span-7 bg-[#0F172A] border border-zinc-800 p-5 rounded-2xl space-y-6 shadow-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-syne font-extrabold uppercase">Product Ratings & reviews</h3>
                  <p className="text-xs text-zinc-400">Total customer feedback verified on the local device storage.</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-syne font-black text-[#E8600A]">{avgReviewRating}</span>
                  <span className="text-zinc-500 text-xs pl-1">/ 5</span>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">{feedback.length} feedbacks</p>
                </div>
              </div>

              <div className="space-y-4">
                {feedback.map((fb) => (
                  <div key={fb.id} className="bg-[#050B18] border border-zinc-800 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white font-bold">{fb.customerName}</span>
                      <div className="flex gap-1 text-sm text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < fb.rating ? 'fill-current' : 'text-zinc-700'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed italic">&ldquo;{fb.comment}&rdquo;</p>
                    <p className="text-[9px] text-zinc-500 text-right">{fb.dateStr}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave a review */}
            <div className="md:col-span-5 bg-[#0F172A] border border-zinc-800 p-5 rounded-2xl h-fit space-y-4 shadow-xl">
              <h4 className="text-sm font-syne font-extrabold uppercase text-white">SUBMIT VERIFIED REVIEW</h4>

              <form onSubmit={handleSubmitFeedback} className="space-y-3 font-semibold text-xs text-zinc-400">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amara Warri"
                    value={fbName}
                    onChange={e => setFbName(e.target.value)}
                    className="w-full bg-[#0A0F1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Star Assessment ({fbStars} / 5)</label>
                  <div className="flex gap-2 py-1">
                    {[1, 2, 3, 4, 5].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setFbStars(st)}
                        className={`text-xl transition-colors ${st <= fbStars ? 'text-amber-500' : 'text-zinc-700'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Commentary / Review</label>
                  <textarea
                    required
                    placeholder="Describe your satisfaction with HP laptop, solar installation or GTBank quick transactions here..."
                    value={fbComment}
                    onChange={e => setFbComment(e.target.value)}
                    rows={4}
                    className="w-full bg-[#0A0F1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-[#E8600A] hover:bg-[#ff7518] text-white text-xs font-syne uppercase tracking-wider font-extrabold rounded-xl transition-all"
                >
                  Post product review
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ROOM 12: EDUCATION */}
        {currentTab === 'shadow' && (
          <div id="room-shadow" className="space-y-6 animate-scaleIn max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#003087] to-zinc-950 border border-zinc-800 p-8 text-center space-y-4 shadow-xl">
              <span className="text-[10px] text-[#E8600A] font-syne uppercase tracking-widest font-extrabold">Room 12 ESGMC SHADOW SCHOOL</span>
              <h3 className="text-3xl font-syne font-black uppercase text-white leading-tight">SDGSpreneurship & Sustainables Training</h3>
              <p className="text-sm text-zinc-300 max-w-2xl mx-auto leading-relaxed">
                Empowering the next-generation of business leaders in Warri, Delta State through micro-retail practices, environmental solar hub installation learning and zero-waste logistics.
              </p>
              <div className="flex justify-center gap-3">
                <a
                  href={waLink('+2349060672127', 'Hello ESGMC Shadow school, I want to learn more about the SDGSpreneurship enrolment.')}
                  target="_blank"
                  className="bg-[#E8600A] hover:bg-[#ff7518] text-white text-xs font-syne font-bold uppercase px-5 py-3 rounded-xl shadow-lg transition-all"
                >
                  Enroll / WhatsApp Inquiry
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#0F172A] border border-zinc-800 p-5 rounded-2xl space-y-3 shadow-lg">
                <h4 className="font-syne font-extrabold text-sm uppercase text-white border-b border-zinc-800 pb-2">Our Methodology</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  ESGMC Shadow School runs an executive learning incubator allowing local interns to manage Ugomenz retail inventory, test high productivity laptops and deploy solar hubs dynamically.
                </p>
              </div>

              <div className="bg-[#0F172A] border border-zinc-800 p-5 rounded-2xl space-y-3 shadow-lg">
                <h4 className="font-syne font-extrabold text-sm uppercase text-white border-b border-zinc-800 pb-2">SDGs Learning Lab</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  We cover essential elements of climate response (Goal 13), sustainable infrastructure (Goal 9) and decent employment growth (Goal 8) to secure circular economies in Warri.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ROOM 13: STAFF CORNER */}
        {currentTab === 'staff' && (
          <div id="room-staff" className="space-y-6 animate-scaleIn">
            {!isStaffAuthenticated ? (
              /* Administrative Lock Screen Panel - Page 8 */
              <div className="max-w-md mx-auto bg-[#0F172A] border border-zinc-850 p-6 rounded-2xl space-y-6 shadow-2xl relative">
                <div className="absolute top-0 right-0 h-1.5 w-1/3 bg-[#E8600A] rounded-tr-2xl"></div>
                <div className="text-center space-y-1.5">
                  <div className="w-11 h-11 rounded-full bg-zinc-900 mx-auto flex items-center justify-center text-[#E8600A] border border-zinc-805">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-base font-syne font-extrabold uppercase text-white">Ugomenz Staff Authorization</h3>
                  <p className="text-xs text-zinc-400">Unlock overrides for prices, stock statuses, live bank cords & diagnostics</p>
                </div>

                <form onSubmit={handleStaffLogin} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Company Manager Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UGOMENZ2025"
                      value={staffCode}
                      onChange={e => setStaffCode(e.target.value)}
                      className="w-full bg-[#0A0F1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Manager Key</label>
                      <input
                        type="password"
                        required
                        placeholder="qw123#@"
                        value={staffKey}
                        onChange={e => setStaffKey(e.target.value)}
                        className="w-full bg-[#0A0F1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Authorization PIN</label>
                      <input
                        type="password"
                        required
                        placeholder="12345"
                        value={staffPin}
                        onChange={e => setStaffPin(e.target.value)}
                        className="w-full bg-[#0A0F1E] border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {staffError && <p className="text-red-400 text-[11px] font-bold text-center">{staffError}</p>}

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-[#E8600A] hover:bg-[#ff7518] text-white text-xs font-syne uppercase tracking-wider font-extrabold rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    Authenticate credentials
                  </button>
                </form>

                <div className="flex items-center gap-2">
                  <div className="h-px bg-zinc-850 flex-1"></div>
                  <span className="text-[9px] text-zinc-500 uppercase font-black">OR</span>
                  <div className="h-px bg-zinc-850 flex-1"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </button>

                <p className="text-zinc-500 text-[10px] text-center italic border-t border-zinc-800/80 pt-3">
                  Default: Code: <span className="font-mono text-zinc-400">UGOMENZ2025</span> / Key: <span className="font-mono text-zinc-400">qw123#@</span> / PIN: <span className="font-mono text-zinc-400">12345</span>
                </p>
              </div>
            ) : (
              /* Authenticated Staff Standalone Workshop Suite */
              <StaffWorkshopSuite
                currentUser={currentUser}
                campaign={campaign}
                setCampaign={setCampaign}
                products={products}
                setProducts={setProducts}
                videoList={videoList}
                setVideoList={setVideoList}
                socialsState={socialsState}
                setSocialsState={setSocialsState}
                managers={managers}
                handleToggleManagerStatus={handleToggleManagerStatus}
                feedback={feedback}
                setFeedback={setFeedback}
                handleStaffLogout={handleStaffLogout}
                categories={categories}
                analytics={analytics}
                setAnalytics={setAnalytics}
              />
            )}
          </div>
        )}
      </main>

      {/* FIXED SCROLLABLE BOTTOM TABS NAV (13 TABS) - Page 3 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#050B18] border-t border-zinc-800/80 p-1.5 sm:p-2 z-40 shadow-2xl">
        <div className="max-w-7xl mx-auto relative">
          {/* Scroll fade modifiers */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#050B18] to-transparent pointer-events-none z-10"></div>

          <div className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth pl-2 pr-8 py-0.5 justify-start md:justify-between">
            {[
              { id: 'gallery', label: 'Gallery', icon: ImageIcon },
              { id: 'videos', label: 'Videos', icon: PlayCircle },
              { id: 'showroom', label: 'Showroom', icon: Store },
              { id: 'infoDesk', label: 'AI Desk', icon: Bot },
              { id: 'channel', label: 'Channel', icon: Share2 },
              { id: 'livesheet', label: 'Live Sheet', icon: FileText },
              { id: 'invoice', label: 'Invoice', icon: CreditCard },
              { id: 'pickup', label: 'Pickup', icon: Truck },
              { id: 'warranty', label: 'Warranty', icon: ShieldAlert },
              { id: 'contact', label: 'Contact', icon: Phone },
              { id: 'feedback', label: 'Feedback', icon: Star },
              { id: 'shadow', label: 'Education', icon: GraduationCap },
              { id: 'staff', label: 'Staff_Set', icon: Settings },
            ].map((tab, idx) => {
              const IconComp = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCurrentTab(tab.id);
                    recordRoomVisit(tab.id);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg relative shrink-0 transition-all ${isActive ? 'text-[#E8600A]' : 'text-zinc-500 hover:text-zinc-300'}`}
                  style={{ minWidth: '68px' }}
                >
                  {/* Page 3 Top orange border active tab selector */}
                  {isActive && (
                    <span className="absolute top-0 left-1/3 right-1/3 h-[3px] bg-[#E8600A] rounded-full"></span>
                  )}
                  <IconComp className="w-5 h-5 mb-1" />
                  <span className="text-[9px] font-syne font-bold uppercase tracking-wider truncate max-w-full">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom Sheet Modal S1 Quick-View (Suggestions) */}
      {quickViewProduct && (() => {
        // Find current selected variant if specified
        const currentVariant = quickViewProduct.variants?.find(v => v.id === selectedVariantId) || null;

        // Collect all valid available images for the active specs
        const angleImages = currentVariant
          ? [currentVariant.heroImage, currentVariant.angle2, currentVariant.angle3, currentVariant.angle4, currentVariant.angle5].filter(Boolean) as string[]
          : [quickViewProduct.heroImage, quickViewProduct.angle2, quickViewProduct.angle3, quickViewProduct.angle4, quickViewProduct.angle5].filter(Boolean) as string[];

        const activeFeaturedImage = selectedAnglePhotoUrl && angleImages.includes(selectedAnglePhotoUrl)
          ? selectedAnglePhotoUrl
          : (angleImages[0] || quickViewProduct.heroImage);

        return (
          <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 p-0 sm:p-4 transition-all">
            <div className="bg-[#0A0F1E] border-t sm:border border-zinc-800 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto no-scrollbar p-6 space-y-6 relative flex flex-col justify-between">
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-5 right-5 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-full transition-all z-20"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[#003087] text-white text-[10px] uppercase font-syne font-extrabold px-2.5 py-1 rounded">
                    Interactive Spec Sheet
                  </span>
                  <span className="text-zinc-500 font-mono text-xs font-bold uppercase">{currentVariant?.sku || quickViewProduct.model || 'DECO-WARRI'}</span>
                  {currentVariant && (
                    <span className="bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-sans font-extrabold px-2 py-0.5 rounded">
                      Variant: {currentVariant.colorName}
                    </span>
                  )}
                </div>

                {/* Angle Gallery in quick view */}
                <div className="space-y-3">
                  <div className="aspect-[16/10] w-full rounded-2xl bg-[#050B18] overflow-hidden border border-zinc-800 flex items-center justify-center relative p-3">
                    <img src={activeFeaturedImage} alt={quickViewProduct.name} className="max-h-full max-w-full object-contain hover:scale-105 transition-all duration-300" />
                    <div className="absolute top-4 left-4 bg-[#E8600A] text-white text-xs font-syne font-extrabold px-3 py-1.5 rounded-lg shadow-md uppercase">
                      {quickViewProduct.price === 0 ? 'Call for Price' : `₦${quickViewProduct.price.toLocaleString()}`}
                    </div>
                  </div>

                  {/* Multi angle thumbnail selectors */}
                  {angleImages.length > 1 && (
                    <div className="flex justify-center gap-2 pb-1 overflow-x-auto">
                      {angleImages.map((img, index) => {
                        const isSelected = activeFeaturedImage === img;
                        const label = index === 0 ? "Front" : index === 1 ? "Side" : index === 2 ? "Back" : index === 3 ? "Port" : "Detail";
                        return (
                          <button
                            key={`thumb-${index}`}
                            type="button"
                            onClick={() => setSelectedAnglePhotoUrl(img)}
                            className={`flex flex-col items-center gap-1 p-1 rounded-xl bg-[#0F172A] border transition-all ${isSelected ? 'border-[#E8600A] scale-102 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'}`}
                          >
                            <img src={img} className="w-12 h-10 object-cover rounded-lg" alt="" />
                            <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Product Meta details */}
                <div className="space-y-1">
                  <h4 className="text-lg font-syne font-extrabold uppercase text-white">{quickViewProduct.name}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed bg-[#050B18]/45 p-3 rounded-xl border border-zinc-855">{quickViewProduct.description}</p>
                </div>

                {/* Variant Color selection */}
                {quickViewProduct.variants && quickViewProduct.variants.length > 0 && (
                  <div className="space-y-2 border-t border-zinc-800/80 pt-3">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Available Options & Multiangle Shades:</label>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVariantId(null);
                          setSelectedAnglePhotoUrl(null);
                        }}
                        className={`px-3 py-2 text-xs font-syne font-bold uppercase rounded-xl border transition-all ${
                          selectedVariantId === null
                            ? 'bg-[#E8600A]/10 border-[#E8600A] text-white'
                            : 'border-zinc-805 text-zinc-400 bg-[#0F172A] hover:border-zinc-700'
                        }`}
                      >
                        Default Shade
                      </button>
                      {quickViewProduct.variants.map((v) => {
                        const isSelected = selectedVariantId === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setSelectedVariantId(v.id);
                              setSelectedAnglePhotoUrl(v.heroImage); // Default to the variant's hero image
                            }}
                            className={`px-3 py-2 text-xs font-syne font-bold uppercase rounded-xl border transition-all ${
                              isSelected
                                ? 'bg-[#E8600A]/10 border-[#E8600A] text-white'
                                : 'border-zinc-805 text-zinc-400 bg-[#0F172A] hover:border-zinc-700'
                            }`}
                          >
                            🎨 {v.colorName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center bg-[#0F172A] p-3 rounded-xl text-xs border border-zinc-850">
                  <span className="text-zinc-400">Availability Rating:</span>
                  <span className={`font-bold ${quickViewProduct.stockStatus === 'In Stock' ? 'text-green-400' : 'text-zinc-500'}`}>
                    {quickViewProduct.stockStatus}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-800 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategoryFilter(quickViewProduct.category);
                    setSearchQuery(quickViewProduct.name);
                    setCurrentTab('gallery');
                    setQuickViewProduct(null);
                  }}
                  className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-syne font-bold uppercase rounded-xl tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  <Search className="w-4 h-4" />
                  Show Showroom Filter
                </button>

                <a
                  href={waLink('+2349060672127', `Hello, I want to pay for ${quickViewProduct.name} - ${currentVariant ? currentVariant.colorName : 'Default'} (₦${quickViewProduct.price.toLocaleString()}) via quick scan.`)}
                  target="_blank"
                  className="py-3 px-4 bg-[#25D366] hover:bg-[#1eba4e] text-white text-xs font-syne font-bold uppercase rounded-xl tracking-wider text-center flex items-center justify-center gap-1.5 flex-1 transition-all"
                  onClick={() => setQuickViewProduct(null)}
                >
                  <MessageCircle className="w-4.5 h-4.5" />
                  WhatsApp Buy
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setQuickViewProduct(null);
                    setCurrentTab('invoice');
                  }}
                  className="py-3 px-4 bg-[#E8600A] hover:bg-[#ff7518] text-white text-xs font-syne font-bold uppercase rounded-xl tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  <CreditCard className="w-4.5 h-4.5" />
                  Direct invoice pay &rarr;
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PINTEREST SHOWROOM LIGHTBOX MODAL */}
      {activeLightboxPhotoIdx !== null && (() => {
        const ph = showroomPhotos[activeLightboxPhotoIdx];
        if (!ph) return null;
        const isPinned = myPinnedPhotos.includes(ph.id || '');

        const handlePrevLightbox = () => {
          setActiveLightboxPhotoIdx(prev => {
            if (prev === null) return null;
            return prev === 0 ? showroomPhotos.length - 1 : prev - 1;
          });
        };

        const handleNextLightbox = () => {
          setActiveLightboxPhotoIdx(prev => {
            if (prev === null) return null;
            return prev === showroomPhotos.length - 1 ? 0 : prev + 1;
          });
        };

        return (
          <div 
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setActiveLightboxPhotoIdx(null)}
          >
            <div 
              className="relative max-w-4xl w-full bg-[#0F172A] rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[95vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Left Column: Huge High-Res Image Area */}
              <div className="md:w-3/5 bg-zinc-950 flex items-center justify-center relative p-2 min-h-[300px] md:min-h-[500px]">
                <img 
                  src={ph.imageUrl} 
                  alt={ph.title} 
                  className="max-h-[60vh] md:max-h-[80vh] max-w-full object-contain rounded-lg shadow-md animate-scaleIn"
                />

                {/* Navigation Chevrons inside the image viewport */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevLightbox();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/75 hover:bg-[#E8600A] text-white border border-zinc-800 hover:scale-110 active:scale-95 transition-all z-10 cursor-pointer"
                  title="Previous Photo"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextLightbox();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/75 hover:bg-[#E8600A] text-white border border-zinc-800 hover:scale-110 active:scale-95 transition-all z-10 cursor-pointer"
                  title="Next Photo"
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              {/* Right Column: Pinterest styled info card */}
              <div className="md:w-2/5 p-6 md:p-8 flex flex-col justify-between bg-[#0F172A] space-y-6 overflow-y-auto">
                <div>
                  <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#E8600A] font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                      Pinterest Pin Board
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTogglePinPhoto(ph.id || '')}
                      className={`px-4 py-2 rounded-full text-xs font-syne uppercase font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isPinned 
                          ? 'bg-[#E8600A] text-white hover:bg-[#ff7518]' 
                          : 'bg-red-600 hover:bg-red-750 text-white shadow shadow-red-950/45'
                      }`}
                    >
                      <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-white' : ''}`} />
                      <span>{isPinned ? 'Pinned' : 'Save Pin'}</span>
                    </button>
                  </div>

                  <div className="pt-6 space-y-4 text-left">
                    <h3 className="text-xl font-syne font-black uppercase text-white tracking-tight leading-tight">
                      {ph.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed bg-[#050B18]/50 p-4 rounded-xl border border-zinc-850">
                      {ph.description || "Take an exclusive visual look inside our physical tech & electronics department showroom."}
                    </p>
                    {isPinned && (
                      <div className="p-3 bg-red-950/10 border border-red-900/30 rounded-lg text-[10px] text-red-200">
                        📍 This physical space is pinned in your personal board memory for checkout inquiries!
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  {/* Whatsapp inquiry block */}
                  <a
                    href={waLink('+2349060672127', `Hello support, I saw your showroom photo "${ph.title}" in the Pinterest gallery section of your app and wanted to inquire about the physical setup and items displayed.`)}
                    target="_blank"
                    className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-syne uppercase tracking-wider font-extrabold rounded-xl shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Inquire Dept on WhatsApp
                  </a>

                  {/* Close Lightbox */}
                  <button
                    type="button"
                    onClick={() => setActiveLightboxPhotoIdx(null)}
                    className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 text-white text-xs font-syne uppercase tracking-wider font-extrabold rounded-xl transition-all cursor-pointer"
                  >
                    Close Walkthrough
                  </button>
                </div>
              </div>
            </div>
            {/* Absolute close button on the main lightbox backdrop (top-right of screen) */}
            <button
              onClick={() => setActiveLightboxPhotoIdx(null)}
              className="absolute top-6 right-6 p-3 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white transition-all hover:scale-105 cursor-pointer z-50"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        );
      })()}
    </div>
  );
}
