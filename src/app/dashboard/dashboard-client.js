"use client";

import Footer from "@/components/Footer";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  User,
  ChevronDown,
  LogOut,
  LayoutGrid,
  Tag,
  Star,
  Sparkles,
  Truck,
  ArrowRight,
  BadgeCheck,
  Check,
  Shirt,
  Footprints,
  Watch,
  SprayCan,
} from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { showToast } from "@/lib/adminUi";

export default function DashboardClient({
  profile,
  products = [],
  categories = [],
  slides = [],
}) {
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");

  const ref = useRef(null);
  const productsSectionRef = useRef(null);

  const username = profile?.username || "User";

  /*
    IMPORTANT:
    DashboardClient.js hadda sawir default ah ma keensanayo.
    Sawirka hero waxaa laga keenayaa admin slides oo keliya.
    Haddii admin image_url geliyo -> wuu muuqanayaa.
    Haddii admin image_url ka tago madhan -> black/gold clean background ayuu noqonayaa.
  */
  const fallbackSlide = {
    title: "Premium Men's Fashion",
    subtitle:
      "Discover premium clothes, shoes, perfumes, and accessories with a smooth shopping experience.",
    button_text: "Shop Now",
    category: "New Dubai Fashion Style",
    image_url: "/images/stylish-men-fashion.jpg",
  };

  /*
    Halkan waxaan ka saarnay active_slide khasabka ahaa.
    Hadda dashboard-ku wuxuu qaadanayaa slide-kii ugu dambeeyay ee is_active = true.
    Haddii kii ugu dambeeyay la delete gareeyo, kii xiga ayaa muuqanaya.
  */
  const latestHeroSlide = useMemo(() => {
    const validSlides = (slides || [])
      .filter((slide) => {
        if (!slide) return false;
        if (slide.is_active === false) return false;
        return true;
      })
      .sort((a, b) => {
        const bTime = new Date(b?.created_at || 0).getTime();
        const aTime = new Date(a?.created_at || 0).getTime();
        return bTime - aTime;
      });

    return validSlides[0] || fallbackSlide;
  }, [slides]);

  const heroTitle = latestHeroSlide?.title?.trim() || fallbackSlide.title;
  const heroSubtitle =
    latestHeroSlide?.subtitle?.trim() || fallbackSlide.subtitle;
  const heroButton =
    latestHeroSlide?.button_text?.trim() || fallbackSlide.button_text;
  const heroCategory =
    latestHeroSlide?.category?.trim() || fallbackSlide.category;

  const heroImage =
    latestHeroSlide?.image_url && latestHeroSlide.image_url.trim() !== ""
      ? latestHeroSlide.image_url.trim()
      : "";

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadCartCount() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("user_id", user.id);

    if (error) return;

    const totalQty = (data || []).reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

    setCartCount(totalQty);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadCartCount();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      productsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  const filteredProducts = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return (products || []).filter((product) => {
      const name = (product?.name || "").toLowerCase();
      const category = (product?.category || "").toLowerCase();
      const description = (product?.description || "").toLowerCase();

      const matchesSearch =
        searchText === "" ||
        name.includes(searchText) ||
        category.includes(searchText) ||
        description.includes(searchText);

      const matchesCategory =
        activeCategory === "all" ||
        (product?.category || "").toLowerCase() ===
          activeCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, search, activeCategory]);

  function getCategoryIcon(categoryName) {
    const name = (categoryName || "").toLowerCase();

    if (name.includes("cloth")) return Shirt;
    if (name.includes("shirt")) return Shirt;
    if (name.includes("shoe")) return Footprints;
    if (name.includes("access")) return Watch;
    if (name.includes("watch")) return Watch;
    if (name.includes("perfume")) return SprayCan;

    return Tag;
  }

  return (
    <div className="min-h-screen bg-[#fffdf7]">
      {/* HEADER */}
      <header className="sticky top-0 z-[99999] border-b border-black/10 bg-black text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:flex-nowrap md:gap-4 md:px-6">
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-yellow-500 text-xl font-bold text-yellow-400">
              ND
            </div>

            <div>
              <h1 className="text-2xl font-bold text-yellow-400">New Dubai</h1>
              <p className="text-xs text-zinc-300">Men Fashion Shop</p>
            </div>
          </div>

          <div className="order-3 w-full md:order-none md:mx-3 md:flex-1">
            <div className="flex items-center rounded-full bg-white px-4 py-3 shadow-sm">
              <Search className="text-black" size={18} />
              <input
                type="text"
                placeholder="Search products, brands and more..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="ml-3 w-full bg-transparent text-black outline-none placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              href="/cart"
              className="relative flex items-center gap-2 rounded-2xl border border-yellow-500 px-4 py-3 text-yellow-400 transition hover:bg-yellow-500 hover:text-black"
            >
              <ShoppingCart size={18} />
              <span className="hidden md:inline">Cart</span>

              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white shadow-md">
                  {cartCount}
                </span>
              )}
            </Link>

            <div ref={ref} className="relative">
              <button
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-2xl bg-yellow-500 px-3 py-3 text-sm font-semibold text-black transition hover:opacity-90 sm:px-4"
              >
                <User size={16} />
                <span className="max-w-[74px] truncate sm:max-w-[90px]">{username}</span>
                <ChevronDown
                  size={16}
                  className={`transition ${open ? "rotate-180" : ""}`}
                />
              </button>

              {open && (
                <div style={accountStyles.panel}>
                  <div style={accountStyles.top}>
                    <div style={accountStyles.userRow}>
                      <div style={accountStyles.avatar}>
                        {username?.charAt(0)?.toUpperCase() || "U"}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <h3 style={accountStyles.name}>{username}</h3>
                        <p style={accountStyles.email}>
                          {profile?.email ||
                            profile?.phone ||
                            "New Dubai Customer"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        style={accountStyles.closeBtn}
                      >
                        ×
                      </button>
                    </div>

                    <div style={accountStyles.statusBox}>
                      <p style={accountStyles.statusLabel}>ACCOUNT STATUS</p>
                      <div style={accountStyles.statusText}>
                        <BadgeCheck size={16} />
                        Active customer account
                      </div>
                    </div>
                  </div>

                  <div style={accountStyles.body}>
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      style={accountStyles.menuItem}
                    >
                      <span style={accountStyles.menuLeft}>
                        <User size={17} />
                        My Account
                      </span>
                      <ArrowRight size={15} />
                    </Link>

                    <Link
                      href="/cart"
                      onClick={() => setOpen(false)}
                      style={accountStyles.menuItem}
                    >
                      <span style={accountStyles.menuLeft}>
                        <ShoppingCart size={17} />
                        My Cart
                      </span>

                      <span style={accountStyles.cartBadge}>{cartCount}</span>
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() => setOpen(false)}
                      style={accountStyles.menuItem}
                    >
                      <span style={accountStyles.menuLeft}>
                        <Truck size={17} />
                        My Orders
                      </span>
                      <ArrowRight size={15} />
                    </Link>

                    <Link
                      href="/orders/track"
                      onClick={() => setOpen(false)}
                      style={accountStyles.menuItem}
                    >
                      <span style={accountStyles.menuLeft}>
                        <BadgeCheck size={17} />
                        Track Order
                      </span>
                      <ArrowRight size={15} />
                    </Link>

                    <div style={accountStyles.orderBox}>
                      <div style={accountStyles.orderTop}>
                        <strong>Latest Order</strong>
                        <span style={accountStyles.trackingBadge}>
                          Tracking
                        </span>
                      </div>

                      <p style={accountStyles.orderText}>
                        Track your order status: Pending, Processing, Shipped or
                        Delivered.
                      </p>

                      <Link
                        href="/orders"
                        onClick={() => setOpen(false)}
                        style={accountStyles.viewBtn}
                      >
                        View Orders <ArrowRight size={13} />
                      </Link>
                    </div>

                    <form action="/auth/signout" method="post">
                      <button type="submit" style={accountStyles.logoutBtn}>
                        <LogOut size={17} />
                        Logout
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TOP MINI MENU */}
        <div className="shadow-[0_-1px_0_rgba(255,255,255,0.06)]">
          <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 py-3 text-sm font-semibold md:px-6">
            <span className="shrink-0 text-yellow-400">New Arrivals</span>
            <span className="shrink-0 text-white">Clothes</span>
            <span className="shrink-0 text-white">Shoes</span>
            <span className="shrink-0 text-white">Accessories</span>
            <span className="shrink-0 text-white">Perfume</span>
            <span className="shrink-0 text-white">Watches</span>
            <span className="shrink-0 text-white">Sale</span>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section style={heroStyles.section}>
        <div style={heroStyles.container}>
          <div style={heroStyles.heroCard}>
            <div
              style={{
                ...heroStyles.bgImage,
                backgroundImage: heroImage
                  ? `linear-gradient(90deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.88) 45%, rgba(0,0,0,0.50) 100%), url("${heroImage}")`
                  : "radial-gradient(circle at 15% 20%, rgba(245,164,0,0.14), transparent 28%), linear-gradient(135deg, #000000 0%, #070707 45%, #111111 100%)",
              }}
            />

            <div style={heroStyles.content}>
              <div style={heroStyles.textBox}>
                <div style={heroStyles.badge}>
                  <Sparkles size={16} />
                  {heroCategory || "New Dubai Fashion Style"}
                </div>

                <h1 style={heroStyles.heroTitle}>
                  {heroTitle}
                  <span style={heroStyles.goldTitle}>
                    {heroCategory || "New Dubai Fashion Style"}
                  </span>
                </h1>

                <p style={heroStyles.heroSubtitle}>{heroSubtitle}</p>

                <div style={heroStyles.buttons}>
                  <Link href="#products" style={heroStyles.primaryBtn}>
                    {heroButton || "Shop Now"}
                    <ArrowRight size={18} />
                  </Link>

                  <Link href="#categories" style={heroStyles.secondaryBtn}>
                    Explore Collection
                    <ArrowRight size={18} />
                  </Link>
                </div>

                <div style={heroStyles.features}>
                  <div style={heroStyles.featureCard}>
                    <BadgeCheck size={28} color="#f5a400" />
                    <div>
                      <h3 style={heroStyles.featureTitle}>Premium Quality</h3>
                      <p style={heroStyles.featureText}>
                        Carefully selected products for exceptional style.
                      </p>
                    </div>
                  </div>

                  <div style={heroStyles.featureCard}>
                    <Truck size={28} color="#f5a400" />
                    <div>
                      <h3 style={heroStyles.featureTitle}>Fast Delivery</h3>
                      <p style={heroStyles.featureText}>
                        Reliable and secure delivery to your door.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section
        id="categories"
        className="mx-auto max-w-7xl px-4 pb-8 pt-8 md:px-6"
      >
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-yellow-700">
              Collections
            </p>
            <h3 className="text-2xl font-bold text-black">Shop by Category</h3>
          </div>
          <p className="text-sm text-zinc-500">
            Explore our premium collections
          </p>
        </div>

        <div className="flex gap-3 overflow-x-auto rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm">
          <button
            onClick={() => setActiveCategory("all")}
            className={`flex shrink-0 items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold shadow-sm transition duration-300 ${
              activeCategory === "all"
                ? "border-black bg-black text-yellow-400"
                : "border-zinc-200 bg-zinc-50 text-black hover:border-yellow-500 hover:bg-yellow-500 hover:text-black"
            }`}
          >
            <LayoutGrid size={18} />
            all
          </button>

          {categories.map((category) => {
            const CategoryIcon = getCategoryIcon(category.name);

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.name)}
                className={`flex shrink-0 items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold shadow-sm transition duration-300 ${
                  activeCategory.toLowerCase() ===
                  (category.name || "").toLowerCase()
                    ? "border-black bg-black text-yellow-400"
                    : "border-zinc-200 bg-zinc-50 text-black hover:border-yellow-500 hover:bg-yellow-500 hover:text-black"
                }`}
              >
                <CategoryIcon size={18} />
                {category.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* PRODUCTS */}
      <section
        id="products"
        ref={productsSectionRef}
        className="mx-auto max-w-7xl px-4 pb-16 md:px-6"
      >
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-yellow-700">
              Featured
            </p>
            <h3 className="text-2xl font-bold text-black">Premium Products</h3>
          </div>
          <p className="text-sm text-zinc-500">
            {filteredProducts.length} product
            {filteredProducts.length === 1 ? "" : "s"} found
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
              <Search size={26} />
            </div>
            <h4 className="mt-4 text-2xl font-bold text-black">
              No products found
            </h4>
            <p className="mt-2 text-zinc-500">
              Try another search or choose a different category.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("all");
              }}
              className="mt-5 rounded-2xl bg-black px-5 py-3 font-semibold text-yellow-400 hover:opacity-90"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                supabase={supabase}
                setCartCount={setCartCount}
                product={product}
              />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

