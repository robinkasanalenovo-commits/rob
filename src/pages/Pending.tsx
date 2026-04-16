import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, Phone, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";

export default function Pending() {
  const { user, logout } = useStore();
  const [, setLocation] = useLocation();

  const { data: contactData } = useQuery({
    queryKey: ["/api/settings/contact-number"],
    queryFn: async () => {
      const res = await fetch("/api/settings/contact-number");
      return res.json();
    }
  });

  const contactNumber = contactData?.contactNumber || "9999878381";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center border-none shadow-lg">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          <CardDescription className="text-base mt-2">
            Thanks for signing up, {user?.name}!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Your account is currently under review by our team. You will receive an email notification once your account is approved.
          </p>

          {/* Instant Shopping Contact */}
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm font-medium text-green-800 mb-3">
              🛒 तुरंत शॉपिंग करना चाहते हैं?<br/>
              <span className="text-xs text-green-600">Want to shop instantly?</span>
            </p>
            <div className="flex gap-2">
              <a 
                href={`tel:${contactNumber}`}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
              <a 
                href={`https://wa.me/91${contactNumber.replace(/\D/g, '')}?text=Hi, I want to place an order. My name is ${user?.name || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
            <p className="text-xs text-green-600 mt-2">📞 {contactNumber}</p>
          </div>

          <div className="rounded-lg bg-secondary/50 p-4 text-sm text-left">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              What happens next?
            </h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-1">
              <li>Our team verifies your delivery address</li>
              <li>We activate your account within 24 hours</li>
              <li>You can start ordering fresh groceries!</li>
            </ul>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              logout();
              setLocation("/auth");
            }}
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
