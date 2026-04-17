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
        {!searchQuery && activeCategory === "all" && (
          <>
            {banners.length > 0 ? (
              <div className="group relative overflow-hidden rounded-2xl shadow-xl transition-all hover:shadow-2xl" data-testid="banner-carousel">
                <div className="relative">
                  {banners.map((banner, index) => (
                    <div
                      key={banner.id}
                      className={`transition-opacity duration-500 ${index === currentBannerIndex ? "opacity-100" : "absolute inset-0 opacity-0"}`}
                      data-testid={`banner-slide-${banner.id}`}
                    >
                      <img
                        src={banner.imageUrl}
                        alt={banner.title || "Promotional Banner"}
                        className="h-40 w-full object-cover sm:h-48"
                      />
                      {(banner.title || banner.subtitle || banner.ctaText) && (
                        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4">
                          {banner.title && (
                            <h2 className="text-xl font-bold leading-tight text-white">{banner.title}</h2>
                          )}
                          {banner.subtitle && (
                            <p className="text-sm text-white/90">{banner.subtitle}</p>
                          )}
                          {banner.ctaText && banner.ctaLink && (
                            <a
                              href={banner.ctaLink}
                              className="mt-2 inline-block w-fit rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-blue-900 shadow-lg transition-all hover:bg-yellow-300"
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
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow-lg transition-all hover:bg-white"
                      data-testid="banner-prev"
                    >
                      <span>⬅️</span>
                    </button>
                    <button
                      onClick={nextBanner}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow-lg transition-all hover:bg-white"
                      data-testid="banner-next"
                    >
                      <span>➡️</span>
                    </button>
                    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {banners.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentBannerIndex(index)}
                          className={`h-2 rounded-full transition-all ${index === currentBannerIndex ? "w-4 bg-white" : "w-2 bg-white/50"}`}
                          data-testid={`banner-dot-${index}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : customBanner ? (
              <div className="group overflow-hidden rounded-2xl shadow-xl transition-all hover:shadow-2xl">
                <img
                  src={customBanner}
                  alt="Promotional Banner"
                  className="max-h-48 w-full object-cover sm:max-h-56"
                  data-testid="custom-home-banner"
                />
              </div>
            ) : (
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white shadow-xl transition-all hover:shadow-2xl">
                <div className="relative z-10 w-4/5">
                  <span className="mb-3 inline-block rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-900">
                    {bannerText.tagLine}
                  </span>
                  <h2 className="mb-2 text-2xl font-black leading-tight text-white">
                    {bannerText.mainHeading}
                  </h2>
                  <h3 className="mb-2 text-base font-bold text-blue-100">{bannerText.subHeading}</h3>
                  <p className="mb-4 text-xs font-medium text-blue-100">{bannerText.description}</p>
                  <button
                    onClick={() => setActiveCategory("vegetables")}
                    className="rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-bold text-blue-900 shadow-lg transition-all hover:scale-105 hover:bg-yellow-300 active:scale-95"
                  >
                    {bannerText.buttonText}
                  </button>
                </div>
                <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/10 blur-3xl transition-transform duration-500 group-hover:scale-110"></div>
                <div className="absolute bottom-2 right-4 text-5xl opacity-20 transition-opacity duration-500 group-hover:opacity-30">🛒</div>
              </div>
            )}

            <div>
              <h3 className="mb-4 px-1 text-base font-bold text-foreground">Shop by category</h3>

              {categoriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-xl">🔄</div>
                </div>
              ) : dynamicCategories.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">No categories available</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 px-1">
                  {dynamicCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.slug)}
                      className="group/cat flex flex-col items-center gap-2 transition-transform active:scale-95"
                      data-testid={`category-${cat.slug}`}
                    >
                      <div
                        className={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 bg-gradient-to-br ${cat.colorStart || "from-gray-100"} ${cat.colorEnd || "to-gray-200"} ${cat.borderColor || "border-gray-300"} ${cat.imageUrl ? "" : "p-4"} shadow-md transition-all duration-300 group-hover/cat:scale-105 group-hover/cat:shadow-lg`}
                      >
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className={`text-2xl ${cat.textColor || "text-gray-600"}`}>📦</div>
                        )}
                      </div>
                      <span className={`break-words text-center text-sm font-bold leading-tight ${cat.textColor || "text-gray-900"}`}>
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {activeOffers.length > 0 && (
              <div className="space-y-3" data-testid="home-offers-section">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500">
                      <span className="text-white">🏷️</span>
                    </div>
                    <h2 className="text-base font-bold text-gray-900">Today's Offers</h2>
                  </div>
                  <Link href="/offers">
                    <button className="flex items-center gap-0.5 text-xs font-semibold text-orange-500" data-testid="btn-see-all-offers">
                      Sab Dekho <span>➡️</span>
                    </button>
                  </Link>
                </div>

                <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                  {activeOffers.map((offer) => (
                    <Link href="/offers" key={offer.id}>
                      <div
                        className="w-64 flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition-transform active:scale-95"
                        data-testid={`home-offer-card-${offer.id}`}
                      >
                        <div className="h-1 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400" />
                        {offer.image ? (
                          <img
                            src={offer.image}
                            alt={offer.title}
                            className="h-28 w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : null}
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="flex-1 text-sm font-bold leading-tight text-gray-900">{offer.title}</p>
                            {offer.discount && (
                              <span className="shrink-0 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {offer.discount}
                              </span>
                            )}
                          </div>
                          {offer.description && (
                            <p className="mt-1 line-clamp-2 text-xs leading-snug text-gray-500">
                              {offer.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {productCategories
              .filter((cat) => cat.showOnHome !== "false")
              .map((cat) => {
                const categoryProducts = PRODUCTS
                  .filter((p) => p.category === cat.slug)
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

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

            {serviceCategories
              .filter((cat) => cat.showOnHome !== "false")
              .map((cat) => {
                const categoryServices = servicesList
                  .filter((s) => s.categorySlug === cat.slug)
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

                const serviceProducts = categoryServices.map((s) => ({
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

        {(searchQuery || activeCategory !== "all") && (
          <div className="space-y-4">
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    activeCategory === cat.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-white text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filteredProducts.map((product) =>
                product.id > 10000 ? (
                  <ServiceCard key={product.id} product={product} />
                ) : (
                  <ProductCard key={product.id} product={product} hasVariants={product.hasVariants} />
                )
              )}
            </div>

            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <div className="mb-3 text-3xl">🔍</div>
                <p className="text-base font-medium">No matches found</p>
                <p className="text-xs">Try searching for something else</p>
              </div>
            )}
          </div>
        )}
      </main>

      <div className="mb-16 space-y-2 bg-gray-100 px-4 py-4 text-center">
        <p className="text-xs text-muted-foreground">© 2026 AtoZDukaan (atozdukaan.com)</p>
        <div className="flex items-center justify-center gap-3">
          <a href="/privacy-policy" className="text-xs text-primary underline" data-testid="link-privacy-policy">
            Privacy Policy
          </a>
          <span className="text-xs text-muted-foreground">•</span>
          <a href="/delete-account" className="text-xs text-red-500 underline" data-testid="link-delete-account">
            Delete Account
          </a>
        </div>
      </div>

      <BottomNav onCartClick={() => setIsCartOpen(true)} onHomeClick={() => setActiveCategory("all")} />
    </div>
  );
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}
