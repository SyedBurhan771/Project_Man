import { Building2, Calendar, Clock, DollarSign, Sparkles, ArrowRight, MoreVertical } from 'lucide-react';

function ProjectCard({ project }) {
  const getStatusColor = (status) => {
    const colors = {
      'In Progress': 'bg-green-500',
      'Planning': 'bg-purple-500',
      'Delayed': 'bg-red-500',
      'Completed': 'bg-blue-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${project.categoryColor}`}></div>
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
            {project.code}
          </span>
        </div>
        <button className="p-0.5 hover:bg-gray-100 rounded">
          <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {/* Name */}
      <h3 className="font-bold text-gray-900 mb-2 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
        {project.name}
      </h3>

      {/* Info */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Building2 className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{project.customer}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Calendar className="w-3 h-3 flex-shrink-0" />
          <span>Due {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Status + Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(project.status)}`}></div>
            <span className="text-xs font-medium text-gray-700">{project.status}</span>
          </div>
          <span className="text-xs font-bold text-indigo-700">{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Time & Budget mini bars */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 flex items-center gap-1">
          <Clock className="w-3 h-3 text-blue-600" />
          <div className="flex-1 h-1 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${project.timeProgress}%` }}></div>
          </div>
          <span className="text-xs font-semibold text-blue-700">{project.timeProgress}%</span>
        </div>
        <div className="flex-1 flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-green-600" />
          <div className="flex-1 h-1 bg-green-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-600 rounded-full" style={{ width: `${project.budgetProgress}%` }}></div>
          </div>
          <span className="text-xs font-semibold text-green-700">{project.budgetProgress}%</span>
        </div>
      </div>

      {/* Tags + Avatars */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          {project.priority === 'High' && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">H</span>
          )}
          {project.aiGenerated && (
            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-semibold flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />AI
            </span>
          )}
          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
            {project.taskCount}T
          </span>
        </div>

        <div className="flex -space-x-1">
          {project.avatars.slice(0, 3).map((avatar, idx) => (
            <div
              key={idx}
              className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border border-white flex items-center justify-center text-white text-xs font-bold"
            >
              {avatar.slice(0, 1)}
            </div>
          ))}
          {project.avatars.length > 3 && (
            <div className="w-5 h-5 rounded-full bg-gray-300 border border-white flex items-center justify-center text-gray-700 text-xs font-bold">
              +{project.avatars.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* View Button */}
      <button className="w-full mt-2 flex items-center justify-center gap-1 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors text-xs">
        <span>View Details</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

export default ProjectCard;