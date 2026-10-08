import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, TrendingUp } from "lucide-react";
import { api, apiMessage } from "@/lib/api";
import { AdminButton, AdminError, AdminField, AdminLoading, Panel, money } from "./AdminCommon";

const dateInput = (date) => date.toISOString().slice(0, 10);

export default function AdminAnalytics() {
  const [from, setFrom] = useState(() => dateInput(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(() => dateInput(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api(`/admin/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(`${to}T23:59:59.999`)}`);
      setData(response);
    } catch (err) {
      setError(apiMessage(err, "Unable to load analytics"));
    } finally {
      setLoading(false);
      firstLoad.current = false;
    }
  }, [from, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), firstLoad.current ? 0 : 320);
    return () => window.clearTimeout(timer);
  }, [load]);

  const maxRevenue = useMemo(
    () => Math.max(1, ...(data?.dailyRevenue || []).map((row) => Number(row.revenue || 0))),
    [data],
  );

  if (loading && !data) return <AdminLoading label="Loading analytics…" />;

  const summary = data?.summary || {};
  const metrics = [
    ["Revenue", money(summary.totalRevenue)],
    ["Orders", summary.totalOrders ?? 0],
    ["Users", summary.users ?? 0],
    ["Products", summary.products ?? 0],
    ["Low stock", summary.lowStockProducts ?? 0],
  ];

  return (
    <div className={`admin-analytics-stack ${loading ? "is-refreshing" : ""}`} aria-busy={loading}>
      <Panel
        className="admin-analytics-panel"
        title="Analytics"
        subtitle="Revenue, orders, top products and daily trend"
        actions={(
          <>
            <AdminField label="From" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            <AdminField label="To" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            <AdminButton tone="ghost" loading={loading} onClick={() => void load()}>
              <RefreshCw size={15} />Refresh
            </AdminButton>
          </>
        )}
      >
        {error && <AdminError message={error} retry={() => void load()} />}
        {loading && data && <div className="admin-inline-refresh"><span /><p>Updating analytics without leaving this screen…</p></div>}

        <div className="admin-analytics-kpis">
          {metrics.map(([label, value], index) => (
            <article key={String(label)} className={index === 0 ? "primary" : ""}>
              <small>{label}</small>
              <strong>{value}</strong>
              <span>{index === 0 ? "Live revenue" : "Live API"}</span>
            </article>
          ))}
        </div>

        <section className="admin-revenue-section">
          <div className="admin-analytics-section-title">
            <div><small>Revenue timeline</small><h3>Daily revenue</h3></div>
            <TrendingUp size={18} />
          </div>
          <div className="admin-revenue-list">
            {(data?.dailyRevenue || []).map((row) => {
              const width = Math.max(2, Number(row.revenue || 0) / maxRevenue * 100);
              return (
                <div className="admin-revenue-row" key={row._id}>
                  <span>{row._id}</span>
                  <div><i style={{ width: `${width}%` }} /></div>
                  <b>{money(row.revenue)}</b>
                </div>
              );
            })}
            {!(data?.dailyRevenue || []).length && <p className="admin-analytics-empty">No revenue in this period.</p>}
          </div>
        </section>
      </Panel>

      <Panel className="admin-top-products-panel" title="Top products" subtitle="Best performers by quantity sold">
        <div className="admin-top-products-grid">
          {(data?.topProducts || []).map((row, index) => (
            <article key={row._id || row.name}>
              <span className="admin-top-rank">{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{row.name}</h3><p>{row.quantity} sold</p></div>
              <strong>{money(row.revenue)}</strong>
            </article>
          ))}
          {!(data?.topProducts || []).length && <p className="admin-analytics-empty">No product sales yet.</p>}
        </div>
      </Panel>
    </div>
  );
}
