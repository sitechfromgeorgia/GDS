import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  useMemo,
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
import { ErrorBoundary } from "./components/ErrorBoundary";
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
  isLoadingData: boolean;
  toggleTheme: () => void;
  refreshProducts: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshUsers: () => Promise<void>;
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
  updateOrderPricing: (id: string, items: OrderItem[]) => Promise<void>;
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
  const [isLoadingData, setIsLoadingData] = useState(false);
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
  const fetchUserProfile = async (userId: string, supabase: NonNullable<ReturnType<typeof getSupabase>>): Promise<User | null> => {
    try {
      const query = supabase.from("users").select("*").eq("id", userId).single();
      const result = await promiseWithTimeout(
        Promise.resolve(query),
        8000,
        "Profile load timeout"
      );
      return (result as { data: User | null })?.data ?? null;
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

  // Targeted refresh functions - refresh only specific data
  const refreshProducts = useCallback(async () => {
    try {
      const supabase = getSupabase();
      if (isDemo) {
        if (supabase) {
          const { data, error } = await supabase.from("products").select("*");
          if (error) {
            console.error("Failed to refresh products:", error);
            setProducts(db.getProducts());
            return;
          }
          if (data) setProducts(data as Product[]);
          else setProducts(db.getProducts());
        } else {
          setProducts(db.getProducts());
        }
      } else if (supabase) {
        const { data, error } = await supabase.from("products").select("*");
        if (error) {
          console.error("Failed to refresh products:", error);
          showToast("პროდუქტების ჩატვირთვა ვერ მოხერხდა", "error");
          return;
        }
        if (data) setProducts(data as Product[]);
      }
    } catch (error) {
      console.error("Unexpected error refreshing products:", error);
      if (isDemo) {
        setProducts(db.getProducts());
      } else {
        showToast("პროდუქტების ჩატვირთვა ვერ მოხერხდა", "error");
      }
    }
  }, [isDemo, showToast]);

  const refreshOrders = useCallback(async () => {
    try {
      const supabase = getSupabase();
      if (isDemo) {
        setOrders(db.getOrders());
      } else if (supabase) {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("createdAt", { ascending: false });
        if (error) {
          console.error("Failed to refresh orders:", error);
          showToast("შეკვეთების ჩატვირთვა ვერ მოხერხდა", "error");
          return;
        }
        if (data) setOrders(data as Order[]);
      }
    } catch (error) {
      console.error("Unexpected error refreshing orders:", error);
      if (isDemo) {
        setOrders(db.getOrders());
      } else {
        showToast("შეკვეთების ჩატვირთვა ვერ მოხერხდა", "error");
      }
    }
  }, [isDemo, showToast]);

  const refreshUsers = useCallback(async () => {
    try {
      const supabase = getSupabase();
      if (isDemo) {
        setUsers(db.getUsers());
      } else if (supabase) {
        const { data, error } = await supabase.from("users").select("*");
        if (error) {
          console.error("Failed to refresh users:", error);
          showToast("მომხმარებლების ჩატვირთვა ვერ მოხერხდა", "error");
          return;
        }
        if (data) setUsers(data as User[]);
      }
    } catch (error) {
      console.error("Unexpected error refreshing users:", error);
      if (isDemo) {
        setUsers(db.getUsers());
      } else {
        showToast("მომხმარებლების ჩატვირთვა ვერ მოხერხდა", "error");
      }
    }
  }, [isDemo, showToast]);

  const refreshData = useCallback(async () => {
    const supabase = getSupabase();
    setIsLoadingData(true);

    try {
      if (isDemo) {
        // Demo mode: Real products from Supabase, mock orders
        if (supabase) {
          try {
            // Use Promise.allSettled for error isolation
            const results = await Promise.allSettled([
              supabase.from("products").select("*"),
              supabase.from("categories").select("*"),
              supabase.from("units").select("*"),
            ]);

            // Products
            if (results[0].status === "fulfilled" && results[0].value.data) {
              setProducts(results[0].value.data as Product[]);
            } else {
              setProducts(db.getProducts());
            }

            // Categories
            if (results[1].status === "fulfilled") {
              const catData = (results[1].value as { data: Array<{ name: string }> | null })?.data;
              if (catData?.length && catData.length > 0) {
                setCategories(catData.map((c) => c.name));
              } else {
                setCategories(db.getCategories());
              }
            } else {
              setCategories(db.getCategories());
            }

            // Units
            if (results[2].status === "fulfilled") {
              const unitData = (results[2].value as { data: Array<{ name: string }> | null })?.data;
              if (unitData?.length && unitData.length > 0) {
                setUnits(unitData.map((u) => u.name));
              } else {
                setUnits(db.getUnits());
              }
            } else {
              setUnits(db.getUnits());
            }
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
        setOrders(db.getOrders());
        setUsers(db.getUsers());
        return;
      }

      // Production mode: All data from Supabase with error isolation
      if (supabase && user) {
        const results = await Promise.allSettled([
          supabase.from("products").select("*"),
          supabase.from("orders").select("*").order("createdAt", { ascending: false }),
          supabase.from("users").select("*"),
          supabase.from("units").select("*"),
          supabase.from("categories").select("*"),
        ]);

        // Products
        if (results[0].status === "fulfilled" && results[0].value.data) {
          setProducts(results[0].value.data as Product[]);
        }

        // Orders
        if (results[1].status === "fulfilled" && results[1].value.data) {
          setOrders(results[1].value.data as any);
        }

        // Users
        if (results[2].status === "fulfilled" && results[2].value.data) {
          setUsers(results[2].value.data as User[]);
        }

        // Units
        if (results[3].status === "fulfilled") {
          const unitData = (results[3].value as { data: Array<{ name: string }> | null })?.data;
          if (unitData?.length && unitData.length > 0) {
            setUnits(unitData.map((u) => u.name));
          } else {
            setUnits(db.getUnits());
          }
        } else {
          setUnits(db.getUnits());
        }

        // Categories
        if (results[4].status === "fulfilled") {
          const catData = (results[4].value as { data: Array<{ name: string }> | null })?.data;
          if (catData?.length && catData.length > 0) {
            setCategories(catData.map((c) => c.name));
          } else {
            setCategories(db.getCategories());
          }
        } else {
          setCategories(db.getCategories());
        }

        // Log any failures for debugging
        results.forEach((result, idx) => {
          if (result.status === "rejected") {
            const tables = ["products", "orders", "users", "units", "categories"];
            console.warn(`Failed to fetch ${tables[idx]}:`, result.reason);
          }
        });
      }
    } finally {
      setIsLoadingData(false);
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

    let retryCount = 0;
    const maxRetries = 10;
    let retryTimeout: NodeJS.Timeout | null = null;
    let hasShownError = false;
    let isUnmounting = false;
    let currentChannel: ReturnType<typeof supabase.channel> | null = null;

    const subscribeToOrders = () => {
      if (isUnmounting) return null;

      // Remove existing channel before creating new one
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
        currentChannel = null;
      }

      const channel = supabase
        .channel('orders-realtime-' + Date.now()) // Unique channel name for reconnection
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            if (isUnmounting) return;
            console.log('Realtime order update:', payload.eventType);
            if (payload.eventType === 'INSERT') {
              const newOrder = payload.new as Order;
              setOrders((prev) => {
                const existingIndex = prev.findIndex((o) => o.id === newOrder.id);
                if (existingIndex !== -1) {
                  const updated = [...prev];
                  updated[existingIndex] = newOrder;
                  return updated;
                }
                return [newOrder, ...prev];
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedOrder = payload.new as Order;
              setOrders((prev) => {
                const existingIndex = prev.findIndex((o) => o.id === updatedOrder.id);
                if (existingIndex === -1) {
                  return [updatedOrder, ...prev];
                }
                const updated = [...prev];
                updated[existingIndex] = updatedOrder;
                return updated;
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedOrder = payload.old as Order;
              setOrders((prev) => prev.filter((o) => o.id !== deletedOrder.id));
            }
          }
        )
        .subscribe((status, err) => {
          if (isUnmounting) return;

          if (status === 'SUBSCRIBED') {
            console.log('Realtime orders subscription active');
            retryCount = 0;
            hasShownError = false;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || err) {
            console.error('Realtime subscription error:', status, err);

            if (retryCount < maxRetries) {
              retryCount++;
              const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30s
              console.log(`Retrying realtime connection in ${delay}ms (attempt ${retryCount}/${maxRetries})`);

              retryTimeout = setTimeout(() => {
                if (!isUnmounting) {
                  subscribeToOrders();
                }
              }, delay);
            } else {
              // After max retries, show warning once and continue retrying silently every 2 minutes
              if (!hasShownError) {
                hasShownError = true;
                console.warn('Max realtime retries reached, continuing with 2-minute interval');
                setToasts((prev) => [...prev, {
                  id: Date.now().toString(),
                  message: "კავშირი დროებით შეფერხდა - ავტომატურად აღდგება",
                  type: "info"
                }]);
              }
              // Continue retrying every 2 minutes silently
              retryTimeout = setTimeout(() => {
                if (!isUnmounting) {
                  subscribeToOrders();
                }
              }, 120000);
            }
          } else if (status === 'CLOSED') {
            console.log('Realtime channel closed');
          }
        });

      currentChannel = channel;
      return channel;
    };

    subscribeToOrders();

    // Reconnect when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isUnmounting) {
        console.log('Tab visible - reconnecting realtime');
        // Reset retry state and resubscribe
        retryCount = 0;
        hasShownError = false;
        if (retryTimeout) {
          clearTimeout(retryTimeout);
          retryTimeout = null;
        }
        subscribeToOrders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isUnmounting = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (retryTimeout) clearTimeout(retryTimeout);
      if (currentChannel) supabase.removeChannel(currentChannel);
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

    // Auto-create category if it doesn't exist
    if (p.category && !categories.includes(p.category)) {
      console.log("Auto-creating new category:", p.category);
      await addCategory(p.category);
    }

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
      // Only add description if it has value
      if (p.description) {
        productForSupabase.description = p.description;
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
    } catch (err) {
      console.error("Unexpected error adding product:", err);
      const errorMessage = err instanceof Error ? err.message : "უცნობი შეცდომა";
      showToast("შეცდომა: " + errorMessage, "error");
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
    const product = products.find((p: Product) => p.id === id);
    if (!product) return;

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );

    if (isDemo) {
      db.toggleProductStatus(id);
    } else {
      const { error } = await getSupabase()
        ?.from("products")
        .update({ isActive: !product.isActive })
        .eq("id", id) || {};
      if (error) {
        // Rollback on error
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: product.isActive } : p))
        );
        showToast("სტატუსის შეცვლა ვერ მოხერხდა", "error");
      }
    }
  };

  const toggleProductPromo = async (id: string) => {
    const product = products.find((p: Product) => p.id === id);
    if (!product) return;

    const nextPromo = !product.isPromo;

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isPromo: nextPromo } : p
      )
    );

    if (isDemo) {
      db.toggleProductPromo(id);
    } else {
      const { error } = await getSupabase()
        ?.from("products")
        .update({
          isPromo: nextPromo,
          price: nextPromo ? product.price : null,
        })
        .eq("id", id) || {};
      if (error) {
        // Rollback on error
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isPromo: product.isPromo } : p))
        );
        showToast("პრომო სტატუსის შეცვლა ვერ მოხერხდა", "error");
      }
    }
  };

  const bulkProductAction = async (
    ids: string[],
    updates: Partial<Product>,
  ) => {
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (ids.includes(p.id) ? { ...p, ...updates } : p))
    );

    if (isDemo) {
      db.bulkUpdateProducts(ids, updates);
    } else {
      // Use .in() for single query instead of N queries
      const { error } = await getSupabase()
        ?.from("products")
        .update(updates)
        .in("id", ids) || {};
      if (error) {
        // Rollback on error
        refreshProducts();
        showToast("ბულკ განახლება ვერ მოხერხდა", "error");
      }
    }
  };

  const addUnit = async (unit: string) => {
    // Optimistic update - add immediately to UI
    setUnits(prev => [...prev, unit]);

    if (isDemo) {
      db.addUnit(unit);
    } else {
      const { error } = await getSupabase()?.from("units").insert({ name: unit }) || {};
      if (error) {
        // Rollback on error
        setUnits(prev => prev.filter(u => u !== unit));
        showToast("ერთეულის დამატება ვერ მოხერხდა", "error");
        return;
      }
    }
    showToast("ერთეული დაემატა", "success");
  };
  const updateUnit = async (oldUnit: string, newUnit: string) => {
    // Store original values for rollback
    const originalUnits = [...units];
    const originalProducts = [...products];

    // Optimistic update
    setUnits((prev) => prev.map((u) => (u === oldUnit ? newUnit : u)));
    setProducts((prev) =>
      prev.map((p) => (p.unit === oldUnit ? { ...p, unit: newUnit } : p))
    );

    if (isDemo) {
      db.updateUnit(oldUnit, newUnit);
      showToast("ერთეული განახლდა", "success");
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      // Rollback on error
      setUnits(originalUnits);
      setProducts(originalProducts);
      showToast("კავშირის შეცდომა", "error");
      return;
    }

    try {
      // Step 1: Update units table
      const { error: unitsError } = await supabase
        .from("units")
        .update({ name: newUnit })
        .eq("name", oldUnit);

      if (unitsError) {
        throw new Error(`Units update failed: ${unitsError.message}`);
      }

      // Step 2: Update products table
      const { error: productsError } = await supabase
        .from("products")
        .update({ unit: newUnit })
        .eq("unit", oldUnit);

      if (productsError) {
        // Rollback: revert units table change
        console.error("Products update failed, rolling back units:", productsError);
        await supabase.from("units").update({ name: oldUnit }).eq("name", newUnit);

        // Rollback local state
        setUnits(originalUnits);
        setProducts(originalProducts);
        showToast("ერთეულის განახლება ვერ მოხერხდა", "error");
        return;
      }

      showToast("ერთეული განახლდა", "success");
    } catch (error) {
      console.error("Unexpected error updating unit:", error);
      // Rollback local state
      setUnits(originalUnits);
      setProducts(originalProducts);
      showToast("ერთეულის განახლება ვერ მოხერხდა", "error");
    }
  };

  const deleteUnit = async (unit: string) => {
    // Store original for rollback
    const originalUnits = [...units];

    // Optimistic update
    setUnits((prev) => prev.filter((u) => u !== unit));

    if (isDemo) {
      db.deleteUnit(unit);
      showToast("ერთეული წაიშალა", "success");
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setUnits(originalUnits);
      showToast("კავშირის შეცდომა", "error");
      return;
    }

    try {
      const { error } = await supabase.from("units").delete().eq("name", unit);

      if (error) {
        throw error;
      }

      showToast("ერთეული წაიშალა", "success");
    } catch (error) {
      console.error("Failed to delete unit:", error);
      // Rollback local state
      setUnits(originalUnits);
      showToast("ერთეულის წაშლა ვერ მოხერხდა", "error");
    }
  };

  const addCategory = async (category: string) => {
    // Optimistic update - add immediately to UI
    setCategories(prev => [...prev, category]);

    if (isDemo) {
      db.addCategory(category);
    } else {
      const { error } = await getSupabase()?.from("categories").insert({ name: category }) || {};
      if (error) {
        // Rollback on error
        setCategories(prev => prev.filter(c => c !== category));
        showToast("კატეგორიის დამატება ვერ მოხერხდა", "error");
        return;
      }
    }
    showToast("კატეგორია დაემატა", "success");
  };
  const updateCategory = async (oldCategory: string, newCategory: string) => {
    // Store original values for rollback
    const originalCategories = [...categories];
    const originalProducts = [...products];

    // Optimistic update
    setCategories((prev) => prev.map((c) => (c === oldCategory ? newCategory : c)));
    setProducts((prev) =>
      prev.map((p) => (p.category === oldCategory ? { ...p, category: newCategory } : p))
    );

    if (isDemo) {
      db.updateCategory(oldCategory, newCategory);
      showToast("კატეგორია განახლდა", "success");
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      // Rollback on error
      setCategories(originalCategories);
      setProducts(originalProducts);
      showToast("კავშირის შეცდომა", "error");
      return;
    }

    try {
      // Step 1: Update categories table
      const { error: categoriesError } = await supabase
        .from("categories")
        .update({ name: newCategory })
        .eq("name", oldCategory);

      if (categoriesError) {
        throw new Error(`Categories update failed: ${categoriesError.message}`);
      }

      // Step 2: Update products table
      const { error: productsError } = await supabase
        .from("products")
        .update({ category: newCategory })
        .eq("category", oldCategory);

      if (productsError) {
        // Rollback: revert categories table change
        console.error("Products update failed, rolling back categories:", productsError);
        await supabase.from("categories").update({ name: oldCategory }).eq("name", newCategory);

        // Rollback local state
        setCategories(originalCategories);
        setProducts(originalProducts);
        showToast("კატეგორიის განახლება ვერ მოხერხდა", "error");
        return;
      }

      showToast("კატეგორია განახლდა", "success");
    } catch (error) {
      console.error("Unexpected error updating category:", error);
      // Rollback local state
      setCategories(originalCategories);
      setProducts(originalProducts);
      showToast("კატეგორიის განახლება ვერ მოხერხდა", "error");
    }
  };

  const deleteCategory = async (category: string) => {
    // Store original for rollback
    const originalCategories = [...categories];

    // Optimistic update
    setCategories((prev) => prev.filter((c) => c !== category));

    if (isDemo) {
      db.deleteCategory(category);
      showToast("კატეგორია წაიშალა", "success");
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setCategories(originalCategories);
      showToast("კავშირის შეცდომა", "error");
      return;
    }

    try {
      const { error } = await supabase.from("categories").delete().eq("name", category);

      if (error) {
        throw error;
      }

      showToast("კატეგორია წაიშალა", "success");
    } catch (error) {
      console.error("Failed to delete category:", error);
      // Rollback local state
      setCategories(originalCategories);
      showToast("კატეგორიის წაშლა ვერ მოხერხდა", "error");
    }
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
    // Optimistic update
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? { ...order, status, ...(driver ? { driverId: driver } : {}) }
          : order
      )
    );

    if (isDemo) {
      db.updateOrderStatus(id, status, driver);
      showToast("სტატუსი განახლდა", "success");
    } else {
      const supabase = getSupabase();
      if (!supabase) {
        refreshOrders(); // Rollback
        showToast("სტატუსის შეცვლა ვერ მოხერხდა", "error");
        return;
      }

      const updates: { status: OrderStatus; driverId?: string } = { status };
      if (driver) updates.driverId = driver;

      const { error } = await supabase.from("orders").update(updates).eq("id", id);

      if (error) {
        refreshOrders(); // Rollback on error
        showToast("სტატუსის შეცვლა ვერ მოხერხდა", "error");
        return;
      }
      showToast("სტატუსი განახლდა", "success");
    }
  };
  const updateOrderPricing = async (id: string, items: OrderItem[]) => {
    const totalCost = items.reduce(
      (acc, i) => acc + (i.sellPrice || 0) * i.quantity,
      0,
    );
    const totalProfit = items.reduce(
      (acc, i) =>
        acc + ((i.sellPrice || 0) - (i.costPrice || 0)) * i.quantity,
      0,
    );

    // Optimistic update
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, items, totalCost, totalProfit } : order
      )
    );

    if (isDemo) {
      db.updateOrderPricing(id, items);
    } else {
      const { error } = await getSupabase()
        ?.from("orders")
        .update({ items, totalCost, totalProfit })
        .eq("id", id) || {};

      if (error) {
        refreshOrders(); // Rollback on error
        showToast("ფასების შენახვა ვერ მოხერხდა", "error");
        return;
      }
    }
    showToast(t("orders.order_updated"), "success");
  };

  // Update costPrice for a product across all CONFIRMED orders
  const updateProductCostPrice = async (productId: string, costPrice: number) => {
    const confirmedOrders = orders.filter(o => o.status === OrderStatus.CONFIRMED);
    const ordersToUpdate = confirmedOrders.filter(order =>
      order.items.some(item => item.productId === productId)
    );

    if (ordersToUpdate.length === 0) {
      showToast(`თვითღირებულება განახლდა: ${costPrice}₾`, "success");
      return;
    }

    // Optimistic update - update UI immediately
    setOrders((prev) =>
      prev.map((order) => {
        if (order.status !== OrderStatus.CONFIRMED) return order;
        const hasProduct = order.items.some(item => item.productId === productId);
        if (!hasProduct) return order;

        return {
          ...order,
          items: order.items.map(item =>
            item.productId === productId ? { ...item, costPrice } : item
          ),
        };
      })
    );

    showToast(`თვითღირებულება განახლდა: ${costPrice}₾`, "success");

    // Background update to database
    if (isDemo) {
      ordersToUpdate.forEach((order) => {
        const updatedItems = order.items.map(item =>
          item.productId === productId ? { ...item, costPrice } : item
        );
        db.updateOrderPricing(order.id, updatedItems);
      });
    } else {
      // Update all orders in parallel (not sequentially)
      const updatePromises = ordersToUpdate.map((order) => {
        const updatedItems = order.items.map(item =>
          item.productId === productId ? { ...item, costPrice } : item
        );
        return getSupabase()
          ?.from("orders")
          .update({ items: updatedItems })
          .eq("id", order.id);
      });

      // Wait for all updates in parallel
      const results = await Promise.allSettled(updatePromises);
      const failures = results.filter(r => r.status === "rejected");
      if (failures.length > 0) {
        console.warn("Some cost price updates failed:", failures);
        // Refresh to sync with server state on error
        refreshOrders();
      }
    }
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

    // Optimistic update
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? {
              ...order,
              items: updatedItems,
              totalCost: totalCost > 0 ? totalCost : order.totalCost,
              totalProfit: totalProfit > 0 ? totalProfit : order.totalProfit,
            }
          : order
      )
    );

    if (isDemo) {
      db.updateOrderPricing(id, updatedItems);
    } else {
      const { error } = await getSupabase()
        ?.from("orders")
        .update({
          items: updatedItems,
          totalCost: totalCost > 0 ? totalCost : undefined,
          totalProfit: totalProfit > 0 ? totalProfit : undefined
        })
        .eq("id", id) || {};

      if (error) {
        refreshOrders(); // Rollback on error
        showToast("შეკვეთის განახლება ვერ მოხერხდა", "error");
        return;
      }
    }
    showToast(t("orders.order_updated"), "success");
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    users,
    products,
    orders,
    units,
    categories,
    theme,
    config,
    isDemo,
    isLoadingData,
    toggleTheme,
    login,
    logout,
    refreshData,
    refreshProducts,
    refreshOrders,
    refreshUsers,
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
  }), [
    user, users, products, orders, units, categories, theme, config, isDemo, isLoadingData,
    toggleTheme, login, logout, refreshData, refreshProducts, refreshOrders, refreshUsers, saveConfig,
    addProduct, updateProduct, deleteProduct, toggleProductStatus, toggleProductPromo, bulkProductAction,
    addUnit, updateUnit, deleteUnit, addCategory, updateCategory, deleteCategory,
    addUser, updateUser, updateUserStatus, deleteUser,
    createOrder, updateOrderStatus, updateOrderPricing, updateProductCostPrice, updateOrderItems,
    showToast
  ]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <AppContext.Provider value={contextValue}>
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
    <ErrorBoundary>
      <AppProvider>
        <HashRouter>
          <Routes>
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/*" element={<AppLoader />} />
          </Routes>
        </HashRouter>
      </AppProvider>
    </ErrorBoundary>
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
