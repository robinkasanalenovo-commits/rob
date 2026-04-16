import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Tv, Droplets, Smartphone, Leaf, Cherry, Milk, Heart, House, Shirt, Baby, Car, Dumbbell, Book, Music, Camera, Gamepad2, Utensils, ShoppingBag, Gift, Coffee, Pizza, Sparkles, Package, LayoutGrid, RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ProductCard } from "@/components/product/ProductCard";
import { ServiceCard } from "@/components/product/ServiceCard";

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

export default function Categories() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [location] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat) {
      setActiveCategory(cat);
    }
  }, [location]);

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

  const { data: productsData } = useQuery<DBProduct[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      return Array.isArray(data) ? data.filter((p: DBProduct) => p.isActive === "true") : [];
    },
  });
  const PRODUCTS: Product[] = Array.isArray(productsData) 
    ? productsData.map((p: DBProduct) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice || p.price,
        image: p.image,
        category: p.category,
        unit: p.unit || "1 pc",
        sortOrder: p.sortOrder || 0,
        hasVariants: p.hasVariants === "true",
      })).sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  const { data: servicesData } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const res = await fetch("/api/services");
      const data = await res.json();
      return Array.isArray(data) ? data.filter((s: Service) => s.isActive === "true") : [];
    },
  });
  const SERVICES: Product[] = Array.isArray(servicesData) 
    ? servicesData.map((s: Service) => ({
        id: s.id + 10000,
        name: s.name,
        price: s.price,
        originalPrice: s.originalPrice || s.price,
        image: s.image,
        category: s.categorySlug,
        unit: s.unit || "per service",
        sortOrder: s.sortOrder || 0,
        hasVariants: false,
      })).sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  const getCategoryIcon = (iconKey: string | null) => {
    if (!iconKey || !LUCIDE_ICONS[iconKey]) return LayoutGrid;
    return LUCIDE_ICONS[iconKey];
  };

  const activeIsService = dynamicCategories.find(c => c.slug === activeCategory)?.type === "service";
  
  const allItems = activeIsService ? SERVICES : PRODUCTS;
  
  const filteredItems = allItems.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getItemCount = (cat: Category) => {
    if (cat.type === "service") {
      return SERVICES.filter(s => s.category === cat.slug).length;
    }
    return PRODUCTS.filter(p => p.category === cat.slug).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-50 pb-24">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="container mx-auto px-3 py-4 space-y-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold font-heading">Shop by Category</h1>
          
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : dynamicCategories.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No categories available</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {dynamicCategories.map((cat) => {
                const IconComponent = getCategoryIcon(cat.iconKey);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.slug)}
                    className={`group relative h-28 rounded-xl overflow-hidden border-2 transition-all ${
                      activeCategory === cat.slug
                        ? "border-primary shadow-lg"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid={`category-card-${cat.slug}`}
                  >
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="absolute inset-0 h-full w-full object-cover brightness-[0.5] group-hover:brightness-[0.6] transition-all"
                      />
                    ) : (
                      <div className={`absolute inset-0 h-full w-full bg-gradient-to-br ${cat.colorStart?.replace('from-', 'from-').replace('-100', '-500') || 'from-gray-500'} ${cat.colorEnd?.replace('to-', 'to-').replace('-200', '-600') || 'to-gray-600'}`} />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-white">
                      {!cat.imageUrl && <IconComponent className="h-8 w-8 mb-1" />}
                      <h3 className="text-sm font-bold text-center px-2">{cat.name}</h3>
                      <p className="text-[10px] text-white/80 mt-0.5">
                        {getItemCount(cat)} {cat.type === "service" ? "services" : "items"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-all ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            All
          </button>
          {dynamicCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-all ${
                activeCategory === cat.slug
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-bold font-heading mb-4">
            {activeCategory === "all"
              ? "All Products"
              : `${dynamicCategories.find(c => c.slug === activeCategory)?.name || activeCategory}`}
            ({filteredItems.length})
          </h2>
          
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filteredItems.map((item) => (
              activeIsService 
                ? <ServiceCard key={item.id} product={item} />
                : <ProductCard key={item.id} product={item} hasVariants={item.hasVariants} />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
              <Search className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-base font-medium">
                {activeIsService ? "No services found" : "No products found"}
              </p>
              <p className="text-xs">Try a different category or search</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav onCartClick={() => setIsCartOpen(true)} />
    </div>
  );
}
