import { Search, Bell, Settings as SettingsIcon, HelpCircle, User } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-8">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search items..." 
          className="w-full bg-gray-100 border-none rounded-md py-2 pl-10 pr-4 focus:ring-2 focus:ring-red-500 outline-none text-sm"
        />
      </div>
      
      <div className="flex items-center gap-5 text-gray-500">
        <Bell size={20} className="cursor-pointer hover:text-red-600" />
        <SettingsIcon size={20} className="cursor-pointer hover:text-red-600" />
        <HelpCircle size={20} className="cursor-pointer hover:text-red-600" />
        <div className="flex items-center gap-2 pl-4 border-l cursor-pointer">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">LM</div>
          <span className="text-sm font-medium text-gray-700">Lindita M.</span>
        </div>
      </div>
    </header>
  );
}