const heroStyles = {
  section: {
    background: "#000",
    padding: "24px 18px 38px",
    color: "#fff",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "1280px",
    margin: "0 auto",
  },

  heroCard: {
    position: "relative",
    minHeight: "520px",
    borderRadius: "34px",
    overflow: "hidden",
    background: "#070707",
    border: "1px solid rgba(245,164,0,0.28)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
  },

  bgImage: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },

  content: {
    position: "relative",
    zIndex: 2,
    minHeight: "520px",
    display: "flex",
    alignItems: "center",
    padding: "52px",
    boxSizing: "border-box",
  },

  textBox: {
    maxWidth: "760px",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid rgba(245,164,0,0.55)",
    background: "rgba(0,0,0,0.55)",
    color: "#f5a400",
    padding: "9px 16px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "900",
    marginBottom: "18px",
  },

  heroTitle: {
    margin: 0,
    color: "#fff",
    fontSize: "56px",
    lineHeight: "64px",
    fontWeight: "950",
    letterSpacing: "0",
    textShadow: "0 12px 30px rgba(0,0,0,0.65)",
  },

  goldTitle: {
    display: "block",
    color: "#f5a400",
    marginTop: "4px",
  },

  heroSubtitle: {
    margin: "22px 0 0",
    maxWidth: "680px",
    color: "#e5e7eb",
    fontSize: "17px",
    lineHeight: "30px",
    fontWeight: "650",
  },

  buttons: {
    marginTop: "30px",
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
  },

  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    background: "#f5a400",
    color: "#000",
    textDecoration: "none",
    padding: "15px 24px",
    borderRadius: "16px",
    fontWeight: "950",
    boxShadow: "0 18px 35px rgba(245,164,0,0.25)",
  },

  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    background: "rgba(0,0,0,0.45)",
    color: "#f5a400",
    border: "1px solid rgba(245,164,0,0.55)",
    textDecoration: "none",
    padding: "15px 24px",
    borderRadius: "16px",
    fontWeight: "900",
  },

  features: {
    marginTop: "36px",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
    maxWidth: "720px",
  },

  featureCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    border: "1px solid rgba(245,164,0,0.28)",
    background: "rgba(0,0,0,0.58)",
    borderRadius: "22px",
    padding: "18px",
    backdropFilter: "blur(8px)",
  },

  featureTitle: {
    margin: 0,
    color: "#fff",
    fontSize: "16px",
    fontWeight: "950",
  },

  featureText: {
    margin: "6px 0 0",
    color: "#d4d4d8",
    fontSize: "13px",
    lineHeight: "21px",
    fontWeight: "650",
  },
};

