import { User, UserRole, Product, Order, OrderStatus, OrderItem } from '../types';

// Default password for all demo accounts
const DEFAULT_PASS = 'gds2025';

const USERS: User[] = [
  { id: 'u1', name: 'Giorgi Admin', email: 'admin@gds.ge', password: DEFAULT_PASS, role: UserRole.ADMIN, avatar: 'https://picsum.photos/200', isActive: true },
  { id: 'u2', name: 'Khinkali House', email: 'khinkali@rest.ge', password: DEFAULT_PASS, role: UserRole.RESTAURANT, avatar: 'https://picsum.photos/201', isActive: true, phone: '555-12-34-56', locationLink: 'https://maps.app.goo.gl/1' },
  { id: 'u3', name: 'Vino Underground', email: 'vino@rest.ge', password: DEFAULT_PASS, role: UserRole.RESTAURANT, avatar: 'https://picsum.photos/202', isActive: true, phone: '599-00-00-00', locationLink: 'https://maps.app.goo.gl/2' },
  { id: 'u4', name: 'Luka Driver', email: 'luka@driver.ge', password: DEFAULT_PASS, role: UserRole.DRIVER, avatar: 'https://picsum.photos/203', isActive: true, phone: '577-12-12-12' },
  { id: 'u5', name: 'Demo User', email: 'demo@gds.ge', password: DEFAULT_PASS, role: UserRole.DEMO, avatar: 'https://picsum.photos/204', isActive: true, locationLink: 'https://maps.app.goo.gl/demo' },
];

const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Potatoes (Svaneti)', category: 'ბოსტნეული', unit: 'კგ', isActive: true, image: 'https://picsum.photos/300/200?random=1', isPromo: true, price: 1.8, viewCount: 1250 },
  { id: 'p2', name: 'Tomatoes (Kakheti)', category: 'ბოსტნეული', unit: 'კგ', isActive: true, image: 'https://picsum.photos/300/200?random=2', viewCount: 980 },
  { id: 'p3', name: 'Sulguni Cheese', category: 'რძის ნაწარმი', unit: 'კგ', isActive: true, image: 'https://picsum.photos/300/200?random=3', isPromo: true, price: 22, viewCount: 2100 },
  { id: 'p4', name: 'Matsoni', category: 'რძის ნაწარმი', unit: 'ქილა', isActive: true, image: 'https://picsum.photos/300/200?random=4', viewCount: 450 },
  { id: 'p5', name: 'Flour (Premium)', category: 'ბაკალეა', unit: 'ტომარა (50კგ)', isActive: true, image: 'https://picsum.photos/300/200?random=5', viewCount: 890 },
  { id: 'p6', name: 'Sunflower Oil', category: 'ბაკალეა', unit: 'ლიტრი', isActive: true, image: 'https://picsum.photos/300/200?random=6', viewCount: 670 },
  { id: 'p7', name: 'Cucumber', category: 'ბოსტნეული', unit: 'კგ', isActive: true, image: 'https://picsum.photos/300/200?random=7', viewCount: 540 },
];

