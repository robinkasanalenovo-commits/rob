import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { Clock, Store, Phone, LogOut } from "lucide-react";

export default function SellerPending() {
  const [_, setLocation] = useLocation();
  const { user, logout } = useStore();

  const handleLogout = () => {
    logout();
    setLocation("/seller-auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg" data-testid="seller-pending-card">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Account Under Review</CardTitle>
          <CardDescription className="text-base mt-2">
            आपका seller account review में है। जल्द ही approve होगा।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-orange-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-orange-600" />
              <span className="font-medium">{user?.shopName || "Your Shop"}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Owner: {user?.name}
            </p>
            <p className="text-sm text-muted-foreground">
              Phone: {user?.phone}
            </p>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Questions? Contact admin:
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.location.href = "tel:9999878381"}
                data-testid="btn-call-admin"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                onClick={() => window.open("https://wa.me/919999878381", "_blank")}
                data-testid="btn-whatsapp-admin"
              >
                WhatsApp
              </Button>
            </div>
          </div>

          <Button 
            variant="ghost" 
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
            data-testid="btn-seller-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
