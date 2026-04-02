import { Search, Bell, HelpCircle } from 'lucide-react';

function Header() {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects, tasks..."
              className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg w-80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-gray-100 rounded-lg">
            <Bell className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded-lg">
            <HelpCircle className="w-4 h-4 text-gray-600" />
          </button>
          <div className="w-8 h-8 bg-purple-600 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

export default Header;