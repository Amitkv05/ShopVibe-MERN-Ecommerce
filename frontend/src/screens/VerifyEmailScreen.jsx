import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import Button from "@/components/reusable/Button";
const requests = new Map();
function verifyOnce(token) { if (!requests.has(token))
    requests.set(token, api(`/verify-email/${token}`)); return requests.get(token); }
export default function VerifyEmailScreen() { const { setPage } = useStore(); const token = typeof window !== "undefined" ? decodeURIComponent(window.location.pathname.split("/")[2] || "") : ""; const [state, setState] = useState({ loading: true, ok: false, message: "Verifying your email..." }); useEffect(() => { let active = true; verifyOnce(token).then((d) => active && setState({ loading: false, ok: true, message: d.message || "Email verified successfully" })).catch(e => active && setState({ loading: false, ok: false, message: e instanceof Error ? e.message : "Verification failed" })); return () => { active = false; }; }, [token]); return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6"><div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-xl p-8 text-center">{state.loading ? <div className="animate-pulse text-violet-600 font-semibold">Verifying…</div> : state.ok ? <CheckCircle size={56} className="mx-auto text-emerald-500"/> : <AlertCircle size={56} className="mx-auto text-red-500"/>}<h1 className="text-2xl font-bold mt-5">{state.ok ? "Email verified" : "Verification link issue"}</h1><p className="text-gray-500 mt-2 mb-6">{state.message}</p><Button onClick={() => setPage("login")} fullWidth>Continue to sign in</Button></div></div>; }
