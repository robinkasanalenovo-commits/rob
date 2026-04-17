import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { Minus, Plus, Trash2, Clock, Truck, ShoppingCart, MessageSquare, RefreshCw, CheckCircle, Download, ZoomIn, Gift } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface DeliverySlot {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  isActive: string;
  sortOrder: number;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
const cart: any[] = [];
const updateQuantity = () => {};
const removeFromCart = () => {};
const clearCart = () => {};
const user = null;
const isAuthenticated = false;
  const [, setLocation] = useLocation();
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState("");
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [confirmedOrderTotal, setConfirmedOrderTotal] = useState(0);
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const { toast } = useToast();

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const savings = cart.reduce((acc, item) => acc + (item.originalPrice - item.price) * item.quantity, 0);

  const referralBalance = 0;
const referralDiscount = 0;
const total = subtotal;

  // Fetch payment QR code
  const { data: paymentQrData } = useQuery<{ qrCode: string | null }>({
    queryKey: ["/api/settings/payment-qr"],
    queryFn: async () => {
      const res = await fetch("/api/settings/payment-qr");
      return res.json();
    },
  });
  const paymentQrCode = paymentQrData?.qrCode;

  // Fetch visible delivery slots for user's area
  const userAreaId = user?.mainAreaId;
  const { data: slotsData, isLoading: slotsLoading } = useQuery<DeliverySlot[]>({
    queryKey: ["/api/delivery-slots/area", userAreaId],
    queryFn: async () => {
      if (userAreaId) {
        const res = await fetch(`/api/delivery-slots/area/${userAreaId}`);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } else {
        // Fallback: get all active slots if no area selected
        const res = await fetch("/api/delivery-slots");
        const data = await res.json();
        return Array.isArray(data) ? data.filter((s: DeliverySlot) => String(s.isActive) === "true") : [];
      }
    },
    enabled: open,
  });
  const deliverySlots = Array.isArray(slotsData) ? slotsData : [];

  // Auto-select first slot if none selected
  useEffect(() => {
    if (deliverySlots.length > 0 && !selectedSlotId) {
      setSelectedSlotId(deliverySlots[0].id.toString());
    }
  }, [deliverySlots, selectedSlotId]);

  // Place order directly
  const handlePlaceOrder = async () => {
    // Check if user is logged in
    const { isAuthenticated, user } = useStore.getState();
    
    if (!isAuthenticated || !user) {
      toast({
        title: "Login Required",
        description: "कृपया order करने के लिए पहले login करें",
      });
      onClose();
      setLocation("/auth");
      return;
    }

    // Check if user is approved

    if (!selectedSlotId || deliverySlots.length === 0) {
      toast({
        title: "Select Delivery Slot",
        description: "Please select a delivery slot before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    // Get selected slot info
    const selectedSlot = deliverySlots.find(s => s.id.toString() === selectedSlotId);
    const slotDisplay = selectedSlot 
      ? `${selectedSlot.name} (${selectedSlot.startTime} - ${selectedSlot.endTime})`
      : "No slot selected";
    
    try {
      // Prepare order items for stock tracking
      const orderItems = cart.map(item => ({
        productId: item.id,
        variantId: item.variantId || null,
        variantName: item.variantName || null,
        productName: item.variantName ? `${item.name} (${item.variantName})` : item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price * item.quantity,
      }));
      
      const orderData = {
        userId: user?.id || null,
        customerName: user?.name || "Guest",
        customerPhone: user?.phone || "",
        mainAreaName: user?.mainAreaName || "",
        subAreaName: user?.subAreaName || "",
        total: subtotal,
        itemsCount: cart.length,
        deliverySlot: slotDisplay,
        deliveryAddress: user?.address || "",
        orderNotes: orderNotes.trim() || null,
        items: orderItems,
        applyReferralCredit: referralDiscount > 0,
      };
      
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      
      if (!res.ok) {
        throw new Error("Failed to place order");
      }
      
      const orderResult = await res.json();
      
      // Google Ads conversion tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          'send_to': 'AW-17772211319/rfulCPmvu-4bEPfYuZpC',
          'transaction_id': orderResult.id?.toString() || '',
        });
      }
      
      // Show order confirmation with payment options
      setConfirmedOrderId(orderResult.id);
      setConfirmedOrderTotal(orderResult.total ?? total);
      setShowOrderConfirmation(true);
      clearCart();
      
      toast({
        title: "Order Placed Successfully!",
        description: `Your order will be delivered: ${slotDisplay}.`,
      });
    } catch (error) {
      toast({
        title: "Order Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle Cash on Delivery selection
  const handleCashOnDelivery = async () => {
    if (confirmedOrderId) {
      try {
        await fetch(`/api/orders/${confirmedOrderId}/payment-status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentStatus: "cod" }),
        });
      } catch (error) {
        console.error("Failed to update payment status:", error);
      }
    }
    handleCloseConfirmation();
  };

  // Show QR code for payment (don't update status yet - wait for confirmation)
  const handleMakePayment = () => {
    setShowPaymentQR(true);
  };

  // Confirm online payment done
  const handleConfirmOnlinePayment = async () => {
    if (confirmedOrderId) {
      try {
        await fetch(`/api/orders/${confirmedOrderId}/payment-status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentStatus: "online_paid" }),
        });
      } catch (error) {
        console.error("Failed to update payment status:", error);
      }
    }
    handleCloseConfirmation();
  };

  // Go back from QR to options
  const handleBackFromQR = () => {
    setShowPaymentQR(false);
  };

  const handleCloseConfirmation = () => {
    setShowOrderConfirmation(false);
    setConfirmedOrderTotal(0);
    setConfirmedOrderId(null);
    setShowPaymentQR(false);
    onClose();
  };

  // Reset states when drawer closes
  const handleDrawerClose = () => {
    setShowPaymentQR(false);
    onClose();
  };

  // Handle sheet open/close - prevent closing during payment options screen
  const handleSheetOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // If showing payment options, don't close on external events (like toast dismiss)
      if (showOrderConfirmation) {
        return; // Ignore close request - user must click a payment button
      }
      handleDrawerClose();
    }
  };

  return (
  <div style={{ padding: "20px", background: "white", color: "black" }}>
    CartDrawer Base Test ✅
  </div>
);