const UNITS = ['კგ', 'ცალი', 'ქილა', 'ტომარა (50კგ)', 'ლიტრი', 'ყუთი', 'შეკვრა'];
const CATEGORIES = ['ბოსტნეული', 'რძის ნაწარმი', 'ბაკალეა', 'ხორცი', 'სასმელები', 'ხილი'];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    restaurantId: 'u2',
    restaurantName: 'Khinkali House',
    status: OrderStatus.COMPLETED,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    items: [
      { productId: 'p1', productName: 'Potatoes (Svaneti)', quantity: 20, unit: 'კგ', costPrice: 1.2, sellPrice: 1.8 },
      { productId: 'p3', productName: 'Sulguni Cheese', quantity: 5, unit: 'კგ', costPrice: 15, sellPrice: 22 },
    ],
    totalCost: 20 * 1.8 + 5 * 22,
    totalProfit: (20 * 1.8 + 5 * 22) - (20 * 1.2 + 5 * 15),
    driverId: 'u4'
  },
  {
    id: 'ord-102',
    restaurantId: 'u3',
    restaurantName: 'Vino Underground',
    status: OrderStatus.PENDING,
    createdAt: new Date().toISOString(),
    items: [
      { productId: 'p2', productName: 'Tomatoes (Kakheti)', quantity: 10, unit: 'კგ' },
      { productId: 'p4', productName: 'Matsoni', quantity: 12, unit: 'ქილა' },
    ]
  },
  // Demo user orders - მრავალფეროვანი შეკვეთები სხვადასხვა რაოდენობის პროდუქტებით
  {
    id: 'ord-demo-001',
    restaurantId: 'u5',
    restaurantName: 'Demo User',
    status: OrderStatus.COMPLETED,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    items: [
      { productId: 'p1', productName: 'კარტოფილი (სვანური)', quantity: 50, unit: 'კგ', costPrice: 1.2, sellPrice: 1.8 },
      { productId: 'p2', productName: 'პამიდორი (კახური)', quantity: 20, unit: 'კგ', costPrice: 2.5, sellPrice: 3.5 },
      { productId: 'p3', productName: 'სულგუნი', quantity: 8, unit: 'კგ', costPrice: 15, sellPrice: 22 },
      { productId: 'p6', productName: 'მზესუმზირის ზეთი', quantity: 10, unit: 'ლიტრი', costPrice: 3.0, sellPrice: 4.2 },
    ],
    totalCost: 50 * 1.8 + 20 * 3.5 + 8 * 22 + 10 * 4.2,
    totalProfit: (50 * 0.6) + (20 * 1.0) + (8 * 7) + (10 * 1.2),
    driverId: 'u4'
  },
  {
    id: 'ord-demo-002',
    restaurantId: 'u5',
    restaurantName: 'Demo User',
    status: OrderStatus.COMPLETED,
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    items: [
      { productId: 'p3', productName: 'სულგუნი', quantity: 15, unit: 'კგ', costPrice: 15, sellPrice: 22 },
      { productId: 'p4', productName: 'მაწონი', quantity: 36, unit: 'ქილა', costPrice: 1.5, sellPrice: 2.5 },
      { productId: 'p5', productName: 'ფქვილი (პრემიუმ)', quantity: 1, unit: 'ტომარა (50კგ)', costPrice: 45, sellPrice: 55 },
    ],
    totalCost: 15 * 22 + 36 * 2.5 + 1 * 55,
    totalProfit: (15 * 7) + (36 * 1.0) + (1 * 10),
    driverId: 'u4'
  },
  {
    id: 'ord-demo-003',
    restaurantId: 'u5',
    restaurantName: 'Demo User',
    status: OrderStatus.COMPLETED,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    items: [
      { productId: 'p5', productName: 'ფქვილი (პრემიუმ)', quantity: 3, unit: 'ტომარა (50კგ)', costPrice: 45, sellPrice: 55 },
      { productId: 'p6', productName: 'მზესუმზირის ზეთი', quantity: 25, unit: 'ლიტრი', costPrice: 3.0, sellPrice: 4.2 },
      { productId: 'p1', productName: 'კარტოფილი (სვანური)', quantity: 30, unit: 'კგ', costPrice: 1.2, sellPrice: 1.8 },
      { productId: 'p7', productName: 'კიტრი', quantity: 15, unit: 'კგ', costPrice: 1.8, sellPrice: 2.8 },
      { productId: 'p4', productName: 'მაწონი', quantity: 12, unit: 'ქილა', costPrice: 1.5, sellPrice: 2.5 },
    ],
    totalCost: 3 * 55 + 25 * 4.2 + 30 * 1.8 + 15 * 2.8 + 12 * 2.5,
    totalProfit: (3 * 10) + (25 * 1.2) + (30 * 0.6) + (15 * 1.0) + (12 * 1.0),
    driverId: 'u4'
  },
  {
    id: 'ord-demo-004',
    restaurantId: 'u5',
    restaurantName: 'Demo User',
    status: OrderStatus.COMPLETED,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    items: [
      { productId: 'p7', productName: 'კიტრი', quantity: 25, unit: 'კგ', costPrice: 1.8, sellPrice: 2.8 },
      { productId: 'p2', productName: 'პამიდორი (კახური)', quantity: 30, unit: 'კგ', costPrice: 2.5, sellPrice: 3.5 },
      { productId: 'p1', productName: 'კარტოფილი (სვანური)', quantity: 40, unit: 'კგ', costPrice: 1.2, sellPrice: 1.8 },
    ],
    totalCost: 25 * 2.8 + 30 * 3.5 + 40 * 1.8,
    totalProfit: (25 * 1.0) + (30 * 1.0) + (40 * 0.6),
    driverId: 'u4'
  },
  {
    id: 'ord-demo-005',
    restaurantId: 'u5',
    restaurantName: 'Demo User',
    status: OrderStatus.COMPLETED,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    items: [
      { productId: 'p2', productName: 'პამიდორი (კახური)', quantity: 35, unit: 'კგ', costPrice: 2.5, sellPrice: 3.5 },
      { productId: 'p3', productName: 'სულგუნი', quantity: 12, unit: 'კგ', costPrice: 15, sellPrice: 22 },
      { productId: 'p4', productName: 'მაწონი', quantity: 24, unit: 'ქილა', costPrice: 1.5, sellPrice: 2.5 },
      { productId: 'p6', productName: 'მზესუმზირის ზეთი', quantity: 15, unit: 'ლიტრი', costPrice: 3.0, sellPrice: 4.2 },
      { productId: 'p7', productName: 'კიტრი', quantity: 20, unit: 'კგ', costPrice: 1.8, sellPrice: 2.8 },
      { productId: 'p1', productName: 'კარტოფილი (სვანური)', quantity: 25, unit: 'კგ', costPrice: 1.2, sellPrice: 1.8 },
    ],
    totalCost: 35 * 3.5 + 12 * 22 + 24 * 2.5 + 15 * 4.2 + 20 * 2.8 + 25 * 1.8,
    totalProfit: (35 * 1.0) + (12 * 7) + (24 * 1.0) + (15 * 1.2) + (20 * 1.0) + (25 * 0.6),
    driverId: 'u4'
  },
  {
    id: 'ord-demo-006',
    restaurantId: 'u5',
    restaurantName: 'Demo User',
    status: OrderStatus.COMPLETED,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    items: [
      { productId: 'p1', productName: 'კარტოფილი (სვანური)', quantity: 60, unit: 'კგ', costPrice: 1.2, sellPrice: 1.8 },
      { productId: 'p5', productName: 'ფქვილი (პრემიუმ)', quantity: 2, unit: 'ტომარა (50კგ)', costPrice: 45, sellPrice: 55 },
      { productId: 'p6', productName: 'მზესუმზირის ზეთი', quantity: 20, unit: 'ლიტრი', costPrice: 3.0, sellPrice: 4.2 },
      { productId: 'p3', productName: 'სულგუნი', quantity: 5, unit: 'კგ', costPrice: 15, sellPrice: 22 },
    ],
    totalCost: 60 * 1.8 + 2 * 55 + 20 * 4.2 + 5 * 22,
    totalProfit: (60 * 0.6) + (2 * 10) + (20 * 1.2) + (5 * 7),
    driverId: 'u4'
  },
  {
    id: 'ord-demo-007',
    restaurantId: 'u5',
    restaurantName: 'Demo User',
    status: OrderStatus.DELIVERED,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    items: [
      { productId: 'p5', productName: 'ფქვილი (პრემიუმ)', quantity: 4, unit: 'ტომარა (50კგ)', costPrice: 45, sellPrice: 55 },
      { productId: 'p7', productName: 'კიტრი', quantity: 30, unit: 'კგ', costPrice: 1.8, sellPrice: 2.8 },
      { productId: 'p2', productName: 'პამიდორი (კახური)', quantity: 25, unit: 'კგ', costPrice: 2.5, sellPrice: 3.5 },
      { productId: 'p4', productName: 'მაწონი', quantity: 18, unit: 'ქილა', costPrice: 1.5, sellPrice: 2.5 },
      { productId: 'p3', productName: 'სულგუნი', quantity: 6, unit: 'კგ', costPrice: 15, sellPrice: 22 },
    ],
    totalCost: 4 * 55 + 30 * 2.8 + 25 * 3.5 + 18 * 2.5 + 6 * 22,
    totalProfit: (4 * 10) + (30 * 1.0) + (25 * 1.0) + (18 * 1.0) + (6 * 7),
    driverId: 'u4'
  },
  {
    id: 'ord-demo-008',
    restaurantId: 'u5',
    restaurantName: 'Demo User',
    status: OrderStatus.CONFIRMED,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    items: [
      { productId: 'p2', productName: 'პამიდორი (კახური)', quantity: 20, unit: 'კგ', costPrice: 2.5, sellPrice: 3.5 },
      { productId: 'p3', productName: 'სულგუნი', quantity: 10, unit: 'კგ', costPrice: 15, sellPrice: 22 },
      { productId: 'p1', productName: 'კარტოფილი (სვანური)', quantity: 35, unit: 'კგ', costPrice: 1.2, sellPrice: 1.8 },
      { productId: 'p6', productName: 'მზესუმზირის ზეთი', quantity: 12, unit: 'ლიტრი', costPrice: 3.0, sellPrice: 4.2 },
    ],
    totalCost: 20 * 3.5 + 10 * 22 + 35 * 1.8 + 12 * 4.2,
    totalProfit: (20 * 1.0) + (10 * 7) + (35 * 0.6) + (12 * 1.2)
  }
];

