import { useEffect, useState } from "react";

export default function OrderFlowButton({ loading, placing, done = false, onClick, children, disabled }) {
  const active = loading || placing;
  const [visual, setVisual] = useState("idle");
  useEffect(() => {
    if (done) { setVisual("done"); return; }
    if (active) {
      setVisual("filling");
      const id = window.setTimeout(() => setVisual("processing"), 520);
      return () => window.clearTimeout(id);
    }
    if (!active && !done) setVisual("idle");
    return undefined;
  }, [active, done]);
  return <button type="button" className={`order-flow-button ${visual}`} onClick={onClick} disabled={disabled || active || done}>
    <span className="order-flow-fill"/><span className="order-flow-progress"/>
    <span className="order-flow-label">
      {visual === "idle" && <>{children} <b>→</b></>}
      {(visual === "filling" || visual === "processing") && <><i className="order-spinner"/> Placing order...</>}
      {visual === "done" && <><i className="order-check">✓</i> Order Confirmed</>}
    </span>
  </button>;
}
