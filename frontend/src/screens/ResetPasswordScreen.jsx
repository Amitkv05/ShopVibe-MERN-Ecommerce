import { useState } from "react";
import { Lock } from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import Button from "@/components/reusable/Button";
import Input from "@/components/reusable/Input";
export default function ResetPasswordScreen() {
    const { setPage, showToast, updateUser } = useStore();
    const token = typeof window !== "undefined" ? decodeURIComponent(window.location.pathname.split("/")[2] || "") : "";
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    async function submit(e) { e.preventDefault(); if (password !== confirmPassword) {
        showToast("Passwords do not match", "error");
        return;
    } setLoading(true); try {
        const d = await api(`/reset/${token}`, { method: "PUT", body: { password, confirmPassword } });
        if (d.user)
            updateUser(d.user);
        showToast("Password reset successful", "success");
        setPage("profile");
    }
    catch (e) {
        showToast(e instanceof Error ? e.message : "Reset failed", "error");
    }
    finally {
        setLoading(false);
    } }
    return <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-6"><div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-xl p-8"><h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1><p className="text-gray-500 mt-2 mb-6">Use at least 8 characters.</p><form onSubmit={submit} className="space-y-4"><Input label="New password" type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} leftIcon={<Lock size={16}/>}/><Input label="Confirm password" type="password" minLength={8} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} leftIcon={<Lock size={16}/>}/><Button type="submit" fullWidth loading={loading}>Update password</Button></form></div></div>;
}
