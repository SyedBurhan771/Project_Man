import React, { useState, useMemo } from 'react';
import { 
  Brain, 
  Link as LinkIcon, 
  ArrowRight, 
  User, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  Circle,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  UserCheck,
  Timer,
  BadgeCheck,
  Calendar,
  Pencil,
  CornerDownRight,
  FileText,
  Briefcase,
  ChevronUp,
  Settings,
  Tag,
  BarChart2,
  Link2,
  Layers,
  TrendingUp,
  Hash,
  AlertCircle,
  Package
} from 'lucide-react';
import API_URL from '../config';
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const GET_ALL_TASKS = gql`
  query GetAllTasks {
    allTasks {
      id
      title
      description
      status
      estimatedDays
      estimatedHours
      estimatedBudget
      personResponsible
      dueDate
      progress
      parent {
        id
      }
      subtasks {
        id
        title
        description
        status
        estimatedDays
        estimatedHours
        estimatedBudget
        personResponsible
        dueDate
        progress
        parent {
          id
        }
      }
      project {
        id
      }
    }
  }
`;

export const TEAM_MEMBERS = [
  { id: 1, name: 'Sarah Mitchell',   role: 'Senior Developer',   hourlyRate: 75,  avatar: 'SM', color: 'from-violet-500 to-purple-600' },
  { id: 2, name: 'Michael Chen',     role: 'UI/UX Designer',     hourlyRate: 90,  avatar: 'MC', color: 'from-blue-500 to-cyan-500'     },
  { id: 3, name: 'Emma Rodriguez',   role: 'QA Engineer',        hourlyRate: 65,  avatar: 'ER', color: 'from-emerald-500 to-teal-500'  },
  { id: 4, name: 'David Kim',        role: 'Backend Engineer',   hourlyRate: 85,  avatar: 'DK', color: 'from-orange-500 to-amber-500'  },
  { id: 5, name: 'Priya Sharma',     role: 'Project Manager',    hourlyRate: 80,  avatar: 'PS', color: 'from-pink-500 to-rose-500'     },
  { id: 6, name: 'James Okafor',     role: 'DevOps Engineer',    hourlyRate: 95,  avatar: 'JO', color: 'from-indigo-500 to-blue-600'   },
];

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function formatDisplayDateTime(dateStr, timeStr) {
  if (!dateStr) return '—';
  try {
    const dt = new Date(`${dateStr}T${timeStr || '00:00'}`);
    return dt.toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch {
    return `${dateStr} ${timeStr || ''}`;
  }
}

/** Parse DDMMYY → readable */
function parseSageDate(raw) {
  if (!raw || raw.length < 6) return '—';
  const d = raw.slice(0, 2), m = raw.slice(2, 4), y = raw.slice(4, 6);
  return `${d}/${m}/20${y}`;
}

function statusLabel(code) {
  const map = { '1': 'Active', '2': 'Closed', '3': 'Pending', '0': 'Inactive' };
  return map[code] || code;
}

function statusColor(code) {
  const map = {
    '1': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    '2': 'bg-gray-100 text-gray-600 border-gray-200',
    '3': 'bg-amber-100 text-amber-700 border-amber-200',
    '0': 'bg-red-100 text-red-600 border-red-200',
  };
  return map[code] || 'bg-gray-100 text-gray-600 border-gray-200';
}

function categoryIcon(cat) {
  const map = { LABOR: '👷', MATERIAL: '📦', EQUIPMENT: '🔧', SERVICE: '🛠️' };
  return map[cat] || '📋';
}

// ====================== LOG HOURS MODAL ======================
function LogHoursModal({ task, onClose, onSave, existingAssignments = [] }) {
  const [selectedMembers, setSelectedMembers] = useState(existingAssignments.map(a => a.memberId));
  const [hoursMap, setHoursMap] = useState(() => {
    const init = {}; existingAssignments.forEach(a => { init[a.memberId] = a.hours; }); return init;
  });
  const [dateMap, setDateMap] = useState(() => {
    const init = {}; existingAssignments.forEach(a => { init[a.memberId] = a.workDate || todayString(); }); return init;
  });
  const [timeMap, setTimeMap] = useState(() => {
    const init = {}; existingAssignments.forEach(a => { init[a.memberId] = a.workTime || '09:00'; }); return init;
  });

  const toggleMember = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) return prev.filter(id => id !== memberId);
      if (!dateMap[memberId]) setDateMap(d => ({ ...d, [memberId]: todayString() }));
      if (!timeMap[memberId]) setTimeMap(t => ({ ...t, [memberId]: '09:00' }));
      return [...prev, memberId];
    });
  };

  const setField = (map, setMap, memberId, val) => setMap(prev => ({ ...prev, [memberId]: val }));

  const totalCost = selectedMembers.reduce((sum, mId) => {
    const member = TEAM_MEMBERS.find(m => m.id === mId);
    const hours = parseFloat(hoursMap[mId] || 0);
    return sum + (member ? member.hourlyRate * hours : 0);
  }, 0);

  const isValid = selectedMembers.length > 0 && selectedMembers.every(mId =>
    dateMap[mId] && timeMap[mId] && parseFloat(hoursMap[mId] || 0) > 0
  );

  const handleSave = () => {
    const assignments = selectedMembers.map(mId => {
      const member = TEAM_MEMBERS.find(m => m.id === mId);
      const hours  = parseFloat(hoursMap[mId] || 0);
      return {
        memberId: mId, memberName: member.name, memberRole: member.role,
        memberAvatar: member.avatar, memberColor: member.color,
        hourlyRate: member.hourlyRate, hours, cost: member.hourlyRate * hours,
        workDate: dateMap[mId] || todayString(), workTime: timeMap[mId] || '09:00',
      };
    });
    onSave(task.id, assignments);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Timer className="w-5 h-5 text-indigo-200" />
              <span className="text-indigo-200 text-sm font-medium">Log Hours & Assign</span>
            </div>
            <h3 className="text-white font-bold text-lg leading-tight">{task.title}</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white/20 hover:bg-white/30 transition-colors text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[72vh] overflow-y-auto">
          <p className="text-sm text-gray-500 mb-5">Select team members, set the <strong>date</strong> and <strong>time</strong> they will work, and enter the hours.</p>
          <div className="space-y-4">
            {TEAM_MEMBERS.map(member => {
              const isSelected = selectedMembers.includes(member.id);
              const hours = hoursMap[member.id] || '';
              const cost  = isSelected ? member.hourlyRate * parseFloat(hours || 0) : 0;
              const date  = dateMap[member.id]  || todayString();
              const time  = timeMap[member.id]  || '09:00';
              return (
                <div key={member.id} className={`rounded-2xl border-2 transition-all duration-150 ${isSelected ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
                  <div className="flex items-center gap-4 px-4 pt-4 pb-2">
                    <button onClick={() => toggleMember(member.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <div className={`w-10 h-10 bg-gradient-to-br ${member.color} rounded-2xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>{member.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.role} · <span className="text-emerald-600 font-semibold">${member.hourlyRate}/hr</span></p>
                    </div>
                    {isSelected && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Cost</p>
                        <p className="text-sm font-bold text-indigo-700">${cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="px-4 pb-4 pt-1">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Work Date</label>
                          <input type="date" value={date} onChange={e => setField(dateMap, setDateMap, member.id, e.target.value)} className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none focus:border-indigo-500 bg-white" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Start Time</label>
                          <input type="time" value={time} onChange={e => setField(timeMap, setTimeMap, member.id, e.target.value)} className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none focus:border-indigo-500 bg-white" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1 flex items-center gap-1"><Timer className="w-3 h-3" /> Hours</label>
                          <input type="number" min="0" step="0.5" value={hours} onChange={e => setField(hoursMap, setHoursMap, member.id, e.target.value)} placeholder="e.g. 4" className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm font-semibold text-center focus:outline-none focus:border-indigo-500 bg-white" />
                        </div>
                      </div>
                      {date && time && (
                        <div className="mt-2 flex items-center gap-1.5 bg-indigo-100 rounded-xl px-3 py-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="text-xs text-indigo-700 font-medium">Scheduled: {formatDisplayDateTime(date, time)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex items-center justify-between rounded-b-3xl">
          <div>
            <p className="text-xs text-gray-500">Total Cost</p>
            <p className="text-2xl font-bold text-indigo-700">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            {!isValid && selectedMembers.length > 0 && <p className="text-[11px] text-amber-500 mt-0.5">Fill date, time & hours for all selected members</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={!isValid} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:brightness-105 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              <BadgeCheck className="w-4 h-4" />Save Assignment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Check({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AssignedMemberPills({ assignments }) {
  if (!assignments || assignments.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {assignments.map(a => (
        <div key={a.memberId} className="flex flex-col bg-indigo-50 border border-indigo-200 rounded-2xl px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <div className={`w-5 h-5 bg-gradient-to-br ${a.memberColor} rounded-full flex items-center justify-center text-white text-[9px] font-bold`}>{a.memberAvatar}</div>
            <span className="text-xs font-semibold text-indigo-700">{a.memberName}</span>
            <span className="text-xs text-indigo-400">· {a.hours}h · ${a.cost.toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ====================== ADD SUBTASK MODAL ======================
function AddSubtaskModal({ parentTask, project, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedDays, setEstimatedDays] = useState(0);
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [estimatedBudget, setEstimatedBudget] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return alert("Subtask title is required");
    setIsCreating(true);
    try {
      const response = await fetch(`${API_URL}/api/ai/create-subtask/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: parentTask.id, projectId: project.id, title: title.trim(),
          description, dueDate: dueDate || null,
          estimatedDays: parseInt(estimatedDays) || 0,
          estimatedHours: parseInt(estimatedHours) || 0,
          estimatedBudget: parseFloat(estimatedBudget) || 0, status: 'todo'
        })
      });
      const result = await response.json();
      if (result.success) { alert(`Subtask "${title}" created successfully!`); onSuccess(); onClose(); }
      else alert('Failed: ' + (result.error || 'Unknown error'));
    } catch (err) { alert('Error: ' + err.message); }
    finally { setIsCreating(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b flex items-center justify-between">
          <h3 className="font-semibold text-lg">Add Subtask under "{parentTask.title}"</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subtask Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500" placeholder="e.g. Research Requirements" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2 h-24 focus:outline-none focus:border-indigo-500" placeholder="Brief description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Due Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Budget (USD)</label><input type="number" value={estimatedBudget} onChange={e => setEstimatedBudget(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2" placeholder="0.00" step="0.01" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Est. Days</label><input type="number" value={estimatedDays} onChange={e => setEstimatedDays(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2" min="0" /></div>
            <div><label className="block text-sm font-medium mb-1">Est. Hours</label><input type="number" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2" min="0" /></div>
          </div>
        </div>
        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={handleCreate} disabled={isCreating || !title.trim()} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50">
            {isCreating ? "Creating..." : "Create Subtask"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ====================== NORMALIZE TASK HELPER ======================
function normalizeTask(t, fallbackIndex = 0) {
  return {
    id: t.id != null ? String(t.id) : `task-fallback-${fallbackIndex}`,
    parentId: t.parent?.id != null ? String(t.parent.id) : null,
    title: t.title || 'Untitled Task',
    description: t.description || '',
    status: t.status || 'todo',
    progress: t.progress || 0,
    estimatedDays: t.estimatedDays || 0,
    estimatedHours: t.estimatedHours || 0,
    expense: parseFloat(t.estimatedBudget ?? t.expense) || 0,
    personResponsible: t.personResponsible || 'Unassigned',
    endDate: t.dueDate || t.endDate || null,
    avatar: t.personResponsible ? t.personResponsible.slice(0, 2).toUpperCase() : 'UN',
    children: (t.subtasks || []).map((sub, idx) => normalizeTask(sub, idx)),
  };
}

// ====================== SAGE X3 TASK CARD ======================
function SageTaskCard({ task }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-indigo-100 overflow-hidden bg-white shadow-sm">
      {/* Task Header Row */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-indigo-50/40 transition-colors group"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Task Code badge */}
        <div className="flex-shrink-0 w-16 text-center">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg">
            <Hash className="w-3 h-3" />{task.taskCode}
          </span>
        </div>

        {/* Category */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700">
          <span>{categoryIcon(task.category)}</span>
          <span>{task.category}</span>
        </div>

        {/* Status */}
        <div className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold border ${statusColor(task.status)}`}>
          {statusLabel(task.status)}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-shrink-0">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>{parseSageDate(task.startDate)}</span>
          <ArrowRight className="w-3 h-3 text-gray-300" />
          <span>{parseSageDate(task.endDate)}</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${task.progress || 0}%` }} />
          </div>
          <span className="text-xs font-semibold text-gray-600">{task.progress || 0}%</span>
        </div>

        {/* Budget Link */}
        <div className="flex items-center gap-1 text-xs text-indigo-500 flex-shrink-0">
          <Link2 className="w-3.5 h-3.5" />
          <span className="font-semibold">{task.budgetLink}</span>
        </div>

        {/* Person Responsible */}
        <div className="flex-1 min-w-0 flex items-center justify-end gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium">{task.personResponsible || '—'}</span>
          </div>
        </div>

        {/* System ID */}
        <div className="flex-shrink-0 text-[10px] font-mono text-gray-300 hidden lg:block">
          {task.systemId}
        </div>

        {/* Expand toggle */}
        <div className="flex-shrink-0 text-gray-400 group-hover:text-indigo-500 transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Budget Lines Expanded */}
      {expanded && task.budgets && task.budgets.length > 0 && (
        <div className="border-t border-indigo-50 bg-gradient-to-br from-slate-50 to-indigo-50/30 px-5 pb-5 pt-4">
          {task.budgets.map((budget, bi) => (
            <div key={bi} className="mb-3 last:mb-0">
              {/* Budget Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-700">
                  <Layers className="w-3 h-3" />Budget {budget.budgetCode}
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusColor(budget.status)}`}>
                  {statusLabel(budget.status)}
                </div>
                <div className="text-xs text-gray-400">
                  Progress: <span className="font-semibold text-gray-600">{budget.progress || 0}%</span>
                </div>
              </div>

              {/* Budget Lines Table */}
              {budget.lines && budget.lines.length > 0 && (
                <div className="rounded-xl overflow-hidden border border-indigo-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-indigo-600 text-white">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Cost Type</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Description</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Quantity</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Amount</th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Currency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budget.lines.map((line, li) => (
                        <tr key={li} className={`border-t border-indigo-50 ${li % 2 === 0 ? 'bg-white' : 'bg-indigo-50/40'}`}>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                              <Package className="w-3 h-3" />{line.costType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{line.description}</td>
                          <td className="px-4 py-3 text-right text-gray-600 text-xs font-medium">{line.quantity?.toFixed(1) ?? '0.0'}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-700">{line.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">{line.currency}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-indigo-50 border-t-2 border-indigo-200">
                        <td colSpan={3} className="px-4 py-3 text-xs font-bold text-indigo-700 uppercase">Total</td>
                        <td className="px-4 py-3 text-right text-base font-extrabold text-indigo-800">
                          {budget.lines.reduce((s, l) => s + (l.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 bg-indigo-200 text-indigo-800 text-xs font-bold rounded-md">
                            {budget.lines[0]?.currency || 'EUR'}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ====================== CREATE TASK FORM ======================
function CreateTaskForm({ project, onSuccess, onCancel }) {
  const [taskCode, setTaskCode] = useState('');
  const [category, setCategory] = useState('LABOR');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [personResponsible, setPersonResponsible] = useState('');
  const [budgetLink, setBudgetLink] = useState('B00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Budget lines state
  const [lines, setLines] = useState([
    { costType: 'WORKER', description: '', amount: '', currency: 'EUR', quantity: '0' }
  ]);

  const addLine = () => setLines(prev => [...prev, { costType: 'WORKER', description: '', amount: '', currency: 'EUR', quantity: '0' }]);
  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx));
  const updateLine = (idx, field, val) => setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l));

  const handleSubmit = async () => {
    if (!taskCode.trim()) return alert("Task Code is required");
    setIsSubmitting(true);
    try {
      const payload = {
        projectId: project.id,
        taskCode: taskCode.trim(),
        category,
        startDate,
        endDate,
        personResponsible,
        budgetLink,
        budgets: [{
          budgetCode: budgetLink,
          status: '1',
          startDate: '',
          endDate: '',
          progress: '0',
          projectLink: '',
          lines: lines.map(l => ({
            costType: l.costType,
            description: l.description,
            amount: parseFloat(l.amount) || 0,
            currency: l.currency,
            quantity: parseFloat(l.quantity) || 0,
          }))
        }]
      };
      const response = await fetch(`${API_URL}/api/ai/create-sage-task/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        alert(`✅ Task "${taskCode}" created in Sage X3!`);
        onSuccess?.();
        onCancel();
      } else {
        alert('Failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border-2 border-indigo-200 rounded-2xl overflow-hidden shadow-lg mt-4">
      {/* Form header */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-black">X3</span>
          </div>
          <h4 className="font-bold text-indigo-800 text-base">New Sage X3 Task</h4>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* Row 1: Task Code + Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" /> Task Code *
            </label>
            <input
              type="text"
              value={taskCode}
              onChange={e => setTaskCode(e.target.value)}
              placeholder="e.g. T01"
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none transition-colors bg-white"
            >
              <option value="LABOR">👷 LABOR</option>
              <option value="MATERIAL">📦 MATERIAL</option>
              <option value="EQUIPMENT">🔧 EQUIPMENT</option>
              <option value="SERVICE">🛠️ SERVICE</option>
            </select>
          </div>
        </div>

        {/* Row 2: Start + End Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Row 3: Person Responsible + Budget Link */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Person Responsible
            </label>
            <input
              type="text"
              value={personResponsible}
              onChange={e => setPersonResponsible(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5" /> Budget Link
            </label>
            <input
              type="text"
              value={budgetLink}
              onChange={e => setBudgetLink(e.target.value)}
              placeholder="e.g. B00"
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Budget Lines */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Budget Lines
            </label>
            <button
              onClick={addLine}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Line
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative">
                <button
                  onClick={() => removeLine(idx)}
                  className="absolute top-3 right-3 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-2 gap-3 pr-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cost Type</label>
                    <select
                      value={line.costType}
                      onChange={e => updateLine(idx, 'costType', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:border-indigo-400"
                    >
                      <option>WORKER</option>
                      <option>MANAGER</option>
                      <option>MATERIAL</option>
                      <option>EQUIPMENT</option>
                      <option>OVERHEAD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description</label>
                    <input
                      type="text"
                      value={line.description}
                      onChange={e => updateLine(idx, 'description', e.target.value)}
                      placeholder="e.g. Operator time"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Amount</label>
                    <input
                      type="number"
                      value={line.amount}
                      onChange={e => updateLine(idx, 'amount', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Currency</label>
                      <select
                        value={line.currency}
                        onChange={e => updateLine(idx, 'currency', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold bg-white focus:outline-none focus:border-indigo-400"
                      >
                        <option>EUR</option>
                        <option>USD</option>
                        <option>GBP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Quantity</label>
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={e => updateLine(idx, 'quantity', e.target.value)}
                        step="0.1"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !taskCode.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating…</>
            ) : (
              <><div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center"><span className="text-white text-[10px] font-black">X3</span></div> Create Task in Sage X3</>
            )}
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-3.5 border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-semibold text-sm rounded-xl transition-all hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ====================== MAIN TASKS TAB ======================
function TasksTab({ project, onAssignmentsChange }) {
  if (!project) return <div className="p-8 text-center text-gray-500">No project data</div>;

  const [showAISubtask, setShowAISubtask]       = useState(false);
  const [newTaskDesc, setNewTaskDesc]           = useState('');
  const [aiTasks, setAiTasks]                   = useState([]);
  const [isGenerating, setIsGenerating]         = useState(false);
  const [isCreating, setIsCreating]             = useState(false);
  const [expandedParents, setExpandedParents]   = useState({});
  const [logModalTask, setLogModalTask]         = useState(null);
  const [taskAssignments, setTaskAssignments]   = useState({});
  const [editingTaskId, setEditingTaskId]       = useState(null);
  const [editTitle, setEditTitle]               = useState('');
  const [addSubtaskFor, setAddSubtaskFor]       = useState(null);
  const [showTaskHeader, setShowTaskHeader]     = useState(true);

  // NEW: control Create Task form visibility
  const [showCreateForm, setShowCreateForm]     = useState(false);

  // Sample Sage X3 tasks — replace with real API data
  const sageTasksSample = [
    {
      taskCode: 'T01', status: '1', category: 'LABOR',
      startDate: '010322', endDate: '010422', progress: '0',
      systemId: 'TAS000000000632', budgetLink: 'B00', personResponsible: '',
      budgets: [{
        budgetCode: 'B00', status: '1', startDate: '', endDate: '', progress: '0', projectLink: '',
        lines: [
          { amount: 355.53, currency: 'EUR', costType: 'WORKER', quantity: 0.0, description: 'Tiempo de operario' },
          { amount: 256.5,  currency: 'EUR', costType: 'MANAGER', quantity: 0.0, description: 'Jefatura de proyecto' },
        ]
      }]
    }
  ];

  const { data, loading, error, refetch: refetchTasks } = useQuery(GET_ALL_TASKS, { fetchPolicy: 'cache-and-network' });

  const groupedTasks = useMemo(() => {
    if (!data?.allTasks || !project?.id) return [];
    if (project.subtasks && project.subtasks.length > 0) {
      return project.subtasks.filter(t => t.id != null).map((t, idx) => normalizeTask(t, idx)).filter(t => !t.parentId);
    }
    return data.allTasks.filter(t => t.id != null && String(t.project?.id) === String(project.id) && !t.parent?.id).map((t, idx) => normalizeTask(t, idx));
  }, [data, project]);

  const rootTaskList = groupedTasks;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
    catch { return '—'; }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':   return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-500" />;
      default:            return <Circle className="w-5 h-5 text-zinc-300" />;
    }
  };

  const toggleParent = (parentId) => setExpandedParents(prev => ({ ...prev, [parentId]: !prev[parentId] }));

  const handleSaveAssignment = (taskId, assignments) => {
    const updated = { ...taskAssignments, [taskId]: assignments };
    setTaskAssignments(updated);
    if (onAssignmentsChange) onAssignmentsChange(updated);
  };

  const startEditing  = (task) => { setEditingTaskId(String(task.id)); setEditTitle(task.title); };
  const cancelEditing = () => { setEditingTaskId(null); setEditTitle(''); };

  const saveTaskTitle = async (taskId) => {
    if (!editTitle?.trim()) return alert("Task title cannot be empty");
    try {
      const response = await fetch(`${API_URL}/api/ai/update-task/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, title: editTitle.trim() })
      });
      const result = await response.json();
      if (result.success) { await refetchTasks(); setEditingTaskId(null); setEditTitle(''); }
      else alert('Failed: ' + (result.error || 'Unknown error'));
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleGenerateTasks = async () => {
    if (!project?.id) return;
    setIsGenerating(true); setAiTasks([]);
    try {
      const response = await fetch(`${API_URL}/api/ai/generate-tasks/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: { name: project.name, description: project.description || '', category: project.category || '' }, prompt: newTaskDesc.trim() || "Generate complete realistic subtasks for this project" })
      });
      const resData = await response.json();
      if (resData.tasks && Array.isArray(resData.tasks)) setAiTasks(resData.tasks);
      else alert("AI did not return any tasks. Please try again.");
    } catch (err) { alert("Error connecting to AI: " + err.message); }
    finally { setIsGenerating(false); }
  };

  const handleCreateTask = async (task) => {
    setIsCreating(true);
    try {
      const response = await fetch(`${API_URL}/api/ai/create-task/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id, title: task.title, description: task.description || '',
          estimatedDays: task.estimatedDays || 0, estimatedHours: task.estimatedHours || 0,
          estimatedBudget: (task.estimatedDays || 0) * 8 * 75, personResponsible: 'AI Generated', status: task.status || 'todo',
        })
      });
      const result = await response.json();
      if (result.success) { alert(`✅ Task "${task.title}" created successfully!`); refetchTasks(); }
      else alert('Failed: ' + (result.error || 'Unknown error'));
    } catch (err) { alert('Error: ' + err.message); }
    finally { setIsCreating(false); }
  };

  // ====================== RENDER A SINGLE TASK CARD ======================
  const renderTaskCard = (task, isChild = false) => {
    const assignments       = taskAssignments[task.id] || [];
    const isAssigned        = assignments.length > 0;
    const totalAssignedCost = assignments.reduce((s, a) => s + a.cost, 0);
    const isEditing         = editingTaskId === String(task.id);
    const budgetDisplay     = isNaN(task.expense) ? '0.00' : parseFloat(task.expense).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
      <div className={`${isChild ? 'ml-10 border-l-4 border-indigo-200 pl-2' : ''} mb-3`}>
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
          <div className="px-6 py-5 hover:bg-gray-50 transition-all flex items-start gap-4 justify-between">
            {isChild && <div className="flex items-center text-indigo-400 mt-1 flex-shrink-0"><CornerDownRight className="w-5 h-5" /></div>}
            <div className="mt-1 flex-shrink-0">{getStatusIcon(task.status)}</div>
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveTaskTitle(task.id); if (e.key === 'Escape') cancelEditing(); }}
                      className="flex-1 font-semibold text-lg bg-white border-2 border-indigo-400 focus:border-indigo-600 rounded-2xl px-4 py-2 focus:outline-none" autoFocus
                    />
                    <button onClick={() => saveTaskTitle(task.id)} className="px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium">Save</button>
                    <button onClick={cancelEditing} className="px-4 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded-xl font-medium">Cancel</button>
                  </>
                ) : (
                  <>
                    <h4 className={`font-semibold text-gray-900 cursor-pointer hover:text-indigo-700 ${isChild ? 'text-base' : 'text-lg'}`} onDoubleClick={() => startEditing(task)}>{task.title}</h4>
                    <button onClick={() => startEditing(task)} className="text-gray-400 hover:text-amber-600 p-1 transition-colors" title="Edit task name"><Pencil className="w-4 h-4" /></button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${isAssigned ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {isAssigned ? <UserCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {isAssigned ? `Assigned (${assignments.length})` : 'Unassigned'}
                </span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">Due {formatDate(task.endDate)}</span>
                {isChild && <><span className="text-sm text-gray-500">•</span><span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Subtask</span></>}
              </div>
              <AssignedMemberPills assignments={assignments} />
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${task.progress || 0}%` }} />
              </div>
              <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-2xl px-5 py-3">
                <div className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-600" /><span className="font-medium text-gray-700">Budget</span></div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-700">{project.currency || 'USD'} {budgetDisplay}</div>
                  {isAssigned && <div className="text-xs text-indigo-600 font-medium mt-0.5">Assigned cost: ${totalAssignedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>}
                </div>
              </div>
              <button onClick={() => setAddSubtaskFor(task)} className="mt-3 text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium">
                <Plus className="w-3.5 h-3.5" /> Add Subtask
              </button>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
              <button onClick={() => setLogModalTask(task)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95">
                <Plus className="w-3.5 h-3.5" />Log Hours
              </button>
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-sm">
                {task.avatar || 'UN'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderParentWithChildren = (parent, parentIndex) => {
    const hasChildren = parent.children && parent.children.length > 0;
    const isExpanded  = expandedParents[parent.id] !== false;
    return (
      <div key={parent.id || `parent-${parentIndex}`} className="mb-4">
        <div className="relative">
          {renderTaskCard(parent, false)}
          {hasChildren && (
            <button onClick={() => toggleParent(parent.id)} className="absolute top-5 right-16 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10 flex items-center gap-1 text-xs text-gray-500 font-medium" title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}>
              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
              <span>{parent.children.length} subtask{parent.children.length !== 1 ? 's' : ''}</span>
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {parent.children.map((child, childIdx) => <div key={child.id || `child-${parent.id}-${childIdx}`}>{renderTaskCard(child, true)}</div>)}
          </div>
        )}
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading tasks…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-red-500 font-semibold">Failed to load tasks</p>
        <p className="text-gray-400 text-sm">{error.message}</p>
        <button onClick={() => refetchTasks()} className="mt-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Retry</button>
      </div>
    );
  }

  // ====================== MAIN JSX ======================
  return (
    <div className="space-y-8">
      {/* Modals */}
      {logModalTask && (
        <LogHoursModal task={logModalTask} existingAssignments={taskAssignments[logModalTask.id] || []} onClose={() => setLogModalTask(null)} onSave={handleSaveAssignment} />
      )}
      {addSubtaskFor && (
        <AddSubtaskModal parentTask={addSubtaskFor} project={project} onClose={() => setAddSubtaskFor(null)} onSuccess={() => { refetchTasks(); setAddSubtaskFor(null); }} />
      )}

      {/* ==================== SAGE X3 SECTION ==================== */}
      <div>
        {/* Sage X3 Badge */}
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg w-fit mb-3">
          <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-black">X3</span>
          </div>
          <span className="text-sm font-semibold text-indigo-700">Sage X3 — Tasks Tab</span>
        </div>

        {/* Collapsible Header with Modify + Create Task buttons IN the bar */}
        <div>
          <div
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6 py-5 rounded-t-2xl flex items-center justify-between cursor-pointer transition-colors select-none"
            onClick={() => setShowTaskHeader(v => !v)}
          >
            {/* Left: title */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                <span className="font-bold text-xl">Task Details</span>
              </div>
              <span className="text-sm opacity-75 mt-0.5 pl-9">Sage X3 — Task Information</span>
            </div>

            {/* Right: action buttons + chevron */}
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              {/* Create Task button */}
              <button
                onClick={() => setShowCreateForm(v => !v)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                  showCreateForm
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-green-500 hover:bg-green-400 text-white shadow-sm'
                }`}
              >
                {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showCreateForm ? 'Cancel' : 'Create Task'}
              </button>

              {/* Modify button */}
              <button
                className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm bg-white/15 hover:bg-white/25 text-white border border-white/30 transition-all active:scale-95"
              >
                <Settings className="w-4 h-4" />
                Modify
              </button>

              {/* Chevron toggle */}
              <div
                className="ml-1 cursor-pointer"
                onClick={() => setShowTaskHeader(v => !v)}
              >
                {showTaskHeader ? <ChevronUp className="w-5 h-5 text-white/70" /> : <ChevronDown className="w-5 h-5 text-white/70" />}
              </div>
            </div>
          </div>

          {/* Create Task Form — slides in below the header bar */}
          {showCreateForm && (
            <div className="border-l border-r border-indigo-200 bg-indigo-50/30 px-6 py-1">
              <CreateTaskForm
                project={project}
                onSuccess={() => refetchTasks()}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          )}

          {/* Task Detail Body */}
          {showTaskHeader && (
            <div className="bg-white border border-gray-200 border-t-0 rounded-b-2xl p-6">
              {/* Sage X3 Task Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Task Code</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <Hash className="w-4 h-4 text-indigo-500" />
                    <span className="font-bold text-indigo-800 text-sm">{sageTasksSample[0]?.taskCode || '—'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Status</label>
                  <div className={`px-4 py-3 rounded-xl border text-sm font-bold ${statusColor(sageTasksSample[0]?.status)}`}>
                    {statusLabel(sageTasksSample[0]?.status)}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Category</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-semibold text-amber-700">
                    <span>{categoryIcon(sageTasksSample[0]?.category)}</span>
                    <span>{sageTasksSample[0]?.category || '—'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Start Date</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {parseSageDate(sageTasksSample[0]?.startDate)}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">End Date</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {parseSageDate(sageTasksSample[0]?.endDate)}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Progress</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${sageTasksSample[0]?.progress || 0}%` }} />
                      </div>
                      <span className="text-sm font-bold text-gray-700">{sageTasksSample[0]?.progress || 0}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Budget Link</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-bold text-indigo-700">
                    <Link2 className="w-4 h-4" />{sageTasksSample[0]?.budgetLink || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Person Responsible</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    {sageTasksSample[0]?.personResponsible || <span className="text-gray-400 italic">Unassigned</span>}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">System ID</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-500 truncate">
                    {sageTasksSample[0]?.systemId || '—'}
                  </div>
                </div>
              </div>

              {/* Budget Lines */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Budget Lines</span>
                  <div className="flex-1 h-px bg-indigo-100 ml-2" />
                </div>
                <div className="space-y-3">
                  {sageTasksSample.map((task, ti) =>
                    task.budgets?.map((budget, bi) => (
                      <SageTaskCard key={`${ti}-${bi}`} task={{ ...task, budgets: [budget] }} />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Dependency Chain */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <LinkIcon className="w-5 h-5 text-amber-600" />
          <span className="font-semibold text-amber-800">Task Dependency Chain</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {rootTaskList.map((task, idx, arr) => {
            const isAssigned = (taskAssignments[task.id] || []).length > 0;
            return (
              <React.Fragment key={task.id || `dep-${idx}`}>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-medium ${isAssigned ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : task.status === 'completed' ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : task.status === 'in-progress' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-600'}`}>
                  {isAssigned ? <UserCheck className="w-4 h-4" /> : getStatusIcon(task.status)}
                  {task.title}
                </div>
                {idx < arr.length - 1 && <ArrowRight className="w-4 h-4 text-amber-400" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* All Tasks List */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            All Tasks
            <span className="text-sm font-normal text-gray-500">({groupedTasks.length} parent task{groupedTasks.length !== 1 ? 's' : ''})</span>
            {loading && data && <span className="ml-2 text-xs text-indigo-400 animate-pulse">refreshing…</span>}
          </h3>
          <div className="text-xs text-gray-500">Scroll for more ↓</div>
        </div>
        <div className="max-h-[620px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-gray-300">
          {groupedTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Circle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No tasks yet</p>
              <p className="text-sm mt-1">Use the AI Task Generator below to create tasks</p>
            </div>
          ) : (
            groupedTasks.map((parent, parentIndex) => renderParentWithChildren(parent, parentIndex))
          )}
        </div>
      </div>

      {/* AI Task Generator */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-100 rounded-2xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 className="text-xl font-semibold text-gray-900">AI Task Generator</h4>
              <p className="text-sm text-purple-600">Let AI help you create realistic and complete subtasks</p>
            </div>
          </div>
          <button
            onClick={() => { setShowAISubtask(!showAISubtask); if (!showAISubtask) { setAiTasks([]); setNewTaskDesc(''); } }}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl text-sm font-medium hover:brightness-105 transition flex items-center gap-2"
          >
            {showAISubtask ? 'Hide' : '✨ Generate Tasks with AI'}
          </button>
        </div>
        {showAISubtask && (
          <div className="space-y-5">
            <textarea
              value={newTaskDesc}
              onChange={e => setNewTaskDesc(e.target.value)}
              placeholder="Describe what kind of tasks you want (or leave empty for general project subtasks)"
              className="w-full px-5 py-4 border border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[110px]"
              rows="4"
            />
            <button onClick={handleGenerateTasks} disabled={isGenerating} className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold text-base disabled:opacity-50 transition">
              {isGenerating ? "AI is analyzing your project..." : "Generate Subtasks with AI"}
            </button>
            {aiTasks.length > 0 && (
              <div className="mt-8">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  AI Suggested Subtasks <span className="text-sm font-normal text-gray-500">({aiTasks.length})</span>
                </h4>
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                  {aiTasks.map((task, idx) => (
                    <div key={`ai-task-${idx}`} className="bg-white border border-purple-200 rounded-2xl p-5 flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 text-lg">{task.title}</h5>
                        {task.description && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{task.description}</p>}
                        <div className="mt-3 text-xs text-gray-500 flex gap-4">
                          <span>{task.estimatedDays || 0} days</span>
                          <span>{task.estimatedHours || (task.estimatedDays * 8)} hours</span>
                        </div>
                      </div>
                      <button onClick={() => handleCreateTask(task)} disabled={isCreating} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl disabled:opacity-50 whitespace-nowrap transition">
                        Create Task
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TasksTab;