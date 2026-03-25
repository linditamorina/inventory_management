import { LayoutDashboard, Package, ShoppingCart, Truck, BarChart3, Settings } from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Package, label: 'Inventory', active: false },
  { icon: ShoppingCart, label: 'Sales', active: false },
  { icon: Truck, label: 'Purchases', active: false },
  { icon: BarChart3, label: 'Reports', active: false },
  { icon: Settings, label: 'Settings', active: false },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#1a1c1e] text-gray-400 flex flex-col min-h-screen">
      <div className="p-6 flex items-center gap-3 text-white">
        <div className="bg-red-600 p-2 rounded-lg">
          <Package size={24} />
        </div>
        <span className="font-bold text-xl tracking-tight">Inventory</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
              item.active ? 'bg-red-600 text-white' : 'hover:bg-gray-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}