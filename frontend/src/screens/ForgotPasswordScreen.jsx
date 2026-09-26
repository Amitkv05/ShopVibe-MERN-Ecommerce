import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import Button from "@/components/reusable/Button";
import Input from "@/components/reusable/Input";
export default function ForgotPasswordScreen() {
    const { setPage, showToast } = useStore();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    async function submit(e) { e.preventDefault(); setLoading(true); try {
        const d = await api("/forgot/password", { method: "POST", body: { email: email.trim().toLowerCase() } });
        setMessage(d.message || "If the account exists, a reset link was sent.");
    }
    catch (e) {
        showToast(e instanceof Error ? e.message : "Unable to request reset", "error");
    }
    finally {
        setLoading(false);
    } }
    return <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-6"><div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-xl p-8"><button onClick={() => setPage("login")} className="text-sm text-gray-500 flex items-center gap-2 mb-6"><ArrowLeft size={16}/> Back to sign in</button><h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1><p className="text-gray-500 mt-2 mb-6">Enter your email and we&apos;ll send a secure reset link.</p><form onSubmit={submit} className="space-y-4"><Input label="Email Address" type="email" required value={email} onChange={e => setEmail(e.target.value)} leftIcon={<Mail size={16}/>} placeholder="you@example.com"/>{message && <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm">{message}</div>}<Button type="submit" fullWidth loading={loading}>Send reset link</Button></form></div></div>;
}
