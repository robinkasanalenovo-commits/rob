import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Store, ArrowLeft } from "lucide-react";

const loginSchema = z.object({
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  shopName: z.string().min(2, "Shop name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  address: z.string().min(5, "Please provide your shop address"),
});

export default function SellerAuth() {
  const [_, setLocation] = useLocation();
  const { login } = useStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      mobile: "",
      password: "",
    },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      shopName: "",
      phone: "",
      email: "",
      password: "",
      address: "",
    },
  });

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/seller/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.mobile,
          password: values.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      login(data);
      
      if (data.sellerStatus === "approved") {
        setLocation("/seller");
      } else {
        setLocation("/seller-pending");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignup = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/seller/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.phone,
          password: values.password,
          name: values.name,
          shopName: values.shopName,
          phone: values.phone,
          email: values.email,
          address: values.address,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      login(data);
      setLocation("/seller-pending");
      
      toast({
        title: "Registration Successful!",
        description: "Your seller account is pending approval.",
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setLocation("/")}
          data-testid="btn-back-home"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-lg" data-testid="seller-auth-card">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Seller Portal</CardTitle>
            <CardDescription>
              Become a seller and list your products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="tab-seller-login">Login</TabsTrigger>
                <TabsTrigger value="signup" data-testid="tab-seller-signup">Register</TabsTrigger>
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
                            <Input 
                              placeholder="Enter your mobile number" 
                              type="tel"
                              data-testid="input-seller-mobile"
                              {...field} 
                            />
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
                            <Input 
                              type="password" 
                              placeholder="Enter your password"
                              data-testid="input-seller-password"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      disabled={isLoading}
                      data-testid="btn-seller-login"
                    >
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="signup">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your name"
                              data-testid="input-seller-name"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="shopName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shop Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your shop name"
                              data-testid="input-seller-shop-name"
                              {...field} 
                            />
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
                            <Input 
                              placeholder="Enter your mobile number"
                              type="tel"
                              data-testid="input-seller-phone"
                              {...field} 
                            />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your email"
                              type="email"
                              data-testid="input-seller-email"
                              {...field} 
                            />
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
                            <Input 
                              type="password"
                              placeholder="Create a password"
                              data-testid="input-seller-password-signup"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shop Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your shop address"
                              data-testid="input-seller-address"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      disabled={isLoading}
                      data-testid="btn-seller-register"
                    >
                      {isLoading ? "Registering..." : "Register as Seller"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
