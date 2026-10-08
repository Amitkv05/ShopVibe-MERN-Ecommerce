import { useEffect, useState } from "react";
import { User, Mail, Phone, Edit2, LogOut, Package, Heart, MapPin, CreditCard, Bell, Shield, HelpCircle, ChevronRight, Camera, Save, X, Settings, CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";
import Button from "@/components/reusable/Button";
import Input from "@/components/reusable/Input";

export default function ProfileScreen() {
  const { user, updateProfile, changePassword, resendVerification, logout, setPage, orders, wishlist, cart, refreshOrders } = useStore();
  const [editing, setEditing] = useState(false);
  const [securityBusy, setSecurityBusy] = useState(false);
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    setForm({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
    void refreshOrders();
  }, [user?.name, user?.email, user?.phone, refreshOrders]);

  const handleSave = async () => {
    try { await updateProfile({ name: form.name, email: form.email }); setEditing(false); }
    catch { /* store handles API feedback */ }
  };

  const handlePasswordSave = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) return;
    setSecurityBusy(true);
    try {
      await changePassword(passwordForm.oldPassword, passwordForm.newPassword, passwordForm.confirmPassword);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } finally { setSecurityBusy(false); }
  };

  const stats = [
    { label: "Orders", value: orders.length, page: "orders" },
    { label: "Wishlist", value: wishlist.length, page: "wishlist" },
    { label: "Cart", value: cart.reduce((sum, item) => sum + item.quantity, 0), page: "cart" },
  ];

  const shortcuts = [
    { icon: Package, label: "My Orders", sub: `${orders.length} orders`, page: "orders" },
    { icon: Heart, label: "Wishlist", sub: `${wishlist.length} saved items`, page: "wishlist" },
    { icon: MapPin, label: "Shipping Addresses", sub: "Manage delivery addresses", page: "addresses" },
    { icon: CreditCard, label: "Payment Methods", sub: "Cards & wallets", page: "profile" },
    { icon: Bell, label: "Notifications", sub: "Alerts & preferences", page: "profile" },
    { icon: HelpCircle, label: "Help Center", sub: "FAQs & support", page: "profile" },
  ];

  return <div className="premium-profile-page">
    <div className="premium-profile-shell">
      <header className="premium-page-heading premium-profile-heading"><div><span>MY ACCOUNT</span><h1>Profile & settings</h1><p>Manage your account, orders and security from one place.</p></div></header>

      <div className="premium-profile-grid">
        <section className="premium-profile-main-card">
          <div className="premium-profile-cover"><span/><span/><span/></div>
          <div className="premium-profile-body">
            <div className="premium-profile-avatar-row">
              <div className="premium-profile-avatar"><span>{(user?.name || "U").charAt(0).toUpperCase()}</span><button aria-label="Change avatar"><Camera size={14}/></button></div>
              {!editing ? <button className="premium-edit-profile" onClick={() => setEditing(true)}><Edit2 size={15}/> Edit profile</button> : <div className="premium-edit-actions"><button onClick={() => setEditing(false)}><X size={16}/></button><button onClick={handleSave}><Save size={15}/> Save</button></div>}
            </div>

            {editing ? <div className="premium-profile-edit-grid">
              <Input label="Full Name" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} leftIcon={<User size={16}/>}/>
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} leftIcon={<Mail size={16}/>}/>
              <Input label="Phone" value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} leftIcon={<Phone size={16}/>}/>
            </div> : <div className="premium-profile-identity">
              <h2>{user?.name || "User"}</h2><p>{user?.email || ""}</p>{user?.phone && <p>{user.phone}</p>}
              <span className={user?.isEmailVerified ? "verified" : "pending"}><CheckCircle2 size={14}/>{user?.isEmailVerified ? "Email verified" : "Email verification pending"}</span>
            </div>}

            {!editing && <div className="premium-profile-stats">{stats.map((stat) => <button key={stat.label} onClick={() => setPage(stat.page)}><b>{stat.value}</b><span>{stat.label}</span></button>)}</div>}
          </div>
        </section>

        <section className="premium-profile-shortcuts">
          <div className="premium-section-title"><div><span>QUICK ACCESS</span><h2>Shopping & account</h2></div></div>
          <div className="premium-shortcut-grid">{shortcuts.map(({ icon: Icon, label, sub, page }) => <button key={label} onClick={() => setPage(page)}><i><Icon size={18}/></i><div><b>{label}</b><span>{sub}</span></div><ChevronRight size={17}/></button>)}</div>
        </section>

        <section className="premium-security-card">
          <div className="premium-section-title"><div><span>SECURITY</span><h2>Privacy & Security</h2><p>Update your password and verify your email.</p></div><Shield size={24}/></div>
          <div className="premium-security-form">
            <Input label="Current Password" type="password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm((current) => ({ ...current, oldPassword: e.target.value }))}/>
            <Input label="New Password" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((current) => ({ ...current, newPassword: e.target.value }))}/>
            <Input label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((current) => ({ ...current, confirmPassword: e.target.value }))}/>
            <Button onClick={handlePasswordSave} loading={securityBusy}>Update Password</Button>
          </div>
          {!user?.isEmailVerified && <button className="premium-resend-link" onClick={() => void resendVerification()}>Resend verification email</button>}
        </section>

        <section className="premium-profile-footer-card">
          <div><Settings size={20}/><div><b>Account preferences</b><span>ShopVibe v2.1 · Privacy Policy · Terms</span></div></div>
          <button className="premium-signout" onClick={logout}><LogOut size={17}/> Sign out</button>
        </section>
      </div>
    </div>
  </div>;
}
