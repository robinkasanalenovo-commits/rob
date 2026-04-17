import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProductCard } from "@/components/product/ProductCard";
import { ServiceCard } from "@/components/product/ServiceCard";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { HorizontalProductScroll } from "@/components/product/HorizontalProductScroll";
import { Link } from "wouter";

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

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

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

  const productCategories = dynamicCategories.filter((c) => c.type !== "service");
  const serviceCategories = dynamicCategories.filter((c) => c.type === "service");

  const { data: servicesData } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const res = await fetch("/api/services");
      const data = await res.json();
      return Array.isArray(data)
        ? data.filter((s: Service) => s.isActive === "true" || String(s.isActive) === "true")
        : [];
    },
  });

  const servicesList = Array.isArray(servicesData)
    ? [...servicesData].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];

  const { data: productsData, isLoading: productsLoading } = useQuery<DBProduct[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      return Array.isArray(data)
        ? data.filter((p: DBProduct) => p.isActive === "true" || String(p.isActive) === "true")
        : [];
    },
  });

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

  const { data: bannersData } = useQuery<Banner[]>({
    queryKey: ["/api/banners"],
    queryFn: async () => {
      const res = await fetch("/api/banners");
      const data = await res.json();
      return Array.isArray(data)
        ? data
            .filter((b: Banner) => String(b.isActive) === "true")
            .sort((a: Banner, b: Banner) => (a.sortOrder || 0) - (b.sortOrder || 0))
        : [];
    },
  });

  const banners = bannersData || [];

  useEffect(() => {
    if (currentBannerIndex >= banners.length && banners.length > 0) {
      setCurrentBannerIndex(0);
    }
  }, [banners.length, currentBannerIndex]);

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

  interface HomeOffer {
    id: number;
    title: string;
    description?: string | null;
    image?: string | null;
    discount?: string | null;
    isActive: string;
  }

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

  const { data: homeBannerData } = useQuery<{ banner: string | null }>({
    queryKey: ["/api/settings/home-banner"],
    queryFn: async () => {
      const res = await fetch("/api/settings/home-banner");
      return res.json();
    },
  });

  const customBanner = homeBannerData?.banner || null;

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
    buttonText: "Shop Now",
  };

  const servicesAsProducts = servicesList.map((s) => ({
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

  const allItems = [...PRODUCTS, ...servicesAsProducts];

  const filteredProducts = allItems
    .filter((product) => {
      const matchesCategory = activeCategory === "all" || product.category === activeCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const categories = [
    { id: "all", name: "All", image: null },
    ...dynamicCategories.map((cat) => ({
      id: cat.slug,
      name: cat.name,
      image: cat.imageUrl,
    })),
  ];
return (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/20 to-white pb-24">
    <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

    <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />

    <main className="container mx-auto space-y-6 px-3 py-4">
      
      <h2>Test Home Page ✅</h2>

      <div className="grid grid-cols-2 gap-3">
        {filteredProducts.map((product) => (
          <div key={product.id}>
            {product.name}
          </div>
        ))}
      </div>

    </main>

    <BottomNav 
      onCartClick={() => setIsCartOpen(true)} 
      onHomeClick={() => setActiveCategory("all")} 
    />
  </div>
);