class MockDB {
  private users: User[] = USERS;
  private products: Product[] = PRODUCTS;
  private orders: Order[] = INITIAL_ORDERS;
  private units: string[] = UNITS;
  private categories: string[] = CATEGORIES;

  getUsers() { return this.users; }
  getProducts() { return this.products; }
  getOrders() { return this.orders; }
  getUnits() { return this.units; }
  getCategories() { return this.categories; }

  login(email: string, password?: string): User | undefined {
    return this.users.find(u => 
      u.email === email && 
      (!password || u.password === password) && 
      u.isActive !== false
    );
  }

  // Users
  addUser(user: User) {
    if (!user.password) user.password = DEFAULT_PASS;
    this.users = [...this.users, user];
  }
  
  updateUser(user: User) {
    this.users = this.users.map(u => u.id === user.id ? { ...u, ...user } : u);
  }
  
  updateUserStatus(id: string, isActive: boolean) {
    this.users = this.users.map(u => u.id === id ? { ...u, isActive } : u);
  }

  // Units
  addUnit(unit: string) {
    if (!this.units.includes(unit)) {
      this.units = [...this.units, unit];
    }
  }

  updateUnit(oldUnit: string, newUnit: string) {
    this.units = this.units.map(u => u === oldUnit ? newUnit : u);
    // Also update products using this unit
    this.products = this.products.map(p => p.unit === oldUnit ? { ...p, unit: newUnit } : p);
  }

