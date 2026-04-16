import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProductCard } from "@/components/product/ProductCard";
import { ServiceCard } from "@/components/product/ServiceCard";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { HorizontalProductScroll } from "@/components/product/HorizontalProductScroll";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ChevronRight, Tv, Droplets, Smartphone, Leaf, Cherry, Milk, Heart, House, Shirt, Baby, Car, Dumbbell, Book, Music, Camera, Gamepad2, Utensils, ShoppingBag, Gift, Coffee, Pizza, Sparkles, Package, LayoutGrid, RefreshCw, ChevronLeft, Tag } from "lucide-react";
import { Link } from "wouter";

import vegImg from "@assets/stock_images/fresh_vegetables_bas_43c891f5.jpg";
import fruitImg from "@assets/stock_images/fresh_fruits_variety_e2abeac1.jpg";
import dairyImg from "@assets/stock_images/milk_and_dairy_produ_1522aa37.jpg";

interface Category {
  id: number;
  name: string;
  slug: string;
  type: string | null;
  iconKey: string | null;
  imageUrl: string | null;
  colorStart: string | null;
  colorEnd: string | null;
  borderColor: string | null;
  textColor: string | null;
  sortOrder: number | null;
  isActive: string | null;
  showOnHome: string | null;
}

interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number;
  image: string;
  categorySlug: string;
  unit: string | null;
  sortOrder: number | null;
  isActive: string | null;
}

interface DBProduct {
  id: number;
  name: string;
  price: number;
  originalPrice: number | null;
  image: string;
  category: string;
  unit: string | null;
  sortOrder: number | null;
  isActive: string | null;
  hasVariants: string | null;
}

interface Banner {
  id: number;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  ctaText: string | null;
  ctaLink: string | null;
  bgColor: string | null;
  textColor: string | null;
  isActive: string | null;
  sortOrder: number | null;
}

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  unit: string;
  sortOrder: number;
  hasVariants: boolean;
}

