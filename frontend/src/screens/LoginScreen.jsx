import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, ShoppingBag, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import Button from "@/components/reusable/Button";
import Input from "@/components/reusable/Input";
export default function LoginScreen() {
    const { login, setPage, showToast, user } = useStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const validate = () => {
        const e = {};
        if (!email)
            e.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(email))
            e.email = "Invalid email format";
        if (!password)
            e.password = "Password is required";
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
            await login(email.trim().toLowerCase(), password);
            const next = typeof window !== "undefined" ? sessionStorage.getItem("shopvibe_after_login") : null;
            if (typeof window !== "undefined")
                sessionStorage.removeItem("shopvibe_after_login");
            setPage(next === "checkout" ? "checkout" : "home");
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Login failed";
            setErrors({ password: message });
            showToast(message, "error");
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (<div key={i} className="absolute rounded-full bg-white/5" style={{
                width: `${150 + i * 80}px`,
                height: `${150 + i * 80}px`,
                top: `${10 + i * 12}%`,
                left: `${-20 + i * 15}%`,
            }}/>))}
        </div>
        <div className="relative text-white text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <ShoppingBag size={40} className="text-white"/>
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome to ShopVibe</h1>
          <p className="text-violet-200 text-lg mb-10 max-w-sm mx-auto">
            Your ultimate fashion destination with thousands of styles and deals.
          </p>
          <div className="grid grid-cols-3 gap-6">
            {[
            { label: "Products", value: "50K+" },
            { label: "Brands", value: "200+" },
            { label: "Happy Customers", value: "1M+" },
        ].map((stat) => (<div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-violet-300 mt-1">{stat.label}</div>
              </div>))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-200">
                <ShoppingBag size={24} className="text-white"/>
              </div>
              <span className="text-2xl font-bold text-gray-900">ShopVibe</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
              <p className="text-gray-500 mt-1">Welcome back! Please enter your details.</p>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {["Google", "Apple"].map((provider) => (<button key={provider} className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <span>{provider === "Google" ? "🌐" : "🍎"}</span>
                  {provider}
                </button>))}
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"/>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-sm text-gray-400">or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email Address" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }} placeholder="you@example.com" error={errors.email} leftIcon={<Mail size={16}/>}/>

              <Input label="Password" type={showPw ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }} placeholder="••••••••" error={errors.password} leftIcon={<Lock size={16}/>} rightIcon={<button type="button" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>}/>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded accent-violet-600"/>
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button type="button" onClick={() => setPage("forgot")} className="text-sm text-violet-600 hover:text-violet-800 font-medium">
                  Forgot password?
                </button>
              </div>

              <Button type="submit" fullWidth size="lg" loading={loading} iconRight={<ArrowRight size={18}/>}>
                Sign In
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don&apos;t have an account?{" "}
              <button onClick={() => setPage("register")} className="text-violet-600 font-semibold hover:text-violet-800">
                Create account
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
