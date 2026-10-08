import { useEffect, useState } from "react";
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

const primary = [
  ["overview", "Overview", "⌂"],
  ["people", "People", "◎"],
];

const storeTabs = [
  ["products", "Products", "▣"],
  ["categories", "Categories", "◫"],
  ["subcategories", "Subcategories", "≡"],
  ["banners", "Banners", "▤"],
  ["inventory", "Inventory", "◧"],
  ["orders", "Orders", "⌑"],
  ["customers", "Customers", "♙"],
  ["coupons", "Coupons", "%"],
  ["reviews", "Reviews", "★"],
  ["analytics", "Analytics", "↗"],
  ["system", "System", "⚙"],
];

const allTabs = [...primary, ...storeTabs];

function tabFromPath() {
  const part = typeof window !== "undefined" ? (window.location.pathname.split("/")[2] || "overview") : "overview";
  if (part === "dashboard") return "overview";
  return allTabs.some(([id]) => id === part) ? part : "overview";
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function ReferenceOverview({ user }) {
  const [data, setData] = useState(null);
  const [system, setSystem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([api("/admin/analytics"), api("/admin/system")])
      .then(([analytics, diagnostics]) => {
        if (!alive) return;
        setData(analytics);
        setSystem(diagnostics);
      })
      .catch((err) => alive && setError(apiMessage(err, "Unable to load admin overview")));
    return () => { alive = false; };
  }, []);

  const summary = data?.summary || {};
  const bars = (data?.orderStats || []).map((row) => Math.min(94, 20 + Number(row.count || 0) * 7)).slice(0, 7);
  while (bars.length < 7) bars.push([38, 58, 44, 72, 48, 88, 61][bars.length]);

  return (
    <div className="admin-overview-grid">
      <section className="admin-welcome">
        <small>Live ShopVibe workspace</small>
        <h1>Good morning, {user?.name?.split(" ")[0] || "Admin"}</h1>
        <p>Here&apos;s what&apos;s happening across your live e-commerce backend today.</p>
        {error && <div className="api-error" style={{ marginTop: 10 }}>{error}</div>}
      </section>

      <section className="admin-metrics">
        <div><b>{summary.totalOrders ?? 0}</b><span>Orders</span></div>
        <div><b>{summary.users ?? 0}</b><span>Customers</span></div>
        <div><b>{summary.products ?? 0}</b><span>Products</span></div>
      </section>

      <section className="admin-profile-card">
        <div className="admin-photo">
          <span>{(user?.name || "SV").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
          <i>Online</i>
        </div>
        <div>
          <h3>{user?.name || "ShopVibe Admin"}</h3>
          <p>Store administrator</p>
          <b>{money(summary.totalRevenue)}</b>
          <small>total revenue</small>
        </div>
      </section>

      <section className="admin-progress-card">
        <div className="admin-card-head">
          <div><small>Order activity</small><h3>{summary.totalOrders ?? 0}</h3></div>
          <span>Live analytics<br />from backend</span>
        </div>
        <div className="bar-chart">
          {bars.map((height, index) => (
            <i key={index}><u style={{ height: `${height}%` }} /><small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small></i>
          ))}
        </div>
      </section>

      <section className="admin-time-card">
        <small>System status</small>
        <div className="time-ring"><span>{system?.database?.pingMs ?? "—"}</span><small>DB ms</small></div>
        <div className="admin-system-mini"><span className={system?.database?.connected ? "" : "off"}>{system?.database?.connected ? "Connected" : "Offline"}</span></div>
      </section>

      <section className="admin-onboarding">
        <div><small>Store health</small><b>{system?.database?.connected ? "LIVE" : "CHECK"}</b></div>
        <p>Current backend feature availability.</p>
        {Object.entries(system?.features || {}).slice(0, 4).map(([key, value]) => (
          <button key={key}><span className={value ? "done" : ""}>{value ? "✓" : ""}</span>{key}<b>›</b></button>
        ))}
      </section>
    </div>
  );
}

export default function AdminScreen() {
  const { user, setPage, logout } = useStore();
  const { isDark, toggleTheme } = useTheme();
  const [view, setView] = useState(tabFromPath);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const onPop = () => setView(tabFromPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [view]);

  if (user?.role !== "admin") {
    return (
      <div className="premium-admin-denied">
        <div>
          <p className="premium-eyebrow">ADMINISTRATION</p>
          <h1>Admin access required</h1>
          <p>This workspace requires an administrator account. Backend role checks remain unchanged.</p>
          <button onClick={() => setPage("home")}>Back to store</button>
        </div>
      </div>
    );
  }

  let content;
  if (view === "overview") {
    content = <ReferenceOverview user={user} />;
  } else if (view === "people") {
    content = (
      <section className="admin-people-view">
        <div className="people-title">
          <div><small>Team</small><h1>People</h1><p>Live customer/user management from your backend.</p></div>
        </div>
        <div className="admin-live-panel"><AdminCustomers /></div>
      </section>
    );
  } else {
    const map = {
      products: <AdminProducts />,
      categories: <AdminCategories />,
      subcategories: <AdminSubcategories />,
      banners: <AdminBanners />,
      inventory: <AdminInventory />,
      orders: <AdminOrders />,
      customers: <AdminCustomers />,
      coupons: <AdminCoupons />,
      reviews: <AdminReviews />,
      analytics: <AdminAnalytics />,
      system: <AdminSystem />,
    };
    content = (
      <section className="admin-people-view">
        <div className="people-title">
          <div>
            <small>Store management</small>
            <h1>{allTabs.find(([id]) => id === view)?.[1]}</h1>
            <p>{view === "analytics" ? "Live performance data from the existing analytics API." : "Existing CRUD/actions remain connected to the same API."}</p>
          </div>
        </div>
        <div className="admin-live-panel">{map[view]}</div>
      </section>
    );
  }

  const label = allTabs.find(([id]) => id === view)?.[1] || "Overview";
  const navigateAdmin = (id) => {
    setView(id);
    history.pushState({}, "", id === "overview" ? "/admin" : `/admin/${id}`);
  };

  return (
    <div className={`admin-page api-admin-page ${expanded ? "expanded" : "collapsed"}`}>
      <aside className="admin-sidebar">
        <button className="admin-logo" onClick={() => setPage("home")} aria-label="Open ShopVibe storefront">S<span>V</span></button>
        <button
          className="admin-sidebar-toggle"
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? "Collapse admin menu" : "Expand admin menu"}
          title={expanded ? "Collapse menu" : "Expand menu"}
        >
          <span>{expanded ? "‹" : "›"}</span><b>{expanded ? "Collapse menu" : "Expand menu"}</b>
        </button>

        <nav aria-label="Admin navigation">
          {primary.map(([id, name, icon]) => (
            <button key={id} onClick={() => navigateAdmin(id)} className={view === id ? "active" : ""} title={name}>
              <i>{icon}</i><span>{name}</span>
            </button>
          ))}
          <div className="admin-extra-nav">
            <small className="admin-extra-label">Store</small>
            {storeTabs.map(([id, name, icon]) => (
              <button key={id} onClick={() => navigateAdmin(id)} className={view === id ? "active" : ""} title={name}>
                <i>{icon}</i><span>{name}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="admin-sidebar-bottom">
          <button onClick={() => setPage("home")} title="Storefront"><i>↗</i><span>Storefront</span></button>
          <button onClick={() => void logout()} title="Sign out"><i>⇥</i><span>Sign out</span></button>
          <div className="admin-avatar">{(user?.name || "A").slice(0, 2).toUpperCase()}</div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>ShopVibe</span><b>/</b><strong>{label}</strong></div>
          <div className="admin-top-actions">
            <button type="button" title="Search" aria-label="Search">⌕</button>
            <button type="button" title="Help" aria-label="Help">?</button>
            <button
              type="button"
              className="admin-theme-toggle"
              onClick={toggleTheme}
              title={isDark ? "Switch admin to light mode" : "Switch admin to dark mode"}
              aria-label={isDark ? "Switch admin to light mode" : "Switch admin to dark mode"}
            >
              <span>{isDark ? "☀" : "☾"}</span><b>{isDark ? "Light" : "Dark"}</b>
            </button>
            <button className="admin-upgrade" onClick={() => setPage("home")}>Storefront</button>
          </div>
        </header>
        {content}
      </main>
    </div>
  );
}
