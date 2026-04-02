import { Filter, ChevronDown, SlidersHorizontal, Plus, MoreVertical } from 'lucide-react'
import AICreateProject from '../components/AICreateProject'
import TaskCard from '../components/TaskCard'

const columns = [
  { id: 'todo', title: 'To do', dotColor: 'bg-gray-500' },
  { id: 'in-progress', title: 'In progress', dotColor: 'bg-blue-500' },
  { id: 'done', title: 'Done', dotColor: 'bg-green-500' }
]

const tasks = [
    {
      id: 'task-1',
      title: 'Hero section',
      description: 'Create a design system for a hero section in 2 different variants. Create a simple presentation with these components.',
      column: 'todo',
      project: {
        name: 'Design System Overhaul',
        code: 'PJM-654',
        category: 'DESIGN SYSTEM',
        color: 'bg-green-500'
      },
      customer: 'TechVision Ltd',
      assignees: [
        { avatar: 'MC', name: 'Michael Chen' },
        { avatar: 'ER', name: 'Emma Rodriguez' }
      ],
      priority: 'High',
      dueDate: '2026-02-08',
      aiGenerated: false,
      linkedToSage: true,
      timeSpent: 2,
      estimatedTime: 4,
      expense: 200,
      budgetedExpense: 400,
      subtasks: { completed: 1, total: 3 },
      comments: 2,
      attachments: 1
    },
    {
      id: 'task-2',
      title: 'Typography change',
      description: 'Modify typography and styling of text placed on 6 screens of the website design. Prepare a documentation.',
      column: 'todo',
      project: {
        name: 'Customer Portal Redesign',
        code: 'PJM-445',
        category: 'TYPOGRAPHY',
        color: 'bg-blue-500'
      },
      customer: 'Innovation Corp',
      assignees: [
        { avatar: 'ER', name: 'Emma Rodriguez' }
      ],
      priority: 'Medium',
      dueDate: '2026-02-10',
      aiGenerated: false,
      linkedToSage: true,
      timeSpent: 0,
      estimatedTime: 3,
      expense: 0,
      budgetedExpense: 300,
      subtasks: { completed: 0, total: 2 },
      comments: 0,
      attachments: 0
    },
    {
      id: 'task-3',
      title: 'Implement design screens',
      description: 'Our designers created 8 screens for a website that needs to be implemented by our dev team.',
      column: 'in-progress',
      project: {
        name: 'Customer Portal Redesign',
        code: 'PJM-445',
        category: 'DEVELOPMENT',
        color: 'bg-pink-500'
      },
      customer: 'Innovation Corp',
      assignees: [
        { avatar: 'MC', name: 'Michael Chen' },
        { avatar: 'LC', name: 'Lisa Chen' }
      ],
      priority: 'High',
      dueDate: '2026-02-06',
      aiGenerated: true,
      linkedToSage: true,
      timeSpent: 5,
      estimatedTime: 8,
      expense: 500,
      budgetedExpense: 800,
      subtasks: { completed: 4, total: 8 },
      comments: 5,
      attachments: 3
    },
    {
      id: 'task-4',
      title: 'Fix bugs in the CSS code',
      description: 'Fix small bugs that are essential to prepare for the next release that will happen this quarter.',
      column: 'done',
      project: {
        name: 'Phoenix Initiative',
        code: 'PJM-789',
        category: 'DEVELOPMENT',
        color: 'bg-pink-500'
      },
      customer: 'ABC Corporation',
      assignees: [
        { avatar: 'MC', name: 'Michael Chen' },
        { avatar: 'ER', name: 'Emma Rodriguez' }
      ],
      priority: 'High',
      dueDate: '2026-02-03',
      aiGenerated: false,
      linkedToSage: true,
      timeSpent: 4,
      estimatedTime: 4,
      expense: 400,
      budgetedExpense: 400,
      subtasks: { completed: 3, total: 3 },
      comments: 8,
      attachments: 2
    },
    {
      id: 'task-5',
      title: 'Proofread final text',
      description: 'The text provided by marketing department needs to be proofread so that we make sure that it fits into our design.',
      column: 'done',
      project: {
        name: 'Phoenix Initiative',
        code: 'PJM-789',
        category: 'TYPOGRAPHY',
        color: 'bg-blue-500'
      },
      customer: 'ABC Corporation',
      assignees: [
        { avatar: 'ER', name: 'Emma Rodriguez' }
      ],
      priority: 'Low',
      dueDate: '2026-02-02',
      aiGenerated: false,
      linkedToSage: true,
      timeSpent: 2,
      estimatedTime: 2,
      expense: 200,
      budgetedExpense: 200,
      subtasks: { completed: 1, total: 1 },
      comments: 3,
      attachments: 1
    },
    {
      id: 'task-6',
      title: 'Responsive design',
      description: 'All designs need to be responsive. The requirement is that it fits all web and mobile screens.',
      column: 'done',
      project: {
        name: 'Design System Overhaul',
        code: 'PJM-654',
        category: 'DESIGN SYSTEM',
        color: 'bg-green-500'
      },
      customer: 'TechVision Ltd',
      assignees: [
        { avatar: 'MC', name: 'Michael Chen' },
        { avatar: 'ER', name: 'Emma Rodriguez' }
      ],
      priority: 'Medium',
      dueDate: '2026-02-01',
      aiGenerated: true,
      linkedToSage: true,
      timeSpent: 6,
      estimatedTime: 6,
      expense: 600,
      budgetedExpense: 600,
      subtasks: { completed: 4, total: 4 },
      comments: 6,
      attachments: 5
    }
  ];
function getTasksInColumn(columnId) {
  return tasks.filter(t => t.column === columnId)
}

function Board() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Board</h1>
          <p className="text-sm text-gray-600 mt-1">Manage tasks across all projects</p>
        </div>
        <div className="flex items-center gap-3">
          <AICreateProject buttonText="AI Create Sprint" />
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="font-medium">Filters</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <span>This week</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Permanent Filter Dropdowns Row */}
      <div className="flex items-center gap-4 mb-6">
        <select className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>All Projects</option>
          <option>Phoenix Initiative</option>
          <option>Design System Overhaul</option>
          <option>Customer Portal Redesign</option>
        </select>
        <select className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>All Priorities</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <select className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>All Team Members</option>
          <option>Michael Chen</option>
          <option>Emma Rodriguez</option>
          <option>Sarah Mitchell</option>
        </select>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-3 gap-6">
        {columns.map((column) => {
          const columnTasks = getTasksInColumn(column.id)

          return (
            <div key={column.id} className="bg-gray-100 rounded-xl p-4">
              {/* Column Header with dot */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${column.dotColor}`}></div>
                  <h2 className="font-bold text-gray-900">{column.title}</h2>
                  <span className="px-2 py-0.5 bg-white rounded-full text-xs font-medium text-gray-600">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Board