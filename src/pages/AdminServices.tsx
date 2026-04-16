import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit2, Trash2, RefreshCw, Save, X, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Category {
  id: number;
  name: string;
  slug: string;
  type: string | null;
  sortOrder: number | null;
  isActive: string | null;
}

interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number;
  image: string;
  images?: string[] | null;
  categorySlug: string;
  unit: string | null;
  sortOrder: number | null;
  isActive: string | null;
}

export default function AdminServices() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    image: "",
    images: [] as string[],
    categorySlug: "",
    unit: "per service",
    sortOrder: "0",
    isActive: "true",
  });

  const { data: servicesData, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const res = await fetch("/api/services");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const servicesList = Array.isArray(servicesData)
    ? [...servicesData].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];

  const { data: categoriesData } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const categoriesList = Array.isArray(categoriesData)
    ? [...categoriesData].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];

  const serviceCategories = categoriesList.filter(c => c.type === "service");

  const createServiceMutation = useMutation({
    mutationFn: async (service: typeof newService) => {
      const mainImage = service.images.length > 0 ? service.images[0] : service.image;
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: service.name,
          description: service.description,
          price: parseInt(service.price),
          originalPrice: parseInt(service.originalPrice),
          image: mainImage,
          images: service.images.length > 0 ? service.images : (service.image ? [service.image] : null),
          categorySlug: service.categorySlug,
          unit: service.unit,
          sortOrder: parseInt(service.sortOrder) || servicesList.length + 1,
          isActive: service.isActive,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create service" }));
        throw new Error(err.error || "Failed to create service");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setShowAddService(false);
      setNewService({
        name: "",
        description: "",
        price: "",
        originalPrice: "",
        image: "",
        images: [],
        categorySlug: "",
        unit: "per service",
        sortOrder: "0",
        isActive: "true",
      });
      toast({ title: "Added!", description: "Service added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add service", variant: "destructive" });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Service> }) => {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to update service" }));
        throw new Error(err.error || "Failed to update service");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setEditingService(null);
      toast({ title: "Updated!", description: "Service updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update service", variant: "destructive" });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Deleted!", description: "Service deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete service", variant: "destructive" });
    },
  });

  const handleDeleteService = (id: number) => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteServiceMutation.mutate(id);
    }
  };

  const getServicesByCategory = () => {
    const grouped: { [key: string]: Service[] } = {};
    serviceCategories.forEach(cat => {
      grouped[cat.slug] = servicesList.filter(s => s.categorySlug === cat.slug);
    });
    const uncategorized = servicesList.filter(s => !serviceCategories.find(c => c.slug === s.categorySlug));
    if (uncategorized.length > 0) {
      grouped["other"] = uncategorized;
    }
    return grouped;
  };

  const groupedServices = getServicesByCategory();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/admin")} className="text-white hover:bg-white/20">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Wrench className="h-6 w-6" />
        <h1 className="text-xl font-bold">Services Management</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Services ({servicesList.length})</h2>
          <Button size="sm" onClick={() => setShowAddService(true)} className="gap-1 bg-blue-600 hover:bg-blue-700" data-testid="add-service-btn">
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>

        {servicesLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : servicesList.length === 0 ? (
          <Card className="border">
            <CardContent className="p-6 text-center text-muted-foreground">
              No services yet. Add your first service!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedServices).map(([slug, services]) => {
              if (services.length === 0) return null;
              const category = serviceCategories.find(c => c.slug === slug);
              const categoryName = category?.name || (slug === "other" ? "Other Services" : slug);

              return (
                <div key={slug} className="space-y-2">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-transparent p-2 rounded-lg">
                    <h3 className="text-sm font-bold text-blue-700">{categoryName}</h3>
                    <span className="text-xs text-muted-foreground">({services.length} services)</span>
                  </div>

                  <div className="space-y-2 pl-2">
                    {services.map(service => (
                      <Card key={service.id} className="border shadow-sm" data-testid={`service-card-${service.id}`}>
                        <CardContent className="p-3">
                          <div className="flex gap-3">
                            <img
                              src={service.image}
                              alt={service.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{service.name}</p>
                              <p className="text-xs text-muted-foreground">{service.unit}</p>
                              {service.description && (
                                <p className="text-xs text-muted-foreground truncate">{service.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-bold text-blue-600">₹{service.price}</span>
                                {service.originalPrice > service.price && (
                                  <span className="text-xs text-muted-foreground line-through">₹{service.originalPrice}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => setEditingService(service)}
                                data-testid={`edit-service-${service.id}`}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteService(service.id)}
                                disabled={deleteServiceMutation.isPending}
                                data-testid={`delete-service-${service.id}`}
                              >
                                {deleteServiceMutation.isPending ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                Add New Service
                <Button variant="ghost" size="sm" onClick={() => setShowAddService(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Service name"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                data-testid="input-service-name"
              />
              <Textarea
                placeholder="Description (optional)"
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                data-testid="input-service-description"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Price (₹)"
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  data-testid="input-service-price"
                />
                <Input
                  placeholder="Original Price (₹)"
                  type="number"
                  value={newService.originalPrice}
                  onChange={(e) => setNewService({ ...newService, originalPrice: e.target.value })}
                  data-testid="input-service-original-price"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Image Links (Max 3)</label>
                <div className="space-y-2">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-[10px] text-muted-foreground w-5 shrink-0">{idx === 0 ? "Main" : `#${idx + 1}`}</span>
                      <Input
                        placeholder={`Image ${idx + 1} URL paste karein`}
                        value={newService.images[idx] || ""}
                        onChange={(e) => {
                          const updated = [...newService.images];
                          if (e.target.value) {
                            updated[idx] = e.target.value;
                          } else {
                            updated.splice(idx, 1);
                          }
                          const filtered = updated.filter(Boolean);
                          setNewService({ ...newService, images: filtered, image: filtered[0] || "" });
                        }}
                        className="flex-1 text-xs"
                        data-testid={`input-service-image-${idx}`}
                      />
                      {newService.images[idx] && (
                        <img src={newService.images[idx]} alt="" className="w-8 h-8 object-cover rounded border shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Select
                value={newService.categorySlug}
                onValueChange={(value) => setNewService({ ...newService, categorySlug: value })}
              >
                <SelectTrigger data-testid="select-service-category">
                  <SelectValue placeholder="Select service category" />
                </SelectTrigger>
                <SelectContent>
                  {serviceCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Unit (e.g., per service, per visit)"
                value={newService.unit}
                onChange={(e) => setNewService({ ...newService, unit: e.target.value })}
                data-testid="input-service-unit"
              />
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => createServiceMutation.mutate(newService)}
                disabled={createServiceMutation.isPending || !newService.name || !newService.price || !newService.categorySlug || (newService.images.length === 0 && !newService.image)}
                data-testid="save-service-btn"
              >
                {createServiceMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Service
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {editingService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                Edit Service
                <Button variant="ghost" size="sm" onClick={() => setEditingService(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Service name"
                defaultValue={editingService.name}
                onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                data-testid="input-edit-service-name"
              />
              <Textarea
                placeholder="Description (optional)"
                defaultValue={editingService.description || ""}
                onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                data-testid="input-edit-service-description"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Price (₹)"
                  type="number"
                  defaultValue={editingService.price}
                  onChange={(e) => setEditingService({ ...editingService, price: parseInt(e.target.value) || 0 })}
                  data-testid="input-edit-service-price"
                />
                <Input
                  placeholder="Original Price (₹)"
                  type="number"
                  defaultValue={editingService.originalPrice}
                  onChange={(e) => setEditingService({ ...editingService, originalPrice: parseInt(e.target.value) || 0 })}
                  data-testid="input-edit-service-original-price"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Image Links (Max 3)</label>
                <div className="space-y-2">
                  {[0, 1, 2].map((idx) => {
                    const currentImages = editingService.images && editingService.images.length > 0 ? editingService.images : editingService.image ? [editingService.image] : [];
                    return (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-[10px] text-muted-foreground w-5 shrink-0">{idx === 0 ? "Main" : `#${idx + 1}`}</span>
                        <Input
                          placeholder={`Image ${idx + 1} URL paste karein`}
                          value={currentImages[idx] || ""}
                          onChange={(e) => {
                            const updated = [...currentImages];
                            if (e.target.value) {
                              updated[idx] = e.target.value;
                            } else {
                              updated.splice(idx, 1);
                            }
                            const filtered = updated.filter((v: string) => Boolean(v));
                            setEditingService({ ...editingService, images: filtered, image: filtered[0] || "" });
                          }}
                          className="flex-1 text-xs"
                          data-testid={`input-edit-service-image-${idx}`}
                        />
                        {currentImages[idx] && (
                          <img src={currentImages[idx]} alt="" className="w-8 h-8 object-cover rounded border shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <Select
                value={editingService.categorySlug}
                onValueChange={(value) => setEditingService({ ...editingService, categorySlug: value })}
              >
                <SelectTrigger data-testid="select-edit-service-category">
                  <SelectValue placeholder="Select service category" />
                </SelectTrigger>
                <SelectContent>
                  {serviceCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Unit (e.g., per service, per visit)"
                defaultValue={editingService.unit || ""}
                onChange={(e) => setEditingService({ ...editingService, unit: e.target.value })}
                data-testid="input-edit-service-unit"
              />
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => updateServiceMutation.mutate({ id: editingService.id, data: editingService })}
                disabled={updateServiceMutation.isPending}
                data-testid="update-service-btn"
              >
                {updateServiceMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Update Service
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
