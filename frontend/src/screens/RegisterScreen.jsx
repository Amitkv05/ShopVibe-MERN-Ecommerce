import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Phone, ShoppingBag, ArrowRight, CheckCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import Button from "@/components/reusable/Button";
import Input from "@/components/reusable/Input";
export default function RegisterScreen() {
    const { register, setPage, showToast } = useStore();
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [errors, setErrors] = useState({});
    const update = (key, value) => {
        setForm((f) => ({ ...f, [key]: value }));
        setErrors((e) => ({ ...e, [key]: "" }));
    };
    const validate = () => {
        const e = {};
        if (!form.name.trim())
            e.name = "Full name is required";
        if (!form.email)
            e.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(form.email))
            e.email = "Invalid email";
        if (!form.password)
            e.password = "Password is required";
        else if (form.password.length < 8)
            e.password = "Min 8 characters";
        if (!form.confirm)
            e.confirm = "Please confirm your password";
        else if (form.confirm !== form.password)
            e.confirm = "Passwords do not match";
        if (!agreed)
            e.agreed = "You must agree to the terms";
        return e;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }
        setLoading(true);
        try {
            await register(form.name.trim(), form.email.trim().toLowerCase(), form.password);
            setPage("profile");
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Registration failed";
            setErrors((prev) => ({ ...prev, email: message }));
            showToast(message, "error");
        }
        finally {
            setLoading(false);
        }
    };
    const passwordStrength = () => {
        const p = form.password;
        if (!p)
            return { score: 0, label: "", color: "" };
        let score = 0;
        if (p.length >= 8)
            score++;
        if (/[A-Z]/.test(p))
            score++;
        if (/[0-9]/.test(p))
            score++;
        if (/[^A-Za-z0-9]/.test(p))
            score++;
        const levels = [
            { label: "Weak", color: "bg-red-400" },
            { label: "Fair", color: "bg-amber-400" },
            { label: "Good", color: "bg-yellow-400" },
            { label: "Strong", color: "bg-emerald-400" },
            { label: "Very Strong", color: "bg-emerald-500" },
        ];
        return { score, ...levels[score] };
    };
    const strength = passwordStrength();
    return (<div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (<div key={i} className="absolute rounded-full bg-white/5" style={{ width: `${150 + i * 80}px`, height: `${150 + i * 80}px`, top: `${10 + i * 12}%`, left: `${-20 + i * 15}%` }}/>))}
        </div>
        <div className="relative text-white text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <ShoppingBag size={40} className="text-white"/>
          </div>
          <h1 className="text-4xl font-bold mb-4">Join ShopVibe</h1>
          <p className="text-violet-200 text-lg mb-10">Create your free account and unlock exclusive deals.</p>
          <div className="space-y-4">
            {[
            "Free shipping on your first order",
            "Exclusive member-only discounts",
            "Early access to new collections",
            "Easy returns & exchanges",
        ].map((benefit) => (<div key={benefit} className="flex items-center gap-3 text-left">
                <CheckCircle size={20} className="text-emerald-400 shrink-0"/>
                <span className="text-violet-100">{benefit}</span>
              </div>))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-200">
                <ShoppingBag size={24} className="text-white"/>
              </div>
              <span className="text-2xl font-bold text-gray-900">ShopVibe</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
              <p className="text-gray-500 mt-1">Join thousands of happy shoppers.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full Name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Alex Johnson" error={errors.name} leftIcon={<User size={16}/>}/>
              <Input label="Email Address" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" error={errors.email} leftIcon={<Mail size={16}/>}/>
              <Input label="Phone Number" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+1 (555) 000-0000" leftIcon={<Phone size={16}/>}/>

              <div>
                <Input label="Password" type={showPw ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="••••••••" error={errors.password} leftIcon={<Lock size={16}/>} rightIcon={<button type="button" onClick={() => setShowPw(!showPw)}>
                      {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>}/>
                {form.password && (<div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[...Array(4)].map((_, i) => (<div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < strength.score ? strength.color : "bg-gray-100"}`}/>))}
                    </div>
                    <p className="text-xs text-gray-500">Strength: <span className="font-medium">{strength.label}</span></p>
                  </div>)}
              </div>

              <Input label="Confirm Password" type="password" value={form.confirm} onChange={(e) => update("confirm", e.target.value)} placeholder="••••••••" error={errors.confirm} leftIcon={<Lock size={16}/>}/>

              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors((p) => ({ ...p, agreed: "" })); }} className="w-4 h-4 mt-0.5 rounded accent-violet-600 shrink-0"/>
                  <span className="text-sm text-gray-600">
                    I agree to the{" "}
                    <button type="button" className="text-violet-600 font-medium hover:underline">Terms of Service</button>
                    {" "}and{" "}
                    <button type="button" className="text-violet-600 font-medium hover:underline">Privacy Policy</button>
                  </span>
                </label>
                {errors.agreed && <p className="text-xs text-red-500 mt-1">{errors.agreed}</p>}
              </div>

              <Button type="submit" fullWidth size="lg" loading={loading} iconRight={<ArrowRight size={18}/>}>
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <button onClick={() => setPage("login")} className="text-violet-600 font-semibold hover:text-violet-800">
                Sign in
              </button>
            </p>
          </div>

          <button onClick={() => setPage("home")} className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Continue as guest
          </button>
        </div>
      </div>
    </div>);
}
