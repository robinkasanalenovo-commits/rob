import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register object storage routes for image uploads
  registerObjectStorageRoutes(app);
  
  // Ensure admin user exists on startup
  try {
    await (storage as any).ensureAdminExists();
    console.log("Admin check completed successfully");
  } catch (err) {
    console.error("Admin check failed:", err);
  }
  
  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Categories error:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Create category
  app.post("/api/categories", async (req, res) => {
    try {
      const { name, slug, type, iconKey, imageUrl, colorStart, colorEnd, borderColor, textColor, sortOrder, isActive, showOnHome } = req.body;
      
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: "Category name is required" });
      }
      
      // Validate type field
      const validTypes = ['product', 'service'];
      const categoryType = validTypes.includes(type) ? type : 'product';
      
      const finalSlug = (slug && typeof slug === 'string' && slug.trim()) 
        ? slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const categoryData = {
        name: name.trim(),
        slug: finalSlug,
        type: categoryType,
        iconKey: iconKey || null,
        imageUrl: imageUrl || null,
        colorStart: colorStart || "from-gray-100",
        colorEnd: colorEnd || "to-gray-200",
        borderColor: borderColor || "border-gray-300",
        textColor: textColor || "text-gray-900",
        sortOrder: typeof sortOrder === 'number' ? sortOrder : parseInt(sortOrder) || 0,
        isActive: isActive || "true",
        showOnHome: showOnHome || "true",
      };
      
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // Update category
  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, slug, type, iconKey, imageUrl, colorStart, colorEnd, borderColor, textColor, sortOrder, isActive, showOnHome } = req.body;
      
      const updateData: Record<string, unknown> = {};
      
      if (name !== undefined) updateData.name = name.trim();
      if (slug !== undefined) updateData.slug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (type !== undefined) {
        const validTypes = ['product', 'service'];
        if (validTypes.includes(type)) {
          updateData.type = type;
        }
      }
      if (iconKey !== undefined) updateData.iconKey = iconKey || null;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
      if (colorStart !== undefined) updateData.colorStart = colorStart;
      if (colorEnd !== undefined) updateData.colorEnd = colorEnd;
      if (borderColor !== undefined) updateData.borderColor = borderColor;
      if (textColor !== undefined) updateData.textColor = textColor;
      if (sortOrder !== undefined) updateData.sortOrder = typeof sortOrder === 'number' ? sortOrder : parseInt(sortOrder) || 0;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (showOnHome !== undefined) updateData.showOnHome = showOnHome;
      
      const category = await storage.updateCategory(id, updateData);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  // Delete category
  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // ==================== AREA MANAGEMENT ====================

  // Get all areas
  app.get("/api/areas", async (req, res) => {
    try {
      const areas = await storage.getAllAreas();
      res.json(areas);
    } catch (error) {
      console.error("Areas error:", error);
      res.status(500).json({ error: "Failed to fetch areas" });
    }
  });

  // Create area
  app.post("/api/areas", async (req, res) => {
    try {
      const { name, slug, sortOrder, isActive } = req.body;
      
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: "Area name is required" });
      }
      
      const finalSlug = (slug && typeof slug === 'string' && slug.trim()) 
        ? slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const areaData = {
        name: name.trim(),
        slug: finalSlug,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : parseInt(sortOrder) || 0,
        isActive: isActive || "true",
      };
      
      const area = await storage.createArea(areaData);
      res.json(area);
    } catch (error) {
      console.error("Create area error:", error);
      res.status(500).json({ error: "Failed to create area" });
    }
  });

  // Update area
  app.patch("/api/areas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, slug, sortOrder, isActive } = req.body;
      
      const updateData: Record<string, unknown> = {};
      
      if (name !== undefined) updateData.name = name.trim();
      if (slug !== undefined) updateData.slug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (sortOrder !== undefined) updateData.sortOrder = typeof sortOrder === 'number' ? sortOrder : parseInt(sortOrder) || 0;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const area = await storage.updateArea(id, updateData);
      if (!area) {
        return res.status(404).json({ error: "Area not found" });
      }
      res.json(area);
    } catch (error) {
      console.error("Update area error:", error);
      res.status(500).json({ error: "Failed to update area" });
    }
  });

  // Delete area
  app.delete("/api/areas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteArea(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete area error:", error);
      res.status(500).json({ error: "Failed to delete area" });
    }
  });

  // Get all sub-areas
  app.get("/api/sub-areas", async (req, res) => {
    try {
      const subAreas = await storage.getAllSubAreas();
      res.json(subAreas);
    } catch (error) {
      console.error("Sub-areas error:", error);
      res.status(500).json({ error: "Failed to fetch sub-areas" });
    }
  });

  // Get sub-areas by area ID
  app.get("/api/areas/:areaId/sub-areas", async (req, res) => {
    try {
      const areaId = parseInt(req.params.areaId);
      const subAreas = await storage.getSubAreasByAreaId(areaId);
      res.json(subAreas);
    } catch (error) {
      console.error("Sub-areas by area error:", error);
      res.status(500).json({ error: "Failed to fetch sub-areas" });
    }
  });

  // Create sub-area
  app.post("/api/sub-areas", async (req, res) => {
    try {
      const { areaId, name, slug, sortOrder, isActive } = req.body;
      
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: "Sub-area name is required" });
      }
      if (!areaId || isNaN(parseInt(areaId))) {
        return res.status(400).json({ error: "Area ID is required" });
      }
      
      const finalSlug = (slug && typeof slug === 'string' && slug.trim()) 
        ? slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const subAreaData = {
        areaId: parseInt(areaId),
        name: name.trim(),
        slug: finalSlug,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : parseInt(sortOrder) || 0,
        isActive: isActive || "true",
      };
      
      const subArea = await storage.createSubArea(subAreaData);
      res.json(subArea);
    } catch (error) {
      console.error("Create sub-area error:", error);
      res.status(500).json({ error: "Failed to create sub-area" });
    }
  });

  // Update sub-area
  app.patch("/api/sub-areas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { areaId, name, slug, sortOrder, isActive } = req.body;
      
      const updateData: Record<string, unknown> = {};
      
      if (areaId !== undefined) updateData.areaId = parseInt(areaId);
      if (name !== undefined) updateData.name = name.trim();
      if (slug !== undefined) updateData.slug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (sortOrder !== undefined) updateData.sortOrder = typeof sortOrder === 'number' ? sortOrder : parseInt(sortOrder) || 0;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const subArea = await storage.updateSubArea(id, updateData);
      if (!subArea) {
        return res.status(404).json({ error: "Sub-area not found" });
      }
      res.json(subArea);
    } catch (error) {
      console.error("Update sub-area error:", error);
      res.status(500).json({ error: "Failed to update sub-area" });
    }
  });

  // Delete sub-area
  app.delete("/api/sub-areas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSubArea(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete sub-area error:", error);
      res.status(500).json({ error: "Failed to delete sub-area" });
    }
  });

  // Get areas with their sub-areas (combined view)
  app.get("/api/areas-with-sub-areas", async (req, res) => {
    // Disable caching for mobile browser compatibility
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    try {
      const areas = await storage.getAllAreas();
      const subAreas = await storage.getAllSubAreas();
      
      const areasWithSubAreas = areas.map(area => ({
        ...area,
        subAreas: subAreas.filter(sa => sa.areaId === area.id)
      }));
      
      res.json(areasWithSubAreas);
    } catch (error) {
      console.error("Areas with sub-areas error:", error);
      res.status(500).json({ error: "Failed to fetch areas with sub-areas" });
    }
  });

  // ===== Delivery Slots =====
  
  // Get all delivery slots
  app.get("/api/delivery-slots", async (req, res) => {
    try {
      const slots = await storage.getAllDeliverySlots();
      res.json(slots);
    } catch (error) {
      console.error("Delivery slots error:", error);
      res.status(500).json({ error: "Failed to fetch delivery slots" });
    }
  });

  // Create delivery slot
  app.post("/api/delivery-slots", async (req, res) => {
    try {
      const { name, startTime, endTime, isActive, sortOrder } = req.body;
      
      if (!name || !startTime || !endTime) {
        return res.status(400).json({ error: "Name, start time, and end time are required" });
      }
      
      const slotData = {
        name: name.trim(),
        startTime,
        endTime,
        isActive: isActive || "true",
        sortOrder: typeof sortOrder === 'number' ? sortOrder : parseInt(sortOrder) || 0,
      };
      
      const slot = await storage.createDeliverySlot(slotData);
      res.json(slot);
    } catch (error) {
      console.error("Create delivery slot error:", error);
      res.status(500).json({ error: "Failed to create delivery slot" });
    }
  });

  // Update delivery slot
  app.patch("/api/delivery-slots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, startTime, endTime, isActive, sortOrder } = req.body;
      
      const updateData: Record<string, unknown> = {};
      
      if (name !== undefined) updateData.name = name.trim();
      if (startTime !== undefined) updateData.startTime = startTime;
      if (endTime !== undefined) updateData.endTime = endTime;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (sortOrder !== undefined) updateData.sortOrder = typeof sortOrder === 'number' ? sortOrder : parseInt(sortOrder) || 0;
      
      const slot = await storage.updateDeliverySlot(id, updateData);
      if (!slot) {
        return res.status(404).json({ error: "Delivery slot not found" });
      }
      res.json(slot);
    } catch (error) {
      console.error("Update delivery slot error:", error);
      res.status(500).json({ error: "Failed to update delivery slot" });
    }
  });

  // Delete delivery slot
  app.delete("/api/delivery-slots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDeliverySlot(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete delivery slot error:", error);
      res.status(500).json({ error: "Failed to delete delivery slot" });
    }
  });

  // Get visible slots for an area (for customer checkout)
  app.get("/api/delivery-slots/area/:areaId", async (req, res) => {
    try {
      const areaId = parseInt(req.params.areaId);
      const slots = await storage.getVisibleSlotsForArea(areaId);
      res.json(slots);
    } catch (error) {
      console.error("Area delivery slots error:", error);
      res.status(500).json({ error: "Failed to fetch area delivery slots" });
    }
  });

  // Set area-specific slot visibility
  app.post("/api/delivery-slots/area-visibility", async (req, res) => {
    try {
      const { areaId, slotId, isActive } = req.body;
      
      if (!areaId || !slotId || isActive === undefined) {
        return res.status(400).json({ error: "Area ID, slot ID, and isActive are required" });
      }
      
      const result = await storage.setAreaDeliverySlotVisibility(
        parseInt(areaId), 
        parseInt(slotId), 
        isActive
      );
      res.json(result);
    } catch (error) {
      console.error("Set area slot visibility error:", error);
      res.status(500).json({ error: "Failed to set area slot visibility" });
    }
  });

  // Get area delivery slot settings
  app.get("/api/delivery-slots/area-settings/:areaId", async (req, res) => {
    try {
      const areaId = parseInt(req.params.areaId);
      const settings = await storage.getAreaDeliverySlots(areaId);
      res.json(settings);
    } catch (error) {
      console.error("Area slot settings error:", error);
      res.status(500).json({ error: "Failed to fetch area slot settings" });
    }
  });

  // Get all area delivery slot settings (for matrix view)
  app.get("/api/delivery-slots/all-area-settings", async (req, res) => {
    try {
      const allSettings = await storage.getAllAreaDeliverySlots();
      res.json(allSettings);
    } catch (error) {
      console.error("All area slot settings error:", error);
      res.status(500).json({ error: "Failed to fetch all area slot settings" });
    }
  });

  // ========== BANNERS ==========
  app.get("/api/banners", async (req, res) => {
    try {
      const { active } = req.query;
      if (active === "true") {
        const banners = await storage.getActiveBanners();
        res.json(banners);
      } else {
        const banners = await storage.getAllBanners();
        res.json(banners);
      }
    } catch (error) {
      console.error("Banners error:", error);
      res.status(500).json({ error: "Failed to fetch banners" });
    }
  });

  app.post("/api/banners", async (req, res) => {
    try {
      const { title, subtitle, description, imageUrl, ctaText, ctaLink, bgColor, textColor, isActive, sortOrder } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL is required" });
      }
      
      const bannerData = {
        title: title || "",
        subtitle: subtitle || "",
        description: description || "",
        imageUrl,
        ctaText: ctaText || "",
        ctaLink: ctaLink || "",
        bgColor: bgColor || "from-green-400 to-green-600",
        textColor: textColor || "white",
        isActive: isActive || "true",
        sortOrder: typeof sortOrder === 'number' ? sortOrder : parseInt(sortOrder) || 0,
      };
      
      const banner = await storage.createBanner(bannerData);
      res.json(banner);
    } catch (error) {
      console.error("Create banner error:", error);
      res.status(500).json({ error: "Failed to create banner" });
    }
  });

  app.patch("/api/banners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, subtitle, description, imageUrl, ctaText, ctaLink, bgColor, textColor, isActive, sortOrder } = req.body;
      
      const updateData: Record<string, unknown> = {};
      
      if (title !== undefined) updateData.title = title;
      if (subtitle !== undefined) updateData.subtitle = subtitle;
      if (description !== undefined) updateData.description = description;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (ctaText !== undefined) updateData.ctaText = ctaText;
      if (ctaLink !== undefined) updateData.ctaLink = ctaLink;
      if (bgColor !== undefined) updateData.bgColor = bgColor;
      if (textColor !== undefined) updateData.textColor = textColor;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (sortOrder !== undefined) updateData.sortOrder = typeof sortOrder === 'number' ? sortOrder : parseInt(sortOrder) || 0;
      
      const banner = await storage.updateBanner(id, updateData);
      if (!banner) {
        return res.status(404).json({ error: "Banner not found" });
      }
      res.json(banner);
    } catch (error) {
      console.error("Update banner error:", error);
      res.status(500).json({ error: "Failed to update banner" });
    }
  });

  app.delete("/api/banners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBanner(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete banner error:", error);
      res.status(500).json({ error: "Failed to delete banner" });
    }
  });

  // Get all services
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      console.error("Services error:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  // Create service
  app.post("/api/services", async (req, res) => {
    try {
      const { name, description, price, originalPrice, image, images, categorySlug, unit, sortOrder, isActive } = req.body;
      
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: "Service name is required" });
      }
      if (!price || !originalPrice || !image || !categorySlug) {
        return res.status(400).json({ error: "Price, original price, image, and category are required" });
      }
      
      const serviceData: any = {
        name: name.trim(),
        description: description || null,
        price: typeof price === 'number' ? price : parseInt(price) || 0,
        originalPrice: typeof originalPrice === 'number' ? originalPrice : parseInt(originalPrice) || 0,
        image,
        categorySlug,
        unit: unit || "per service",
        sortOrder: typeof sortOrder === 'number' ? sortOrder : parseInt(sortOrder) || 0,
        isActive: isActive || "true",
      };
      if (images) serviceData.images = images;
      
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      console.error("Create service error:", error);
      res.status(500).json({ error: "Failed to create service" });
    }
  });

  // Update service
  app.patch("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, description, price, originalPrice, image, images, categorySlug, unit, sortOrder, isActive } = req.body;
      
      const updateData: Record<string, unknown> = {};
      
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = typeof price === 'number' ? price : parseInt(price) || 0;
      if (originalPrice !== undefined) updateData.originalPrice = typeof originalPrice === 'number' ? originalPrice : parseInt(originalPrice) || 0;
      if (image !== undefined) updateData.image = image;
      if (images !== undefined) updateData.images = images;
      if (categorySlug !== undefined) updateData.categorySlug = categorySlug;
      if (unit !== undefined) updateData.unit = unit;
      if (sortOrder !== undefined) updateData.sortOrder = typeof sortOrder === 'number' ? sortOrder : parseInt(sortOrder) || 0;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const service = await storage.updateService(id, updateData);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Update service error:", error);
      res.status(500).json({ error: "Failed to update service" });
    }
  });

  // Delete service
  app.delete("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteService(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete service error:", error);
      res.status(500).json({ error: "Failed to delete service" });
    }
  });

  // Get all customers
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getAllUsers();
      // Add referral count for each customer
      const customersWithReferrals = await Promise.all(
        customers.map(async (customer) => {
          const referralCount = customer.referralCode 
            ? await storage.getReferralCount(customer.referralCode)
            : 0;
          return { ...customer, referralCount };
        })
      );
      res.json(customersWithReferrals);
    } catch (error) {
      console.error("Customers error:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  // Get customer analytics with order stats
  app.get("/api/customers/analytics", async (req, res) => {
    try {
      const customersWithStats = await storage.getCustomersWithOrderStats();
      res.json(customersWithStats);
    } catch (error) {
      console.error("Customer analytics error:", error);
      res.status(500).json({ error: "Failed to fetch customer analytics" });
    }
  });

  // Update customer approval status
  app.patch("/api/customers/:id/approval", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = await storage.updateUserApproval(id, status);
      if (!user) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update approval status" });
    }
  });

  // Delete customer
  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete customer error:", error);
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Update customer details
  app.put("/api/customers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, phone, username, address, mainAreaId, mainAreaName, subAreaId, subAreaName, approvalStatus, referralCode, isAdmin } = req.body;
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (username !== undefined) updateData.username = username;
      if (address !== undefined) updateData.address = address;
      if (mainAreaId !== undefined) updateData.mainAreaId = mainAreaId;
      if (mainAreaName !== undefined) updateData.mainAreaName = mainAreaName;
      if (subAreaId !== undefined) updateData.subAreaId = subAreaId;
      if (subAreaName !== undefined) updateData.subAreaName = subAreaName;
      if (approvalStatus !== undefined) updateData.approvalStatus = approvalStatus;
      if (referralCode !== undefined) updateData.referralCode = referralCode;
      if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
      
      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Update customer error:", error);
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  // Get all orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Get orders for a specific customer
  app.get("/api/orders/my", async (req, res) => {
    try {
      const customerName = req.query.customerName as string;
      if (!customerName) {
        return res.json([]);
      }
      const allOrders = await storage.getAllOrders();
      const customerOrders = allOrders.filter(order => order.customerName === customerName);
      res.json(customerOrders);
    } catch (error) {
      console.error("My orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Create order
  app.get("/api/user/:id/referral-balance", async (req, res) => {
    try {
      const balance = await storage.getUserReferralBalance(req.params.id);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch referral balance" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { userId, customerName, customerPhone, mainAreaName, subAreaName, total, itemsCount, deliverySlot, deliveryAddress, orderNotes, items, applyReferralCredit } = req.body;
      
      if (!customerName || !total || !itemsCount) {
        return res.status(400).json({ error: "Customer name, total, and items count are required" });
      }

      const grossTotal = typeof total === 'number' ? total : parseInt(total) || 0;
      
      const orderItemsData = (items && Array.isArray(items) && items.length > 0)
        ? items.map((item: { productId?: number; productName: string; category: string; quantity: number; unit?: string; price: number }) => ({
            orderId: 0,
            productId: null,
            productName: item.productName,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit || "1 kg",
            price: item.price,
          }))
        : [];

      const baseOrderData = {
        userId: userId || null,
        customerName,
        customerPhone: customerPhone || null,
        mainAreaName: mainAreaName || null,
        subAreaName: subAreaName || null,
        itemsCount: typeof itemsCount === 'number' ? itemsCount : parseInt(itemsCount) || 0,
        status: "Pending",
        deliverySlot: deliverySlot || "Morning",
        deliveryAddress: deliveryAddress || null,
        orderNotes: orderNotes || null,
      };

      const order = await storage.createOrderWithReferralDeduction(
        baseOrderData,
        userId || "",
        grossTotal,
        orderItemsData
      );
      
      res.json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Get stock summary for admin
  app.get("/api/stock-summary", async (req, res) => {
    try {
      const { filter, startDate, endDate, status } = req.query;
      
      let start: Date | undefined;
      let end: Date | undefined;
      
      if (filter === 'today') {
        start = new Date();
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
      } else if (filter === 'weekly') {
        start = new Date();
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
      } else if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
      }
      
      const statusFilter = status ? (status as string).split(',') : undefined;
      
      const summary = await storage.getStockSummaryWithFilters({
        startDate: start,
        endDate: end,
        status: statusFilter,
      });
      res.json(summary);
    } catch (error) {
      console.error("Stock summary error:", error);
      res.status(500).json({ error: "Failed to fetch stock summary" });
    }
  });

  // Get order items by order ID
  app.get("/api/orders/:id/items", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await storage.getOrderItemsByOrderId(id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order items" });
    }
  });

  // Update order status
  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, deliveredAt } = req.body;
      const deliveredAtDate = deliveredAt ? new Date(deliveredAt) : undefined;

      const allOrders = await storage.getAllOrders();
      const existingOrder = allOrders.find(o => o.id === id);
      const previousStatus = existingOrder?.status;

      const order = await storage.updateOrderStatus(id, status, deliveredAtDate);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (status === "Delivered" && previousStatus !== "Delivered") {
        try {
          // Also fix userId on order if it's null but we can match by phone
          let orderUser = null;
          if (order.userId) {
            orderUser = await storage.getUser(order.userId);
          }
          if (!orderUser && order.customerPhone) {
            const allUsers = await storage.getAllUsers();
            orderUser = allUsers.find(u => u.phone === order.customerPhone) || null;
            // Fix the userId on the order for future reference
            if (orderUser && !order.userId) {
              await storage.updateOrder(id, { userId: orderUser.id });
              console.log(`Fixed order #${id} userId to ${orderUser.id} (${orderUser.name})`);
            }
          }
          if (!orderUser && order.customerName) {
            const allUsers = await storage.getAllUsers();
            orderUser = allUsers.find(u => u.name === order.customerName) || null;
          }
          if (orderUser?.referredBy) {
            // Idempotent check: only credit once per order
            // Check if this order already has a referral credit note in its orderNotes
            const creditTag = `[REF_CREDITED_${id}]`;
            const existingNotes = order.orderNotes || "";
            if (!existingNotes.includes(creditTag)) {
              const referrer = await storage.getUserByReferralCode(orderUser.referredBy);
              if (referrer) {
                await storage.addReferralBalance(referrer.id, 50);
                // Mark order as credited
                await storage.updateOrder(id, { orderNotes: (existingNotes ? existingNotes + " " : "") + creditTag });
                console.log(`Referral bonus ₹50 credited to ${referrer.name} (${referrer.id}) for order #${id} by ${orderUser.name}`);
              }
            } else {
              console.log(`Referral credit already given for order #${id}, skipping`);
            }
          }
        } catch (refErr) {
          console.error("Referral credit error:", refErr);
        }
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Update order payment status
  app.patch("/api/orders/:id/payment-status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { paymentStatus } = req.body;
      if (!paymentStatus || !["cod", "online_paid"].includes(paymentStatus)) {
        return res.status(400).json({ error: "Invalid payment status" });
      }
      const order = await storage.updateOrderPaymentStatus(id, paymentStatus);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update payment status" });
    }
  });

  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Create product
  app.post("/api/products", async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Update product (PATCH)
  app.patch("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { syncVariants, oldPrice, oldOriginalPrice, oldStock, ...updateData } = req.body;
      
      const product = await storage.updateProduct(id, updateData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      let syncedCount = 0;
      if (syncVariants && product.hasVariants === "true") {
        const variants = await storage.getVariantsByProductId(id);
        for (const variant of variants) {
          const variantUpdate: any = {};
          let needsUpdate = false;

          if (oldPrice !== undefined && variant.price === oldPrice && updateData.price !== undefined) {
            variantUpdate.price = updateData.price;
            needsUpdate = true;
          }
          if (oldOriginalPrice !== undefined && variant.originalPrice === oldOriginalPrice && updateData.originalPrice !== undefined) {
            variantUpdate.originalPrice = updateData.originalPrice;
            needsUpdate = true;
          }
          if (oldStock !== undefined && variant.stock === oldStock && updateData.stock !== undefined) {
            variantUpdate.stock = updateData.stock;
            needsUpdate = true;
          }

          if (needsUpdate) {
            await storage.updateVariant(variant.id, variantUpdate);
            syncedCount++;
          }
        }
      }

      res.json({ ...product, syncedVariants: syncedCount });
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // Update product (PUT - for compatibility)
  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.updateProduct(id, req.body);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // Reorder products within a category
  app.post("/api/products/reorder", async (req, res) => {
    try {
      const { productIds } = req.body; // Array of product IDs in desired order
      if (!Array.isArray(productIds)) {
        return res.status(400).json({ error: "productIds must be an array" });
      }
      
      // Update each product's sortOrder based on its position in the array
      for (let i = 0; i < productIds.length; i++) {
        await storage.updateProduct(productIds[i], { sortOrder: i + 1 });
      }
      
      res.json({ success: true, message: `Reordered ${productIds.length} products` });
    } catch (error) {
      console.error("Reorder products error:", error);
      res.status(500).json({ error: "Failed to reorder products" });
    }
  });

  // Delete product
  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVariantsByProductId(id);
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Get product variants
  app.get("/api/products/:id/variants", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const variants = await storage.getVariantsByProductId(productId);
      res.json(variants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch variants" });
    }
  });

  // Create product variant
  app.post("/api/products/:id/variants", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const variant = await storage.createVariant({ ...req.body, productId });
      await storage.updateProduct(productId, { hasVariants: "true" });
      res.json(variant);
    } catch (error) {
      res.status(500).json({ error: "Failed to create variant" });
    }
  });

  // Update product variant
  app.patch("/api/variants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const variant = await storage.updateVariant(id, req.body);
      if (!variant) {
        return res.status(404).json({ error: "Variant not found" });
      }
      res.json(variant);
    } catch (error) {
      res.status(500).json({ error: "Failed to update variant" });
    }
  });

  // Delete product variant
  app.delete("/api/variants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVariant(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete variant" });
    }
  });

  // Get admin stats
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get daily sales (65 days)
  app.get("/api/admin/sales/daily", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 65;
      const dailySales = await storage.getDailySales(days);
      res.json(dailySales);
    } catch (error) {
      console.error("Daily sales error:", error);
      res.status(500).json({ error: "Failed to fetch daily sales" });
    }
  });

  // Get monthly sales (60 months)
  app.get("/api/admin/sales/monthly", async (req, res) => {
    try {
      const months = parseInt(req.query.months as string) || 60;
      const monthlySales = await storage.getMonthlySales(months);
      res.json(monthlySales);
    } catch (error) {
      console.error("Monthly sales error:", error);
      res.status(500).json({ error: "Failed to fetch monthly sales" });
    }
  });

  // Sales Analytics - Area-wise
  app.get("/api/admin/analytics/areas", async (req, res) => {
    try {
      const areaStats = await storage.getAreaSalesAnalytics();
      res.json(areaStats);
    } catch (error) {
      console.error("Area analytics error:", error);
      res.status(500).json({ error: "Failed to fetch area analytics" });
    }
  });

  // Sales Analytics - Product-wise
  app.get("/api/admin/analytics/products", async (req, res) => {
    try {
      const productStats = await storage.getProductSalesAnalytics();
      res.json(productStats);
    } catch (error) {
      console.error("Product analytics error:", error);
      res.status(500).json({ error: "Failed to fetch product analytics" });
    }
  });

  // Sales Analytics - Overview
  app.get("/api/admin/analytics/overview", async (req, res) => {
    try {
      const overview = await storage.getSalesOverview();
      res.json(overview);
    } catch (error) {
      console.error("Sales overview error:", error);
      res.status(500).json({ error: "Failed to fetch sales overview" });
    }
  });

  // Generate unique referral code
  function generateReferralCode(name: string): string {
    const prefix = (name || "USER").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "USER";
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timestamp = Date.now().toString(36).slice(-2).toUpperCase();
    return `${prefix}${suffix}${timestamp}`;
  }

  // Register user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, name, phone, email, address, mainAreaId, mainAreaName, subAreaId, subAreaName, referredByCode } = req.body;
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Validate referral code exists if provided
      let validReferredBy = null;
      if (referredByCode && referredByCode.trim()) {
        const allUsers = await storage.getAllUsers();
        const referrer = allUsers.find(u => u.referralCode === referredByCode.trim());
        if (referrer) {
          validReferredBy = referredByCode.trim();
        }
        // If referral code doesn't exist, we just ignore it (don't error)
      }

      // Generate unique referral code for new user
      const newReferralCode = generateReferralCode(name);

      const user = await storage.createUser({
        username,
        password,
        name: name || "",
        phone: phone || "",
        email: email || "",
        address: address || "",
        mainAreaId: mainAreaId || null,
        mainAreaName: mainAreaName || "",
        subAreaId: subAreaId || null,
        subAreaName: subAreaName || "",
        referralCode: newReferralCode,
        referredBy: validReferredBy,
        approvalStatus: "approved",
      });

      res.json({ 
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        address: user.address,
        mainAreaId: user.mainAreaId,
        mainAreaName: user.mainAreaName,
        subAreaId: user.subAreaId,
        subAreaName: user.subAreaName,
        referralCode: user.referralCode,
        referralBalance: user.referralBalance || 0,
        approvalStatus: user.approvalStatus,
        isAdmin: user.isAdmin 
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Failed to register" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({ 
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        address: user.address,
        mainAreaId: user.mainAreaId,
        mainAreaName: user.mainAreaName,
        subAreaId: user.subAreaId,
        subAreaName: user.subAreaName,
        referralCode: user.referralCode,
        referralBalance: user.referralBalance || 0,
        approvalStatus: user.approvalStatus,
        isAdmin: user.isAdmin 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // ===================== SELLER ROUTES =====================

  // Seller Registration
  app.post("/api/seller/register", async (req, res) => {
    try {
      const { username, password, name, shopName, phone, email, address } = req.body;
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "This phone number is already registered" });
      }

      const user = await storage.createUser({
        username,
        password,
        name: name || "",
        phone: phone || "",
        email: email || "",
        address: address || "",
        isSeller: "true",
        shopName: shopName || "",
        sellerStatus: "pending",
        approvalStatus: "pending", // Sellers also need approval
        isAdmin: "false",
      });

      res.json({ 
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        shopName: user.shopName,
        isSeller: user.isSeller,
        sellerStatus: user.sellerStatus,
      });
    } catch (error) {
      console.error("Seller register error:", error);
      res.status(500).json({ error: "Failed to register seller" });
    }
  });

  // Seller Login
  app.post("/api/seller/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (user.isSeller !== "true") {
        return res.status(401).json({ error: "This account is not a seller account" });
      }

      res.json({ 
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        shopName: user.shopName,
        isSeller: user.isSeller,
        sellerStatus: user.sellerStatus,
        allowedCategories: user.allowedCategories || [],
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Get seller's products
  app.get("/api/seller/products", async (req, res) => {
    try {
      const { sellerId } = req.query;
      if (!sellerId) {
        return res.status(400).json({ error: "Seller ID required" });
      }
      const allProducts = await storage.getAllProducts();
      const sellerProducts = allProducts.filter(p => p.sellerId === sellerId);
      res.json(sellerProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Add product (seller)
  app.post("/api/seller/products", async (req, res) => {
    try {
      const { name, price, originalPrice, image, images, category, unit, stock, sellerId, sellerShopName } = req.body;

      if (sellerId) {
        const seller = await storage.getUser(sellerId);
        if (seller?.allowedCategories && seller.allowedCategories.length > 0) {
          if (!seller.allowedCategories.includes(category)) {
            return res.status(403).json({ error: "You are not allowed to add products in this category" });
          }
        }
      }
      
      const product = await storage.createProduct({
        name,
        price: parseInt(price),
        originalPrice: parseInt(originalPrice) || parseInt(price),
        image,
        images: images || null,
        category,
        unit: unit || "1 kg",
        stock: parseInt(stock) || 100,
        isActive: "true",
        sortOrder: 0,
        hasVariants: "false",
        sellerId: sellerId || null,
        sellerShopName: sellerShopName || null,
      });

      res.json(product);
    } catch (error) {
      console.error("Add seller product error:", error);
      res.status(500).json({ error: "Failed to add product" });
    }
  });

  // Update seller's product
  app.put("/api/seller/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price, originalPrice, image, images, category, unit, stock, isActive, sellerId } = req.body;

      if (category && sellerId) {
        const seller = await storage.getUser(sellerId);
        if (seller?.allowedCategories && seller.allowedCategories.length > 0) {
          if (!seller.allowedCategories.includes(category)) {
            return res.status(403).json({ error: "You are not allowed to use this category" });
          }
        }
      }
      
      const updateData: any = { name, price, originalPrice, image, category, unit, stock, isActive };
      if (images !== undefined) updateData.images = images;
      const product = await storage.updateProduct(parseInt(id), updateData);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // Delete seller's product
  app.delete("/api/seller/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Get all sellers (for admin)
  app.get("/api/sellers", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const sellers = allUsers.filter(u => u.isSeller === "true");
      res.json(sellers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sellers" });
    }
  });

  // Update seller status (admin)
  app.patch("/api/sellers/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = await storage.updateUser(id, { sellerStatus: status });
      if (!user) {
        return res.status(404).json({ error: "Seller not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update seller status" });
    }
  });

  // Admin: Approve seller
  app.post("/api/admin/sellers/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { allowedCategories } = req.body || {};
      const updateData: any = { sellerStatus: 'approved' };
      if (allowedCategories && Array.isArray(allowedCategories)) {
        updateData.allowedCategories = allowedCategories;
      }
      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ error: "Seller not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve seller" });
    }
  });

  // Admin: Update seller allowed categories
  app.post("/api/admin/sellers/:id/categories", async (req, res) => {
    try {
      const { id } = req.params;
      const { allowedCategories } = req.body;
      if (!allowedCategories || !Array.isArray(allowedCategories)) {
        return res.status(400).json({ error: "allowedCategories must be an array" });
      }
      const user = await storage.updateUser(id, { allowedCategories });
      if (!user) {
        return res.status(404).json({ error: "Seller not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update seller categories" });
    }
  });

  // Admin: Reject seller
  app.post("/api/admin/sellers/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.updateUser(id, { sellerStatus: 'rejected' });
      if (!user) {
        return res.status(404).json({ error: "Seller not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject seller" });
    }
  });

  // Admin: Delete seller
  app.delete("/api/admin/sellers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ error: "Seller not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete seller" });
    }
  });

  // ===================== END SELLER ROUTES =====================

  // ===================== STAFF ROUTES =====================

  app.post("/api/staff/register", async (req, res) => {
    try {
      const { username, password, name, phone } = req.body;
      if (!username || !password || !name) {
        return res.status(400).json({ error: "Username, password, and name are required" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "This phone number is already registered" });
      }
      const user = await storage.createUser({
        username,
        password,
        name: name || "",
        phone: phone || "",
        email: "",
        address: "",
        isStaff: "true",
        staffStatus: "pending",
        approvalStatus: "approved",
        isAdmin: "false",
        isSeller: "false",
      });
      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        isStaff: user.isStaff,
        staffStatus: user.staffStatus,
      });
    } catch (error) {
      console.error("Staff register error:", error);
      res.status(500).json({ error: "Failed to register staff" });
    }
  });

  app.post("/api/staff/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      if (user.isStaff !== "true") {
        return res.status(401).json({ error: "This account is not a staff account" });
      }
      if (user.staffStatus !== "approved") {
        return res.json({
          id: user.id,
          username: user.username,
          name: user.name,
          phone: user.phone,
          isStaff: user.isStaff,
          staffStatus: user.staffStatus,
          _pending: true,
        });
      }
      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        isStaff: user.isStaff,
        staffStatus: user.staffStatus,
      });
    } catch (error) {
      console.error("Staff login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.get("/api/admin/staff", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const staffUsers = allUsers.filter(u => u.isStaff === "true");
      const allTransactions = await storage.getAllTransactions();
      const staffList = staffUsers.map(s => {
        const entries = allTransactions.filter(t => t.staffId === s.id);
        return {
          id: s.id,
          username: s.username,
          name: s.name,
          phone: s.phone,
          staffStatus: s.staffStatus,
          createdAt: s.createdAt,
          entryCount: entries.length,
        };
      });
      res.json(staffList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  app.post("/api/admin/staff/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user || user.isStaff !== "true") {
        return res.status(404).json({ error: "Staff not found" });
      }
      await storage.updateUser(id, { staffStatus: "approved" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to approve staff" });
    }
  });

  app.post("/api/admin/staff/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user || user.isStaff !== "true") {
        return res.status(404).json({ error: "Staff not found" });
      }
      await storage.updateUser(id, { staffStatus: "rejected" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reject staff" });
    }
  });

  app.get("/api/staff/transactions", async (req, res) => {
    try {
      const { staffId } = req.query;
      if (!staffId) {
        return res.status(400).json({ error: "staffId required" });
      }
      const allTxns = await storage.getAllTransactions();
      const staffTxns = allTxns.filter(t => t.staffId === staffId);
      res.json(staffTxns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staff transactions" });
    }
  });

  app.delete("/api/admin/staff/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ error: "Staff not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete staff" });
    }
  });

  // ===================== END STAFF ROUTES =====================

  // Admin: Credit referral balance to user
  app.post("/api/admin/users/:id/credit-referral", async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, adminId } = req.body;
      if (adminId) {
        const admin = await storage.getUser(adminId);
        if (!admin || admin.isAdmin !== "true") {
          return res.status(403).json({ error: "Unauthorized" });
        }
      }
      const numAmount = Number(amount);
      if (!Number.isFinite(numAmount) || numAmount <= 0 || numAmount > 10000) {
        return res.status(400).json({ error: "Valid amount required (1-10000)" });
      }
      const user = await storage.addReferralBalance(id, Math.round(numAmount));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, newBalance: user.referralBalance });
    } catch (error) {
      res.status(500).json({ error: "Failed to credit referral balance" });
    }
  });

  // ===================== TRANSACTION / P&L ROUTES =====================

  app.get("/api/transactions", async (req, res) => {
    try {
      const txns = await storage.getAllTransactions();
      res.json(txns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const { type, amount, description, itemName, quantity, purchasePrice, billImage, date, staffId, staffName } = req.body;
      const allowedTypes = ["Purchase", "Offline Sale", "Online Sale", "Expense"];
      if (!type || !allowedTypes.includes(type)) {
        return res.status(400).json({ error: "Valid type required: Purchase, Offline Sale, Online Sale, or Expense" });
      }
      if (staffId && type === "Expense") {
        return res.status(403).json({ error: "Staff cannot add Expense entries" });
      }
      const numAmount = Number(amount);
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: "Valid positive amount required" });
      }
      const parsedPurchasePrice = purchasePrice ? Number(purchasePrice) : null;
      if (parsedPurchasePrice !== null && !Number.isFinite(parsedPurchasePrice)) {
        return res.status(400).json({ error: "Invalid purchase price" });
      }
      const txn = await storage.createTransaction({
        type,
        amount: Math.round(numAmount),
        description: description || "",
        itemName: itemName || null,
        quantity: quantity || null,
        purchasePrice: parsedPurchasePrice !== null ? Math.round(parsedPurchasePrice) : null,
        billImage: billImage || null,
        staffId: staffId || null,
        staffName: staffName || null,
        date: date ? new Date(date) : new Date(),
      });
      res.json(txn);
    } catch (error) {
      console.error("Create transaction error:", error);
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.put("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const updateData: any = {};
      if (req.body.type) {
        const allowedTypes = ["Purchase", "Offline Sale", "Online Sale", "Expense"];
        if (!allowedTypes.includes(req.body.type)) return res.status(400).json({ error: "Invalid type" });
        updateData.type = req.body.type;
      }
      if (req.body.amount !== undefined) {
        const numAmount = Number(req.body.amount);
        if (!Number.isFinite(numAmount) || numAmount <= 0) return res.status(400).json({ error: "Invalid amount" });
        updateData.amount = Math.round(numAmount);
      }
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.itemName !== undefined) updateData.itemName = req.body.itemName;
      if (req.body.quantity !== undefined) updateData.quantity = req.body.quantity;
      if (req.body.billImage !== undefined) updateData.billImage = req.body.billImage;
      if (req.body.date !== undefined) updateData.date = new Date(req.body.date);
      const txn = await storage.updateTransaction(id, updateData);
      if (!txn) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(txn);
    } catch (error) {
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTransaction(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  app.get("/api/admin/pnl-summary", async (req, res) => {
    try {
      const allTransactions = await storage.getAllTransactions();
      const allOrders = await storage.getAllOrders();

      const deliveredOrders = allOrders.filter(o => o.status === "Delivered" || o.status === "delivered");
      const onlineSalesTotal = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      const purchases = allTransactions.filter(t => t.type === "Purchase");
      const offlineSales = allTransactions.filter(t => t.type === "Offline Sale");
      const onlineSaleTxns = allTransactions.filter(t => t.type === "Online Sale");
      const expenses = allTransactions.filter(t => t.type === "Expense");

      const totalPurchase = purchases.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalOfflineSales = offlineSales.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalOnlineSaleTxns = onlineSaleTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalOnlineSales = onlineSalesTotal + totalOnlineSaleTxns;
      const totalSales = totalOnlineSales + totalOfflineSales;
      const netProfitLoss = totalSales - (totalPurchase + totalExpenses);

      res.json({
        totalPurchase,
        onlineSalesTotal: totalOnlineSales,
        totalOfflineSales,
        totalSales,
        totalExpenses,
        netProfitLoss,
        onlineOrderCount: deliveredOrders.length + onlineSaleTxns.length,
        purchaseCount: purchases.length,
        offlineSaleCount: offlineSales.length,
        expenseCount: expenses.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch P&L summary" });
    }
  });

  // ===================== END TRANSACTION / P&L ROUTES =====================

  // Get my referrals (for customer to see who they referred)
  app.get("/api/referrals/me", async (req, res) => {
    try {
      const { referralCode } = req.query;
      
      if (!referralCode) {
        return res.json({ referrals: [], count: 0, approvedCount: 0, purchasedCount: 0 });
      }

      const allUsers = await storage.getAllUsers();
      const referredUsers = allUsers.filter(u => u.referredBy === referralCode);
      
      // Get orders to check if referred users made purchases
      const allOrders = await storage.getAllOrders();
      
      const referralsWithStatus = referredUsers.map(user => {
        // Match orders by userId (preferred) or by name as fallback
        const userOrders = allOrders.filter(o => 
          o.userId === user.id || o.customerName === user.name
        );
        const hasPurchased = userOrders.length > 0;
        const firstOrderDate = hasPurchased ? userOrders[userOrders.length - 1]?.createdAt : null;
        
        return {
          id: user.id,
          name: user.name || "Unknown",
          phone: user.phone || "",
          approvalStatus: user.approvalStatus || "pending",
          isApproved: user.approvalStatus === "approved",
          hasPurchased,
          firstOrderDate,
          totalOrders: userOrders.length,
          registeredAt: user.createdAt,
        };
      });

      res.json({
        referrals: referralsWithStatus,
        count: referralsWithStatus.length,
        approvedCount: referralsWithStatus.filter(r => r.isApproved).length,
        purchasedCount: referralsWithStatus.filter(r => r.hasPurchased).length,
      });
    } catch (error) {
      console.error("Referrals error:", error);
      res.status(500).json({ error: "Failed to fetch referrals" });
    }
  });

  // Get payment QR code
  app.get("/api/settings/payment-qr", async (req, res) => {
    try {
      const qrCode = await storage.getSetting("payment_qr_code");
      res.json({ qrCode: qrCode || null });
    } catch (error) {
      console.error("Get payment QR error:", error);
      res.status(500).json({ error: "Failed to get payment QR code" });
    }
  });

  // Set payment QR code (admin only)
  app.post("/api/settings/payment-qr", async (req, res) => {
    try {
      const { qrCode } = req.body;
      await storage.setSetting("payment_qr_code", qrCode || "");
      res.json({ success: true });
    } catch (error) {
      console.error("Set payment QR error:", error);
      res.status(500).json({ error: "Failed to set payment QR code" });
    }
  });

  // Get delivery settings
  app.get("/api/settings/delivery", async (req, res) => {
    try {
      const minOrderForFreeDelivery = await storage.getSetting("min_order_free_delivery") || "149";
      const deliveryCharge = await storage.getSetting("delivery_charge") || "20";
      res.json({ minOrderForFreeDelivery, deliveryCharge });
    } catch (error) {
      console.error("Get delivery settings error:", error);
      res.status(500).json({ error: "Failed to get delivery settings" });
    }
  });

  // Set delivery settings (admin only)
  app.post("/api/settings/delivery", async (req, res) => {
    try {
      const { minOrderForFreeDelivery, deliveryCharge } = req.body;
      if (minOrderForFreeDelivery) {
        await storage.setSetting("min_order_free_delivery", minOrderForFreeDelivery);
      }
      if (deliveryCharge) {
        await storage.setSetting("delivery_charge", deliveryCharge);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Set delivery settings error:", error);
      res.status(500).json({ error: "Failed to set delivery settings" });
    }
  });

  // Get home banner
  app.get("/api/settings/home-banner", async (req, res) => {
    try {
      const banner = await storage.getSetting("home_banner");
      res.json({ banner: banner || null });
    } catch (error) {
      console.error("Get home banner error:", error);
      res.status(500).json({ error: "Failed to get home banner" });
    }
  });

  // Set home banner (admin only)
  app.post("/api/settings/home-banner", async (req, res) => {
    try {
      const { banner } = req.body;
      await storage.setSetting("home_banner", banner || "");
      res.json({ success: true });
    } catch (error) {
      console.error("Set home banner error:", error);
      res.status(500).json({ error: "Failed to set home banner" });
    }
  });

  // Get APK download link
  app.get("/api/settings/apk-link", async (req, res) => {
    try {
      const apkLink = await storage.getSetting("apk_download_link") || "";
      const apkEnabled = await storage.getSetting("apk_enabled") || "true";
      res.json({ apkLink, apkEnabled: apkEnabled === "true" });
    } catch (error) {
      console.error("Get APK link error:", error);
      res.status(500).json({ error: "Failed to get APK link" });
    }
  });

  // Set APK download link (admin only)
  app.post("/api/settings/apk-link", async (req, res) => {
    try {
      const { apkLink, apkEnabled } = req.body;
      await storage.setSetting("apk_download_link", apkLink || "");
      await storage.setSetting("apk_enabled", apkEnabled ? "true" : "false");
      res.json({ success: true });
    } catch (error) {
      console.error("Set APK link error:", error);
      res.status(500).json({ error: "Failed to set APK link" });
    }
  });

  // Get contact number settings
  app.get("/api/settings/contact-number", async (req, res) => {
    try {
      const contactNumber = await storage.getSetting("contact_number") || "9999878381";
      res.json({ contactNumber });
    } catch (error) {
      console.error("Get contact number error:", error);
      res.status(500).json({ error: "Failed to get contact number" });
    }
  });

  // Set contact number (admin only)
  app.post("/api/settings/contact-number", async (req, res) => {
    try {
      const { contactNumber } = req.body;
      await storage.setSetting("contact_number", contactNumber || "9999878381");
      res.json({ success: true });
    } catch (error) {
      console.error("Set contact number error:", error);
      res.status(500).json({ error: "Failed to set contact number" });
    }
  });

  // Get banner text settings
  app.get("/api/settings/banner-text", async (req, res) => {
    try {
      const tagLine = await storage.getSetting("banner_tag_line") || "🏠 Daily Essentials & Services";
      const mainHeading = await storage.getSetting("banner_main_heading") || "Fresh Groceries Delivered";
      const subHeading = await storage.getSetting("banner_sub_heading") || "+ Home Services You Trust";
      const description = await storage.getSetting("banner_description") || "Veggies, Fruits, Dairy | Electricity, Mobile, Water RO & More";
      const buttonText = await storage.getSetting("banner_button_text") || "Shop Now";
      res.json({ tagLine, mainHeading, subHeading, description, buttonText });
    } catch (error) {
      console.error("Get banner text error:", error);
      res.status(500).json({ error: "Failed to get banner text" });
    }
  });

  // Set banner text settings (admin only)
  app.post("/api/settings/banner-text", async (req, res) => {
    try {
      const { tagLine, mainHeading, subHeading, description, buttonText } = req.body;
      await storage.setSetting("banner_tag_line", tagLine || "");
      await storage.setSetting("banner_main_heading", mainHeading || "");
      await storage.setSetting("banner_sub_heading", subHeading || "");
      await storage.setSetting("banner_description", description || "");
      await storage.setSetting("banner_button_text", buttonText || "");
      res.json({ success: true });
    } catch (error) {
      console.error("Set banner text error:", error);
      res.status(500).json({ error: "Failed to set banner text" });
    }
  });

  // Update admin credentials
  app.post("/api/admin/update-credentials", async (req, res) => {
    try {
      const { currentPassword, newUsername, newPassword } = req.body;
      
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required" });
      }

      // Find admin users
      const allUsers = await storage.getAllUsers();
      const adminUser = allUsers.find(u => u.isAdmin === "true" || String(u.isAdmin) === "true");
      
      if (!adminUser) {
        return res.status(404).json({ error: "Admin user not found" });
      }

      // Verify current password
      if (adminUser.password !== currentPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Update credentials
      const updates: any = {};
      if (newUsername) updates.username = newUsername;
      if (newPassword) updates.password = newPassword;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No changes provided" });
      }

      await storage.updateUser(adminUser.id, updates);
      res.json({ success: true, message: "Credentials updated successfully" });
    } catch (error) {
      console.error("Update admin credentials error:", error);
      res.status(500).json({ error: "Failed to update credentials" });
    }
  });

  // Account deletion request
  app.post("/api/delete-account-request", async (req, res) => {
    try {
      const { phone, reason } = req.body;

      if (!phone || typeof phone !== "string" || phone.trim() === "") {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const customers = await storage.getAllUsers();
      const customer = customers.find((c: any) => c.phone === phone.trim());

      if (!customer) {
        return res.status(404).json({ message: "No account found with this phone number" });
      }

      await storage.deleteUser(customer.id);

      res.json({ success: true, message: "Account deletion request submitted successfully" });
    } catch (error) {
      console.error("Delete account request error:", error);
      res.status(500).json({ message: "Failed to process deletion request" });
    }
  });

  app.get("/api/service-requests", async (req, res) => {
    try {
      const requests = await storage.getAllServiceRequests();
      res.json(requests);
    } catch (error) {
      console.error("Service requests error:", error);
      res.status(500).json({ error: "Failed to fetch service requests" });
    }
  });

  app.post("/api/service-requests", async (req, res) => {
    try {
      const { serviceName, serviceId, servicePrice, customerName, customerPhone, customerAddress, preferredDate, preferredTime, notes, requestType } = req.body;
      if (!serviceName || !customerName || !customerPhone) {
        return res.status(400).json({ error: "Service name, customer name, and phone are required" });
      }
      const validRequestTypes = ["booking", "call"];
      const request = await storage.createServiceRequest({
        serviceName,
        serviceId: serviceId || null,
        servicePrice: servicePrice || null,
        customerName,
        customerPhone,
        customerAddress: customerAddress || null,
        preferredDate: preferredDate || null,
        preferredTime: preferredTime || null,
        notes: notes || null,
        requestType: validRequestTypes.includes(requestType) ? requestType : "booking",
        status: "Pending",
      });
      res.json(request);
    } catch (error) {
      console.error("Create service request error:", error);
      res.status(500).json({ error: "Failed to create service request" });
    }
  });

  app.patch("/api/service-requests/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const { status } = req.body;
      const validStatuses = ["Pending", "Confirmed", "Completed", "Cancelled"];
      if (!status || !validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });
      const updated = await storage.updateServiceRequestStatus(id, status);
      if (!updated) return res.status(404).json({ error: "Request not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update service request" });
    }
  });

  app.delete("/api/service-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await storage.deleteServiceRequest(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service request" });
    }
  });

  // ─── OFFERS ───────────────────────────────────────────
  app.get("/api/offers", async (req, res) => {
    try {
      const offersList = await storage.getActiveOffers();
      res.json(offersList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.get("/api/admin/offers", async (req, res) => {
    try {
      const offersList = await storage.getAllOffers();
      res.json(offersList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.post("/api/admin/offers", async (req, res) => {
    try {
      const offer = await storage.createOffer(req.body);
      res.json(offer);
    } catch (error) {
      res.status(500).json({ error: "Failed to create offer" });
    }
  });

  app.put("/api/admin/offers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const offer = await storage.updateOffer(id, req.body);
      if (!offer) return res.status(404).json({ error: "Offer not found" });
      res.json(offer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update offer" });
    }
  });

  app.delete("/api/admin/offers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await storage.deleteOffer(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete offer" });
    }
  });

  return httpServer;
}
