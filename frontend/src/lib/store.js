import { create } from "zustand";
import { api, apiMessage, ApiError } from "./api";
import { adaptCategory, adaptProduct, getVariantSku } from "./data";
const GUEST_CART_KEY = "shopvibe_guest_cart_v1";
function loadGuestCart() {
    if (typeof window === "undefined")
        return [];
    try {
        return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
    }
    catch {
        return [];
    }
}
function saveGuestCart(cart) {
    if (typeof window !== "undefined")
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
}
function clearGuestCart() { if (typeof window !== "undefined")
    localStorage.removeItem(GUEST_CART_KEY); }
function variantSelection(product, sku = "") {
    const variant = product.variants.find((v) => v.sku === sku);
    const attrs = Object.entries(variant?.attributes || {});
    const size = attrs.find(([k]) => k.toLowerCase() === "size")?.[1] || product.sizes[0] || "Standard";
    const color = attrs.find(([k]) => ["color", "colour"].includes(k.toLowerCase()))?.[1] || product.colors[0] || "Default";
    return { size, color };
}
function adaptServerCart(raw) {
    return (raw?.items || []).map((item) => {
        const product = adaptProduct(item.product || {});
        const pick = variantSelection(product, item.variantSku || "");
        return { product, quantity: Number(item.quantity || 1), size: pick.size, color: pick.color, variantSku: item.variantSku || "" };
    });
}
function adaptAddress(raw) {
    return { id: String(raw?._id || raw?.id || ""), name: raw?.fullName || "", phone: raw?.phoneNo || "", line1: raw?.address || "", line2: "", city: raw?.city || "", state: raw?.state || "", zip: raw?.pinCode || "", country: raw?.country || "", isDefault: Boolean(raw?.isDefault), label: raw?.label || "Home" };
}
function addressPayload(addr) {
    return { label: addr.label || "Home", fullName: addr.name, address: [addr.line1, addr.line2].filter(Boolean).join(", "), city: addr.city, state: addr.state, country: addr.country, pinCode: addr.zip, phoneNo: addr.phone, isDefault: Boolean(addr.isDefault) };
}
function adaptOrder(raw) {
    const items = (raw?.orderItems || []).map((item) => ({ product: adaptProduct({ _id: item.product, name: item.name, price: item.price, images: item.image ? [{ url: item.image }] : [], stock: item.quantity, category: "Order item", description: "" }), quantity: Number(item.quantity || 1), size: item.variantAttributes?.size || item.variantAttributes?.Size || "Standard", color: item.variantAttributes?.color || item.variantAttributes?.Color || "Default", variantSku: item.variantSku || "" }));
    const ship = raw?.shippingInfo || {};
    return { id: String(raw?._id || raw?.id || ""), date: raw?.createdAt || new Date().toISOString(), status: raw?.orderStatus || "Processing", items, total: Number(raw?.totalPrice || 0), address: { id: "", name: ship.fullName || "", phone: ship.phoneNo || "", line1: ship.address || "", line2: "", city: ship.city || "", state: ship.state || "", zip: ship.pinCode || "", country: ship.country || "", isDefault: false }, trackingNumber: raw?.trackingNumber || "", paymentMethod: raw?.paymentMethod, paymentStatus: raw?.paymentInfo?.status, raw };
}
function routeFor(page, productId) {
    const map = { home: "/", shop: "/shop", newArrivals: "/new-arrivals", categories: "/categories", cart: "/cart", wishlist: "/wishlist", checkout: "/checkout", addresses: "/account/addresses", orders: "/account/orders", profile: "/account", login: "/login", register: "/register", forgot: "/forgot-password", changePassword: "/account/security", admin: "/admin" };
    if (page === "product" && productId)
        return `/product/${productId}`;
    return map[page] || "/";
}
export const useStore = create((set, get) => ({
    currentPage: "home", selectedProductId: null,
    setPage: (page, productId) => { set({ currentPage: page, selectedProductId: productId ?? (page === "product" ? get().selectedProductId : null) }); if (typeof window !== "undefined")
        history.pushState({}, "", routeFor(page, productId ?? null)); },
    syncPageFromLocation: () => { if (typeof window === "undefined")
        return; const p = window.location.pathname; let page = "home", id = null; if (p.startsWith("/product/")) {
        page = "product";
        id = decodeURIComponent(p.split("/")[2] || "");
    }
    else if (p === "/shop")
        page = "shop";
    else if (p === "/new-arrivals")
        page = "newArrivals";
    else if (p === "/categories")
        page = "categories";
    else if (p === "/cart")
        page = "cart";
    else if (p === "/wishlist")
        page = "wishlist";
    else if (p === "/checkout")
        page = "checkout";
    else if (p === "/account/addresses")
        page = "addresses";
    else if (p.startsWith("/account/orders"))
        page = "orders";
    else if (p === "/account" || p === "/account/security")
        page = "profile";
    else if (p === "/login")
        page = "login";
    else if (p === "/register")
        page = "register";
    else if (p === "/forgot-password")
        page = "forgot";
    else if (p.startsWith("/reset-password/"))
        page = "reset";
    else if (p.startsWith("/verify-email/"))
        page = "verify";
    else if (p.startsWith("/admin"))
        page = "admin"; set({ currentPage: page, selectedProductId: id }); },
    isLoggedIn: false, authLoading: true, user: null,
    hydrateSession: async () => { get().syncPageFromLocation(); if (typeof window !== "undefined" && !get().isLoggedIn)
        set({ cart: loadGuestCart() }); try {
        const data = await api("/profile");
        set({ user: { id: data.user?._id, name: data.user?.name || "", email: data.user?.email || "", phone: "", avatar: data.user?.avatar?.url || "", role: data.user?.role, isEmailVerified: data.user?.isEmailVerified }, isLoggedIn: true });
        await Promise.allSettled([get().refreshCart(), get().refreshWishlist(), get().refreshAddresses(), get().refreshOrders()]);
    }
    catch (e) {
        if (!(e instanceof ApiError && e.status === 401))
            console.error(e);
    }
    finally {
        set({ authLoading: false });
    } },
    login: async (email, password) => { const data = await api("/login", { method: "POST", body: { email, password } }); set({ user: { id: data.user?._id, name: data.user?.name || "", email: data.user?.email || email, phone: "", avatar: data.user?.avatar?.url || "", role: data.user?.role, isEmailVerified: data.user?.isEmailVerified }, isLoggedIn: true }); await get().syncGuestCart(); await Promise.allSettled([get().refreshWishlist(), get().refreshAddresses(), get().refreshOrders()]); get().showToast("Welcome back!", "success"); },
    register: async (name, email, password) => { const data = await api("/register", { method: "POST", body: { name, email, password } }); set({ user: { id: data.user?._id, name: data.user?.name || name, email: data.user?.email || email, phone: "", avatar: data.user?.avatar?.url || "", role: data.user?.role, isEmailVerified: data.user?.isEmailVerified }, isLoggedIn: true }); await get().syncGuestCart(); get().showToast("Account created. Check your email for verification.", "success"); },
    logout: async () => { try {
        await api("/logout", { method: "POST" });
    }
    finally {
        set({ isLoggedIn: false, user: null, wishlist: [], addresses: [], orders: [], cart: [] });
        saveGuestCart([]);
        get().setPage("home");
    } },
    updateUser: (u) => set(s => ({ user: s.user ? { ...s.user, ...u } : s.user })),
    updateProfile: async (payload) => { const d = await api("/profile/update", { method: "PUT", body: payload }); set(s => ({ user: s.user ? { ...s.user, name: d.user.name, email: d.user.email, isEmailVerified: d.user.isEmailVerified } : s.user })); get().showToast("Profile updated", "success"); },
    changePassword: async (oldPassword, newPassword, confirmPassword) => { const d = await api("/password/update", { method: "POST", body: { oldPassword, newPassword, confirmPassword } }); if (d.user)
        set(s => ({ user: s.user ? { ...s.user, ...d.user } : s.user })); get().showToast("Password updated", "success"); },
    resendVerification: async () => { const d = await api("/verify-email/resend", { method: "POST" }); get().showToast(d.message || "Verification email sent", "success"); return d.message; },
    products: [], categories: [], productMeta: { currentPage: 1, totalPages: 1, productCount: 0, resultPerPage: 12 }, catalogLoading: false, catalogError: "", selectedProduct: null,
    fetchCatalog: async () => { set({ catalogLoading: true, catalogError: "" }); try {
        const [p, c] = await Promise.all([api("/products?limit=50"), api("/categories")]);
        set({ products: (p.products || []).map(adaptProduct), categories: (c.categories || []).map(adaptCategory), productMeta: { currentPage: Number(p.currentPage || 1), totalPages: Number(p.totalPages || 1), productCount: Number(p.productCount || 0), resultPerPage: Number(p.resultPerPage || 12) } });
    }
    catch (e) {
        set({ catalogError: apiMessage(e) });
    }
    finally {
        set({ catalogLoading: false });
    } },
    fetchProducts: async (params = {}) => { set({ catalogLoading: true, catalogError: "" }); try {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "")
            qs.set(k, String(v)); });
        const d = await api(`/products${qs.size ? `?${qs}` : ""}`);
        const items = (d.products || []).map(adaptProduct);
        set({ products: items, productMeta: { currentPage: Number(d.currentPage || params.page || 1), totalPages: Number(d.totalPages || 1), productCount: Number(d.productCount || items.length), resultPerPage: Number(d.resultPerPage || params.limit || 12) } });
        return items;
    }
    catch (e) {
        set({ catalogError: apiMessage(e, "Products could not be loaded") });
        throw e;
    }
    finally {
        set({ catalogLoading: false });
    } },
    fetchProduct: async (id) => { try {
        const d = await api(`/products/${encodeURIComponent(id)}`);
        const p = adaptProduct(d.product);
        set({ selectedProduct: p });
        return p;
    }
    catch (e) {
        set({ selectedProduct: null });
        get().showToast(apiMessage(e, "Product could not be loaded"), "error");
        return null;
    } },
    cart: [],
    refreshCart: async () => { if (!get().isLoggedIn) {
        set({ cart: loadGuestCart() });
        return;
    } const d = await api("/cart"); set({ cart: adaptServerCart(d.cart) }); },
    syncGuestCart: async () => { const guest = loadGuestCart(); if (!guest.length) {
        await get().refreshCart();
        return;
    } for (const item of guest) {
        await api("/cart/items", { method: "POST", body: { product: item.product.id, quantity: item.quantity, variantSku: item.variantSku || getVariantSku(item.product, item.size, item.color) } });
    } clearGuestCart(); await get().refreshCart(); },
    addToCart: async (product, size, color, qty = 1) => { const variantSku = getVariantSku(product, size, color); if (!get().isLoggedIn) {
        const cart = [...get().cart];
        const i = cart.findIndex(x => x.product.id === product.id && x.variantSku === variantSku);
        if (i >= 0)
            cart[i] = { ...cart[i], quantity: Math.min(99, cart[i].quantity + qty) };
        else
            cart.push({ product, quantity: qty, size, color, variantSku });
        set({ cart });
        saveGuestCart(cart);
        get().showToast("Added to guest cart", "success");
        return;
    } const d = await api("/cart/items", { method: "POST", body: { product: product.id, quantity: qty, variantSku } }); set({ cart: adaptServerCart(d.cart) }); get().showToast("Added to cart! 🛒", "success"); },
    removeFromCart: async (productId, size, color) => { const item = get().cart.find(x => x.product.id === productId && x.size === size && x.color === color); if (!get().isLoggedIn) {
        const cart = get().cart.filter(x => x !== item);
        set({ cart });
        saveGuestCart(cart);
        return;
    } await api(`/cart/items/${productId}?variantSku=${encodeURIComponent(item?.variantSku || "")}`, { method: "DELETE" }); await get().refreshCart(); },
    updateQty: async (productId, size, color, qty) => { const item = get().cart.find(x => x.product.id === productId && x.size === size && x.color === color); if (!get().isLoggedIn) {
        const cart = get().cart.map(x => x === item ? { ...x, quantity: qty } : x);
        set({ cart });
        saveGuestCart(cart);
        return;
    } await api(`/cart/items/${productId}`, { method: "PUT", body: { quantity: qty, variantSku: item?.variantSku || "" } }); await get().refreshCart(); },
    clearCart: async () => { if (!get().isLoggedIn) {
        set({ cart: [] });
        clearGuestCart();
        return;
    } await api("/cart", { method: "DELETE" }); set({ cart: [] }); },
    wishlist: [],
    refreshWishlist: async () => { if (!get().isLoggedIn) {
        set({ wishlist: [] });
        return;
    } const d = await api("/wishlist"); set({ wishlist: (d.wishlist?.products || []).map(adaptProduct) }); },
    toggleWishlist: async (product) => { if (!get().isLoggedIn) {
        get().showToast("Sign in to save your wishlist", "info");
        get().setPage("login");
        return;
    } const exists = get().wishlist.some(p => p.id === product.id); await api(`/wishlist/${product.id}`, { method: exists ? "DELETE" : "POST" }); await get().refreshWishlist(); get().showToast(exists ? "Removed from wishlist" : "Added to wishlist! ❤️", exists ? "info" : "success"); },
    addresses: [], selectedAddressId: "", setSelectedAddressId: (id) => set({ selectedAddressId: id }),
    refreshAddresses: async () => { if (!get().isLoggedIn) {
        set({ addresses: [] });
        return;
    } const d = await api("/addresses"); const addresses = (d.addresses || []).map(adaptAddress); set({ addresses, selectedAddressId: get().selectedAddressId || addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || "" }); },
    addAddress: async (address) => { const d = await api("/addresses", { method: "POST", body: addressPayload(address) }); const addresses = (d.addresses || []).map(adaptAddress); set({ addresses, selectedAddressId: addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || "" }); get().showToast("Address saved", "success"); },
    updateAddress: async (id, address) => { const d = await api(`/addresses/${id}`, { method: "PUT", body: addressPayload(address) }); set({ addresses: (d.addresses || []).map(adaptAddress) }); get().showToast("Address updated", "success"); },
    removeAddress: async (id) => { const d = await api(`/addresses/${id}`, { method: "DELETE" }); set({ addresses: (d.addresses || []).map(adaptAddress) }); },
    setDefaultAddress: async (id) => { const a = get().addresses.find(x => x.id === id); if (!a)
        return; await get().updateAddress(id, { ...a, isDefault: true }); set({ selectedAddressId: id }); },
    orders: [], couponCode: "", setCouponCode: (code) => set({ couponCode: code }),
    refreshOrders: async () => { if (!get().isLoggedIn) {
        set({ orders: [] });
        return;
    } const d = await api("/orders/user?limit=100"); set({ orders: (d.orders || []).map(adaptOrder) }); },
    placeOrder: async (paymentMethod = "COD", couponCode = "", paymentInfo) => { if (!get().isLoggedIn)
        throw new Error("Please sign in to checkout"); const addr = get().addresses.find(a => a.id === get().selectedAddressId) || get().addresses[0]; if (!addr)
        throw new Error("Please add a shipping address"); const orderItems = get().cart.map(i => ({ product: i.product.id, quantity: i.quantity, variantSku: i.variantSku || getVariantSku(i.product, i.size, i.color) })); const key = globalThis.crypto?.randomUUID?.() || `web-${Date.now()}-${Math.random()}`; const d = await api("/new/order", { method: "POST", headers: { "Idempotency-Key": key }, body: { shippingInfo: addressPayload(addr), orderItems, paymentMethod, paymentInfo, couponCode: couponCode || undefined } }); await Promise.allSettled([get().refreshCart(), get().refreshOrders()]); get().showToast("Order placed successfully! 🎉", "success"); return adaptOrder(d.order); },
    cancelOrder: async (id, reason = "") => { await api(`/order/${id}/cancel`, { method: "POST", body: { reason } }); await get().refreshOrders(); get().showToast("Order cancelled", "success"); },
    selectedCategory: "All", setSelectedCategory: (cat) => set({ selectedCategory: cat }), searchQuery: "", setSearchQuery: (q) => set({ searchQuery: q }), priceRange: [0, 1000], setPriceRange: (range) => set({ priceRange: range }), sortBy: "featured", setSortBy: (sort) => set({ sortBy: sort }),
    toasts: [], showToast: (message, type = "success") => { const id = `toast-${Date.now()}-${Math.random()}`; set(s => ({ toasts: [...s.toasts, { id, message, type }] })); setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500); }, removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
