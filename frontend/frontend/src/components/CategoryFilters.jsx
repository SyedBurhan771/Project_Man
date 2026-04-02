import { FolderOpen, Megaphone, Wallet, Code, Server } from 'lucide-react'

const categories = [
  { id: 'all', name: 'All Projects', icon: FolderOpen, color: 'bg-gray-500' },
  { id: 'marketing', name: 'Marketing', icon: Megaphone, color: 'bg-pink-500' },
  { id: 'finance', name: 'Finance', icon: Wallet, color: 'bg-green-500' },
  { id: 'development', name: 'Development', icon: Code, color: 'bg-blue-500' },
  { id: 'it', name: 'IT Infrastructure', icon: Server, color: 'bg-purple-500' },
]

function CategoryFilters({ selected, onSelect, projectCount }) {
  return (
    <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-2">
      {categories.map((cat) => {
        const Icon = cat.icon
        const isActive = selected === cat.id
        const count = cat.id === 'all' ? null : projectCount[cat.id] || 0

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              isActive
                ? `${cat.color} text-white shadow-md`
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{cat.name}</span>
            {count !== null && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default CategoryFilters