const accountStyles = {
  panel: {
    position: "absolute",
    top: "calc(100% + 12px)",
    right: "0",
    width: "330px",
    maxWidth: "92vw",
    maxHeight: "calc(100vh - 120px)",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "26px",
    border: "1px solid rgba(245, 164, 0, 0.35)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.50)",
    zIndex: 999999,
    fontFamily: "Arial, sans-serif",
  },

  top: {
    background:
      "linear-gradient(135deg, #000000 0%, #111111 55%, #050505 100%)",
    padding: "18px",
    color: "#ffffff",
  },

  userRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "#f5a400",
    color: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "900",
    border: "1px solid rgba(255,255,255,0.25)",
    flexShrink: 0,
  },

  name: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "900",
    color: "#fff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "185px",
  },

  email: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#bdbdbd",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "190px",
  },

  closeBtn: {
    marginLeft: "auto",
    width: "34px",
    height: "34px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: "22px",
    fontWeight: "800",
    cursor: "pointer",
    lineHeight: "30px",
  },

  statusBox: {
    marginTop: "14px",
    borderRadius: "18px",
    border: "1px solid rgba(245,164,0,0.25)",
    background: "rgba(245,164,0,0.12)",
    padding: "12px",
  },

  statusLabel: {
    margin: 0,
    color: "#f5a400",
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: "0.7px",
  },

  statusText: {
    marginTop: "7px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "800",
  },

  body: {
    padding: "12px",
    background: "#ffffff",
  },

  menuItem: {
    height: "48px",
    borderRadius: "16px",
    border: "1px solid #eeeeee",
    background: "#fafafa",
    color: "#111",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 14px",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "900",
  },

  menuLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#111",
  },

  cartBadge: {
    minWidth: "28px",
    height: "24px",
    borderRadius: "999px",
    background: "#000",
    color: "#f5a400",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "900",
  },

  orderBox: {
    marginTop: "6px",
    marginBottom: "10px",
    borderRadius: "18px",
    border: "1px solid #fde68a",
    background: "#fffbeb",
    padding: "14px",
  },

  orderTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#111",
    fontSize: "14px",
  },

  trackingBadge: {
    borderRadius: "999px",
    background: "#f5a400",
    color: "#000",
    padding: "5px 10px",
    fontSize: "11px",
    fontWeight: "900",
  },

  orderText: {
    margin: "9px 0 12px",
    color: "#555",
    fontSize: "12px",
    lineHeight: "18px",
    fontWeight: "700",
  },

  viewBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    height: "34px",
    padding: "0 13px",
    borderRadius: "12px",
    background: "#000",
    color: "#f5a400",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: "900",
  },

  logoutBtn: {
    width: "100%",
    height: "46px",
    borderRadius: "16px",
    border: "1px solid #fecaca",
    background: "#fee2e2",
    color: "#991b1b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "900",
    cursor: "pointer",
  },
};

