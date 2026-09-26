import { ShoppingBag, Mail, Phone, MapPin } from "lucide-react";
import { useStore } from "@/lib/store";
export default function Footer() {
    const { setPage } = useStore();
    return (<footer className="bg-gray-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <ShoppingBag size={20} className="text-white"/>
              </div>
              <span className="text-xl font-bold text-white">ShopVibe</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Your premier fashion destination. Discover the latest trends, exclusive brands, 
              and unbeatable deals all in one place.
            </p>
            <div className="flex gap-3">
              {["IG", "TW", "FB", "YT"].map((label) => (<button key={label} className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-violet-600 flex items-center justify-center transition-colors duration-200 text-xs font-bold">
                  {label}
                </button>))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {[
            { label: "Home", page: "home" },
            { label: "All Products", page: "shop" },
            { label: "My Orders", page: "orders" },
            { label: "My Wishlist", page: "wishlist" },
            { label: "My Profile", page: "profile" },
        ].map((item) => (<li key={item.label}>
                  <button onClick={() => setPage(item.page)} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {item.label}
                  </button>
                </li>))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4">Categories</h3>
            <ul className="space-y-3">
              {["Men's Fashion", "Women's Fashion", "Kids", "Shoes", "Accessories", "Sports"].map((item) => (<li key={item}>
                  <button onClick={() => setPage("categories")} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {item}
                  </button>
                </li>))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-violet-400 mt-0.5 shrink-0"/>
                <span className="text-sm text-gray-400">123 Fashion Ave, New York, NY 10001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-violet-400 shrink-0"/>
                <span className="text-sm text-gray-400">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-violet-400 shrink-0"/>
                <span className="text-sm text-gray-400">hello@shopvibe.com</span>
              </li>
            </ul>
            <div className="mt-6 p-4 bg-gray-900 rounded-xl">
              <p className="text-sm font-medium text-white mb-2">Newsletter</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Enter email..." className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"/>
                <button className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">
                  Go
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">© 2025 ShopVibe. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (<button key={item} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                {item}
              </button>))}
          </div>
          <div className="flex items-center gap-2">
            {["VISA", "MC", "PayPal", "Apple Pay"].map((pay) => (<span key={pay} className="px-2 py-1 bg-gray-800 rounded text-[10px] font-semibold text-gray-400">
                {pay}
              </span>))}
          </div>
        </div>
      </div>
    </footer>);
}