  deleteUnit(unit: string) {
    this.units = this.units.filter(u => u !== unit);
  }

  // Categories
  addCategory(category: string) {
    if (!this.categories.includes(category)) {
      this.categories = [...this.categories, category];
    }
  }

  updateCategory(oldCategory: string, newCategory: string) {
    this.categories = this.categories.map(c => c === oldCategory ? newCategory : c);
    // Update products using this category
    this.products = this.products.map(p => p.category === oldCategory ? { ...p, category: newCategory } : p);
  }

  deleteCategory(category: string) {
    this.categories = this.categories.filter(c => c !== category);
  }

  // Products
  addProduct(product: Product) {
    this.products = [...this.products, product];
  }
  updateProduct(product: Product) {
    this.products = this.products.map(p => p.id === product.id ? product : p);
  }
  deleteProduct(id: string) {
    this.products = this.products.filter(p => p.id !== id);
  }
  toggleProductStatus(id: string) {
    this.products = this.products.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p);
  }
  toggleProductPromo(id: string) {
    this.products = this.products.map(p => {
      if (p.id === id) {
        const nextPromo = !p.isPromo;
        // If turning off promo, clear price
        return { ...p, isPromo: nextPromo, price: nextPromo ? p.price : undefined };
      }
      return p;
    });
  }

  bulkUpdateProducts(ids: string[], updates: Partial<Product>) {
    this.products = this.products.map(p => {
      if (ids.includes(p.id)) {
        return { ...p, ...updates };
      }
      return p;
    });
  }

  // Orders
  createOrder(restaurant: User, items: { product: Product, quantity: number }[], notes?: string) {
    const newOrder: Order = {
      id: `ord-${Math.floor(Math.random() * 10000)}`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      status: OrderStatus.PENDING,
      createdAt: new Date().toISOString(),
      items: items.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        unit: i.product.unit,
        quantity: i.quantity,
        sellPrice: i.product.isPromo ? i.product.price : undefined
      })),
      notes
    };
    this.orders = [newOrder, ...this.orders];
    return newOrder;
  }

  updateOrderStatus(orderId: string, status: OrderStatus, driverId?: string) {
    this.orders = this.orders.map(o => {
      if (o.id === orderId) {
        const updates: Partial<Order> = { status };
        if (driverId) updates.driverId = driverId;
        return { ...o, ...updates };
      }
      return o;
    });
  }

  updateOrderPricing(orderId: string, items: OrderItem[]) {
    this.orders = this.orders.map(o => {
      if (o.id === orderId) {
        const totalCost = items.reduce((acc, i) => acc + ((i.sellPrice || 0) * i.quantity), 0);
        const totalProfit = items.reduce((acc, i) => acc + (((i.sellPrice || 0) - (i.costPrice || 0)) * i.quantity), 0);
        return { ...o, items, totalCost, totalProfit };
      }
      return o;
    });
  }
}

export const db = new MockDB();
