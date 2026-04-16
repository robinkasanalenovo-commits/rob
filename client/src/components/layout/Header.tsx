import { useState } from "react";
import { MapPin, Search, Clock, Share2, X, Copy, MessageCircle, MessageSquare } from "lucide-react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function Header({ searchQuery, setSearchQuery }: HeaderProps) {
  const { user } = useStore();
  const { toast } = useToast();
  const [showShareSheet, setShowShareSheet] = useState(false);

  const appUrl = "https://atozdukaan.com";
  const shareMsg = `🛒 AtoZDukaan — Fresh Groceries & Home Services!\n\nGhar baithe order karo, seedha delivery paao.\n👉 ${appUrl}\n\n📞 9999878381`;

  const openShare = () => setShowShareSheet(true);
  const closeShare = () => setShowShareSheet(false);

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`, "_blank");
    closeShare();
  };

  const handleSMS = () => {
    window.location.href = `sms:?body=${encodeURIComponent(shareMsg)}`;
    closeShare();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl).then(() => {
      toast({ title: "Link copy ho gaya! ✅" });
    });
    closeShare();
  };

  return (
    <>
      <div className="sticky top-0 z-40 w-full bg-gradient-to-r from-blue-600 to-blue-500 text-primary-foreground shadow-lg transition-all">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-3">
          {/* Top Row: Location & Slots & Share */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-xs font-semibold text-blue-50">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate max-w-[200px]">
                  {user?.isApproved ? "📍 Home" : "Select Location"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-blue-100">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span>Morning 9:30-11:30 | Eve 5:00-7:30</span>
              </div>
            </div>

            {/* Share App Button */}
            <button
              onClick={openShare}
              data-testid="header-share-btn"
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/30 active:scale-95 transition-transform"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share App
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="h-4 w-4" />
            </div>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search "milk", "tomato"...'
              className="h-10 w-full bg-white pl-10 pr-4 text-foreground placeholder:text-gray-500 border-none shadow-md focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0 rounded-full text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* Share Bottom Sheet */}
      {showShareSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" data-testid="header-share-sheet">
          <div className="absolute inset-0 bg-black/50" onClick={closeShare} />
          <div className="relative bg-white rounded-t-2xl p-5 space-y-4 shadow-2xl select-none">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">App Share Karo</h3>
              <button onClick={closeShare} className="p-1.5 rounded-full bg-gray-100 text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* App info - no raw URL text to prevent Android link popup */}
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex items-center gap-3">
              <img src="/favicon.png" alt="AtoZDukaan" className="w-12 h-12 rounded-xl object-contain bg-white p-1 shadow" />
              <div>
                <p className="font-bold text-gray-900 text-sm">AtoZDukaan</p>
                <p className="text-xs text-gray-500">Fresh Groceries & Home Services</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleWhatsApp}
                data-testid="header-share-whatsapp"
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-green-50 border border-green-200 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-green-700">WhatsApp</span>
              </button>

              <button
                onClick={handleSMS}
                data-testid="header-share-sms"
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-50 border border-blue-200 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-blue-700">SMS</span>
              </button>

              <button
                onClick={handleCopy}
                data-testid="header-share-copy"
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-purple-50 border border-purple-200 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                  <Copy className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-purple-700">Copy Link</span>
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 pb-2">
              Dosto ko share karo! 🎉
            </p>
          </div>
        </div>
      )}
    </>
  );
}