function ProductCard({ supabase, setCartCount, product }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const price = Number(product.price || 0);
  const oldPrice = price + 10;
  const stock = Number(product.stock || 12);
  const isLowStock = stock > 0 && stock <= 5;

  const ratingValue = Math.max(0, Math.min(5, Number(product.rating || 4)));
  const [userRating, setUserRating] = useState(ratingValue);

  function handleStarClick(e, starNumber) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftHalf = clickX < rect.width / 2;

    const selectedRating = isLeftHalf ? starNumber - 0.5 : starNumber;
    setUserRating(selectedRating);
  }

  function renderRatingStar(starNumber) {
    if (userRating >= starNumber) {
      return (
        <Star
          size={20}
          style={{
            fill: "#facc15",
            color: "#facc15",
            display: "block",
          }}
        />
      );
    }

    if (userRating >= starNumber - 0.5) {
      return (
        <span
          style={{
            position: "relative",
            width: "20px",
            height: "20px",
            display: "inline-block",
            flexShrink: 0,
          }}
        >
          <Star
            size={20}
            style={{
              color: "#d4d4d8",
              display: "block",
            }}
          />

          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "10px",
              height: "20px",
              overflow: "hidden",
              display: "block",
            }}
          >
            <Star
              size={20}
              style={{
                fill: "#facc15",
                color: "#facc15",
                display: "block",
              }}
            />
          </span>
        </span>
      );
    }

    return (
      <Star
        size={20}
        style={{
          color: "#d4d4d8",
          display: "block",
        }}
      />
    );
  }

  async function handleAddToCart() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      showToast("Fadlan login samee.", "error");
      return;
    }

    const { data: existingItem, error: existingError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();

    if (existingError) {
      showToast(existingError.message, "error");
      return;
    }

    let writeError = null;

    if (existingItem) {
      const { error } = await supabase
        .from("cart_items")
        .update({
          quantity: Number(existingItem.quantity) + Number(quantity),
          rating: userRating,
        })
        .eq("id", existingItem.id);

      writeError = error;
    } else {
      const { error } = await supabase.from("cart_items").insert({
        user_id: user.id,
        product_id: product.id,
        quantity: Number(quantity),
        rating: userRating,
      });

      writeError = error;
    }

    if (writeError) {
      showToast(writeError.message, "error");
      return;
    }

    const { data: updatedCart, error: cartError } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("user_id", user.id);

    if (!cartError) {
      const totalQty = (updatedCart || []).reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );
      setCartCount(totalQty);
    }

    setAdded(true);
    showToast("Added to cart.");
    setTimeout(() => setAdded(false), 1800);
  }

  function decreaseQty() {
    setQuantity((prev) => Math.max(1, prev - 1));
  }

  function increaseQty() {
    setQuantity((prev) => Math.min(10, prev + 1));
  }

  return (
    <div className="group flex h-full min-h-[520px] flex-col rounded-[22px] border border-zinc-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-500/10 sm:min-h-[560px] sm:rounded-[28px] sm:p-6">
      <div className="mb-5 flex justify-center">
        <span className="rounded-full bg-yellow-100 px-6 py-2 text-sm font-bold text-yellow-700 transition group-hover:bg-black group-hover:text-yellow-400">
          Best Choice
        </span>
      </div>

      <div
        className="relative mx-auto mb-5 flex w-full max-w-[210px] flex-none items-center justify-center overflow-hidden rounded-[20px] border border-zinc-200 bg-zinc-100 sm:rounded-[24px]"
        style={{ aspectRatio: "1 / 1" }}
      >
        <span className="absolute left-3 top-3 z-10 rounded-full bg-black/80 px-3 py-1 text-xs font-bold text-yellow-400">
          New
        </span>
        <img
          src={product.image_url || "/images/t-shirts.jpg"}
          alt={product.name}
          className="block transition duration-500 group-hover:scale-110"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
      </div>

      <p className="text-sm font-medium text-yellow-700">
        {product.category || "Accessories"}
      </p>

      <h3 className="mt-2 min-h-[56px] line-clamp-2 text-[22px] font-bold leading-7 text-black">
        {product.name}
      </h3>

      <div
        style={{
          marginTop: "10px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          height: "24px",
        }}
      >
        {[1, 2, 3, 4, 5].map((starNumber) => (
          <button
            key={starNumber}
            type="button"
            onClick={(e) => handleStarClick(e, starNumber)}
            aria-label={`Rate ${starNumber} star`}
            title="Click left side for half star, right side for full star"
            style={{
              width: "22px",
              height: "22px",
              padding: 0,
              margin: 0,
              border: "none",
              background: "transparent",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            {renderRatingStar(starNumber)}
          </button>
        ))}

        <span
          style={{
            marginLeft: "6px",
            fontSize: "14px",
            fontWeight: "700",
            color: "#71717a",
            lineHeight: "20px",
            whiteSpace: "nowrap",
          }}
        >
          ({userRating.toFixed(1)})
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-[22px] font-extrabold text-black">
          ${price.toFixed(2)}
        </span>
        <span className="text-lg text-zinc-400 line-through">
          ${oldPrice.toFixed(2)}
        </span>
      </div>

      <div className="mt-3 h-7">
        {stock <= 0 ? (
          <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-600">
            Out of stock
          </span>
        ) : isLowStock ? (
          <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-600">
            Low stock left
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-600">
            In stock
          </span>
        )}
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-medium text-zinc-700">Quantity</p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            overflow: "hidden",
            borderRadius: "14px",
            border: "1px solid #d4d4d8",
            background: "#fff",
            height: "44px",
          }}
        >
          <button
            type="button"
            onClick={decreaseQty}
            style={{
              width: "48px",
              height: "44px",
              border: "none",
              background: "#fff",
              fontSize: "22px",
              fontWeight: "900",
              color: "#111",
              cursor: "pointer",
            }}
          >
            -
          </button>

          <div
            style={{
              width: "58px",
              height: "44px",
              borderLeft: "1px solid #d4d4d8",
              borderRight: "1px solid #d4d4d8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "900",
              color: "#111",
              background: "#fff",
            }}
          >
            {quantity}
          </div>

          <button
            type="button"
            onClick={increaseQty}
            style={{
              width: "48px",
              height: "44px",
              border: "none",
              background: "#fff",
              fontSize: "22px",
              fontWeight: "900",
              color: "#111",
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={stock <= 0}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[18px] font-bold transition ${
            stock <= 0
              ? "cursor-not-allowed bg-zinc-200 text-zinc-500"
              : added
              ? "bg-green-600 text-white"
              : "bg-black text-yellow-400 hover:bg-yellow-500 hover:text-black"
          }`}
        >
          {added ? (
            <>
              <Check size={20} />
              Added to Cart
            </>
          ) : stock <= 0 ? (
            "Unavailable"
          ) : (
            "Add to Cart"
          )}
        </button>
      </div>
    </div>
  );
}
