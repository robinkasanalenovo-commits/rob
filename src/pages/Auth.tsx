import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Check } from "lucide-react";

interface Area {
  id: number;
  name: string;
  slug: string;
}

interface SubArea {
  id: number;
  areaId: number;
  name: string;
  slug: string;
}

interface AreaWithSubAreas extends Area {
  subAreas: SubArea[];
}

const loginSchema = z.object({
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  mainAreaId: z.string().min(1, "Please select your area"),
  subAreaId: z.string().optional(),
  address: z.string().min(10, "Please provide your full delivery address"),
  referredByCode: z.string().optional(),
});

export default function Auth() {
  const [_, setLocation] = useLocation();
  const { login, signup } = useStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [selectedAreaName, setSelectedAreaName] = useState<string>("");
  const [selectedSubAreaName, setSelectedSubAreaName] = useState<string>("");
  const [areaDrawerOpen, setAreaDrawerOpen] = useState(false);
  const [subAreaDrawerOpen, setSubAreaDrawerOpen] = useState(false);
  const [areasList, setAreasList] = useState<AreaWithSubAreas[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);

  // Fetch areas directly without React Query to avoid caching issues on mobile
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const timestamp = Date.now();
        const res = await fetch(`/api/areas-with-sub-areas?v=${timestamp}`, {
          method: 'GET',
          cache: 'no-store',
        });
        
        if (!res.ok) return;
        
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAreasList(data);
        }
      } catch (error) {
        console.error("Areas fetch error:", error);
      } finally {
        setAreasLoading(false);
      }
    };
    
    fetchAreas();
  }, []);
  
  // Get sub-areas for selected area
  const selectedArea = areasList.find(a => a.id.toString() === selectedAreaId);
  const subAreasList = selectedArea?.subAreas || [];

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      mobile: "",
      password: "",
    },
  });

  const savedRefCode = typeof window !== "undefined" ? localStorage.getItem("referralCode") || "" : "";

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
      mainAreaId: "",
      subAreaId: "",
      address: "",
      referredByCode: savedRefCode,
    },
  });

  useEffect(() => {
    if (savedRefCode) {
      setActiveTab("signup");
      signupForm.setValue("referredByCode", savedRefCode);
    }
  }, [savedRefCode]);

  // Reset sub-area when main area changes
  useEffect(() => {
    if (selectedAreaId) {
      signupForm.setValue("subAreaId", "");
      setSelectedSubAreaName("");
    }
  }, [selectedAreaId]);

  async function onLogin(values: z.infer<typeof loginSchema>) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.mobile,
          password: values.password,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Login Failed",
          description: error.error || "Invalid credentials",
          variant: "destructive",
        });
        return;
      }
      
      const userData = await response.json();
      login(userData);
      toast({ title: "Welcome back!", description: "You successfully logged in." });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function onSignup(values: z.infer<typeof signupSchema>) {
    try {
      const selectedArea = areasList.find(a => a.id.toString() === values.mainAreaId);
      const selectedSubArea = selectedArea?.subAreas.find(s => s.id.toString() === values.subAreaId);
      
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.phone,
          password: values.password,
          name: values.name,
          phone: values.phone,
          email: values.email,
          mainAreaId: values.mainAreaId ? parseInt(values.mainAreaId) : null,
          mainAreaName: selectedArea?.name || "",
          subAreaId: values.subAreaId ? parseInt(values.subAreaId) : null,
          subAreaName: selectedSubArea?.name || "",
          address: values.address,
          referredByCode: values.referredByCode?.trim() || null,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Registration Failed",
          description: error.error || "Could not create account",
          variant: "destructive",
        });
        return;
      }
      
      const user = await response.json();
      localStorage.removeItem("referralCode");
      signup({ 
        ...values, 
        id: user.id,
        mainAreaName: selectedArea?.name || "",
        subAreaName: selectedSubArea?.name || "",
      });
      setLocation("/");
      toast({
        title: "Welcome to AtoZDukaan!",
        description: "Your account has been created. Start shopping now!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }

  function handleAreaSelect(area: AreaWithSubAreas) {
    setSelectedAreaId(area.id.toString());
    setSelectedAreaName(area.name);
    signupForm.setValue("mainAreaId", area.id.toString());
    setAreaDrawerOpen(false);
  }

  function handleSubAreaSelect(subArea: SubArea) {
    setSelectedSubAreaName(subArea.name);
    signupForm.setValue("subAreaId", subArea.id.toString());
    setSubAreaDrawerOpen(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-orange-50 px-4 py-6">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <span className="text-2xl font-black text-white">A-Z</span>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            AtoZDukaan
          </CardTitle>
          <CardDescription className="text-sm">
            Fresh Groceries & Home Services - Sab Kuch Ek Jagah!
          </CardDescription>
          
          {/* Services showcase */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg">
              <span className="text-lg">🥬</span>
              <span className="text-[9px] text-green-700 font-medium">Vegetables</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-orange-50 rounded-lg">
              <span className="text-lg">🍎</span>
              <span className="text-[9px] text-orange-700 font-medium">Fruits</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg">
              <span className="text-lg">🥛</span>
              <span className="text-[9px] text-blue-700 font-medium">Dairy</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-yellow-50 rounded-lg">
              <span className="text-lg">⚡</span>
              <span className="text-[9px] text-yellow-700 font-medium">Electrician</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-cyan-50 rounded-lg">
              <span className="text-lg">🔧</span>
              <span className="text-[9px] text-cyan-700 font-medium">Plumber</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-purple-50 rounded-lg">
              <span className="text-lg">📱</span>
              <span className="text-[9px] text-purple-700 font-medium">Mobile</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-sky-50 rounded-lg">
              <span className="text-lg">❄️</span>
              <span className="text-[9px] text-sky-700 font-medium">AC Service</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-teal-50 rounded-lg">
              <span className="text-lg">💧</span>
              <span className="text-[9px] text-teal-700 font-medium">Water RO</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input placeholder="9876543210" {...field} data-testid="input-login-mobile" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">Login</Button>
                  <div className="text-center mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        const message = "Hello, mujhe apna AtoZDukaan password reset karna hai.";
                        window.open(`https://wa.me/919999878381?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className="text-xs text-primary hover:underline"
                      data-testid="link-forgot-password"
                    >
                      Forgot Password? WhatsApp karein
                    </button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="signup">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-3">
                  <FormField
                    control={signupForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} data-testid="input-signup-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input placeholder="9876543210" {...field} data-testid="input-signup-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (for password recovery)</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" {...field} data-testid="input-signup-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} data-testid="input-signup-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Area Selection - Drawer based for mobile */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={signupForm.control}
                      name="mainAreaId"
                      render={() => (
                        <FormItem>
                          <FormLabel>Area</FormLabel>
                          <button
                            type="button"
                            onClick={() => setAreaDrawerOpen(true)}
                            className="w-full h-10 px-3 py-2 text-sm border border-input rounded-md bg-white flex items-center justify-between"
                            data-testid="select-area"
                          >
                            <span className={selectedAreaName ? "text-foreground" : "text-muted-foreground"}>
                              {selectedAreaName || "Select Area"}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </button>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="subAreaId"
                      render={() => (
                        <FormItem>
                          <FormLabel>Sub-Area</FormLabel>
                          <button
                            type="button"
                            onClick={() => selectedAreaId && setSubAreaDrawerOpen(true)}
                            disabled={!selectedAreaId}
                            className="w-full h-10 px-3 py-2 text-sm border border-input rounded-md bg-white flex items-center justify-between disabled:opacity-50"
                            data-testid="select-subarea"
                          >
                            <span className={selectedSubAreaName ? "text-foreground" : "text-muted-foreground"}>
                              {selectedSubAreaName || "Select Sub-Area"}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </button>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={signupForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Address</FormLabel>
                        <FormControl>
                          <Input placeholder="House No., Street, Colony..." {...field} data-testid="input-signup-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="referredByCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referral Code (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter friend's referral code..." {...field} data-testid="input-signup-referral" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">Create Account</Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Area Selection Drawer */}
      <Drawer open={areaDrawerOpen} onOpenChange={setAreaDrawerOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Select Your Area</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {areasLoading ? (
              <p className="text-center text-muted-foreground py-4">Loading areas...</p>
            ) : areasList.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No delivery areas available yet. Please check back later.</p>
            ) : (
              <div className="space-y-2">
                {areasList.map(area => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => handleAreaSelect(area)}
                    className="w-full p-4 text-left rounded-lg border hover:bg-accent flex items-center justify-between transition-colors"
                  >
                    <span className="font-medium">{area.name}</span>
                    {selectedAreaId === area.id.toString() && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Sub-Area Selection Drawer */}
      <Drawer open={subAreaDrawerOpen} onOpenChange={setSubAreaDrawerOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Select Sub-Area in {selectedAreaName}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {subAreasList.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No sub-areas available</p>
            ) : (
              <div className="space-y-2">
                {subAreasList.map(subArea => (
                  <button
                    key={subArea.id}
                    type="button"
                    onClick={() => handleSubAreaSelect(subArea)}
                    className="w-full p-4 text-left rounded-lg border hover:bg-accent flex items-center justify-between transition-colors"
                  >
                    <span className="font-medium">{subArea.name}</span>
                    {signupForm.watch("subAreaId") === subArea.id.toString() && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
