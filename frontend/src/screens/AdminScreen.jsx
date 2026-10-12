import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FolderKanban,
  HeartHandshake,
  LayoutDashboard,
  Layers3,
  LogOut,
  Moon,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Sun,
  Tag,
  TicketPercent,
  UsersRound,
  X,
} from "lucide-react";
import { api, apiMessage } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useTheme } from "@/components/reusable/ThemeProvider";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminCategories from "@/components/admin/AdminCategories";
import AdminSubcategories from "@/components/admin/AdminSubcategories";
import AdminInventory from "@/components/admin/AdminInventory";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminCustomers from "@/components/admin/AdminCustomers";
import AdminCoupons from "@/components/admin/AdminCoupons";
import AdminReviews from "@/components/admin/AdminReviews";
import AdminBanners from "@/components/admin/AdminBanners";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminSystem from "@/components/admin/AdminSystem";
import "../styles/admin/AdminScreen.css";

const primaryTabs = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "people", label: "People", icon: UsersRound },
];
const storeTabs = [
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: Layers3 },
  { id: "subcategories", label: "Subcategories", icon: FolderKanban },
  { id: "banners", label: "Banners", icon: Boxes },
  { id: "inventory", label: "Inventory", icon: ClipboardList },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "customers", label: "Customers", icon: UsersRound },
  { id: "coupons", label: "Coupons", icon: TicketPercent },
  { id: "reviews", label: "Reviews", icon: HeartHandshake },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "system", label: "System", icon: ShieldCheck },
];
const allTabs = [...primaryTabs, ...storeTabs];
const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
const number = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value) || 0);

function tabFromPath() {
  if (typeof window === "undefined") return "overview";
  const tab = window.location.pathname.split("/")[2] || "overview";
  if (tab === "dashboard") return "overview";
  return allTabs.some(({ id }) => id === tab) ? tab : "overview";
}

function extractOrders(payload) {
  if (Array.isArray(payload)) return payload;
  for (const candidate of [
    payload?.orders,
    payload?.data?.orders,
    payload?.data,
    payload?.items,
    payload?.results,
  ]) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function orderDate(order) {
  const value = order?.createdAt || order?.placedAt || order?.date;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function orderAmount(order) {
  const value =
    order?.totalAmount ??
    order?.total ??
    order?.grandTotal ??
    order?.pricing?.grandTotal ??
    order?.pricing?.total ??
    order?.totals?.grandTotal ??
    order?.totalPrice;
  return value == null || !Number.isFinite(Number(value))
    ? null
    : Number(value);
}

function latestOrders(orders) {
  return [...orders]
    .sort(
      (a, b) => (orderDate(b)?.getTime() || 0) - (orderDate(a)?.getTime() || 0),
    )
    .slice(0, 5);
}

/** Order-value trend from orders returned by the existing admin API.
 * Do not manufacture chart data when the API returns no orders.
 */
function makeMonthlyTrend(orders, period) {
  const now = new Date();
  const months = Array.from({ length: period }, (_, i) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (period - i - 1),
      1,
    );
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString("en-US", { month: "short" }),
      value: 0,
      count: 0,
    };
  });
  const byMonth = new Map(months.map((month) => [month.key, month]));
  orders.forEach((order) => {
    const date = orderDate(order);
    const total = orderAmount(order);
    if (!date || total == null) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const month = byMonth.get(key);
    if (month) {
      month.value += total;
      month.count += 1;
    }
  });
  return months;
}

