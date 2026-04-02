import { Building2 } from 'lucide-react'

function TaskCard({ task }) {
  const getPriorityColor = (priority) => {
    const colors = {
      High: 'bg-red-100 text-red-700',
      Medium: 'bg-yellow-100 text-yellow-700',
      Low: 'bg-green-100 text-green-700'
    }
    return colors[priority] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>
      
      {/* Description */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {task.description}
      </p>

      {/* Project Info */}
      <div className="mb-3 space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-gray-500">Project:</span>
          <span className="font-semibold text-gray-700">{task.project.name}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-gray-500">Code:</span>
          <span className="font-semibold text-gray-700">{task.project.code}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Building2 className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-gray-700">{task.customer}</span>
        </div>
      </div>

      {/* Priority */}
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>

        {/* Assignees */}
        <div className="flex -space-x-2">
          {task.assignees.map((assignee, idx) => (
            <div
              key={idx}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-white flex items-center justify-center text-white text-xs font-semibold"
              title={assignee.name}
            >
              {assignee.avatar}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TaskCard