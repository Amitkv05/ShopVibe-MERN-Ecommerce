import { useEffect, useState } from "react";
import { Package, Truck, CheckCircle, XCircle, ChevronDown, ChevronUp, ArrowRight, ShoppingBag } from "lucide-react";
import { useStore } from "@/lib/store";
import Button from "@/components/reusable/Button";
import Badge from "@/components/reusable/Badge";
const STATUS_CONFIG = {
    Processing: { icon: <Package size={16}/>, variant: "info", color: "bg-blue-500", step: 1 },
    Shipped: { icon: <Truck size={16}/>, variant: "warning", color: "bg-amber-500", step: 2 },
    Delivered: { icon: <CheckCircle size={16}/>, variant: "success", color: "bg-emerald-500", step: 3 },
    Cancelled: { icon: <XCircle size={16}/>, variant: "danger", color: "bg-red-500", step: 0 },
};
function OrderCard({ order }) {
    const [expanded, setExpanded] = useState(false);
    const { setPage, cancelOrder, showToast } = useStore();
    const cfg = STATUS_CONFIG[order.status];
    const trackingSteps = [
        { label: "Order Placed", done: true },
        { label: "Processing", done: cfg.step >= 1 },
        { label: "Shipped", done: cfg.step >= 2 },
        { label: "Delivered", done: cfg.step >= 3 },
    ];
    return (<div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-900 font-mono">{order.id}</span>
              <Badge variant={cfg.variant}>
                <span className="flex items-center gap-1">
                  {cfg.icon}
                  {order.status}
                </span>
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {new Date(order.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            {order.trackingNumber && (<p className="text-xs text-gray-400 mt-0.5">Tracking: <span className="font-mono">{order.trackingNumber}</span></p>)}
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900 text-lg">₹{order.total.toFixed(2)}</p>
            {order.items.length > 0 && (<p className="text-xs text-gray-500">{order.items.reduce((a, i) => a + i.quantity, 0)} items</p>)}
          </div>
        </div>

        {/* Tracking Timeline */}
        {order.status !== "Cancelled" && (<div className="mt-5">
            <div className="flex items-center">
              {trackingSteps.map((step, i) => (<div key={step.label} className="flex items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white transition-colors ${step.done ? cfg.color : "bg-gray-200"}`}>
                    {step.done ? <CheckCircle size={14}/> : <span className="text-xs font-bold text-gray-400">{i + 1}</span>}
                  </div>
                  {i < trackingSteps.length - 1 && (<div className={`flex-1 h-1 mx-1 rounded-full ${step.done && trackingSteps[i + 1].done ? cfg.color : "bg-gray-200"}`}/>)}
                </div>))}
            </div>
            <div className="flex justify-between mt-1.5">
              {trackingSteps.map((step) => (<span key={step.label} className="text-[10px] text-gray-500 text-center" style={{ flex: 1 }}>
                  {step.label}
                </span>))}
            </div>
          </div>)}

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 text-sm text-violet-600 font-medium hover:text-violet-800 transition-colors">
            {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            {expanded ? "Hide" : "View"} Details
          </button>
          {order.status === "Delivered" && (<button className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
              Write Review
            </button>)}
          {order.status === "Processing" && (<button onClick={async () => { if (!window.confirm("Cancel this order?"))
            return; try {
            await cancelOrder(order.id, "Cancelled by customer");
        }
        catch (error) {
            showToast(error instanceof Error ? error.message : "Unable to cancel order", "error");
        } }} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
              Cancel Order
            </button>)}
        </div>
      </div>

      {/* Expanded Items */}
      {expanded && (<div className="border-t border-gray-100 bg-gray-50 p-5">
          {order.items.length === 0 ? (<p className="text-sm text-gray-500">No order-item snapshot was returned for this legacy order.</p>) : (<div className="space-y-3">
              {order.items.map((item) => (<div key={`${item.product.id}-${item.variantSku || item.size}`} className="flex gap-3 items-center">
                  <img src={item.product.image} alt={item.product.name} className="w-14 h-14 rounded-xl object-cover bg-gray-200 shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-gray-500">{item.variantSku || `${item.size} • ${item.color}`} • Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900 shrink-0">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                </div>))}
            </div>)}



          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Delivered to</p>
            <p className="text-sm text-gray-700">
              {order.address.line1}, {order.address.city}, {order.address.state}
            </p>
          </div>

          {order.status === "Delivered" && (<div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setPage("shop")} icon={<ShoppingBag size={14}/>}>
                Reorder
              </Button>
            </div>)}
        </div>)}
    </div>);
}
export default function OrdersScreen() {
    const { orders, setPage, refreshOrders, cancelOrder, showToast } = useStore();
    useEffect(() => { void refreshOrders(); }, [refreshOrders]);
    const [filter, setFilter] = useState("All");
    const statuses = ["All", "Processing", "Shipped", "Delivered", "Cancelled"];
    const filtered = filter === "All" ? orders : orders.filter((o) => o.status === filter);
    if (orders.length === 0) {
        return (<div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-6">
            <Package size={40} className="text-violet-300"/>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-8">Start shopping and your orders will appear here.</p>
          <Button onClick={() => setPage("shop")} size="lg" iconRight={<ArrowRight size={18}/>}>
            Start Shopping
          </Button>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} total orders</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {statuses.map((status) => {
            const count = status === "All" ? orders.length : orders.filter((o) => o.status === status).length;
            return (<button key={status} onClick={() => setFilter(status)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${filter === status
                    ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                {status}
                {count > 0 && (<span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === status ? "bg-white/20" : "bg-gray-100"}`}>
                    {count}
                  </span>)}
              </button>);
        })}
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (<div className="text-center py-12 text-gray-500">No orders with this status</div>) : (filtered.map((order) => <OrderCard key={order.id} order={order}/>))}
        </div>
      </div>
    </div>);
}
