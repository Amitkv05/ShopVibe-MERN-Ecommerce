import { useEffect, useState } from "react";
import { User, Mail, Phone, Edit2, LogOut, Package, Heart, MapPin, CreditCard, Bell, Shield, HelpCircle, ChevronRight, Camera, Save, X, Settings } from "lucide-react";
import { useStore } from "@/lib/store";
import Button from "@/components/reusable/Button";
import Input from "@/components/reusable/Input";
export default function ProfileScreen() {
    const { user, updateProfile, changePassword, resendVerification, logout, setPage, orders, wishlist, cart, refreshOrders } = useStore();
    const [editing, setEditing] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [securityBusy, setSecurityBusy] = useState(false);
    const handlePasswordSave = async () => {
        if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword)
            return;
        setSecurityBusy(true);
        try {
            await changePassword(passwordForm.oldPassword, passwordForm.newPassword, passwordForm.confirmPassword);
            setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        }
        finally {
            setSecurityBusy(false);
        }
    };
    const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
    useEffect(() => { setForm({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" }); void refreshOrders(); }, [user?.name, user?.email, user?.phone, refreshOrders]);
    const handleSave = async () => {
        try {
            await updateProfile({ name: form.name, email: form.email });
            setEditing(false);
        }
        catch { /* store/API toast handles user feedback elsewhere */ }
    };
    const menuItems = [
        {
            section: "Shopping",
            items: [
                { icon: <Package size={18}/>, label: "My Orders", sub: `${orders.length} orders`, page: "orders", badge: orders.filter(o => o.status === "Processing" || o.status === "Shipped").length },
                { icon: <Heart size={18}/>, label: "Wishlist", sub: `${wishlist.length} items`, page: "wishlist" },
                { icon: <MapPin size={18}/>, label: "Shipping Addresses", sub: "Manage delivery addresses", page: "addresses" },
            ],
        },
        {
            section: "Account",
            items: [
                { icon: <CreditCard size={18}/>, label: "Payment Methods", sub: "Cards & wallets", page: "profile" },
                { icon: <Bell size={18}/>, label: "Notifications", sub: "Alerts & preferences", page: "profile" },
                { icon: <Shield size={18}/>, label: "Privacy & Security", sub: "Password & data", page: "profile" },
                { icon: <Settings size={18}/>, label: "Settings", sub: "App preferences", page: "profile" },
            ],
        },
        {
            section: "Support",
            items: [
                { icon: <HelpCircle size={18}/>, label: "Help Center", sub: "FAQs & support", page: "profile" },
            ],
        },
    ];
    const stats = [
        { label: "Orders", value: orders.length, page: "orders" },
        { label: "Wishlist", value: wishlist.length, page: "wishlist" },
        { label: "Cart", value: cart.reduce((a, i) => a + i.quantity, 0), page: "cart" },
    ];
    return (<div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-6">
          {/* Header Gradient */}
          <div className="h-28 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 relative">
            <div className="absolute inset-0 opacity-10">
              {[...Array(3)].map((_, i) => (<div key={i} className="absolute rounded-full bg-white" style={{ width: `${80 + i * 60}px`, height: `${80 + i * 60}px`, top: `-${20 + i * 10}px`, right: `${i * 80}px` }}/>))}
            </div>
          </div>

          {/* Avatar */}
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-xl">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-md hover:bg-violet-700 transition-colors">
                  <Camera size={13}/>
                </button>
              </div>
              {!editing ? (<button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
                  <Edit2 size={14}/>
                  Edit Profile
                </button>) : (<div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50">
                    <X size={16}/>
                  </button>
                  <Button size="sm" onClick={handleSave} icon={<Save size={14}/>}>Save</Button>
                </div>)}
            </div>

            {editing ? (<div className="space-y-3">
                <Input label="Full Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} leftIcon={<User size={16}/>}/>
                <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} leftIcon={<Mail size={16}/>}/>
                <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} leftIcon={<Phone size={16}/>}/>
              </div>) : (<>
                <h2 className="text-xl font-bold text-gray-900">{user?.name || "User"}</h2>
                <p className="text-gray-500 text-sm">{user?.email || ""}</p>
                <p className="text-gray-500 text-sm">{user?.phone || ""}</p>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
                    {user?.isEmailVerified ? "Email verified" : "Email verification pending"}
                  </span>
                </div>
              </>)}

            {/* Stats */}
            {!editing && (<div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
                {stats.map((stat) => (<button key={stat.label} onClick={() => setPage(stat.page)} className="text-center p-3 rounded-xl hover:bg-violet-50 transition-colors group">
                    <p className="text-xl font-bold text-gray-900 group-hover:text-violet-600">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                  </button>))}
              </div>)}
          </div>
        </div>

        {/* Menu Sections */}
        {menuItems.map((section) => (<div key={section.section} className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
            <p className="px-5 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{section.section}</p>
            {section.items.map((item, i) => (<button key={item.label} onClick={() => setPage(item.page)} className={`w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors ${i !== section.items.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
                </div>
                <div className="flex items-center gap-2">
                  {"badge" in item && item.badge && item.badge > 0 ? (<span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>) : null}
                  <ChevronRight size={16} className="text-gray-300"/>
                </div>
              </button>))}
          </div>))}

        <div className="bg-white rounded-2xl border border-gray-100 mb-4 p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div><p className="font-bold text-gray-900">Privacy & Security</p><p className="text-xs text-gray-500 mt-1">Change your password and manage email verification.</p></div>
            {!user?.isEmailVerified && <button onClick={() => void resendVerification()} className="text-xs font-semibold text-violet-600">Resend verification</button>}
          </div>
          <div className="grid gap-3">
            <Input label="Current Password" type="password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm(f => ({ ...f, oldPassword: e.target.value }))}/>
            <Input label="New Password" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}/>
            <Input label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}/>
            <Button onClick={handlePasswordSave} loading={securityBusy}>Update Password</Button>
          </div>
        </div>

        {/* Logout */}
        <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-4 bg-white rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all font-semibold">
          <LogOut size={18}/>
          Sign Out
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">ShopVibe v2.0 • Privacy Policy • Terms</p>
      </div>
    </div>);
}
