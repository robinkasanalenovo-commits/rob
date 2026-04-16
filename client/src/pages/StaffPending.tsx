import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Phone, LogOut } from "lucide-react";

export default function StaffPending() {
  const [, setLocation] = useLocation();
  const { user, logout } = useStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="mx-auto bg-amber-100 p-4 rounded-full w-20 h-20 flex items-center justify-center">
            <Clock className="h-10 w-10 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Account Under Review</h2>
          <p className="text-gray-500 text-sm">
            Hi <span className="font-medium text-gray-700">{user?.name || "Staff"}</span>, your Purchase & Sale Manager account has been created successfully.
          </p>
          <p className="text-gray-500 text-sm">
            The admin needs to approve your account before you can start entering data. Please contact the admin for quick approval.
          </p>
          <div className="pt-2 space-y-2">
            <a href="tel:9999878381" className="block">
              <Button variant="outline" className="w-full" data-testid="btn-call-admin">
                <Phone className="h-4 w-4 mr-2" />
                Call Admin: 9999878381
              </Button>
            </a>
            <a href="https://wa.me/919999878381?text=Hi, I have signed up as Purchase %26 Sale Manager staff. Please approve my account." className="block">
              <Button variant="outline" className="w-full text-green-600 border-green-200 hover:bg-green-50" data-testid="btn-whatsapp-admin">
                WhatsApp Admin
              </Button>
            </a>
          </div>
          <Button variant="ghost" onClick={() => { logout(); setLocation("/staff-auth"); }} className="text-gray-400" data-testid="btn-staff-logout">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
