import { useStore } from "@/lib/store";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import clsx from "clsx";
const icons = {
    success: <CheckCircle size={18} className="text-emerald-500"/>,
    error: <AlertCircle size={18} className="text-red-500"/>,
    info: <Info size={18} className="text-blue-500"/>,
};
const colors = {
    success: "bg-white border-emerald-200",
    error: "bg-white border-red-200",
    info: "bg-white border-blue-200",
};
export default function ToastContainer() {
    const { toasts, removeToast } = useStore();
    return (<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (<div key={t.id} className={clsx("flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl shadow-black/10 min-w-[280px] max-w-sm pointer-events-auto", "animate-in slide-in-from-bottom-4 duration-300", colors[t.type])}>
          {icons[t.type]}
          <span className="flex-1 text-sm font-medium text-gray-800">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16}/>
          </button>
        </div>))}
    </div>);
}
