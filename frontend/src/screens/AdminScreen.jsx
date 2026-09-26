import { useEffect, useState } from "react";
import { Activity, BarChart3, Boxes, ChartNoAxesCombined, Image as ImageIcon, LayoutDashboard, LogOut, Package, ShoppingBag, Star, Tags, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminCategories from "@/components/admin/AdminCategories";
import AdminInventory from "@/components/admin/AdminInventory";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminCustomers from "@/components/admin/AdminCustomers";
import AdminCoupons from "@/components/admin/AdminCoupons";
import AdminReviews from "@/components/admin/AdminReviews";
import AdminBanners from "@/components/admin/AdminBanners";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminSystem from "@/components/admin/AdminSystem";
const tabs = [["dashboard", "Dashboard", LayoutDashboard], ["products", "Products", Package], ["categories", "Categories", Tags], ["banners", "Banners", ImageIcon], ["inventory", "Inventory", Boxes], ["orders", "Orders", ShoppingBag], ["customers", "Customers", Users], ["coupons", "Coupons", Tags], ["reviews", "Reviews", Star], ["analytics", "Analytics", ChartNoAxesCombined], ["system", "System", Activity]];
function tabFromPath() { if (typeof window === "undefined")
    return "dashboard"; const part = window.location.pathname.split("/")[2] || "dashboard"; return tabs.some(([id]) => id === part) ? part : "dashboard"; }
export default function AdminScreen() {
    const { user, setPage, logout } = useStore();
    const [tab, setTab] = useState(tabFromPath);
    useEffect(() => { const onPop = () => setTab(tabFromPath()); window.addEventListener("popstate", onPop); return () => window.removeEventListener("popstate", onPop); }, []);
    const selectTab = (next) => { setTab(next); if (typeof window !== "undefined")
        history.pushState({}, "", next === "dashboard" ? "/admin" : `/admin/${next}`); };
    if (user?.role !== "admin")
        return <div className="min-h-[70vh] flex items-center justify-center px-4"><div className="max-w-md text-center bg-white rounded-3xl border p-8"><BarChart3 className="mx-auto text-violet-500"/><h1 className="mt-4 text-2xl font-bold">Admin access required</h1><p className="mt-2 text-sm text-gray-500">This route requires an administrator account. The backend also enforces the admin role on every admin API.</p><button onClick={() => setPage("home")} className="mt-5 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white">Back to store</button></div></div>;
    const content = { dashboard: <AdminDashboard />, products: <AdminProducts />, categories: <AdminCategories />, banners: <AdminBanners />, inventory: <AdminInventory />, orders: <AdminOrders />, customers: <AdminCustomers />, coupons: <AdminCoupons />, reviews: <AdminReviews />, analytics: <AdminAnalytics />, system: <AdminSystem /> }[tab];
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 lg:flex"><aside className="hidden lg:flex lg:w-64 lg:flex-col bg-slate-950 text-white sticky top-16 h-[calc(100vh-4rem)]"><div className="px-5 py-5 border-b border-white/10"><p className="text-xs uppercase tracking-[0.22em] text-violet-300">Administration</p><p className="mt-1 text-lg font-bold">ShopVibe Admin</p><p className="text-xs text-slate-400 truncate">{user.email}</p></div><nav className="flex-1 overflow-auto p-3 space-y-1">{tabs.map(([id, label, Icon]) => <button key={id} onClick={() => selectTab(id)} className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${tab === id ? "bg-violet-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}><Icon size={17}/>{label}</button>)}</nav><div className="p-3 border-t border-white/10"><button onClick={() => void logout()} className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10"><LogOut size={16}/>Sign out</button></div></aside><main className="min-w-0 flex-1"><div className="border-b border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 lg:hidden"><div className="flex gap-2 overflow-x-auto">{tabs.map(([id, label]) => <button key={id} onClick={() => selectTab(id)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold ${tab === id ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>{label}</button>)}</div></div><div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8"><div className="mb-6"><p className="text-xs uppercase tracking-[0.18em] text-violet-600 font-semibold">Admin panel</p><h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{tabs.find(x => x[0] === tab)?.[1]}</h1></div>{content}</div></main></div>;
}