function SalesChart({ orders, period }) {
  const months = useMemo(
    () => makeMonthlyTrend(orders, period),
    [orders, period],
  );
  const hasData = months.some((m) => m.count > 0);
  const width = 680;
  const height = 240;
  const paddingX = 45;
  const top = 18;
  const bottom = 204;
  const max = Math.max(...months.map((month) => month.value), 1);
  const positions = months.map((month, index) => {
    const x =
      paddingX +
      (index * (width - paddingX * 2)) / Math.max(months.length - 1, 1);
    const y = bottom - (month.value / max) * (bottom - top);
    return { x, y, ...month };
  });
  const line = positions
    .map((item, index) => `${index === 0 ? "M" : "L"}${item.x},${item.y}`)
    .join(" ");
  const area = `${line} L${positions.at(-1)?.x ?? paddingX},${bottom} L${paddingX},${bottom} Z`;

  if (!hasData) {
    return (
      <div className="adm-chart-empty">
        <BarChart3 size={33} aria-hidden="true" />
        <strong>No order trend available yet</strong>
        <p>
          Monthly order values will appear here when dated orders are returned
          by the backend.
        </p>
      </div>
    );
  }
  return (
    <svg
      className="adm-sales-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Order values for the last ${period} months, based on loaded orders`}
    >
      <defs>
        <linearGradient id={`adm-area-${period}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f45f77" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f45f77" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = bottom - ratio * (bottom - top);
        return (
          <g key={ratio}>
            <line
              x1={paddingX}
              x2={width - 15}
              y1={y}
              y2={y}
              className="adm-chart-gridline"
            />
            <text x="35" y={y + 4} textAnchor="end" className="adm-chart-axis">
              {money(max * ratio)}
            </text>
          </g>
        );
      })}
      <path d={area} fill={`url(#adm-area-${period})`} />
      <path d={line} className="adm-chart-line" />
      {positions.map((point) => (
        <g key={point.key}>
          <circle
            cx={point.x}
            cy={point.y}
            r="3.5"
            className="adm-chart-point"
          />
          <text
            x={point.x}
            y="229"
            textAnchor="middle"
            className="adm-chart-axis"
          >
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function AdminOverview({ onNavigate }) {
  const [analytics, setAnalytics] = useState(null);
  const [system, setSystem] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [analyticsError, setAnalyticsError] = useState("");
  const [period, setPeriod] = useState(6);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const results = await Promise.allSettled([
        api("/admin/analytics"),
        api("/admin/system"),
        api("/admin/orders"),
      ]);
      if (!mounted) return;
      if (results[0].status === "fulfilled") setAnalytics(results[0].value);
      else
        setAnalyticsError(
          apiMessage(results[0].reason, "Unable to load analytics"),
        );
      if (results[1].status === "fulfilled") setSystem(results[1].value);
      if (results[2].status === "fulfilled")
        setOrders(extractOrders(results[2].value));
      else
        setOrdersError(
          apiMessage(results[2].reason, "Unable to load recent orders"),
        );
      setLoading(false);
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const summary = analytics?.summary || {};
  const kpis = [
    {
      label: "Total Revenue",
      value: summary.totalRevenue == null ? "—" : money(summary.totalRevenue),
      icon: Tag,
      go: "analytics",
      hint: "From analytics",
    },
    {
      label: "Total Orders",
      value: summary.totalOrders == null ? "—" : number(summary.totalOrders),
      icon: ShoppingCart,
      go: "orders",
      hint: "Store orders",
    },
    {
      label: "Total Customers",
      value: summary.users == null ? "—" : number(summary.users),
      icon: UsersRound,
      go: "customers",
      hint: "Registered users",
    },
    {
      label: "Products",
      value: summary.products == null ? "—" : number(summary.products),
      icon: Package,
      go: "products",
      hint: "Catalog items",
    },
  ];
  const connected = Boolean(system?.database?.connected);
  const recent = latestOrders(orders);

  return (
    <div className="adm-overview">
      {analyticsError && (
        <p className="adm-notice" role="alert">
          {analyticsError}
        </p>
      )}
      <div className="adm-kpi-grid">
        {kpis.map(({ label, value, icon: Icon, go, hint }) => (
          <button
            key={label}
            className="adm-kpi"
            type="button"
            onClick={() => onNavigate(go)}
          >
            <span className="adm-kpi-icon">
              <Icon size={20} />
            </span>
            <span className="adm-kpi-content">
              <span className="adm-kpi-label">{label}</span>
              <strong>{loading ? "—" : value}</strong>
              <small>{hint}</small>
            </span>
            <ArrowUpRight size={15} className="adm-kpi-arrow" />
          </button>
        ))}
      </div>
      <div className="adm-overview-panels">
        <section
          className="adm-panel adm-sales-panel"
          aria-label="Sales overview"
        >
          <div className="adm-panel-head">
            <div>
              <h2>Sales Overview</h2>
              <p>Order value trend from loaded orders</p>
            </div>
            <select
              aria-label="Sales trend range"
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
            >
              <option value="3">Last 3 months</option>
              <option value="6">Last 6 months</option>
            </select>
          </div>
          <SalesChart orders={orders} period={period} />
          <div className="adm-sales-footer">
            <span>
              <i /> Order value
            </span>
            <small>
              {ordersError ||
                "Uses dated orders returned by the existing API; paginated results may be partial."}
            </small>
          </div>
        </section>
        <section
          className="adm-panel adm-recent-panel"
          aria-label="Recent orders"
        >
          <div className="adm-panel-head">
            <div>
              <h2>Recent Orders</h2>
              <p>Latest available orders</p>
            </div>
            <button
              className="adm-text-link"
              type="button"
              onClick={() => onNavigate("orders")}
            >
              View All <ArrowUpRight size={15} />
            </button>
          </div>
          {ordersError ? (
            <div className="adm-recent-empty">
              <span>{ordersError}</span>
            </div>
          ) : recent.length === 0 ? (
            <div className="adm-recent-empty">
              <ShoppingBag size={30} />
              <span>
                {loading
                  ? "Loading recent orders…"
                  : "No recent orders to show"}
              </span>
            </div>
          ) : (
            <div className="adm-order-list">
              {recent.map((order, index) => {
                const id = String(
                  order?.orderNumber ||
                    order?.orderId ||
                    order?._id ||
                    order?.id ||
                    `Order ${index + 1}`,
                );
                const status = String(
                  order?.orderStatus || order?.status || "Pending",
                );
                const amount = orderAmount(order);
                const when = orderDate(order);
                return (
                  <button
                    key={`${id}-${index}`}
                    className="adm-order-row"
                    type="button"
                    onClick={() => onNavigate("orders")}
                  >
                    <span className="adm-order-icon">
                      <ShoppingBag size={18} />
                    </span>
                    <span className="adm-order-info">
                      <strong>#{id.slice(-12)}</strong>
                      <small>
                        {when
                          ? when.toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Order date unavailable"}
                      </small>
                    </span>
                    <span className="adm-order-amount">
                      {amount == null ? "—" : money(amount)}
                    </span>
                    <span className="adm-order-status">
                      {status.replace(/_/g, " ")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <div className="adm-overview-bottom">
        <section className="adm-panel adm-shortcuts-panel">
          <div className="adm-panel-head">
            <div>
              <h2>Quick Actions</h2>
              <p>Manage your store</p>
            </div>
          </div>
          <div className="adm-action-grid">
            {[
              { id: "products", title: "Manage products", icon: Package },
              { id: "orders", title: "Process orders", icon: ShoppingBag },
              { id: "categories", title: "Categories", icon: Layers3 },
              { id: "coupons", title: "Coupons", icon: TicketPercent },
            ].map(({ id, title, icon: Icon }) => (
              <button key={id} type="button" onClick={() => onNavigate(id)}>
                <Icon size={18} />
                <span>{title}</span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        </section>
        <section className="adm-panel adm-health-panel">
          <div className="adm-panel-head">
            <div>
              <h2>System Health</h2>
              <p>Backend connectivity</p>
            </div>
            <ShieldCheck size={21} />
          </div>
          <div className="adm-health-status">
            <span className={`adm-health-dot ${connected ? "online" : ""}`} />
            {system
              ? connected
                ? "Database connected"
                : "Connection unavailable"
              : "Status unavailable"}
          </div>
          <p>
            Database response:{" "}
            <strong>
              {system?.database?.pingMs == null
                ? "—"
                : `${system.database.pingMs} ms`}
            </strong>
          </p>
          <button
            className="adm-text-link"
            type="button"
            onClick={() => onNavigate("system")}
          >
            View system details <ArrowRight size={15} />
          </button>
        </section>
      </div>
    </div>
  );
}

export default function AdminScreen() {
  const { user, setPage, logout } = useStore();
  const { isDark, toggleTheme } = useTheme();
  const [view, setView] = useState(tabFromPath);
  const [expanded, setExpanded] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handlePop() {
      setView(tabFromPath());
    }
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [view]);

  const navigateAdmin = (id) => {
    setView(id);
    setSearchOpen(false);
    setSearchText("");
    if (typeof window !== "undefined") {
      window.history.pushState(
        {},
        "",
        id === "overview" ? "/admin" : `/admin/${id}`,
      );
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="premium-admin-denied">
        <div>
          <ShieldCheck size={35} />
          <p className="premium-eyebrow">SHOPVIBE ADMIN</p>
          <h1>Admin access required</h1>
          <p>This area is restricted to authorized administrators.</p>
          <button onClick={() => setPage("home")}>
            Back to store <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const adminMap = {
    products: AdminProducts,
    categories: AdminCategories,
    subcategories: AdminSubcategories,
    banners: AdminBanners,
    inventory: AdminInventory,
    orders: AdminOrders,
    customers: AdminCustomers,
    coupons: AdminCoupons,
    reviews: AdminReviews,
    analytics: AdminAnalytics,
    system: AdminSystem,
  };
  const PageComponent = view === "people" ? AdminCustomers : adminMap[view];
  const title = allTabs.find(({ id }) => id === view)?.label || "Dashboard";
  const matches = allTabs
    .filter(({ label }) =>
      label.toLowerCase().includes(searchText.trim().toLowerCase()),
    )
    .slice(0, 7);

  function navButton({ id, label, icon: Icon }) {
    return (
      <button
        key={id}
        type="button"
        className={view === id ? "active" : ""}
        onClick={() => navigateAdmin(id)}
        title={label}
        aria-current={view === id ? "page" : undefined}
      >
        <Icon size={18} aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <div
      className={`admin-page api-admin-page ${expanded ? "expanded" : "collapsed"}`}
    >
      <aside className="admin-sidebar" aria-label="Admin sidebar">
        <div className="admin-sidebar-brand">
          <button
            className="admin-logo"
            type="button"
            onClick={() => setPage("home")}
            aria-label="Go to ShopVibe storefront"
          >
            <ShoppingBag size={22} />
          </button>
          {expanded && (
            <div>
              <strong>
                Shop<span>Vibe</span>
              </strong>
              <small>ADMIN WORKSPACE</small>
            </div>
          )}
        </div>
        <button
          type="button"
          className="admin-sidebar-toggle"
          onClick={() => setExpanded((value) => !value)}
          title={expanded ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
        </button>
        <nav aria-label="Admin navigation">
          <span className="admin-extra-label">WORKSPACE</span>
          {primaryTabs.map(navButton)}
          <span className="admin-extra-label">STORE MANAGEMENT</span>
          {storeTabs.map(navButton)}
        </nav>
        <div className="admin-sidebar-bottom">
          <button type="button" onClick={() => setPage("home")}>
            <Store size={18} />
            <span>Storefront</span>
          </button>
          <button type="button" onClick={() => void logout()}>
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
          <div className="admin-sidebar-user">
            <span>{(user?.name || "A").slice(0, 2).toUpperCase()}</span>
            {expanded && (
              <div>
                <strong>{user?.name || "Admin"}</strong>
                <small>Administrator</small>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <button type="button" onClick={() => navigateAdmin("overview")}>
              Admin
            </button>
            <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <div className="admin-search-area">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search admin pages…"
              aria-label="Search admin pages"
              value={searchText}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchText(e.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearchOpen(false);
                if (e.key === "Enter" && matches.length > 0)
                  navigateAdmin(matches[0].id);
              }}
            />
            {searchText && (
              <button
                type="button"
                className="admin-search-clear"
                aria-label="Clear search"
                onClick={() => setSearchText("")}
              >
                <X size={15} />
              </button>
            )}
            {searchOpen && searchText.trim() && (
              <div
                className="admin-search-results"
                role="listbox"
                aria-label="Admin page matches"
              >
                {matches.length ? (
                  matches.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      role="option"
                      aria-selected={view === id}
                      onClick={() => navigateAdmin(id)}
                    >
                      <Icon size={15} />
                      {label}
                      <ArrowRight size={14} />
                    </button>
                  ))
                ) : (
                  <span>No matching admin page</span>
                )}
              </div>
            )}
          </div>
          <div className="admin-top-actions">
            <button
              type="button"
              className="admin-theme-toggle"
              onClick={toggleTheme}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              className="admin-store-link"
              onClick={() => setPage("home")}
            >
              <Store size={16} /> <span>View Store</span>
              <ArrowUpRight size={14} />
            </button>
            <div className="admin-top-avatar" title={user?.name || "Admin"}>
              {(user?.name || "A").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="admin-mobile-tabs" aria-label="Mobile admin navigation">
          {allTabs.map(navButton)}
        </div>
        <div className="admin-main-content">
          <div className="admin-page-title">
            <div>
              <span className="admin-eyebrow">SHOPVIBE / ADMIN</span>
              <h1>{title === "Dashboard" ? "Dashboard Overview" : title}</h1>
              <p>
                {view === "overview"
                  ? "A live snapshot of your store performance and operations."
                  : "Manage your store using the existing connected backend."}
              </p>
            </div>
            {view === "overview" && (
              <span className="admin-today">
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
          {view === "overview" ? (
            <AdminOverview onNavigate={navigateAdmin} />
          ) : (
            <section className="admin-managed-page">
              <div className="admin-live-panel">
                {PageComponent ? (
                  <PageComponent />
                ) : (
                  <p>This admin section is unavailable.</p>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
