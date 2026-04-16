import { useRef } from "react";
import { Product } from "@/lib/store";
import { ProductCard } from "./ProductCard";
import { ServiceCard } from "./ServiceCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HorizontalProductScrollProps {
  title: string;
  products: Product[];
  onSeeAll?: () => void;
  isService?: boolean;
}

export function HorizontalProductScroll({ title, products, onSeeAll, isService = false }: HorizontalProductScrollProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-heading">{title}</h2>
        <Button 
          variant="default" 
          size="sm" 
          onClick={onSeeAll}
          className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white font-bold text-sm px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse hover:animate-none border-2 border-white/30">
          See All <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="w-full whitespace-nowrap rounded-lg">
        <div className="flex w-max space-x-4 pb-4 px-1">
          {products.map((product) => (
            <div key={product.id} className="w-[160px] md:w-[200px] shrink-0">
              {isService 
                ? <ServiceCard product={product} />
                : <ProductCard product={product} hasVariants={product.hasVariants} />
              }
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </div>
  );
}