const LUCIDE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Tv, Droplets, Smartphone, Heart, Home: House, House, Shirt, Baby, Car, Dumbbell, Book, Music, Camera, Gamepad2, Utensils, Leaf, Cherry, Milk, ShoppingBag, Gift, Coffee, Pizza, Sparkles, Package, LayoutGrid
};

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      return Array.isArray(data) ? data.filter((c: Category) => c.isActive === "true") : [];
    },
  });
  const dynamicCategories = Array.isArray(categoriesData) 
    ? [...categoriesData].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) 
    : [];

  const productCategories = dynamicCategories.filter(c => c.type !== "service");
  const serviceCategories = dynamicCategories.filter(c => c.type === "service");

  const { data: servicesData } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const res = await fetch("/api/services");
      const data = await res.json();
      return Array.isArray(data) ? data.filter((s: Service) => s.isActive === "true" || String(s.isActive) === "true") : [];
    },
  });
  const servicesList = Array.isArray(servicesData) 
    ? [...servicesData].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) 
    : [];

  // Fetch products from database
  const { data: productsData, isLoading: productsLoading } = useQuery<DBProduct[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      return Array.isArray(data) ? data.filter((p: DBProduct) => p.isActive === "true" || String(p.isActive) === "true") : [];
    },
  });
  // Map DB products to frontend Product type
  const PRODUCTS: Product[] = Array.isArray(productsData) 
    ? productsData
        .map((p: DBProduct) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          originalPrice: p.originalPrice || p.price,
          image: p.image,
          category: p.category,
          unit: p.unit || "1 pc",
          sortOrder: p.sortOrder || 0,
          hasVariants: p.hasVariants === "true",
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  // Fetch banners for carousel
  const { data: bannersData } = useQuery<Banner[]>({
    queryKey: ["/api/banners"],
    queryFn: async () => {
      const res = await fetch("/api/banners");
      const data = await res.json();
      return Array.isArray(data) 
        ? data.filter((b: Banner) => String(b.isActive) === "true").sort((a: Banner, b: Banner) => (a.sortOrder || 0) - (b.sortOrder || 0))
        : [];
    },
  });
  const banners = bannersData || [];

  // Banner carousel state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  
  // Reset index when banners array changes to avoid out-of-bounds
  useEffect(() => {
    if (currentBannerIndex >= banners.length && banners.length > 0) {
      setCurrentBannerIndex(0);
    }
  }, [banners.length, currentBannerIndex]);
  
  // Auto-rotate banners every 4 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const nextBanner = useCallback(() => {
    if (banners.length <= 1) return;
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevBanner = useCallback(() => {
    if (banners.length <= 1) return;
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Fetch active offers for home page
  interface HomeOffer { id: number; title: string; description?: string | null; image?: string | null; discount?: string | null; isActive: string; }
  const { data: offersData } = useQuery<HomeOffer[]>({
    queryKey: ["/api/offers"],
    queryFn: async () => {
      const res = await fetch("/api/offers");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });
  const activeOffers = Array.isArray(offersData) ? offersData : [];

  // Fetch custom home banner (fallback when no carousel banners)
  const { data: homeBannerData } = useQuery<{ banner: string | null }>({
    queryKey: ["/api/settings/home-banner"],
    queryFn: async () => {
      const res = await fetch("/api/settings/home-banner");
      return res.json();
    },
  });
  const customBanner = homeBannerData?.banner || null;

  // Fetch banner text settings
  const { data: bannerTextData } = useQuery<{
    tagLine: string;
    mainHeading: string;
    subHeading: string;
    description: string;
    buttonText: string;
  }>({
    queryKey: ["/api/settings/banner-text"],
    queryFn: async () => {
      const res = await fetch("/api/settings/banner-text");
      return res.json();
    },
  });
  const bannerText = bannerTextData || {
    tagLine: "🏠 Daily Essentials & Services",
    mainHeading: "Fresh Groceries Delivered",
    subHeading: "+ Home Services You Trust",
    description: "Veggies, Fruits, Dairy | Electricity, Mobile, Water RO & More",
    buttonText: "Shop Now"
  };

  // Convert services to product-like format for filtering
  const servicesAsProducts = servicesList.map(s => ({
    id: s.id + 10000,
    name: s.name,
    price: s.price,
    originalPrice: s.originalPrice,
    image: s.image,
    category: s.categorySlug,
    unit: s.unit || "per service",
    sortOrder: s.sortOrder || 0,
    hasVariants: false,
  }));
  
  // Combine products and services for filtering
  const allItems = [...PRODUCTS, ...servicesAsProducts];
  
  const filteredProducts = allItems
    .filter((product) => {
      const matchesCategory = activeCategory === "all" || product.category === activeCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  
  const getCategoryIcon = (iconKey: string | null) => {
    if (!iconKey || !LUCIDE_ICONS[iconKey]) return LayoutGrid;
    return LUCIDE_ICONS[iconKey];
  };

  const categories = [
    { id: "all", name: "All", image: null },
    ...dynamicCategories.map(cat => ({
      id: cat.slug,
      name: cat.name,
      image: cat.imageUrl,
    }))
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/20 to-white pb-24">
      {/* Mobile-First Header */}
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="container mx-auto px-3 py-4 space-y-6">
        
        {/* Only show Banner/Cats when NOT searching */}
        {!searchQuery && activeCategory === "all" && (
          <>
            {/* Banner Carousel or Fallback */}
            {banners.length > 0 ? (
              <div className="relative rounded-2xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all" data-testid="banner-carousel">
                <div className="relative">
                  {banners.map((banner, index) => (
                    <div
                      key={banner.id}
                      className={`transition-opacity duration-500 ${index === currentBannerIndex ? "opacity-100" : "opacity-0 absolute inset-0"}`}
                      data-testid={`banner-slide-${banner.id}`}
                    >
                      <img 
                        src={banner.imageUrl} 
                        alt={banner.title || "Promotional Banner"} 
                        className="w-full object-cover h-40 sm:h-48"
                      />
                      {(banner.title || banner.subtitle || banner.ctaText) && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-4">
                          {banner.title && (
                            <h2 className="text-white text-xl font-bold leading-tight">{banner.title}</h2>
                          )}
                          {banner.subtitle && (
                            <p className="text-white/90 text-sm">{banner.subtitle}</p>
                          )}
                          {banner.ctaText && banner.ctaLink && (
                            <a 
                              href={banner.ctaLink}
                              className="mt-2 inline-block bg-yellow-400 text-blue-900 text-sm font-bold px-4 py-2 rounded-lg shadow-lg hover:bg-yellow-300 transition-all w-fit"
                            >
                              {banner.ctaText}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {banners.length > 1 && (
                  <>
                    <button
                      onClick={prevBanner}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1.5 rounded-full shadow-lg transition-all"
                      data-testid="banner-prev"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-800" />
                    </button>
                    <button
                      onClick={nextBanner}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1.5 rounded-full shadow-lg transition-all"
                      data-testid="banner-next"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-800" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {banners.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentBannerIndex(index)}
                          className={`h-2 rounded-full transition-all ${index === currentBannerIndex ? "bg-white w-4" : "bg-white/50 w-2"}`}
                          data-testid={`banner-dot-${index}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : customBanner ? (
              <div className="rounded-2xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all">
                <img 
                  src={customBanner} 
                  alt="Promotional Banner" 
                  className="w-full object-cover max-h-48 sm:max-h-56"
                  data-testid="custom-home-banner"
                />
              </div>
            ) : (
              <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all">
                <div className="relative z-10 w-4/5">
                  <span className="inline-block rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider mb-3 text-blue-900">
                    {bannerText.tagLine}
                  </span>
                  <h2 className="text-2xl font-black leading-tight mb-2 text-white">
                    {bannerText.mainHeading}
                  </h2>
                  <h3 className="text-base font-bold text-blue-100 mb-2">{bannerText.subHeading}</h3>
                  <p className="text-blue-100 text-xs mb-4 font-medium">
                    {bannerText.description}
                  </p>
                  <button 
                    onClick={() => setActiveCategory("vegetables")}
                    className="bg-yellow-400 text-blue-900 text-sm font-bold px-5 py-2.5 rounded-lg shadow-lg hover:bg-yellow-300 hover:shadow-xl hover:scale-105 transition-all active:scale-95">
                    {bannerText.buttonText}
                  </button>
                </div>
                <div className="absolute -right-8 -bottom-8 h-40 w-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
                <div className="absolute right-4 bottom-2 text-5xl opacity-20 group-hover:opacity-30 transition-opacity duration-500">🛒</div>
              </div>
            )}

            {/* All Categories Grid */}
            <div>
              <h3 className="text-base font-bold text-foreground mb-4 px-1">Shop by category</h3>
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : dynamicCategories.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No categories available</p>
              ) : (
            <div className="grid grid-cols-3 gap-2 px-1">
            {dynamicCategories.map(cat => {
                    const IconComponent = getCategoryIcon(cat.iconKey);
                    return (
                      <button 
                        key={cat.id} 
                        onClick={() => setActiveCategory(cat.slug)}
                        className="group/cat flex flex-col items-center gap-2 active:scale-95 transition-transform"
                        data-testid={`category-${cat.slug}`}
                      >
                       <div className={`w-full aspect-square rounded-2xl bg-gradient-to-br
                       ${cat.colorStart || "from-gray-100"} ${cat.colorEnd || "to-gray-200"} border-2 ${cat.borderColor || "border-gray-300"} ${cat.imageUrl ? "" : "p-4"} overflow-hidden shadow-md group-hover/cat:shadow-lg group-hover/cat:scale-105 transition-all duration-300 flex items-center justify-center`}>
                          {cat.imageUrl ? (
                            <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover" />
                          ) : (
                            <IconComponent className={`h-14 w-14 ${cat.textColor || "text-gray-600"}`} />
                          )}
                        </div>
                        <span className={`text-sm font-bold text-center leading-tight break-words ${cat.textColor || "text-gray-900"}`}>
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Today's Offers Section */}
            {activeOffers.length > 0 && (
              <div className="space-y-3" data-testid="home-offers-section">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                      <Tag className="h-3.5 w-3.5 text-white" />
                    </div>
                    <h2 className="text-base font-bold text-gray-900">Today's Offers</h2>
                  </div>
                  <Link href="/offers">
                    <button className="text-xs text-orange-500 font-semibold flex items-center gap-0.5" data-testid="btn-see-all-offers">
                      Sab Dekho <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {activeOffers.map(offer => (
                    <Link href="/offers" key={offer.id}>
                      <div className="flex-shrink-0 w-64 rounded-2xl bg-white border border-orange-100 shadow-sm overflow-hidden cursor-pointer active:scale-95 transition-transform" data-testid={`home-offer-card-${offer.id}`}>
                        <div className="h-1 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400" />
                        {offer.image ? (
                          <img src={offer.image} alt={offer.title} className="w-full h-28 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : null}
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-gray-900 text-sm leading-tight flex-1">{offer.title}</p>
                            {offer.discount && (
                              <span className="text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white px-1.5 py-0.5 rounded-full shrink-0">{offer.discount}</span>
                            )}
                          </div>
                          {offer.description && (
                            <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">{offer.description}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

             {/* Dynamic Horizontal Scrolls for All Product Categories (controlled by showOnHome) */}
            {productCategories
              .filter(cat => cat.showOnHome !== "false")
              .map(cat => {
                const categoryProducts = PRODUCTS.filter(p => p.category === cat.slug).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                return (
                  <div key={cat.id} className="space-y-2">
                    <HorizontalProductScroll 
                      title={cat.name} 
                      products={categoryProducts}
                      onSeeAll={() => setActiveCategory(cat.slug)}
                    />
                  </div>
                );
            })}
            
            {/* Dynamic Horizontal Scrolls for All Service Categories (controlled by showOnHome) */}
            {serviceCategories
              .filter(cat => cat.showOnHome !== "false")
              .map(cat => {
                const categoryServices = servicesList.filter(s => s.categorySlug === cat.slug).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                const serviceProducts = categoryServices.map(s => ({
                  id: s.id + 10000,
                  name: s.name,
                  price: s.price,
                  originalPrice: s.originalPrice,
                  image: s.image,
                  category: s.categorySlug,
                  unit: s.unit || "per service",
                  sortOrder: s.sortOrder || 0,
                }));
                return (
                  <div key={cat.id} className="space-y-2">
                    <HorizontalProductScroll 
                      title={cat.name} 
                      products={serviceProducts}
                      onSeeAll={() => setActiveCategory(cat.slug)}
                      isService={true}
                    />
                  </div>
                );
            })}
          </>
        )}

        {/* Filtered View (Search or Category Selected) */}
        {(searchQuery || activeCategory !== "all") && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
               {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                      activeCategory === cat.id 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-white text-muted-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {cat.name}
                  </button>
               ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filteredProducts.map((product) => (
                product.id > 10000
                  ? <ServiceCard key={product.id} product={product} />
                  : <ProductCard key={product.id} product={product} hasVariants={product.hasVariants} />
              ))}
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                <Search className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-base font-medium">No matches found</p>
                <p className="text-xs">Try searching for something else</p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <div className="bg-gray-100 py-4 px-4 text-center space-y-2 mb-16">
        <p className="text-xs text-muted-foreground">© 2026 AtoZDukaan (atozdukaan.com)</p>
        <div className="flex items-center justify-center gap-3">
          <a href="/privacy-policy" className="text-xs text-primary underline" data-testid="link-privacy-policy">Privacy Policy</a>
          <span className="text-xs text-muted-foreground">•</span>
          <a href="/delete-account" className="text-xs text-red-500 underline" data-testid="link-delete-account">Delete Account</a>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav onCartClick={() => setIsCartOpen(true)} onHomeClick={() => setActiveCategory("all")} />
    </div>
  );
}

// Utility for conditional classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}
