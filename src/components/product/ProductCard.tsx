import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  price: number;
  originalPrice: number;
  isActive?: string;
  sortOrder?: number;
}

interface ProductCardProps {
  product: Product;
  variant?: "default" | "compact";
  hasVariants?: boolean;
}

export function ProductCard({ product, variant = "default", hasVariants = false }: ProductCardProps) {
  const { cart, addToCart, removeFromCart, updateQuantity } = useStore();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [showVariantMenu, setShowVariantMenu] = useState(false);
  const [variantsLoaded, setVariantsLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchVariants = () => {
    if (hasVariants) {
      // Add cache-busting timestamp to force fresh data
      fetch(`/api/products/${product.id}/variants?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            // Filter active variants - accept "true" or missing isActive (default active)
            const activeVariants = data.filter((v: ProductVariant) => 
              !v.isActive || v.isActive === "true" || 
              String(v.isActive).toLowerCase() === "true"
            );
            // Sort by sortOrder to ensure correct display order
            const sortedVariants = activeVariants.sort((a: ProductVariant, b: ProductVariant) => 
              (a.sortOrder || 0) - (b.sortOrder || 0)
            );
            if (sortedVariants.length > 0) {
              setVariants(sortedVariants);
              // Only set selected variant if not already set or if current selection is invalid
              if (!selectedVariant || !sortedVariants.find(v => v.id === selectedVariant.id)) {
                setSelectedVariant(sortedVariants[0]);
              }
            }
            setVariantsLoaded(true);
          }
        })
        .catch(err => console.error("Failed to fetch variants:", err));
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [hasVariants, product.id]);

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayOriginalPrice = selectedVariant ? selectedVariant.originalPrice : product.originalPrice;
  const displayUnit = selectedVariant ? selectedVariant.name : product.unit;

  const cartItem = cart.find((item) => {
    if (selectedVariant) {
      return item.id === product.id && item.variantId === selectedVariant.id;
    }
    return item.id === product.id && !item.variantId;
  });
  const quantity = cartItem?.quantity || 0;

  const discount = Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100);

  const handleAddToCart = () => {
    if (hasVariants && selectedVariant) {
      addToCart(product, selectedVariant);
    } else {
      addToCart(product);
    }
  };

  const handleUpdateQuantity = (delta: number) => {
    if (hasVariants && selectedVariant) {
      updateQuantity(product.id, delta, selectedVariant.id);
    } else {
      updateQuantity(product.id, delta);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative flex flex-col rounded-xl border border-gray-200/50 bg-white shadow-sm transition-all hover:shadow-lg hover:border-primary/20 h-full"
    >
      {/* Image Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-b from-gray-50 to-white p-2">
        {(() => {
          const allImages = product.images && product.images.length > 0 ? product.images : [product.image];
          return (
            <>
              <img
                src={allImages[currentImageIndex % allImages.length]}
                alt={product.name}
                className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
              {allImages.length > 1 && (
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                      className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex % allImages.length ? "w-3 bg-primary" : "w-1.5 bg-gray-300"}`}
                    />
                  ))}
                </div>
              )}
            </>
          );
        })()}
        {discount > 0 && (
          <div className="absolute top-2 left-2 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
            {discount}% OFF
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-medium text-foreground text-sm line-clamp-2 leading-tight mb-2">
          {product.name}
        </h3>
        
        {/* Variant Selector */}
        {hasVariants && variants.length > 0 ? (
          <div className="relative mb-2">
            <button
              onClick={() => {
                // Refresh variants when opening dropdown to get latest data
                if (!showVariantMenu) {
                  fetchVariants();
                }
                setShowVariantMenu(!showVariantMenu);
              }}
              className="flex items-center justify-between w-full text-xs bg-blue-50 text-blue-700 px-2 py-1.5 rounded-lg border border-blue-200"
            >
              <span className="font-medium">{selectedVariant?.name || "Select size"}</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", showVariantMenu && "rotate-180")} />
            </button>
            {showVariantMenu && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {variants.map((v, index) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariant(v);
                      setShowVariantMenu(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-2 text-xs hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0",
                      selectedVariant?.id === v.id && "bg-blue-100"
                    )}
                  >
                    <span className="flex items-center gap-1">
                      <span className="text-gray-400 text-[10px]">{index + 1}.</span>
                      <span>{v.name}</span>
                    </span>
                    <span className="font-bold text-primary">₹{v.price}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-2">{product.unit}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-col">
             <span className="text-[11px] text-muted-foreground line-through opacity-70">₹{displayOriginalPrice}</span>
             <span className="text-base font-bold text-foreground">₹{displayPrice}</span>
          </div>

          {quantity === 0 ? (
            <Button
              size="sm"
              className="h-8 w-20 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold tracking-wide uppercase text-xs shadow-md hover:shadow-lg transition-all active:scale-95"
              onClick={handleAddToCart}
            >
              ADD
            </Button>
          ) : (
            <div className="flex h-8 items-center rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md w-20 justify-between px-1">
              <button
                onClick={() => handleUpdateQuantity(-1)}
                className="flex h-full w-6 items-center justify-center active:scale-90 transition-transform"
              >
                <Minus className="h-3 w-3 stroke-[3]" />
              </button>
              <span className="text-xs font-bold">{quantity}</span>
              <button
                onClick={handleAddToCart}
                className="flex h-full w-6 items-center justify-center active:scale-90 transition-transform"
              >
                <Plus className="h-3 w-3 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
