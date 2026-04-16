import { useQuery } from "@tanstack/react-query";
import { Tag, Clock, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Offer {
  id: number;
  title: string;
  description?: string | null;
  image?: string | null;
  discount?: string | null;
  isActive: string;
  expiryDate?: string | null;
  sortOrder: number;
  createdAt: string;
}

export default function Offers() {
  const { data: offers = [], isLoading } = useQuery<Offer[]>({
    queryKey: ["/api/offers"],
    queryFn: async () => {
      const res = await fetch("/api/offers");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const formatExpiry = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full" data-testid="btn-back-home">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <Tag className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Today's Offers</h1>
              <p className="text-[10px] text-muted-foreground leading-none">Limited time deals</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl bg-white border animate-pulse h-40" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <Sparkles className="h-10 w-10 text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 mb-1">Abhi koi offer nahi hai</h2>
            <p className="text-sm text-muted-foreground">Jaldi aayenge! Tab tak shopping karte rahein 🛒</p>
            <Link href="/">
              <Button className="mt-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6" data-testid="btn-go-shopping">
                Shopping Karo
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground font-medium">{offers.length} offer{offers.length !== 1 ? "s" : ""} available</p>
            {offers.map((offer, idx) => (
              <div
                key={offer.id}
                data-testid={`card-offer-${offer.id}`}
                className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Gradient accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400" />

                <div className="flex gap-0">
                  {/* Image */}
                  {offer.image && (
                    <div className="w-36 h-36 flex-shrink-0">
                      <img
                        src={offer.image}
                        alt={offer.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className={`flex-1 p-4 ${offer.image ? "" : "pl-4"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 text-base leading-tight flex-1" data-testid={`text-offer-title-${offer.id}`}>
                        {offer.title}
                      </h3>
                      {offer.discount && (
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs font-bold px-2 py-0.5 rounded-full shrink-0" data-testid={`badge-discount-${offer.id}`}>
                          {offer.discount}
                        </Badge>
                      )}
                    </div>

                    {offer.description && (
                      <p className="text-sm text-gray-600 mt-1.5 leading-snug" data-testid={`text-offer-desc-${offer.id}`}>
                        {offer.description}
                      </p>
                    )}

                    {offer.expiryDate && (
                      <div className="flex items-center gap-1 mt-2.5 text-xs text-orange-600 font-medium">
                        <Clock className="h-3 w-3" />
                        <span>Valid till {formatExpiry(offer.expiryDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
