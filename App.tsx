import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  User,
  Product,
  Order,
  OrderItem,
  UserRole,
  OrderStatus,
  Toast as ToastType,
} from "./types";
import { db } from "./services/db";
import { initSupabase, getSupabase } from "./services/supabaseClient";
import { Layout } from "./components/Layout";
import { LandingPage } from "./components/LandingPage";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { RestaurantDashboard } from "./components/restaurant/RestaurantView";
import { DriverDashboard } from "./components/driver/DriverView";
import { SetupPage } from "./components/SetupPage";
import { Toast } from "./components/ui/Shared";
import { Loader2 } from "lucide-react";
import "./i18n";
import { useTranslation } from "react-i18next";

interface AppConfig {
  supabaseUrl: string;
  supabaseKey: string;
  companyName: string;
  setupComplete: boolean;
}

interface AppContextType {
  user: User | null;
  users: User[];
  products: Product[];
  orders: Order[];
  units: string[];
  categories: string[];
  theme: "light" | "dark";
  config: AppConfig | null;
  toggleTheme: () => void;
  login: (
    email: string,
    password?: string,
    rememberMe?: boolean,
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshData: () => void;
  saveConfig: (cfg: AppConfig) => void;
  addProduct: (p: Product) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductStatus: (id: string) => Promise<void>;
  toggleProductPromo: (id: string) => Promise<void>;
  bulkProductAction: (
    ids: string[],
    updates: Partial<Product>,
  ) => Promise<void>;
  addUnit: (unit: string) => Promise<void>;
  updateUnit: (oldUnit: string, newUnit: string) => Promise<void>;
  deleteUnit: (unit: string) => Promise<void>;
  addCategory: (category: string) => Promise<void>;
  updateCategory: (oldCategory: string, newCategory: string) => Promise<void>;
  deleteCategory: (category: string) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  updateUserStatus: (id: string, isActive: boolean) => Promise<void>;
  deleteUser: (id: string, adminPassword: string) => Promise<boolean>;
  createOrder: (
    items: { product: Product; quantity: number }[],
    notes?: string,
  ) => Promise<void>;
  updateOrderStatus: (
    id: string,
    status: OrderStatus,
    driverId?: string,
  ) => Promise<void>;
  updateOrderPricing: (id: string, items: any[]) => Promise<void>;
  updateProductCostPrice: (productId: string, costPrice: number) => Promise<void>;
  updateOrderItems: (id: string, items: OrderItem[], correctedBy?: string) => Promise<void>;
  showToast: (message: string, type?: ToastType["type"]) => void;
  isDemo: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("gds_theme") as any) || "light",
  );

  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastType[]>([]);

  // Helper: Promise with timeout to prevent hanging
  const promiseWithTimeout = <T,>(
    promise: Promise<T>,
    timeoutMs: number = 10000,
    timeoutError = "Operation timeout"
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(timeoutError)), timeoutMs)
      ),
    ]);
  };

  // Helper: Fetch user profile with timeout
  const fetchUserProfile = async (userId: string, supabase: any): Promise<User | null> => {
    try {
      const result = await promiseWithTimeout(
        supabase.from("users").select("*").eq("id", userId).single(),
        8000,
        "Profile load timeout"
      );
      return (result as any)?.data as User | null;
    } catch (e) {
      console.warn("Profile fetch failed:", e);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true; // Prevent memory leaks and race conditions

    // Access environment variables
    const getEnv = (key: string) => {
      const viteKey = `VITE_${key}`;
      const nextKey = `NEXT_PUBLIC_${key}`;
      return (
        (window as any).env?.[viteKey] ||
        (window as any).env?.[nextKey] ||
        import.meta.env?.[viteKey] ||
        import.meta.env?.[nextKey]
      );
    };

    const envUrl = getEnv("SUPABASE_URL");
    const envKey = getEnv("SUPABASE_ANON_KEY");
    const envCompany = getEnv("COMPANY_NAME");

    let supabaseInitialized = false;

    if (envUrl && envKey) {
      const envConfig: AppConfig = {
        supabaseUrl: envUrl,
        supabaseKey: envKey,
        companyName: envCompany || "GDS Greenland",
        setupComplete: true,
      };
      setConfig(envConfig);
      initSupabase(envConfig.supabaseUrl, envConfig.supabaseKey);
      supabaseInitialized = true;
    } else {
      const savedConfig = localStorage.getItem("gds_system_config");
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        initSupabase(parsed.supabaseUrl, parsed.supabaseKey);
        supabaseInitialized = true;
      }
    }

    // First check for saved demo session (faster, no network)
    const savedSession = localStorage.getItem("gds_session");
    if (savedSession) {
      try {
        const { email } = JSON.parse(savedSession);
        if (email === "demo@gds.ge") {
          const demoUser = db.login(email, "demo");
          if (demoUser && isMounted) {
            setIsDemo(true);
            setUser(demoUser);
            setLoading(false);
            return; // Early return, no need for Supabase
          }
        }
      } catch (e) {
        console.warn("Local session restore failed:", e);
        localStorage.removeItem("gds_session");
      }
    }

    // Set up Supabase auth listener FIRST (before getSession)
    // This is the recommended approach from Supabase docs
    const supabase = getSupabase();
    let subscription: { unsubscribe: () => void } | null = null;

    if (supabase && supabaseInitialized) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;

        console.log("Auth event:", event);

        // Handle INITIAL_SESSION - this fires on page load/refresh
        if (event === "INITIAL_SESSION") {
          if (session?.user) {
            // Session exists from localStorage, fetch profile asynchronously
            fetchUserProfile(session.user.id, supabase).then((profile) => {
              if (!isMounted) return;

              if (profile) {
                setUser(profile);
                setIsDemo(false);
              } else {
                // No profile found, create basic user from auth data
                const basicUser: User = {
                  id: session.user.id,
                  email: session.user.email || "",
                  name: session.user.email?.split("@")[0] || "User",
                  role: UserRole.ADMIN,
                  isActive: true,
                };
                setUser(basicUser);
                setIsDemo(false);
              }
              setLoading(false);
            });
          } else {
            // No session
            setLoading(false);
          }
          return;
        }

        // Handle SIGNED_IN
        if (event === "SIGNED_IN" && session?.user) {
          fetchUserProfile(session.user.id, supabase).then((profile) => {
            if (!isMounted) return;

            if (profile) {
              setUser(profile);
              setIsDemo(false);
            }
          });
          return;
        }

        // Handle SIGNED_OUT
        if (event === "SIGNED_OUT") {
          setUser(null);
          setIsDemo(false);
          localStorage.removeItem("gds_session");
          return;
        }

        // Handle TOKEN_REFRESHED
        if (event === "TOKEN_REFRESHED" && session?.user) {
          // Token refreshed, user state should already be set
          return;
        }
      });

      subscription = data.subscription;

      // Fallback timeout - if INITIAL_SESSION doesn't fire within 10 seconds, stop loading
      setTimeout(() => {
        if (isMounted && loading) {
          console.warn("Auth initialization timeout, stopping loading");
          setLoading(false);
        }
      }, 10000);
    } else {
      // No Supabase configured
      if (isMounted) {
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const saveConfig = (cfg: AppConfig) => {
    localStorage.setItem("gds_system_config", JSON.stringify(cfg));
    setConfig(cfg);
    initSupabase(cfg.supabaseUrl, cfg.supabaseKey);
    // Remove reload to prevent loop, state update will trigger navigation
  };

  const toggleTheme = () => {
    setTheme((prev: "light" | "dark") => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("gds_theme", next);
      return next;
    });
  };

  const showToast = useCallback(
    (message: string, type: ToastType["type"] = "success") => {
      const id = Date.now().toString();
      setToasts((prev: ToastType[]) => [...prev, { id, message, type }]);
    },
    [],
  );

  const removeToast = (id: string) =>
    setToasts((prev: ToastType[]) => prev.filter((t: ToastType) => t.id !== id));

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const refreshData = useCallback(async () => {
    const supabase = getSupabase();

    // Always load local mock data for fallback or initial state if needed, but prioritize Supabase
    // If we are in DEMO mode, we might want to show Supabase products but keep local orders?
    // User requirement: "Demo for restaurant must see REAL products"

    if (isDemo) {
      // For Demo user:
      // 1. Get Products from Supabase (Real data)
      // 2. Keep Orders local (Mock)
      // 3. User is Mock
      if (supabase) {
        try {
          const { data: realProducts, error } = await supabase
            .from("products")
            .select("*");
          if (realProducts && !error) setProducts(realProducts as Product[]);
          else setProducts(db.getProducts());

          const { data: realCategories } = await supabase
            .from("categories")
            .select("*");
          if (realCategories && realCategories.length > 0)
            setCategories(realCategories.map((c: any) => c.name));
          else setCategories(db.getCategories());

          const { data: realUnits } = await supabase.from("units").select("*");
          if (realUnits && realUnits.length > 0)
            setUnits(realUnits.map((u: any) => u.name));
          else setUnits(db.getUnits());
        } catch (e) {
          console.warn("Demo sync failed, using mock", e);
          setProducts(db.getProducts());
          setCategories(db.getCategories());
          setUnits(db.getUnits());
        }
      } else {
        setProducts(db.getProducts());
        setCategories(db.getCategories());
        setUnits(db.getUnits());
      }
      setOrders(db.getOrders()); // Demo user sees mock orders from db.ts
      setUsers(db.getUsers()); // Demo user only sees itself?
      return;
    }

    if (supabase && user) {
      try {
        const [pRes, oRes, uRes] = await Promise.all([
          supabase.from("products").select("*"),
          supabase
            .from("orders")
            .select("*")
            .order("createdAt", { ascending: false }),
          supabase.from("users").select("*"),
        ]);

        if (pRes.data) setProducts(pRes.data as Product[]);
        if (oRes.data) setOrders(oRes.data as any);
        if (uRes.data) setUsers(uRes.data as User[]);

        // Load units/categories if they exist in DB, otherwise use defaults
        // For now using DB defaults as they might not be in Supabase yet
        setUnits(db.getUnits());
        setCategories(db.getCategories());
      } catch (e) {
        console.warn("Supabase sync failed");
      }
    }
  }, [isDemo, user]);

  useEffect(() => {
    if (user) refreshData();
  }, [user, isDemo, refreshData]);

  // Realtime subscription for orders - enables live updates between restaurant and admin
  useEffect(() => {
    if (isDemo || !user) return;

    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Realtime order update:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            setOrders((prev) => {
              // Avoid duplicates (optimistic update may have added it already)
              if (prev.some((o) => o.id === newOrder.id)) return prev;
              return [newOrder, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as Order;
            setOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedOrder = payload.old as Order;
            setOrders((prev) => prev.filter((o) => o.id !== deletedOrder.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isDemo, user]);

  const login = async (
    email: string,
    password?: string,
    rememberMe: boolean = false,
  ): Promise<boolean> => {
    // Check for demo login specifically
    if (email === "demo@gds.ge") {
      const u = db.login(email, password);
      if (u) {
        setIsDemo(true);
        setUser(u);
        // Save demo session for persistence
        localStorage.setItem("gds_session", JSON.stringify({ email: "demo@gds.ge" }));
        return true;
      }
    }

    const supabase = getSupabase();

    if (supabase) {
      try {
        const { data } = await supabase.auth.signInWithPassword({
          email,
          password: password || "",
        });
        if (data.user) {
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", data.user.id)
            .single();
          // If no profile exists, create a basic one based on auth data (or handle error)
          const mappedUser: User = profile || {
            id: data.user.id,
            email: data.user.email || "",
            name: "User",
            role: UserRole.RESTAURANT, // Default role
            isActive: true,
          };
          setUser(mappedUser);
          setIsDemo(false);
          if (rememberMe)
            localStorage.setItem(
              "gds_session",
              JSON.stringify({ email: mappedUser.email }),
            );
          return true;
        }
      } catch (e) {
        console.error("Login failed:", e);
      }
    }
    return false;
  };

  const logout = async () => {
    localStorage.removeItem("gds_session");
    setUser(null);
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
  };

  const addProduct = async (p: Product) => {
    console.log("addProduct called with:", p);
    console.log("isDemo:", isDemo);

    if (isDemo) {
      db.addProduct(p);
      showToast("პროდუქტი დაემატა", "success");
      refreshData();
      return;
    }

    try {
      const supabase = getSupabase();
      if (!supabase) {
        showToast("კავშირის შეცდომა", "error");
        return;
      }
      // Prepare product for Supabase - remove undefined values and generate UUID
      const productForSupabase: Record<string, any> = {
        id: crypto.randomUUID(),
        name: p.name,
        category: p.category,
        unit: p.unit,
        image: p.image || '',
        isActive: p.isActive ?? true,
        isPromo: p.isPromo ?? false,
      };
      // Only add price if it has value
      if (p.price !== undefined && p.price !== null) {
        productForSupabase.price = p.price;
      }

      console.log("Inserting product:", productForSupabase);

      const { data, error } = await supabase.from("products").insert(productForSupabase).select();

      if (error) {
        console.error("Product insert error:", error);
        showToast("პროდუქტის დამატება ვერ მოხერხდა: " + error.message, "error");
        return;
      }

      console.log("Product inserted successfully:", data);
      showToast("პროდუქტი დაემატა", "success");
      refreshData();
    } catch (err: any) {
      console.error("Unexpected error adding product:", err);
      showToast("შეცდომა: " + (err?.message || "უცნობი შეცდომა"), "error");
    }
  };
  const updateProduct = async (p: Product) => {
    if (isDemo) db.updateProduct(p);
    else await getSupabase()?.from("products").update(p).eq("id", p.id);
    refreshData();
  };
  const deleteProduct = async (id: string) => {
    if (isDemo) db.deleteProduct(id);
    else await getSupabase()?.from("products").delete().eq("id", id);
    refreshData();
  };
  const toggleProductStatus = async (id: string) => {
    if (isDemo) {
      db.toggleProductStatus(id);
    } else {
      const product = products.find((p: Product) => p.id === id);
      if (product) {
        await getSupabase()
          ?.from("products")
          .update({ isActive: !product.isActive })
          .eq("id", id);
      }
    }
    refreshData();
  };
  const toggleProductPromo = async (id: string) => {
    if (isDemo) {
      db.toggleProductPromo(id);
    } else {
      const product = products.find((p: Product) => p.id === id);
      if (product) {
        const nextPromo = !product.isPromo;
        await getSupabase()
          ?.from("products")
          .update({
            isPromo: nextPromo,
            price: nextPromo ? product.price : null,
          })
          .eq("id", id);
      }
    }
    refreshData();
  };
  const bulkProductAction = async (
    ids: string[],
    updates: Partial<Product>,
  ) => {
    if (isDemo) {
      db.bulkUpdateProducts(ids, updates);
    } else {
      // Supabase doesn't support bulk update with IN, so update each
      for (const id of ids) {
        await getSupabase()?.from("products").update(updates).eq("id", id);
      }
    }
    refreshData();
  };

  const addUnit = async (unit: string) => {
    if (isDemo) {
      db.addUnit(unit);
    } else {
      await getSupabase()?.from("units").insert({ name: unit });
    }
    refreshData();
  };
  const updateUnit = async (oldUnit: string, newUnit: string) => {
    if (isDemo) {
      db.updateUnit(oldUnit, newUnit);
    } else {
      await getSupabase()?.from("units").update({ name: newUnit }).eq("name", oldUnit);
      // Also update products using this unit
      await getSupabase()?.from("products").update({ unit: newUnit }).eq("unit", oldUnit);
    }
    refreshData();
  };
  const deleteUnit = async (unit: string) => {
    if (isDemo) {
      db.deleteUnit(unit);
    } else {
      await getSupabase()?.from("units").delete().eq("name", unit);
    }
    refreshData();
  };

  const addCategory = async (category: string) => {
    if (isDemo) {
      db.addCategory(category);
    } else {
      await getSupabase()?.from("categories").insert({ name: category });
    }
    refreshData();
  };
  const updateCategory = async (oldCategory: string, newCategory: string) => {
    if (isDemo) {
      db.updateCategory(oldCategory, newCategory);
    } else {
      await getSupabase()?.from("categories").update({ name: newCategory }).eq("name", oldCategory);
      // Also update products using this category
      await getSupabase()?.from("products").update({ category: newCategory }).eq("category", oldCategory);
    }
    refreshData();
  };
  const deleteCategory = async (category: string) => {
    if (isDemo) {
      db.deleteCategory(category);
    } else {
      await getSupabase()?.from("categories").delete().eq("name", category);
    }
    refreshData();
  };

  const addUser = async (u: User & { password?: string }) => {
    if (isDemo) {
      db.addUser(u);
      showToast(t("users.user_created_success"), "success");
    } else {
      const supabase = getSupabase();
      if (!supabase) {
        showToast(t("errors.supabase_not_configured"), "error");
        return;
      }

      console.log("=== Starting user creation ===");
      console.log("Email:", u.email);
      console.log("Name:", u.name);
      console.log("Role:", u.role);
      console.log("Password provided:", !!u.password);

      // Step 1: Create user in Supabase Auth
      // The database trigger will automatically create profile in public.users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: u.email,
        password: u.password || "TempPassword123!",
        options: {
          data: {
            name: u.name,
            role: u.role,
          },
        },
      });

      console.log("Auth response:", { authData, authError });

      if (authError) {
        console.error("Auth user creation failed:", authError);
        showToast(authError.message || t("errors.user_creation_failed"), "error");
        return;
      }

      if (!authData.user) {
        console.error("No user in auth response");
        showToast(t("errors.user_creation_failed"), "error");
        return;
      }

      console.log("Auth user created successfully:", authData.user.id);

      // Step 2: Update the profile with additional fields (trigger already created basic profile)
      // Small delay to ensure trigger has completed
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: updateData, error: updateError } = await supabase
        .from("users")
        .update({
          phone: u.phone || null,
          locationLink: u.locationLink || null,
          avatar: u.avatar || null,
        })
        .eq("id", authData.user.id)
        .select();

      console.log("Profile update response:", { updateData, updateError });

      if (updateError) {
        console.warn("Profile update failed:", updateError);
      }

      showToast(t("users.user_created_success"), "success");
      console.log("=== User creation completed ===");
    }
    refreshData();
  };
  const updateUser = async (u: User) => {
    if (isDemo) {
      db.updateUser(u);
    } else {
      await getSupabase()?.from("users").update(u).eq("id", u.id);
    }
    if (user?.id === u.id) setUser(u);
    refreshData();
  };
  const updateUserStatus = async (id: string, active: boolean) => {
    if (isDemo) {
      db.updateUserStatus(id, active);
    } else {
      await getSupabase()
        ?.from("users")
        .update({ isActive: active })
        .eq("id", id);
    }
    refreshData();
  };

  const deleteUser = async (id: string, adminPassword: string): Promise<boolean> => {
    // Verify admin password by attempting to sign in
    const supabase = getSupabase();
    if (!supabase || !user) {
      showToast(t("errors.supabase_not_configured"), "error");
      return false;
    }

    // Verify admin password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: adminPassword,
    });

    if (signInError) {
      showToast("არასწორი პაროლი", "error");
      return false;
    }

    // Don't allow deleting yourself
    if (id === user.id) {
      showToast("საკუთარი ანგარიშის წაშლა არ შეიძლება", "error");
      return false;
    }

    if (isDemo) {
      // For demo mode, just remove from local state
      db.deleteUser?.(id);
      showToast("მომხმარებელი წაშლილია", "success");
      refreshData();
      return true;
    }

    // Delete from users table (this will cascade or be handled by DB)
    const { error: dbError } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("Error deleting user from DB:", dbError);
      showToast("მომხმარებლის წაშლა ვერ მოხერხდა", "error");
      return false;
    }

    showToast("მომხმარებელი წარმატებით წაიშალა", "success");
    refreshData();
    return true;
  };

  const createOrder = async (
    items: { product: Product; quantity: number }[],
    notes?: string,
  ) => {
    if (!user) return;

    const newOrder: Order = {
      id: crypto.randomUUID(),
      restaurantId: user.id,
      restaurantName: user.name,
      status: OrderStatus.PENDING,
      createdAt: new Date().toISOString(),
      items: items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        unit: i.product.unit,
        quantity: i.quantity,
        sellPrice: i.product.isPromo ? i.product.price : undefined,
      })),
      notes,
    };

    if (isDemo) {
      db.createOrder(user, items, notes);
      setOrders((prev) => [newOrder, ...prev]);
      showToast("შეკვეთა წარმატებით გაიგზავნა", "success");
    } else {
      const supabase = getSupabase();
      if (!supabase) {
        showToast("კავშირის შეცდომა - სცადეთ თავიდან", "error");
        return;
      }

      const { error } = await supabase.from("orders").insert(newOrder);

      if (error) {
        console.error("Order insert error:", error);
        showToast("შეკვეთის გაგზავნა ვერ მოხერხდა: " + error.message, "error");
        return;
      }

      // წარმატებული insert - დაამატე ლოკალურ state-ში
      setOrders((prev) => [newOrder, ...prev]);
      showToast("შეკვეთა წარმატებით გაიგზავნა", "success");
    }

    refreshData();
  };
  const updateOrderStatus = async (
    id: string,
    status: OrderStatus,
    driver?: string,
  ) => {
    if (isDemo) {
      db.updateOrderStatus(id, status, driver);
    } else {
      const updates: { status: OrderStatus; driverId?: string } = { status };
      if (driver) updates.driverId = driver;
      await getSupabase()?.from("orders").update(updates).eq("id", id);
    }
    refreshData();
  };
  const updateOrderPricing = async (id: string, items: OrderItem[]) => {
    if (isDemo) {
      db.updateOrderPricing(id, items);
    } else {
      const totalCost = items.reduce(
        (acc, i) => acc + (i.sellPrice || 0) * i.quantity,
        0,
      );
      const totalProfit = items.reduce(
        (acc, i) =>
          acc + ((i.sellPrice || 0) - (i.costPrice || 0)) * i.quantity,
        0,
      );
      await getSupabase()
        ?.from("orders")
        .update({ items, totalCost, totalProfit })
        .eq("id", id);
    }
    refreshData();
  };

  // Update costPrice for a product across all CONFIRMED orders
  const updateProductCostPrice = async (productId: string, costPrice: number) => {
    const confirmedOrders = orders.filter(o => o.status === OrderStatus.CONFIRMED);

    for (const order of confirmedOrders) {
      const hasProduct = order.items.some(item => item.productId === productId);
      if (!hasProduct) continue;

      const updatedItems = order.items.map(item =>
        item.productId === productId
          ? { ...item, costPrice }
          : item
      );

      if (isDemo) {
        db.updateOrderPricing(order.id, updatedItems);
      } else {
        await getSupabase()
          ?.from("orders")
          .update({ items: updatedItems })
          .eq("id", order.id);
      }
    }

    refreshData();
    showToast(`თვითღირებულება განახლდა: ${costPrice}₾`, "success");
  };

  // Update order items (for editing orders - by admin or restaurant)
  const updateOrderItems = async (id: string, items: OrderItem[], correctedBy?: string) => {
    // Recalculate totals
    const totalCost = items.reduce(
      (acc, i) => acc + (i.sellPrice || 0) * i.quantity,
      0,
    );
    const totalProfit = items.reduce(
      (acc, i) =>
        acc + ((i.sellPrice || 0) - (i.costPrice || 0)) * i.quantity,
      0,
    );

    // Add correction info if admin is editing
    const updatedItems = correctedBy ? items.map(item => ({
      ...item,
      correctedBy: item.originalQuantity !== undefined ? correctedBy : item.correctedBy,
      correctedAt: item.originalQuantity !== undefined ? new Date().toISOString() : item.correctedAt
    })) : items;

    if (isDemo) {
      db.updateOrderPricing(id, updatedItems);
    } else {
      await getSupabase()
        ?.from("orders")
        .update({
          items: updatedItems,
          totalCost: totalCost > 0 ? totalCost : undefined,
          totalProfit: totalProfit > 0 ? totalProfit : undefined
        })
        .eq("id", id);
    }
    refreshData();
    showToast(t("orders.order_updated"), "success");
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <AppContext.Provider
      value={{
        user,
        users,
        products,
        orders,
        units,
        categories,
        theme,
        config,
        isDemo,
        toggleTheme,
        login,
        logout,
        refreshData,
        saveConfig,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStatus,
        toggleProductPromo,
        bulkProductAction,
        addUnit,
        updateUnit,
        deleteUnit,
        addCategory,
        updateCategory,
        deleteCategory,
        addUser,
        updateUser,
        updateUserStatus,
        deleteUser,
        createOrder,
        updateOrderStatus,
        updateOrderPricing,
        updateProductCostPrice,
        updateOrderItems,
        showToast,
      }}
    >
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t: ToastType) => (
          <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </AppContext.Provider>
  );
};

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/*" element={<AppLoader />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

const AppLoader = () => {
  const { config, user } = useApp();
  if (!config?.setupComplete) return <Navigate to="/setup" replace />;

  const getHomeRedirect = () => {
    if (!user) return <LandingPage />;
    if (user.role === UserRole.DEMO)
      return <Navigate to="/restaurant" replace />;
    return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  };

  return (
    <Routes>
      <Route path="/" element={getHomeRedirect()} />
      <Route
        path="/admin/*"
        element={
          <PrivateRoute roles={[UserRole.ADMIN]}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/restaurant/*"
        element={
          <PrivateRoute roles={[UserRole.RESTAURANT, UserRole.DEMO]}>
            <Layout>
              <RestaurantDashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/driver/*"
        element={
          <PrivateRoute roles={[UserRole.DRIVER]}>
            <Layout>
              <DriverDashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const PrivateRoute = ({
  children,
  roles,
}: {
  children?: React.ReactNode;
  roles: UserRole[];
}) => {
  const { user } = useApp();
  if (!user) return <Navigate to="/" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};
