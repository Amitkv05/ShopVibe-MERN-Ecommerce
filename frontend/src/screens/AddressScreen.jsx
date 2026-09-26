import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, CheckCircle, ArrowLeft, Edit2 } from "lucide-react";
import { useStore } from "@/lib/store";
import Button from "@/components/reusable/Button";
import Input from "@/components/reusable/Input";
export default function AddressScreen() {
    const { addresses, addAddress, updateAddress, removeAddress, setDefaultAddress, setPage, refreshAddresses, isLoggedIn } = useStore();
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({
        name: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        zip: "",
        country: "India",
        isDefault: false,
    });
    useEffect(() => { if (isLoggedIn)
        void refreshAddresses(); }, [isLoggedIn, refreshAddresses]);
    const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
    const handleSave = async () => {
        if (editId)
            await updateAddress(editId, form);
        else
            await addAddress(form);
        setShowForm(false);
        setEditId(null);
        setForm({ name: "", phone: "", line1: "", line2: "", city: "", state: "", zip: "", country: "India", isDefault: false });
    };
    return (<div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setPage("profile")} className="p-2 rounded-xl border border-gray-200 hover:bg-white transition-all">
            <ArrowLeft size={20} className="text-gray-600"/>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shipping Addresses</h1>
            <p className="text-gray-500 text-sm">{addresses.length} saved addresses</p>
          </div>
        </div>

        {/* Address Cards */}
        <div className="space-y-4 mb-6">
          {addresses.map((addr) => (<div key={addr.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${addr.isDefault ? "bg-violet-100" : "bg-gray-100"}`}>
                    <MapPin size={18} className={addr.isDefault ? "text-violet-600" : "text-gray-500"}/>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{addr.name}</p>
                      {addr.isDefault && (<span className="flex items-center gap-1 text-[10px] text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full font-semibold">
                          <CheckCircle size={10}/>
                          Default
                        </span>)}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{addr.line1}{addr.line2 && `, ${addr.line2}`}</p>
                    <p className="text-sm text-gray-600">{addr.city}, {addr.state} {addr.zip}</p>
                    <p className="text-sm text-gray-600">{addr.country}</p>
                    <p className="text-sm text-gray-500 mt-1">📞 {addr.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => {
                setForm({ name: addr.name, phone: addr.phone, line1: addr.line1, line2: addr.line2, city: addr.city, state: addr.state, zip: addr.zip, country: addr.country, isDefault: addr.isDefault });
                setEditId(addr.id);
                setShowForm(true);
            }} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                    <Edit2 size={16}/>
                  </button>
                  {!addr.isDefault && (<button onClick={() => removeAddress(addr.id)} className="p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16}/>
                    </button>)}
                </div>
              </div>
              {!addr.isDefault && (<button onClick={() => setDefaultAddress(addr.id)} className="mt-3 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors">
                  Set as default
                </button>)}
            </div>))}
        </div>

        {/* Add Address Form */}
        {showForm ? (<div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-5">{editId ? "Edit" : "Add New"} Address</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Full Name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Alex Johnson"/>
                <Input label="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+1 (555) 000-0000"/>
              </div>
              <Input label="Address Line 1" value={form.line1} onChange={(e) => update("line1", e.target.value)} placeholder="123 Main Street"/>
              <Input label="Address Line 2 (Optional)" value={form.line2} onChange={(e) => update("line2", e.target.value)} placeholder="Apt, Suite, Unit..."/>
              <div className="grid grid-cols-3 gap-4">
                <Input label="City" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="New York"/>
                <Input label="State" value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="NY"/>
                <Input label="ZIP Code" value={form.zip} onChange={(e) => update("zip", e.target.value)} placeholder="10001"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                <select value={form.country} onChange={(e) => update("country", e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-violet-500">
                  {["India", "United States", "Canada", "United Kingdom", "Australia", "Germany", "France"].map((c) => (<option key={c}>{c}</option>))}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => update("isDefault", e.target.checked)} className="accent-violet-600"/>
                <span className="text-sm text-gray-600">Set as default address</span>
              </label>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); }} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  Save Address
                </Button>
              </div>
            </div>
          </div>) : (<button onClick={() => setShowForm(true)} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-all duration-200 flex items-center justify-center gap-2 font-medium">
            <Plus size={20}/>
            Add New Address
          </button>)}
      </div>
    </div>);
}
