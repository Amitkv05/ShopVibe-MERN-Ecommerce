import { useEffect, useMemo, useState } from "react";
import { Package, Truck, CheckCircle, XCircle, ChevronDown, ChevronUp, ArrowRight, ShoppingBag, CalendarDays, CreditCard, MapPin } from "lucide-react";
import { useStore } from "@/lib/store";
import Button from "@/components/reusable/Button";

const STATUS_CONFIG = {
  Processing: { icon: Package, tone: "blue", step: 1 },
  Shipped: { icon: Truck, tone: "amber", step: 2 },
  Delivered: { icon: CheckCircle, tone: "green", step: 3 },
  Cancelled: { icon: XCircle, tone: "red", step: 0 },
};

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const { setPage, cancelOrder, showToast } = useStore();
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Processing;
  const Icon = cfg.icon;
  const steps = ["Order Placed", "Processing", "Shipped", "Delivered"];

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    try { await cancelOrder(order.id, "Cancelled by customer"); }
    catch (error) { showToast(error instanceof Error ? error.message : "Unable to cancel order", "error"); }
  };

  return <article className="premium-order-card">
    <div className="premium-order-head">
      <div>
        <div className="premium-order-id-row">
          <span className="premium-order-id">#{String(order.id).slice(-12)}</span>
          <span className={`premium-order-status ${cfg.tone}`}><Icon size={14}/>{order.status}</span>
        </div>
        <div className="premium-order-meta"><CalendarDays size={14}/><span>{new Date(order.date).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}</span>{order.paymentMethod && <><CreditCard size={14}/><span>{order.paymentMethod}</span></>}</div>
      </div>
      <div className="premium-order-total"><b>{money(order.total)}</b><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span></div>
    </div>

    {order.status !== "Cancelled" && <div className="premium-order-timeline">
      {steps.map((label, index) => {
        const done = index <= cfg.step;
        return <div className={`premium-order-step ${done ? "done" : ""}`} key={label}>
          <div className="premium-order-step-line"><span>{done ? <CheckCircle size={15}/> : index + 1}</span>{index < steps.length - 1 && <i/>}</div>
          <small>{label}</small>
        </div>;
      })}
    </div>}

    <div className="premium-order-actions">
      <button onClick={() => setExpanded((value) => !value)}>{expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} {expanded ? "Hide details" : "View details"}</button>
      {order.status === "Processing" && <button className="danger" onClick={handleCancel}>Cancel order</button>}
      {order.status === "Delivered" && <button onClick={() => setPage("shop")}>Shop again</button>}
    </div>

    {expanded && <div className="premium-order-details">
      <div className="premium-order-items">
        {order.items.length ? order.items.map((item) => <div className="premium-order-item" key={`${item.product.id}-${item.variantSku || item.size}`}>
          <img src={item.product.image} alt={item.product.name}/>
          <div><b>{item.product.name}</b><span>{item.variantSku || `${item.size} · ${item.color}`} · Qty {item.quantity}</span></div>
          <strong>{money(item.product.price * item.quantity)}</strong>
        </div>) : <p className="premium-muted">No order-item snapshot was returned for this legacy order.</p>}
      </div>
      <aside className="premium-order-delivery">
        <MapPin size={18}/><div><small>Delivery address</small><b>{order.address?.name || "Customer"}</b><p>{[order.address?.line1, order.address?.city, order.address?.state, order.address?.zip].filter(Boolean).join(", ")}</p></div>
      </aside>
    </div>}
  </article>;
}

export default function OrdersScreen() {
  const { orders, setPage, refreshOrders } = useStore();
  const [filter, setFilter] = useState("All");
  useEffect(() => { void refreshOrders(); }, [refreshOrders]);

  const statuses = ["All", "Processing", "Shipped", "Delivered", "Cancelled"];
  const filtered = useMemo(() => filter === "All" ? orders : orders.filter((order) => order.status === filter), [orders, filter]);

  if (!orders.length) return <div className="premium-empty-page">
    <div className="premium-empty-icon"><Package size={38}/></div>
    <h2>No orders yet</h2><p>Start shopping and your orders will appear here.</p>
    <Button onClick={() => setPage("shop")} size="lg" iconRight={<ArrowRight size={18}/>}>Start Shopping</Button>
  </div>;

  return <div className="premium-orders-page">
    <div className="premium-page-shell">
      <header className="premium-page-heading"><div><span>ACCOUNT</span><h1>My Orders</h1><p>Track, review and manage your purchases.</p></div><div className="premium-order-count"><ShoppingBag size={18}/><b>{orders.length}</b><small>Total orders</small></div></header>
      <div className="premium-filter-tabs">
        {statuses.map((status) => {
          const count = status === "All" ? orders.length : orders.filter((order) => order.status === status).length;
          return <button key={status} className={filter === status ? "active" : ""} onClick={() => setFilter(status)}><span>{status}</span>{count > 0 && <b>{count}</b>}</button>;
        })}
      </div>
      <div className="premium-order-list">{filtered.length ? filtered.map((order) => <OrderCard key={order.id} order={order}/>) : <div className="premium-no-results">No orders with this status.</div>}</div>
    </div>
  </div>;
}
