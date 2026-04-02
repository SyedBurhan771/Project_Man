import { Users } from 'lucide-react'

function TeamTab({ project }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Team ({project.assignedEmployees.length})
      </h3>
      <div className="space-y-2">
        {project.assignedEmployees.map((employee) => (
          <div key={employee} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {employee.split(' ').map(n => n[0]).join('')}
            </div>
            <p className="text-sm font-semibold text-gray-900">{employee}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TeamTab