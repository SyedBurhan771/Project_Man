import { useState } from 'react'
import { ChevronDown, ChevronRight, MoreVertical, Sparkles, TrendingUp, FileText, DollarSign, Users, Target, Building2, Calendar } from 'lucide-react'
import LifecycleTimeline from './LifecycleTimeline'
import GeneralTab from './GeneralTab'
import FinancialTab from './FinancialTab'
import TeamTab from './TeamTab'
import TasksTab from './TasksTab'
import ResourcesTab from './ResourcesTab'

function ProjectAccordion({ project }) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('lifecycle')

  const tabs = [
    { key: 'lifecycle', label: 'Lifecycle Phases', icon: TrendingUp },
    { key: 'general', label: 'General', icon: FileText },
    { key: 'financial', label: 'Financial', icon: DollarSign },
    { key: 'team', label: 'Team', icon: Users },
    { key: 'resources', label: 'Resources', icon: Users },
    { key: 'tasks', label: 'Tasks', icon: Target }
  ]

  const getStatusColor = (status) => {
    const colors = {
      'In Progress': 'bg-green-500',
      'Planning': 'bg-purple-500',
      'Delayed': 'bg-red-500'
    }
    return colors[status] || 'bg-gray-500'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <button className="p-0.5 hover:bg-gray-200 rounded">
            {expanded ? <ChevronDown className="w-5 h-5 text-gray-600" /> : <ChevronRight className="w-5 h-5 text-gray-600" />}
          </button>

          <div className={`w-2 h-2 rounded-full ${project.categoryColor}`}></div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-bold text-gray-900">{project.name}</h2>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{project.code}</span>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(project.status)}`}></div>
                    <span className="text-xs font-medium text-gray-700">{project.status}</span>
                  </div>
                  {/* Current phase badge */}
                  {/* <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${lifecyclePhases.find(p => p.id === project.currentPhase)?.color || 'bg-gray-500'}`}>
                    {lifecyclePhases.find(p => p.id === project.currentPhase)?.name || 'Unknown'}
                  </span> */}
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${
  project.currentPhase === 'initiation' ? 'bg-indigo-500' :
  project.currentPhase === 'planning' ? 'bg-blue-500' :
  project.currentPhase === 'execution' ? 'bg-orange-500' :
  project.currentPhase === 'monitoring' ? 'bg-yellow-500' :
  project.currentPhase === 'testing' ? 'bg-purple-500' :
  project.currentPhase === 'deployment' ? 'bg-green-500' :
  project.currentPhase === 'closure' ? 'bg-gray-500' :
  'bg-gray-500'
}`}>
  {project.currentPhase ? project.currentPhase.charAt(0).toUpperCase() + project.currentPhase.slice(1) : 'Unknown'}
</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {project.customer.name}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due: {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span>•</span>
                  <span>{project.subtasks.length} Sub Tasks</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {project.aiGenerated && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-semibold flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI
                  </span>
                )}
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                  {project.priority}
                </span>
                <button className="p-0.5 hover:bg-gray-100 rounded">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="bg-gray-50">
          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white">
            <div className="px-4 flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                      activeTab === tab.key
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-4">
            {activeTab === 'lifecycle' && <LifecycleTimeline project={project} />}
            {activeTab === 'general' && <GeneralTab project={project} />}
            {activeTab === 'financial' && <FinancialTab project={project} />}
            {activeTab === 'team' && <TeamTab project={project} />}
            {activeTab === 'resources' && <ResourcesTab project={project} />}
            {activeTab === 'tasks' && <TasksTab project={project} />}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectAccordion