import { 
  type User, type InsertUser, 
  type Order, type InsertOrder,
  type Product, type InsertProduct,
  type ProductVariant, type InsertProductVariant,
  type Category, type InsertCategory,
  type Service, type InsertService,
  type OrderItem, type InsertOrderItem,
  type Area, type InsertArea,
  type SubArea, type InsertSubArea,
  type DeliverySlot, type InsertDeliverySlot,
  type AreaDeliverySlot, type InsertAreaDeliverySlot,
  type Banner, type InsertBanner,
  type Transaction, type InsertTransaction,
  type ServiceRequest, type InsertServiceRequest,
  type Offer, type InsertOffer,
  users, orders, products, productVariants, settings, categories, services, orderItems, areas, subAreas, deliverySlots, areaDeliverySlots, banners, transactions, serviceRequests, offers
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, sql, and, gte, lte, inArray, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserApproval(id: string, status: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getReferralCount(referralCode: string): Promise<number>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  addReferralBalance(userId: string, amount: number): Promise<User | undefined>;
  deductReferralBalance(userId: string, amount: number): Promise<User | undefined>;
  getUserReferralBalance(userId: string): Promise<number>;
  createOrderWithReferralDeduction(baseOrderData: Omit<InsertOrder, 'total' | 'referralDiscount'>, userId: string, grossTotal: number, orderItemsData: InsertOrderItem[]): Promise<Order>;

  getAllOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string, deliveredAt?: Date): Promise<Order | undefined>;
  updateOrderPaymentStatus(id: number, paymentStatus: string): Promise<Order | undefined>;
  
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
  
  getStats(): Promise<{
    totalRevenue: number;
    pendingOrders: number;
    totalProducts: number;
    totalCustomers: number;
  }>;

  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  getAllServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]>;
  getAllOrderItems(): Promise<OrderItem[]>;
  getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]>;
  getStockSummary(): Promise<{ productName: string; category: string; totalQuantity: number; unit: string | null }[]>;
  getStockSummaryWithFilters(options: {
    startDate?: Date;
    endDate?: Date;
    status?: string[];
  }): Promise<{ 
    productName: string; 
    category: string; 
    totalQuantity: number; 
    unit: string | null;
    unitPrice: number;
    totalCost: number;
  }[]>;

  // Area management
  getAllAreas(): Promise<Area[]>;
  createArea(area: InsertArea): Promise<Area>;
  updateArea(id: number, area: Partial<InsertArea>): Promise<Area | undefined>;
  deleteArea(id: number): Promise<boolean>;
  
  // Sub-area management
  getAllSubAreas(): Promise<SubArea[]>;
  getSubAreasByAreaId(areaId: number): Promise<SubArea[]>;
  createSubArea(subArea: InsertSubArea): Promise<SubArea>;
  updateSubArea(id: number, subArea: Partial<InsertSubArea>): Promise<SubArea | undefined>;
  deleteSubArea(id: number): Promise<boolean>;

  // Sales data
  getDailySales(days: number): Promise<{ date: string; total: number; orderCount: number }[]>;
  getMonthlySales(months: number): Promise<{ month: string; total: number; orderCount: number }[]>;

  // Delivery Slots
  getAllDeliverySlots(): Promise<DeliverySlot[]>;
  createDeliverySlot(slot: InsertDeliverySlot): Promise<DeliverySlot>;
  updateDeliverySlot(id: number, slot: Partial<InsertDeliverySlot>): Promise<DeliverySlot | undefined>;
  deleteDeliverySlot(id: number): Promise<boolean>;
  
  // Area Delivery Slots
  getAreaDeliverySlots(areaId: number): Promise<AreaDeliverySlot[]>;
  getAllAreaDeliverySlots(): Promise<AreaDeliverySlot[]>;
  setAreaDeliverySlotVisibility(areaId: number, slotId: number, isActive: string): Promise<AreaDeliverySlot>;
  getVisibleSlotsForArea(areaId: number): Promise<DeliverySlot[]>;

  // Banners
  getAllBanners(): Promise<Banner[]>;
  getActiveBanners(): Promise<Banner[]>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: number, banner: Partial<InsertBanner>): Promise<Banner | undefined>;
  deleteBanner(id: number): Promise<boolean>;

  // Product Variants
  getVariantsByProductId(productId: number): Promise<ProductVariant[]>;
  createVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  updateVariant(id: number, variant: Partial<InsertProductVariant>): Promise<ProductVariant | undefined>;
  deleteVariant(id: number): Promise<boolean>;
  deleteVariantsByProductId(productId: number): Promise<boolean>;

  // Customer Analytics
  getCustomersWithOrderStats(): Promise<{
    id: string;
    username: string;
    name: string | null;
    phone: string | null;
    address: string | null;
    mainAreaId: number | null;
    mainAreaName: string | null;
    subAreaId: number | null;
    subAreaName: string | null;
    approvalStatus: string | null;
    referralCode: string | null;
    referredBy: string | null;
    referralCount: number;
    referralBalance: number;
    createdAt: Date | null;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: Date | null;
  }[]>;

  // Sales Analytics
  getAreaSalesAnalytics(): Promise<{
    areaId: number | null;
    areaName: string;
    orderCount: number;
    totalSales: number;
    customerCount: number;
  }[]>;

  getProductSalesAnalytics(): Promise<{
    productId: number;
    productName: string;
    category: string;
    totalQuantity: number;
    totalSales: number;
    orderCount: number;
  }[]>;

  getSalesOverview(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    topCustomers: {
      id: string;
      name: string | null;
      phone: string | null;
      orderCount: number;
      totalSpent: number;
    }[];
    recentOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
  }>;

  getAllTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, data: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;

  getAllServiceRequests(): Promise<ServiceRequest[]>;
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequestStatus(id: number, status: string): Promise<ServiceRequest | undefined>;
  deleteServiceRequest(id: number): Promise<boolean>;

  // Offers
  getAllOffers(): Promise<Offer[]>;
  getActiveOffers(): Promise<Offer[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOffer(id: number, offer: Partial<InsertOffer>): Promise<Offer | undefined>;
  deleteOffer(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Search by username, phone, or email
    const [user] = await db.select().from(users).where(
      or(
        eq(users.username, username),
        eq(users.phone, username),
        eq(users.email, username)
      )
    );
    return user;
  }

  async ensureAdminExists(): Promise<void> {
    try {
      const [existingAdmin] = await db.select().from(users).where(eq(users.isAdmin, "true"));
      if (!existingAdmin) {
        const existingByPhone = await this.getUserByUsername("8882018345");
        if (existingByPhone) {
          await db.update(users).set({ isAdmin: "true", approvalStatus: "approved" }).where(eq(users.id, existingByPhone.id));
          console.log("User promoted to admin: " + existingByPhone.username);
        } else {
          const existingByUsername = await this.getUserByUsername("admin@atozstore.com");
          if (existingByUsername) {
            await db.update(users).set({ isAdmin: "true", approvalStatus: "approved" }).where(eq(users.id, existingByUsername.id));
            console.log("Existing user promoted to admin: admin@atozstore.com");
          } else {
            await db.insert(users).values({
              id: crypto.randomUUID(),
              name: "Admin",
              username: "admin@atozstore.com",
              phone: "9999878381",
              email: "admin@atozstore.com",
              password: "admin123",
              isAdmin: "true",
              approvalStatus: "approved",
              referralCode: "ADMIN" + Math.random().toString(36).substring(2, 8).toUpperCase()
            });
            console.log("Default admin created: admin@atozstore.com / admin123");
          }
        }
      }
    } catch (error) {
      console.error("Error ensuring admin exists:", error);
      try {
        const existingByUsername = await this.getUserByUsername("admin@atozstore.com");
        if (!existingByUsername) {
          await db.insert(users).values({
            id: crypto.randomUUID(),
            name: "Admin",
            username: "admin@atozstore.com",
            phone: "9999878381",
            email: "admin@atozstore.com",
            password: "admin123",
            isAdmin: "true",
            approvalStatus: "approved",
            referralCode: "ADMIN" + Date.now().toString(36).toUpperCase()
          });
          console.log("Admin created on retry: admin@atozstore.com / admin123");
        }
      } catch (retryError) {
        console.error("Failed to create admin on retry:", retryError);
      }
    }

    // Fix users with missing referral codes
    try {
      const allUsersForFix = await db.select().from(users);
      for (const u of allUsersForFix) {
        if (!u.referralCode) {
          const code = (u.name || "USER").substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'U') + Math.random().toString(36).substring(2, 8).toUpperCase();
          await db.update(users).set({ referralCode: code }).where(eq(users.id, u.id));
          console.log(`Assigned referralCode ${code} to ${u.name} (${u.phone})`);
        }
      }
    } catch (e) {
      console.error("Error fixing referral codes:", e);
    }

    // Fix uncredited referral bonuses for already-delivered orders
    try {
      const allDeliveredOrders = await db.select().from(orders).where(eq(orders.status, "Delivered"));
      const allUsersForRef = await db.select().from(users);
      for (const order of allDeliveredOrders) {
        const existingNotes = order.orderNotes || "";
        const creditTag = `[REF_CREDITED_${order.id}]`;
        if (existingNotes.includes(creditTag)) continue;

        let orderUser = null;
        if (order.userId) {
          orderUser = allUsersForRef.find(u => u.id === order.userId) || null;
        }
        if (!orderUser && order.customerPhone) {
          orderUser = allUsersForRef.find(u => u.phone === order.customerPhone) || null;
        }
        if (!orderUser && order.customerName) {
          orderUser = allUsersForRef.find(u => u.name === order.customerName) || null;
        }
        if (orderUser?.referredBy) {
          const referrer = allUsersForRef.find(u => u.referralCode === orderUser!.referredBy);
          if (referrer) {
            await db.update(users)
              .set({ referralBalance: sql`COALESCE(${users.referralBalance}, 0) + 50` })
              .where(eq(users.id, referrer.id));
            await db.update(orders)
              .set({ orderNotes: (existingNotes ? existingNotes + " " : "") + creditTag })
              .where(eq(orders.id, order.id));
            console.log(`Startup: Referral bonus ₹50 credited to ${referrer.name} for delivered order #${order.id} by ${orderUser.name}`);
          }
        }
      }
    } catch (e) {
      console.error("Error fixing referral credits:", e);
    }

    // Ensure default delivery slots exist
    const existingSlots = await db.select().from(deliverySlots);
    if (existingSlots.length === 0) {
      await db.insert(deliverySlots).values([
        { name: "Morning", startTime: "09:00", endTime: "12:00", isActive: "true", sortOrder: 0 },
        { name: "Afternoon", startTime: "12:00", endTime: "16:00", isActive: "true", sortOrder: 1 },
        { name: "Evening", startTime: "16:00", endTime: "20:00", isActive: "true", sortOrder: 2 },
      ]);
      console.log("Default delivery slots created: Morning, Afternoon, Evening");
    }

    // Define correct category names and sort orders (single source of truth)
    const correctCategories = [
      { slug: "vegetables", name: "Fresh Vegetables", sortOrder: 1, type: "product", iconKey: "Leaf", colorStart: "from-green-100", colorEnd: "to-green-200", borderColor: "border-green-300", textColor: "text-green-900", isActive: "true" },
      { slug: "fruits", name: "Fresh Fruits", sortOrder: 2, type: "product", iconKey: "Cherry", colorStart: "from-orange-100", colorEnd: "to-orange-200", borderColor: "border-orange-300", textColor: "text-orange-900", isActive: "true" },
      { slug: "dairy", name: "Dairy & Products", sortOrder: 3, type: "product", iconKey: "Milk", colorStart: "from-blue-100", colorEnd: "to-blue-200", borderColor: "border-blue-300", textColor: "text-blue-900", isActive: "true" },
      { slug: "mobile-repair", name: "Mobile Repair", sortOrder: 4, type: "service", iconKey: "Smartphone", colorStart: "from-purple-100", colorEnd: "to-purple-200", borderColor: "border-purple-300", textColor: "text-purple-900", isActive: "true" },
      { slug: "electricity", name: "Electrical Services", sortOrder: 5, type: "service", iconKey: "Tv", colorStart: "from-yellow-100", colorEnd: "to-yellow-200", borderColor: "border-yellow-300", textColor: "text-yellow-900", isActive: "true" },
    ];

    // Ensure default categories exist and have correct names/sort orders
    const existingCategories = await db.select().from(categories);
    
    for (const correctCat of correctCategories) {
      const existing = existingCategories.find(c => c.slug === correctCat.slug);
      if (!existing) {
        // Create if doesn't exist
        await db.insert(categories).values(correctCat);
        console.log(`Created category: ${correctCat.name}`);
      } else if (existing.name !== correctCat.name || existing.sortOrder !== correctCat.sortOrder) {
        // Update if name or sort order is wrong
        await db.update(categories)
          .set({ name: correctCat.name, sortOrder: correctCat.sortOrder })
          .where(eq(categories.slug, correctCat.slug));
        console.log(`Updated category: ${correctCat.slug} -> ${correctCat.name} (order: ${correctCat.sortOrder})`);
      }
    }

    // Ensure default banners exist
    const existingBanners = await db.select().from(banners);
    if (existingBanners.length === 0) {
      await db.insert(banners).values([
        {
          title: "Fresh Vegetables Daily",
          subtitle: "Farm fresh sabzi at your doorstep",
          description: "Get the freshest vegetables delivered",
          imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=400&fit=crop",
          ctaText: "Shop Vegetables",
          ctaLink: "/categories?cat=vegetables",
          bgColor: "from-green-400 to-green-600",
          textColor: "white",
          isActive: "true",
          sortOrder: 1,
        },
        {
          title: "Seasonal Fruits",
          subtitle: "Sweet & Fresh fruits available now",
          description: "Mangoes, Apples, Bananas and more",
          imageUrl: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&h=400&fit=crop",
          ctaText: "Shop Fruits",
          ctaLink: "/categories?cat=fruits",
          bgColor: "from-orange-400 to-orange-600",
          textColor: "white",
          isActive: "true",
          sortOrder: 2,
        },
        {
          title: "Home Services",
          subtitle: "Expert technicians at your service",
          description: "AC repair, Plumber, Electrician & more",
          imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=400&fit=crop",
          ctaText: "Book Now",
          ctaLink: "/categories?cat=electricity",
          bgColor: "from-blue-400 to-blue-600",
          textColor: "white",
          isActive: "true",
          sortOrder: 3,
        },
      ]);
      console.log("Default banners created: Vegetables, Fruits, Home Services");
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.isAdmin, "false")).orderBy(desc(users.createdAt));
  }

  async updateUserApproval(id: string, status: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ approvalStatus: status }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const userOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.userId, id));
    if (userOrders.length > 0) {
      const orderIds = userOrders.map(o => o.id);
      for (const oid of orderIds) {
        await db.delete(orderItems).where(eq(orderItems.orderId, oid));
      }
      await db.delete(orders).where(eq(orders.userId, id));
    }
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getReferralCount(referralCode: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.referredBy, referralCode));
    return Number(result[0]?.count || 0);
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, referralCode));
    return user;
  }

  async addReferralBalance(userId: string, amount: number): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ referralBalance: sql`COALESCE(${users.referralBalance}, 0) + ${amount}` })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async deductReferralBalance(userId: string, amount: number): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ referralBalance: sql`GREATEST(COALESCE(${users.referralBalance}, 0) - ${amount}, 0)` })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getUserReferralBalance(userId: string): Promise<number> {
    const [user] = await db.select({ referralBalance: users.referralBalance }).from(users).where(eq(users.id, userId));
    return user?.referralBalance || 0;
  }

  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async createOrderWithReferralDeduction(baseOrderData: Omit<InsertOrder, 'total' | 'referralDiscount'>, userId: string, grossTotal: number, orderItemsData: InsertOrderItem[]): Promise<Order> {
    return await db.transaction(async (tx) => {
      let referralDiscount = 0;
      if (userId) {
        const [userRow] = await tx.select({ referralBalance: users.referralBalance }).from(users).where(eq(users.id, userId));
        const currentBalance = userRow?.referralBalance || 0;
        if (currentBalance > 0) {
          referralDiscount = Math.min(currentBalance, grossTotal);
        }
      }

      const finalTotal = grossTotal - referralDiscount;
      const orderData = { ...baseOrderData, total: finalTotal, referralDiscount };
      const [newOrder] = await tx.insert(orders).values(orderData).returning();

      if (orderItemsData.length > 0) {
        const itemsWithOrderId = orderItemsData.map(item => ({ ...item, orderId: newOrder.id }));
        await tx.insert(orderItems).values(itemsWithOrderId);
      }

      if (referralDiscount > 0 && userId) {
        await tx.update(users)
          .set({ referralBalance: sql`COALESCE(${users.referralBalance}, 0) - ${referralDiscount}` })
          .where(eq(users.id, userId));
      }

      return newOrder;
    });
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
    return order;
  }

  async updateOrderStatus(id: number, status: string, deliveredAt?: Date): Promise<Order | undefined> {
    const updateData: { status: string; deliveredAt?: Date } = { status };
    if (deliveredAt) {
      updateData.deliveredAt = deliveredAt;
    }
    const [order] = await db.update(orders).set(updateData).where(eq(orders.id, id)).returning();
    return order;
  }

  async updateOrderPaymentStatus(id: number, paymentStatus: string): Promise<Order | undefined> {
    const [order] = await db.update(orders).set({ paymentStatus }).where(eq(orders.id, id)).returning();
    return order;
  }

  async getAllProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(asc(products.sortOrder), asc(products.id));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products).set(productData).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return true;
  }

  async getSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await db.insert(settings).values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }

  async getStats(): Promise<{
    totalRevenue: number;
    pendingOrders: number;
    totalProducts: number;
    totalCustomers: number;
  }> {
    const allOrders = await db.select().from(orders);
    const deliveredOrders = allOrders.filter((o: Order) => o.status === "Delivered");
    const pendingOrdersList = allOrders.filter((o: Order) => o.status === "Pending");
    
    const allProducts = await db.select().from(products);
    const allCustomers = await db.select().from(users).where(eq(users.isAdmin, "false"));

    return {
      totalRevenue: deliveredOrders.reduce((sum: number, o: Order) => sum + o.total, 0),
      pendingOrders: pendingOrdersList.length,
      totalProducts: allProducts.length,
      totalCustomers: allCustomers.length,
    };
  }

  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(asc(categories.sortOrder));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db.update(categories).set(categoryData).where(eq(categories.id, id)).returning();
    return category;
  }

  async deleteCategory(id: number): Promise<boolean> {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  async getAllServices(): Promise<Service[]> {
    return db.select().from(services).orderBy(asc(services.sortOrder));
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await db.update(services).set(serviceData).where(eq(services.id, id)).returning();
    return service;
  }

  async deleteService(id: number): Promise<boolean> {
    await db.delete(services).where(eq(services.id, id));
    return true;
  }

  async createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]> {
    if (items.length === 0) return [];
    const newItems = await db.insert(orderItems).values(items).returning();
    return newItems;
  }

  async getAllOrderItems(): Promise<OrderItem[]> {
    return db.select().from(orderItems);
  }

  async getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async getStockSummary(): Promise<{ productName: string; category: string; totalQuantity: number; unit: string | null }[]> {
    const result = await db
      .select({
        productName: orderItems.productName,
        category: orderItems.category,
        totalQuantity: sql<number>`CAST(SUM(${orderItems.quantity}) AS INTEGER)`,
        unit: orderItems.unit,
      })
      .from(orderItems)
      .groupBy(orderItems.productName, orderItems.category, orderItems.unit)
      .orderBy(orderItems.category, orderItems.productName);
    return result;
  }

  async getStockSummaryWithFilters(options: {
    startDate?: Date;
    endDate?: Date;
    status?: string[];
  }): Promise<{ 
    productName: string; 
    category: string; 
    totalQuantity: number; 
    unit: string | null;
    unitPrice: number;
    totalCost: number;
  }[]> {
    const conditions = [];
    
    if (options.startDate) {
      conditions.push(sql`${orders.createdAt} >= ${options.startDate.toISOString()}`);
    }
    if (options.endDate) {
      conditions.push(sql`${orders.createdAt} <= ${options.endDate.toISOString()}`);
    }
    if (options.status && options.status.length > 0) {
      conditions.push(inArray(orders.status, options.status));
    }

    const result = await db
      .select({
        productName: orderItems.productName,
        category: orderItems.category,
        totalQuantity: sql<number>`CAST(SUM(${orderItems.quantity}) AS INTEGER)`,
        unit: orderItems.unit,
        unitPrice: sql<number>`CAST(ROUND(SUM(${orderItems.price})::numeric / NULLIF(SUM(${orderItems.quantity}), 0)) AS INTEGER)`,
        totalCost: sql<number>`CAST(SUM(${orderItems.price}) AS INTEGER)`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(orderItems.productName, orderItems.category, orderItems.unit)
      .orderBy(orderItems.category, orderItems.productName);
    
    return result;
  }

  // Area management methods
  async getAllAreas(): Promise<Area[]> {
    return db.select().from(areas).orderBy(asc(areas.sortOrder));
  }

  async createArea(area: InsertArea): Promise<Area> {
    const [newArea] = await db.insert(areas).values(area).returning();
    return newArea;
  }

  async updateArea(id: number, areaData: Partial<InsertArea>): Promise<Area | undefined> {
    const [area] = await db.update(areas).set(areaData).where(eq(areas.id, id)).returning();
    return area;
  }

  async deleteArea(id: number): Promise<boolean> {
    await db.delete(subAreas).where(eq(subAreas.areaId, id));
    await db.delete(areas).where(eq(areas.id, id));
    return true;
  }

  // Sub-area management methods
  async getAllSubAreas(): Promise<SubArea[]> {
    return db.select().from(subAreas).orderBy(asc(subAreas.sortOrder));
  }

  async getSubAreasByAreaId(areaId: number): Promise<SubArea[]> {
    return db.select().from(subAreas).where(eq(subAreas.areaId, areaId)).orderBy(asc(subAreas.sortOrder));
  }

  async createSubArea(subArea: InsertSubArea): Promise<SubArea> {
    const [newSubArea] = await db.insert(subAreas).values(subArea).returning();
    return newSubArea;
  }

  async updateSubArea(id: number, subAreaData: Partial<InsertSubArea>): Promise<SubArea | undefined> {
    const [subArea] = await db.update(subAreas).set(subAreaData).where(eq(subAreas.id, id)).returning();
    return subArea;
  }

  async deleteSubArea(id: number): Promise<boolean> {
    await db.delete(subAreas).where(eq(subAreas.id, id));
    return true;
  }

  // Sales data methods
  async getDailySales(days: number): Promise<{ date: string; total: number; orderCount: number }[]> {
    const allOrders = await db.select().from(orders);
    // Filter delivered orders (case-insensitive)
    const deliveredOrders = allOrders.filter(o => o.status?.toLowerCase() === "delivered");
    
    const salesByDate: Record<string, { total: number; orderCount: number }> = {};
    
    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      salesByDate[dateStr] = { total: 0, orderCount: 0 };
    }
    
    // Aggregate orders by date
    for (const order of deliveredOrders) {
      if (order.createdAt) {
        const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
        if (salesByDate[dateStr]) {
          salesByDate[dateStr].total += order.total;
          salesByDate[dateStr].orderCount += 1;
        }
      }
    }
    
    // Convert to array and sort by date descending
    return Object.entries(salesByDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async getMonthlySales(months: number): Promise<{ month: string; total: number; orderCount: number }[]> {
    const allOrders = await db.select().from(orders);
    // Filter delivered orders (case-insensitive)
    const deliveredOrders = allOrders.filter(o => o.status?.toLowerCase() === "delivered");
    
    const salesByMonth: Record<string, { total: number; orderCount: number }> = {};
    
    // Initialize all months in range
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      salesByMonth[monthStr] = { total: 0, orderCount: 0 };
    }
    
    // Aggregate orders by month
    for (const order of deliveredOrders) {
      if (order.createdAt) {
        const d = new Date(order.createdAt);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (salesByMonth[monthStr]) {
          salesByMonth[monthStr].total += order.total;
          salesByMonth[monthStr].orderCount += 1;
        }
      }
    }
    
    // Convert to array and sort by month descending
    return Object.entries(salesByMonth)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }

  // Delivery Slots
  async getAllDeliverySlots(): Promise<DeliverySlot[]> {
    return db.select().from(deliverySlots).orderBy(asc(deliverySlots.sortOrder));
  }

  async createDeliverySlot(slot: InsertDeliverySlot): Promise<DeliverySlot> {
    const [newSlot] = await db.insert(deliverySlots).values(slot).returning();
    return newSlot;
  }

  async updateDeliverySlot(id: number, slot: Partial<InsertDeliverySlot>): Promise<DeliverySlot | undefined> {
    const [updated] = await db.update(deliverySlots).set(slot).where(eq(deliverySlots.id, id)).returning();
    return updated;
  }

  async deleteDeliverySlot(id: number): Promise<boolean> {
    await db.delete(areaDeliverySlots).where(eq(areaDeliverySlots.slotId, id));
    await db.delete(deliverySlots).where(eq(deliverySlots.id, id));
    return true;
  }

  // Area Delivery Slots
  async getAreaDeliverySlots(areaId: number): Promise<AreaDeliverySlot[]> {
    return db.select().from(areaDeliverySlots).where(eq(areaDeliverySlots.areaId, areaId));
  }

  async getAllAreaDeliverySlots(): Promise<AreaDeliverySlot[]> {
    return db.select().from(areaDeliverySlots);
  }

  async setAreaDeliverySlotVisibility(areaId: number, slotId: number, isActive: string): Promise<AreaDeliverySlot> {
    const existing = await db.select().from(areaDeliverySlots)
      .where(and(eq(areaDeliverySlots.areaId, areaId), eq(areaDeliverySlots.slotId, slotId)));
    
    if (existing.length > 0) {
      const [updated] = await db.update(areaDeliverySlots)
        .set({ isActive })
        .where(and(eq(areaDeliverySlots.areaId, areaId), eq(areaDeliverySlots.slotId, slotId)))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(areaDeliverySlots)
        .values({ areaId, slotId, isActive })
        .returning();
      return created;
    }
  }

  async getVisibleSlotsForArea(areaId: number): Promise<DeliverySlot[]> {
    const allSlots = await this.getAllDeliverySlots();
    const areaSlotSettings = await this.getAreaDeliverySlots(areaId);
    
    return allSlots.filter(slot => {
      // Handle both boolean and string values for isActive
      const isSlotActive = String(slot.isActive) === "true";
      
      // First check global visibility - if globally hidden, never show
      if (!isSlotActive) return false;
      
      // Check for area-specific override
      const areaSetting = areaSlotSettings.find(as => as.slotId === slot.id);
      
      // If there's an area-specific setting and it's hidden, don't show
      if (areaSetting && String(areaSetting.isActive) === "false") return false;
      
      // Otherwise show the slot (globally active, no area override or area override is "true")
      return true;
    });
  }

  // Banners
  async getAllBanners(): Promise<Banner[]> {
    return db.select().from(banners).orderBy(asc(banners.sortOrder));
  }

  async getActiveBanners(): Promise<Banner[]> {
    return db.select().from(banners)
      .where(eq(banners.isActive, "true"))
      .orderBy(asc(banners.sortOrder));
  }

  async createBanner(banner: InsertBanner): Promise<Banner> {
    const [created] = await db.insert(banners).values(banner).returning();
    return created;
  }

  async updateBanner(id: number, banner: Partial<InsertBanner>): Promise<Banner | undefined> {
    const [updated] = await db.update(banners).set(banner).where(eq(banners.id, id)).returning();
    return updated;
  }

  async deleteBanner(id: number): Promise<boolean> {
    await db.delete(banners).where(eq(banners.id, id));
    return true;
  }

  // Product Variants
  async getVariantsByProductId(productId: number): Promise<ProductVariant[]> {
    return db.select().from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(asc(productVariants.sortOrder));
  }

  async createVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const [created] = await db.insert(productVariants).values(variant).returning();
    return created;
  }

  async updateVariant(id: number, variant: Partial<InsertProductVariant>): Promise<ProductVariant | undefined> {
    const [updated] = await db.update(productVariants).set(variant).where(eq(productVariants.id, id)).returning();
    return updated;
  }

  async deleteVariant(id: number): Promise<boolean> {
    await db.delete(productVariants).where(eq(productVariants.id, id));
    return true;
  }

  async deleteVariantsByProductId(productId: number): Promise<boolean> {
    await db.delete(productVariants).where(eq(productVariants.productId, productId));
    return true;
  }

  // Customer Analytics
  async getCustomersWithOrderStats(): Promise<{
    id: string;
    username: string;
    name: string | null;
    phone: string | null;
    address: string | null;
    mainAreaId: number | null;
    mainAreaName: string | null;
    subAreaId: number | null;
    subAreaName: string | null;
    approvalStatus: string | null;
    referralCode: string | null;
    referredBy: string | null;
    referralCount: number;
    referralBalance: number;
    createdAt: Date | null;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: Date | null;
  }[]> {
    const allUsers = await db.select().from(users).where(
      or(
        eq(users.isAdmin, "false"),
        sql`${users.isAdmin} IS NULL`
      )
    );
    
    // Filter out sellers - they should appear in Sellers tab, not Customers tab
    const customersOnly = allUsers.filter(user => user.isSeller !== "true");
    
    const allOrders = await db.select().from(orders);
    
    return customersOnly.map(user => {
      const userOrders = allOrders.filter(o => o.userId === user.id);
      const orderCount = userOrders.length;
      const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const lastOrderDate = userOrders.length > 0 
        ? new Date(Math.max(...userOrders.map(o => o.createdAt ? new Date(o.createdAt).getTime() : 0)))
        : null;
      
      // Count referrals
      const referralCount = user.referralCode 
        ? allUsers.filter(u => u.referredBy === user.referralCode).length 
        : 0;
      
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        address: user.address,
        mainAreaId: user.mainAreaId,
        mainAreaName: user.mainAreaName,
        subAreaId: user.subAreaId,
        subAreaName: user.subAreaName,
        approvalStatus: user.approvalStatus,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        referralCount,
        referralBalance: user.referralBalance || 0,
        createdAt: user.createdAt,
        orderCount,
        totalSpent,
        lastOrderDate,
      };
    });
  }

  // Area-wise sales analytics - use order.mainAreaName directly from orders table
  async getAreaSalesAnalytics(): Promise<{
    areaId: number | null;
    areaName: string;
    orderCount: number;
    totalSales: number;
    customerCount: number;
  }[]> {
    const allOrders = await db.select().from(orders);
    const allAreas = await db.select().from(areas);

    const areaStats: Record<string, { areaId: number | null; areaName: string; orderCount: number; totalSales: number; customerIds: Set<string> }> = {};
    
    // Initialize with all areas
    allAreas.forEach(area => {
      areaStats[area.name] = { areaId: area.id, areaName: area.name, orderCount: 0, totalSales: 0, customerIds: new Set() };
    });
    areaStats["Unknown Area"] = { areaId: null, areaName: "Unknown Area", orderCount: 0, totalSales: 0, customerIds: new Set() };

    // Calculate stats using order's mainAreaName directly
    allOrders.forEach(order => {
      const areaName = order.mainAreaName || "Unknown Area";
      
      // Find matching area for areaId
      const matchedArea = allAreas.find(a => a.name === areaName);
      
      if (!areaStats[areaName]) {
        areaStats[areaName] = { areaId: matchedArea?.id || null, areaName, orderCount: 0, totalSales: 0, customerIds: new Set() };
      }
      
      areaStats[areaName].orderCount++;
      areaStats[areaName].totalSales += order.total || 0;
      if (order.userId) areaStats[areaName].customerIds.add(order.userId);
    });

    return Object.values(areaStats)
      .map(stat => ({
        areaId: stat.areaId,
        areaName: stat.areaName,
        orderCount: stat.orderCount,
        totalSales: stat.totalSales,
        customerCount: stat.customerIds.size,
      }))
      .filter(stat => stat.orderCount > 0)
      .sort((a, b) => b.totalSales - a.totalSales);
  }

  // Product-wise sales analytics
  async getProductSalesAnalytics(): Promise<{
    productId: number;
    productName: string;
    category: string;
    totalQuantity: number;
    totalSales: number;
    orderCount: number;
  }[]> {
    const allOrderItems = await db.select().from(orderItems);
    const allProducts = await db.select().from(products);

    const productStats: Record<number, { productId: number; productName: string; category: string; totalQuantity: number; totalSales: number; orderIds: Set<number> }> = {};

    allOrderItems.forEach(item => {
      const product = allProducts.find(p => p.name === item.productName);
      const productId = product?.id || 0;
      const category = product?.category || "Unknown";

      if (!productStats[productId]) {
        productStats[productId] = { productId, productName: item.productName, category, totalQuantity: 0, totalSales: 0, orderIds: new Set() };
      }

      productStats[productId].totalQuantity += item.quantity || 0;
      productStats[productId].totalSales += (item.quantity || 0) * (item.price || 0);
      productStats[productId].orderIds.add(item.orderId);
    });

    return Object.values(productStats)
      .map(stat => ({
        productId: stat.productId,
        productName: stat.productName,
        category: stat.category,
        totalQuantity: stat.totalQuantity,
        totalSales: stat.totalSales,
        orderCount: stat.orderIds.size,
      }))
      .sort((a, b) => b.totalSales - a.totalSales);
  }

  // Sales overview with top customers
  async getSalesOverview(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    topCustomers: { id: string; name: string | null; phone: string | null; orderCount: number; totalSpent: number }[];
    recentOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
  }> {
    const allOrders = await db.select().from(orders);
    const allUsers = await db.select().from(users).where(
      or(eq(users.isAdmin, "false"), sql`${users.isAdmin} IS NULL`)
    );

    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = allOrders.length;
    const totalCustomers = allUsers.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Recent orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentOrders = allOrders.filter(o => o.createdAt && new Date(o.createdAt) >= sevenDaysAgo).length;

    // Orders by status
    const pendingOrders = allOrders.filter(o => o.status?.toLowerCase() === "pending").length;
    const deliveredOrders = allOrders.filter(o => o.status?.toLowerCase() === "delivered").length;

    // Top customers - use customerName from order as fallback, group by phone if available
    const customerStats: Record<string, { id: string; name: string | null; phone: string | null; orderCount: number; totalSpent: number }> = {};
    
    allOrders.forEach(order => {
      // Use phone as key for grouping customers (more reliable), fallback to userId
      const customerKey = order.customerPhone || order.userId || order.customerName || "unknown";
      if (customerKey === "unknown") return;
      
      const user = order.userId ? allUsers.find(u => u.id === order.userId) : null;
      
      if (!customerStats[customerKey]) {
        customerStats[customerKey] = {
          id: order.userId || customerKey,
          name: user?.name || order.customerName || null,
          phone: user?.phone || order.customerPhone || null,
          orderCount: 0,
          totalSpent: 0,
        };
      }
      
      customerStats[customerKey].orderCount++;
      customerStats[customerKey].totalSpent += order.total || 0;
    });

    const topCustomers = Object.values(customerStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      averageOrderValue,
      topCustomers,
      recentOrders,
      pendingOrders,
      deliveredOrders,
    };
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.date));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransaction(id: number, data: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [updated] = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    return updated;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return true;
  }

  async getAllServiceRequests(): Promise<ServiceRequest[]> {
    return db.select().from(serviceRequests).orderBy(desc(serviceRequests.createdAt));
  }

  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const [created] = await db.insert(serviceRequests).values(request).returning();
    return created;
  }

  async updateServiceRequestStatus(id: number, status: string): Promise<ServiceRequest | undefined> {
    const [updated] = await db.update(serviceRequests).set({ status }).where(eq(serviceRequests.id, id)).returning();
    return updated;
  }

  async deleteServiceRequest(id: number): Promise<boolean> {
    await db.delete(serviceRequests).where(eq(serviceRequests.id, id));
    return true;
  }

  async getAllOffers(): Promise<Offer[]> {
    return db.select().from(offers).orderBy(asc(offers.sortOrder), desc(offers.createdAt));
  }

  async getActiveOffers(): Promise<Offer[]> {
    const today = new Date().toISOString().split("T")[0];
    const all = await db.select().from(offers).where(eq(offers.isActive, "true")).orderBy(asc(offers.sortOrder), desc(offers.createdAt));
    return all.filter(o => !o.expiryDate || o.expiryDate >= today);
  }

  async createOffer(offer: InsertOffer): Promise<Offer> {
    const [created] = await db.insert(offers).values(offer).returning();
    return created;
  }

  async updateOffer(id: number, offer: Partial<InsertOffer>): Promise<Offer | undefined> {
    const [updated] = await db.update(offers).set(offer).where(eq(offers.id, id)).returning();
    return updated;
  }

  async deleteOffer(id: number): Promise<boolean> {
    await db.delete(offers).where(eq(offers.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
