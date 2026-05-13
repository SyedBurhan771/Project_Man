import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Package,
  ChevronsUpDown,
  Box,
  Search,
  Check
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
  { id: 1, name: 'Sarah Mitchell', role: 'Senior Developer', hourlyRate: 75, avatar: 'SM', color: 'from-violet-500 to-purple-600' },
  { id: 2, name: 'Michael Chen', role: 'UI/UX Designer', hourlyRate: 90, avatar: 'MC', color: 'from-blue-500 to-cyan-500' },
  { id: 3, name: 'Emma Rodriguez', role: 'QA Engineer', hourlyRate: 65, avatar: 'ER', color: 'from-emerald-500 to-teal-500' },
  { id: 4, name: 'David Kim', role: 'Backend Engineer', hourlyRate: 85, avatar: 'DK', color: 'from-orange-500 to-amber-500' },
  { id: 5, name: 'Priya Sharma', role: 'Project Manager', hourlyRate: 80, avatar: 'PS', color: 'from-pink-500 to-rose-500' },
  { id: 6, name: 'James Okafor', role: 'DevOps Engineer', hourlyRate: 95, avatar: 'JO', color: 'from-indigo-500 to-blue-600' },
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

/** Parse DDMMYY, YYYY-MM-DD, or MM/DD/YY → readable */
function parseSageDate(raw) {
  if (!raw) return '—';
  const s = String(raw);
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 3) {
      const m = parts[0].padStart(2, '0');
      const d = parts[1].padStart(2, '0');
      const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${m}/${d}/${y}`;
    }
    return s;
  }
  if (s.includes('-')) {
    const [y, m, d] = s.split('-');
    return `${m}/${d}/${y}`;
  }
  if (s.length === 8 && !s.includes('/') && !s.includes('-')) {
    // YYYYMMDD -> MM/DD/YYYY
    const y = s.slice(0, 4), m = s.slice(4, 6), d = s.slice(6, 8);
    return `${m}/${d}/${y}`;
  }
  if (s.length === 6 && !s.includes('/')) {
    const d = s.slice(0, 2), m = s.slice(2, 4), y = s.slice(4, 6);
    return `${m}/${d}/20${y}`;
  }
  return s;
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
      const hours = parseFloat(hoursMap[mId] || 0);
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
              const cost = isSelected ? member.hourlyRate * parseFloat(hours || 0) : 0;
              const date = dateMap[member.id] || todayString();
              const time = timeMap[member.id] || '09:00';
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

// ====================== TASK CATEGORY DROPDOWN ======================
const TASK_CATEGORIES = [
  { code: 'MAT', label: 'Material' },
  { code: 'MATERIAL', label: 'Material' },
  { code: 'MISC', label: 'Miscellaneous' },
  { code: 'MIXED', label: 'Mixed' },
  { code: 'PHASE', label: 'Phase' },
  { code: 'PROJECT', label: 'Project follow-up' },
  { code: 'QA', label: 'Quality' },
];

function TaskCategorySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = TASK_CATEGORIES.find((t) => t.code === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none transition-colors bg-white flex items-center justify-between cursor-pointer"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400 font-normal'}>
          {selected ? selected.code : 'Select category…'}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-50 border-b border-gray-100"
          >
            — Select category —
          </button>
          {TASK_CATEGORIES.map((t) => (
            <button
              key={t.code}
              type="button"
              onClick={() => { onChange(t.code); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 flex items-center ${value === t.code ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-gray-800'
                }`}
            >
              <span className="font-mono font-bold w-20">{t.code}</span>
              <span className="text-gray-500 text-xs pl-2">{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ====================== CREATE TASK FORM ======================
function CreateSubTaskForm({ project, parentTask, onSuccess, onCancel }) {
  const [tascod, setTascod] = useState('T-');
  const [tcacod, setTcacod] = useState('');
  // Parent info is read-only
  const taspae = parentTask.taskCode;
  const tasfcy = parentTask.fcy || project?.sageX3?.salesSite || project?.sageX3?.site || project?.salesSite || project?.site || '';

  const [tasdesaxx, setTasdesaxx] = useState('');
  const [tasdesax1, setTasdesax1] = useState('');
  const [tasstartdt, setTasstartdt] = useState('');
  const [tasenddt, setTasenddt] = useState('');
  const [tasdur, setTasdur] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Helper to convert Sage date to YYYY-MM-DD for input[type="date"]
  const toIso = (raw) => {
    if (!raw) return '';
    const s = String(raw);
    if (s.includes('-')) return s; // Already YYYY-MM-DD
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) {
        const m = parts[0].padStart(2, '0');
        const d = parts[1].padStart(2, '0');
        const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        return `${y}-${m}-${d}`;
      }
    }
    // Handle DDMMYY format
    if (s.length >= 6 && !s.includes('/')) {
      const d = s.slice(0, 2), m = s.slice(2, 4), y = s.slice(4, 6);
      return `20${y}-${m}-${d}`;
    }
    return s;
  };

  const parentMinDate = useMemo(() => toIso(parentTask.startDate), [parentTask.startDate]);
  const parentMaxDate = useMemo(() => toIso(parentTask.endDate), [parentTask.endDate]);

  const handleSubmit = async () => {
    const trimmedCode = tascod.trim();
    setError('');

    if (!trimmedCode || trimmedCode === 'T-') {
      setError("plz enter Task Code");
      return;
    }
    if (!trimmedCode.startsWith('T-')) {
      setError("Task Code must start with 'T-' (e.g., T-01)");
      return;
    }
    if (trimmedCode === taspae) {
      setError("Subtask code cannot be same as Parent task code");
      return;
    }

    const afterDash = trimmedCode.slice(2);
    if (afterDash && !/^\d+$/.test(afterDash)) {
      setError("plz write code only numbers");
      return;
    }

    // Ensure all fields are filled
    if (!tcacod) return alert("plz enter Category");
    if (!tasdesaxx) return alert("plz enter Description");
    if (!tasdesax1) return alert("plz enter Short Description");
    if (!tasstartdt) return alert("plz enter Start Date");
    if (!tasenddt) return alert("plz enter End Date");
    if (!tasdur) return alert("plz enter Duration");

    setIsSubmitting(true);
    try {
      const payload = {
        oppnum: project?.projectNum || project?.id || '',
        tascod: trimmedCode,
        tcacod,
        tasfcy,
        taspae, // Parent Code
        tasdesaxx,
        tasdesax1,
        tasstartdt,
        tasenddt,
        tasdur,
      };
      const response = await fetch(`${API_URL}/api/soap/subtasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        alert(`✅ Subtask "${tascod}" created successfully under "${taspae}"!`);
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
            <CornerDownRight className="text-white w-4 h-4" />
          </div>
          <h4 className="font-bold text-indigo-800 text-base">New Subtask for {taspae}</h4>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" /> Task Code *
            </label>
            <input
              type="text"
              value={tascod}
              onChange={e => {
                const val = e.target.value;
                setTascod(val);
                if (!val.startsWith('T-')) {
                  setError("Task Code must start with 'T-' (e.g., T-01)");
                } else {
                  const afterDash = val.slice(2);
                  if (afterDash && !/^\d+$/.test(afterDash)) {
                    setError("plz write code only numbers");
                  } else if (val === 'T-') {
                    setError("plz enter Task Code");
                  } else {
                    setError("");
                  }
                }
              }}
              placeholder="e.g. T-01"
              className={`w-full border-2 ${error ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none transition-colors`}
            />
            {error && (
              <p className="mt-1.5 text-[10px] font-bold text-red-500 flex items-center gap-1 animate-pulse">
                <span className="bg-red-500 text-white w-3 h-3 rounded-full flex items-center justify-center text-[8px]">!</span>
                {error}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Category *
            </label>
            <TaskCategorySelect
              value={tcacod}
              onChange={setTcacod}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Description *
            </label>
            <input
              type="text"
              value={tasdesaxx}
              onChange={e => setTasdesaxx(e.target.value)}
              placeholder="Subtask Description"
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Short Description *
            </label>
            <input
              type="text"
              value={tasdesax1}
              onChange={e => setTasdesax1(e.target.value)}
              placeholder="Short Description"
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Start Date *
            </label>
            <input
              type="date"
              value={tasstartdt}
              onChange={e => setTasstartdt(e.target.value)}
              min={parentMinDate}
              max={tasenddt || parentMaxDate}
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> End Date *
            </label>
            <input
              type="date"
              value={tasenddt}
              onChange={e => setTasenddt(e.target.value)}
              min={tasstartdt || parentMinDate}
              max={parentMaxDate}
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" /> Duration *
            </label>
            <input
              type="number"
              value={tasdur}
              onChange={e => setTasdur(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <CornerDownRight className="w-3.5 h-3.5" /> Parent Task Code
            </label>
            <div className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm flex items-center justify-between">
              <span className="font-semibold text-gray-700">{taspae}</span>
              <span className="text-[10px] text-gray-400 italic ml-2">Read-only</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" /> Task Site (FCY)
            </label>
            <div className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm flex items-center justify-between">
              <span className="font-semibold text-gray-700">{tasfcy || '—'}</span>
              <span className="text-[10px] text-gray-400 italic ml-2">Read-only (from parent)</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !!error || !tascod.trim() || tascod === 'T-'}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating…</>
            ) : (
              <><div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center"><span className="text-white text-[10px] font-black">X3</span></div> Create Subtask in Sage X3</>
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

function CreateTaskForm({ project, onSuccess, onCancel }) {
  const [tascod, setTascod] = useState('T-');
  const [tcacod, setTcacod] = useState('');
  const [tasfcy, setTasfcy] = useState(project?.sageX3?.salesSite || project?.sageX3?.site || project?.salesSite || project?.site || '');
  const [tasdesaxx, setTasdesaxx] = useState('');
  const [tasdesax1, setTasdesax1] = useState('');
  const [tasstartdt, setTasstartdt] = useState('');
  const [tasenddt, setTasenddt] = useState('');
  const [tasdur, setTasdur] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmedCode = tascod.trim();
    setError('');

    if (!trimmedCode || trimmedCode === 'T-') {
      setError("plz enter Task Code");
      return;
    }
    if (!trimmedCode.startsWith('T-')) {
      setError("Task Code must start with 'T-' (e.g., T-01)");
      return;
    }

    const afterDash = trimmedCode.slice(2);
    if (afterDash && !/^\d+$/.test(afterDash)) {
      setError("plz write code only numbers");
      return;
    }

    // Ensure all fields are filled
    if (!tcacod || !tasfcy || !tasdesaxx || !tasdesax1 || !tasstartdt || !tasenddt || !tasdur) {
      return alert("All fields are required. Please fill in Category, Descriptions, Dates, and Duration.");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        oppnum: project?.projectNum || project?.id || '',
        tascod: tascod.trim(),
        tcacod,
        tasfcy,
        tasdesaxx,
        tasdesax1,
        tasstartdt,
        tasenddt,
        tasdur,
      };
      const response = await fetch(`${API_URL}/api/soap/tasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        alert(`✅ Task "${tascod}" created successfully!`);
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
          <h4 className="font-bold text-indigo-800 text-base">New Task</h4>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" /> Task Code *
            </label>
            <input
              type="text"
              value={tascod}
              onChange={e => {
                const val = e.target.value;
                setTascod(val);
                if (!val.startsWith('T-')) {
                  setError("Task Code must start with 'T-' (e.g., T-01)");
                } else {
                  const afterDash = val.slice(2);
                  if (afterDash && !/^\d+$/.test(afterDash)) {
                    setError("plz write code only numbers");
                  } else if (val === 'T-') {
                    setError("plz enter Task Code");
                  } else {
                    setError("");
                  }
                }
              }}
              placeholder="e.g. T-01"
              className={`w-full border-2 ${error ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none transition-colors`}
            />
            {error && (
              <p className="mt-1.5 text-[10px] font-bold text-red-500 flex items-center gap-1 animate-pulse">
                <span className="bg-red-500 text-white w-3 h-3 rounded-full flex items-center justify-center text-[8px]">!</span>
                {error}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Category
            </label>
            <TaskCategorySelect
              value={tcacod}
              onChange={setTcacod}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Description
            </label>
            <input
              type="text"
              value={tasdesaxx}
              onChange={e => setTasdesaxx(e.target.value)}
              placeholder="Task Description"
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Short Description
            </label>
            <input
              type="text"
              value={tasdesax1}
              onChange={e => setTasdesax1(e.target.value)}
              placeholder="Short Description"
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Start Date
            </label>
            <input
              type="date"
              value={tasstartdt}
              onChange={e => setTasstartdt(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> End Date
            </label>
            <input
              type="date"
              value={tasenddt}
              onChange={e => setTasenddt(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" /> Duration
            </label>
            <input
              type="number"
              value={tasdur}
              onChange={e => setTasdur(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" /> Task Site (FCY)
            </label>
            <div className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm flex items-center justify-between">
              <span className="font-semibold text-gray-700">{tasfcy || '—'}</span>
              <span className="text-[10px] text-gray-400 italic ml-2">Auto-filled from project</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !!error || !tascod.trim() || tascod === 'T-'}
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

function UpdateTaskForm({ project, task, onSuccess, onCancel }) {
  const [tcacod, setTcacod] = useState(task.category || '');
  const [tasdesaxx, setTasdesaxx] = useState(task.description || '');
  const [tasdesax1, setTasdesax1] = useState(task.shortDesc || '');

  // Helper to convert MM/DD/YY to YYYY-MM-DD
  const toIso = (raw) => {
    if (!raw || !raw.includes('/')) return raw;
    const parts = raw.split('/');
    if (parts.length === 3) {
      const m = parts[0].padStart(2, '0');
      const d = parts[1].padStart(2, '0');
      const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${y}-${m}-${d}`;
    }
    return raw;
  };

  const [tasstartdt, setTasstartdt] = useState(toIso(task.startDate));
  const [tasenddt, setTasenddt] = useState(toIso(task.endDate));
  const [tasdur, setTasdur] = useState(task.duration || '1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tascod = task.taskCode;
  const tasfcy = task.fcy || '';
  const isSubtask = !!task.parentCode;

  const handleSubmit = async () => {
    if (!tcacod || !tasdesaxx || !tasdesax1 || !tasstartdt || !tasenddt || !tasdur) {
      return alert("All fields are required.");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        oppnum: project?.projectNum || project?.id || '',
        tascod,
        tcacod,
        tasfcy,
        tasdesaxx,
        tasdesax1,
        tasstartdt,
        tasenddt,
        tasdur,
      };

      if (isSubtask) {
        payload.taspae = task.parentCode;
      }

      const endpoint = isSubtask
        ? `${API_URL}/api/soap/subtasks/${tascod}/`
        : `${API_URL}/api/soap/tasks/${tascod}/`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        alert(`✅ ${isSubtask ? 'Sub-task' : 'Task'} "${tascod}" updated successfully!`);
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
            <Pencil className="text-white w-4 h-4" />
          </div>
          <h4 className="font-bold text-indigo-800 text-base">Update {isSubtask ? 'Sub-task' : 'Task'}: {tascod}</h4>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" /> Task Code (Read-only)
            </label>
            <div className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed">
              {tascod}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Category *
            </label>
            <TaskCategorySelect value={tcacod} onChange={setTcacod} />
          </div>
        </div>

        {isSubtask && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Parent Task Code (Read-only)
            </label>
            <div className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed">
              {task.parentCode}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Description *
            </label>
            <input
              type="text"
              value={tasdesaxx}
              onChange={e => setTasdesaxx(e.target.value)}
              placeholder="Task Description"
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Short Description *
            </label>
            <input
              type="text"
              value={tasdesax1}
              onChange={e => setTasdesax1(e.target.value)}
              placeholder="Short Description"
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Start Date *
            </label>
            <input
              type="date"
              value={tasstartdt}
              onChange={e => setTasstartdt(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> End Date *
            </label>
            <input
              type="date"
              value={tasenddt}
              onChange={e => setTasenddt(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" /> Duration *
            </label>
            <input
              type="number"
              value={tasdur}
              onChange={e => setTasdur(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" /> Task Site (FCY) (Read-only)
          </label>
          <div className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed">
            {tasfcy || '—'}
          </div>
        </div>

        {/* CTA */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all active:scale-95 shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Updating…</>
            ) : (
              <><div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center"><span className="text-white text-[10px] font-black">X3</span></div> Update Task in Sage X3</>
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

  const [showAISubtask, setShowAISubtask] = useState(false);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [aiTasks, setAiTasks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [creatingTaskTitle, setCreatingTaskTitle] = useState(null);
  const [createdAiTasks, setCreatedAiTasks] = useState(new Set());
  const [expandedParents, setExpandedParents] = useState({});
  const [logModalTask, setLogModalTask] = useState(null);
  const [taskAssignments, setTaskAssignments] = useState({});
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [addSubtaskFor, setAddSubtaskFor] = useState(null);
  const [showTaskHeader, setShowTaskHeader] = useState(true);
  const [selectedAiIndices, setSelectedAiIndices] = useState(new Set());
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // NEW: control Create Task form visibility
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeSubTaskParent, setActiveSubTaskParent] = useState(null);
  const [activeUpdateTask, setActiveUpdateTask] = useState(null);

  const [sageTasks, setSageTasks] = useState([]);
  const [loadingSageTasks, setLoadingSageTasks] = useState(false);
  const [expandedSageTasks, setExpandedSageTasks] = useState({}); // { taskCode: boolean }

  const fetchSageTasks = async () => {
    const oppnum = project?.projectNum || project?.id;
    if (!oppnum) return;
    setLoadingSageTasks(true);
    try {
      const response = await fetch(`${API_URL}/api/soap/tasks/?oppnum=${oppnum}`);
      const result = await response.json();
      if (result.success && result.tasks) {
        // 1. Sort all tasks by code first (numeric sort)
        const baseSorted = [...result.tasks].sort((a, b) =>
          String(a.taskCode).localeCompare(String(b.taskCode), undefined, { numeric: true })
        );

        // 2. Build map and hierarchy
        const taskMap = {};
        const roots = [];
        baseSorted.forEach(t => {
          taskMap[t.taskCode] = { ...t, children: [] };
        });

        baseSorted.forEach(t => {
          if (t.parentCode && taskMap[t.parentCode]) {
            taskMap[t.parentCode].children.push(taskMap[t.taskCode]);
          } else {
            roots.push(taskMap[t.taskCode]);
          }
        });

        // 3. Flatten back into a linear list with 'level' info for indentation
        const flattenedHierarchical = [];
        const walk = (nodes, level = 0) => {
          nodes.forEach(node => {
            const hasChildren = node.children && node.children.length > 0;
            flattenedHierarchical.push({ ...node, level, hasChildren });
            if (hasChildren) {
              walk(node.children, level + 1);
            }
          });
        };
        walk(roots);

        setSageTasks(flattenedHierarchical);

        // Auto-expand all roots by default if you want
        const initialExpanded = {};
        roots.forEach(r => { initialExpanded[r.taskCode] = true; });
        setExpandedSageTasks(initialExpanded);
      }
    } catch (err) {
      console.error("Error fetching sage tasks:", err);
    } finally {
      setLoadingSageTasks(false);
    }
  };

  React.useEffect(() => {
    fetchSageTasks();
  }, [project?.projectNum, project?.id]);

  const { data, loading, error, refetch: refetchTasks } = useQuery(GET_ALL_TASKS, { fetchPolicy: 'cache-and-network' });

  const groupedTasks = useMemo(() => {
    if (!project?.id) return [];

    // Always use data.allTasks for real projects (not drafts) so we see new tasks immediately
    if (data?.allTasks && !String(project.id).startsWith('draft')) {
      return data.allTasks
        .filter(t => t.id != null && String(t.project?.id) === String(project.id) && !t.parent?.id)
        .map((t, idx) => normalizeTask(t, idx));
    }

    // Fallback to project.subtasks for drafts or if allTasks is missing
    if (project.subtasks && project.subtasks.length > 0) {
      return project.subtasks
        .filter(t => t.id != null)
        .map((t, idx) => normalizeTask(t, idx))
        .filter(t => !t.parentId);
    }

    return [];
  }, [data, project]);

  const rootTaskList = groupedTasks;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
    catch { return '—'; }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-500" />;
      default: return <Circle className="w-5 h-5 text-zinc-300" />;
    }
  };

  const toggleParent = (parentId) => setExpandedParents(prev => ({ ...prev, [parentId]: !prev[parentId] }));

  const handleSaveAssignment = (taskId, assignments) => {
    const updated = { ...taskAssignments, [taskId]: assignments };
    setTaskAssignments(updated);
    if (onAssignmentsChange) onAssignmentsChange(updated);
  };

  const startEditing = (task) => { setEditingTaskId(String(task.id)); setEditTitle(task.title); };
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
    setIsGenerating(true); setAiTasks([]); setCreatedAiTasks(new Set());
    setSelectedAiIndices(new Set());
    try {
      const response = await fetch(`${API_URL}/api/ai/generate-tasks/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: { name: project.name, description: project.description || '', category: project.category || '' }, prompt: newTaskDesc.trim() || "Generate complete realistic subtasks for this project" })
      });
      const resData = await response.json();

      let tasks = [];
      if (resData.tasks && Array.isArray(resData.tasks)) {
        tasks = resData.tasks;
      } else if (resData.text) {
        // Fallback: try to parse text as JSON array
        try {
          const match = resData.text.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (Array.isArray(parsed)) tasks = parsed;
          }
        } catch (e) { console.error("Frontend fallback parse failed:", e); }
      }

      if (tasks.length > 0) {
        setAiTasks(tasks);
      } else {
        alert("AI did not return any tasks in the expected format. Please try again.");
      }
    } catch (err) { alert("Error connecting to AI: " + err.message); }
    finally { setIsGenerating(false); }
  };

  const handleCreateTask = async (payload, suppressAlert = false) => {
    if (!suppressAlert) setCreatingTaskTitle(payload.tasdesaxx);
    try {
      const response = await fetch(`${API_URL}/api/soap/tasks/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        if (!suppressAlert) alert(`✅ Task "${payload.tascod}" created successfully!`);
        // We use the AI title (tasdesaxx) to track which ones are created in the UI
        setCreatedAiTasks(prev => new Set([...prev, payload.tasdesaxx]));
        return true;
      }
      else {
        if (!suppressAlert) alert('Failed: ' + (result.error || 'Unknown error'));
        return false;
      }
    } catch (err) {
      if (!suppressAlert) alert('Error: ' + err.message);
      return false;
    }
    finally { if (!suppressAlert) setCreatingTaskTitle(null); }
  };

  const toggleTaskSelection = (index) => {
    setSelectedAiIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedAiIndices.size === aiTasks.length) {
      setSelectedAiIndices(new Set());
    } else {
      const all = new Set();
      aiTasks.forEach((_, idx) => {
        if (!createdAiTasks.has(aiTasks[idx].title)) {
          all.add(idx);
        }
      });
      setSelectedAiIndices(all);
    }
  };

  const handleCreateSelectedTasks = async () => {
    const selectedIndices = Array.from(selectedAiIndices);
    const total = selectedIndices.length;
    if (total === 0) return;

    setIsCreatingBatch(true);
    setBatchProgress({ current: 0, total });
    let successCount = 0;

    // Helper for delay
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Calculate starting Task Code (tascod) e.g., T-01
    let nextNum = 1;
    const existingCodes = sageTasks.map(t => t.taskCode).filter(c => c && c.startsWith('T-'));
    if (existingCodes.length > 0) {
      const nums = existingCodes.map(c => parseInt(c.replace('T-', ''))).filter(n => !isNaN(n));
      if (nums.length > 0) nextNum = Math.max(...nums) + 1;
    }

    // Task Site (tasfcy) logic
    const siteCode = project?.sageX3?.salesSite || project?.sageX3?.site || project?.salesSite || project?.site || '';

    for (let i = 0; i < total; i++) {
      const idx = selectedIndices[i];
      const task = aiTasks[idx];

      if (createdAiTasks.has(task.title)) {
        setBatchProgress(prev => ({ ...prev, current: i + 1 }));
        continue;
      }

      setBatchProgress({ current: i + 1, total });

      // Generate task code for this specific task
      const tascod = `T-${String(nextNum).padStart(2, '0')}`;

      // Prepare Sage-compatible payload
      const payload = {
        oppnum: project?.projectNum || project?.id || '',
        tascod: tascod,
        tcacod: task.category || 'MISC',
        tasfcy: siteCode,
        tasdesaxx: task.title,           // AI Title -> Sage Description
        tasdesax1: (task.description || '').substring(0, 80), // AI Description -> Sage Short Description (80 char limit)
        tasstartdt: task.startDate || '',
        tasenddt: task.endDate || '',
        tasdur: String(task.duration || '1'),
      };

      const ok = await handleCreateTask(payload, true);
      if (ok) {
        successCount++;
      }

      // Increment for next task regardless of success to avoid duplicate codes in same batch
      nextNum++;

      if (i < total - 1) {
        await delay(600);
      }
    }

    if (successCount > 0) {
      alert(`✅ Successfully created ${successCount} out of ${total} tasks in Sage X3!`);
      refetchTasks();
      fetchSageTasks();
    } else {
      alert(`❌ Failed to create any tasks in Sage X3.`);
    }

    setSelectedAiIndices(new Set());
    setIsCreatingBatch(false);
    setBatchProgress({ current: 0, total: 0 });
  };

  // ====================== RENDER A SINGLE TASK CARD ======================
  const renderTaskCard = (task, isChild = false) => {
    const assignments = taskAssignments[task.id] || [];
    const isAssigned = assignments.length > 0;
    const totalAssignedCost = assignments.reduce((s, a) => s + a.cost, 0);
    const isEditing = editingTaskId === String(task.id);
    const budgetDisplay = isNaN(task.expense) ? '0.00' : parseFloat(task.expense).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    const isExpanded = expandedParents[parent.id] !== false;
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

      {/* AI Task Generator - MOVED TO TOP */}
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
            onClick={() => { setShowAISubtask(!showAISubtask); if (!showAISubtask) { setAiTasks([]); setNewTaskDesc(''); setCreatedAiTasks(new Set()); } }}
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
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    AI Suggested Subtasks <span className="text-sm font-normal text-gray-500">({aiTasks.length})</span>
                  </h4>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedAiIndices.size === aiTasks.length ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                        {selectedAiIndices.size === aiTasks.length && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      Select All
                    </button>
                    <button
                      onClick={handleCreateSelectedTasks}
                      disabled={selectedAiIndices.size === 0 || isCreatingBatch}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition shadow-sm flex items-center gap-2 min-w-[160px] justify-center"
                    >
                      {isCreatingBatch ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span className="tabular-nums">Task {batchProgress.current}/{batchProgress.total}</span>
                        </div>
                      ) : (
                        <>Create Selected ({selectedAiIndices.size})</>
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                  {aiTasks.map((task, idx) => {
                    const isSelected = selectedAiIndices.has(idx);
                    const isCreated = createdAiTasks.has(task.title);
                    return (
                      <div
                        key={`ai-task-${idx}`}
                        className={`bg-white border rounded-2xl p-5 flex items-start gap-4 transition-all ${isSelected ? 'border-indigo-400 bg-indigo-50/30' : 'border-purple-200'}`}
                      >
                        <button
                          onClick={() => !isCreated && toggleTaskSelection(idx)}
                          disabled={isCreated}
                          className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${isCreated ? 'bg-gray-100 border-gray-200' : isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white hover:border-indigo-400'}`}
                        >
                          {isCreated ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : isSelected && <Check className="w-4 h-4 text-white" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-semibold text-gray-900 text-lg">{task.title}</h5>
                            {isCreated && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Created</span>}
                          </div>
                          {task.description && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{task.description}</p>}
                          <div className="mt-3 text-xs text-gray-500 flex gap-4">
                            <span>{task.estimatedDays || 0} days</span>
                            <span>{task.estimatedHours || (task.estimatedDays * 8)} hours</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95 ${showCreateForm
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-green-500 hover:bg-green-400 text-white shadow-sm'
                  }`}
              >
                {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showCreateForm ? 'Cancel' : 'Create Task'}
              </button>

              {/* Modify button */}
              {/* <button
                className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm bg-white/15 hover:bg-white/25 text-white border border-white/30 transition-all active:scale-95"
              >
                <Settings className="w-4 h-4" />
                Modify
              </button> */}

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
                onSuccess={() => { refetchTasks(); fetchSageTasks(); }}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          )}

          {activeSubTaskParent && (
            <div className="border-l border-r border-indigo-200 bg-amber-50/20 px-6 py-1">
              <CreateSubTaskForm
                project={project}
                parentTask={activeSubTaskParent}
                onSuccess={() => { refetchTasks(); fetchSageTasks(); }}
                onCancel={() => setActiveSubTaskParent(null)}
              />
            </div>
          )}

          {activeUpdateTask && (
            <div className="border-l border-r border-indigo-200 bg-indigo-50/30 px-6 py-1">
              <UpdateTaskForm
                project={project}
                task={activeUpdateTask}
                onSuccess={() => { refetchTasks(); fetchSageTasks(); }}
                onCancel={() => setActiveUpdateTask(null)}
              />
            </div>
          )}

          {/* Task Detail Body - REDESIGNED TABLE VIEW */}
          {showTaskHeader && (
            <div className="bg-white border border-gray-200 border-t-0 rounded-b-2xl overflow-hidden">
              {loadingSageTasks ? (
                <div className="text-center py-10 text-gray-400">Loading tasks...</div>
              ) : sageTasks.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-medium">No tasks found for this project in Sage X3</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#003B52] text-white text-xs uppercase tracking-wider">
                        <th className="px-4 py-3 text-left font-semibold border-r border-white/10 w-[40%]">Task</th>
                        <th className="px-4 py-3 text-left font-semibold border-r border-white/10 w-[15%]">Status</th>
                        <th className="px-4 py-3 text-left font-semibold border-r border-white/10 w-[15%]">Category</th>
                        <th className="px-4 py-3 text-left font-semibold border-r border-white/10 w-[15%]">Start date</th>
                        <th className="px-4 py-3 text-left font-semibold w-[15%] border-r border-white/10">End date</th>
                        <th className="px-4 py-3 text-left font-semibold w-[10%]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-700">
                      {sageTasks.map((sageTask, taskIdx) => {
                        // Check if task should be visible based on ancestors
                        const isVisible = (task) => {
                          if (task.level === 0) return true;
                          // Find ancestors
                          let currentLevel = task.level;
                          let searchIdx = taskIdx - 1;
                          while (searchIdx >= 0 && currentLevel > 0) {
                            const prev = sageTasks[searchIdx];
                            if (prev.level === currentLevel - 1) {
                              if (!expandedSageTasks[prev.taskCode]) return false;
                              currentLevel = prev.level;
                            }
                            searchIdx--;
                          }
                          return true;
                        };

                        if (!isVisible(sageTask)) return null;

                        return (
                          <tr
                            key={sageTask.taskCode}
                            className={`group hover:bg-indigo-50/50 transition-colors border-b border-gray-100 ${taskIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                          >
                            {/* Task Code & Title */}
                            <td className="px-4 py-4 align-top border-r border-gray-100">
                              <div
                                className="flex items-start gap-3"
                                style={{ paddingLeft: `${(sageTask.level || 0) * 28}px` }}
                              >
                                <div className="mt-0.5 flex-shrink-0 flex items-center gap-1">
                                  {sageTask.hasChildren && (
                                    <button
                                      onClick={() => setExpandedSageTasks(prev => ({ ...prev, [sageTask.taskCode]: !prev[sageTask.taskCode] }))}
                                      className="p-0.5 hover:bg-indigo-100 rounded transition-colors"
                                    >
                                      {expandedSageTasks[sageTask.taskCode] ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />
                                      )}
                                    </button>
                                  )}
                                  {!sageTask.hasChildren && sageTask.level > 0 && (
                                    <CornerDownRight className="w-4 h-4 text-indigo-400" />
                                  )}
                                  {sageTask.level === 0 && !sageTask.hasChildren && (
                                    sageTask.category === 'PROJECT' ? (
                                      <User className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <Box className="w-4 h-4 text-gray-500" />
                                    )
                                  )}
                                </div>
                                <div className="flex flex-col gap-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold whitespace-nowrap ${sageTask.level > 0 ? 'text-indigo-600 text-xs' : 'text-blue-700'}`}>
                                      {sageTask.taskCode}
                                    </span>
                                    <span className={`text-gray-900 font-medium line-clamp-1 ${sageTask.level > 0 ? 'text-sm' : ''}`}>
                                      [ {sageTask.description || sageTask.shortDesc || 'No Title'} ]
                                    </span>
                                  </div>
                                  {sageTask.shortDesc && sageTask.shortDesc !== sageTask.description && (
                                    <span className="text-xs text-gray-500 italic ml-1">
                                      {sageTask.shortDesc}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-4 align-top border-r border-gray-100">
                              <div className="flex items-center justify-between group-hover:pr-2 transition-all">
                                <span className="font-semibold text-gray-800">{statusLabel(sageTask.status)}</span>
                                <div className="text-gray-300">⋮</div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="px-4 py-4 align-top border-r border-gray-100">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-5 bg-amber-400 rounded-full" />
                                <span className="font-medium text-gray-700">{sageTask.category}</span>
                                <Search className="w-3.5 h-3.5 text-gray-300 ml-auto cursor-pointer hover:text-indigo-500" />
                              </div>
                            </td>

                            {/* Start Date */}
                            <td className="px-4 py-4 align-top border-r border-gray-100">
                              <div className="flex items-center gap-2 bg-gray-50/50 rounded p-1.5 border border-gray-100 group-hover:bg-white transition-colors">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs font-medium">{parseSageDate(sageTask.startDate)}</span>
                                <div className="ml-auto flex flex-col gap-0.5 opacity-20 group-hover:opacity-100">
                                  <div className="w-3 h-3 border border-gray-300 rounded-sm" />
                                </div>
                              </div>
                            </td>

                            {/* End Date */}
                            <td className="px-4 py-4 align-top">
                              <div className="flex items-center gap-2 bg-gray-50/50 rounded p-1.5 border border-gray-100 group-hover:bg-white transition-colors">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs font-medium">{parseSageDate(sageTask.endDate)}</span>
                                <div className="ml-auto flex flex-col gap-0.5 opacity-20 group-hover:opacity-100">
                                  <div className="w-3 h-3 border border-gray-300 rounded-sm" />
                                </div>
                              </div>
                            </td>

                            {/* Action */}
                            <td className="px-4 py-4 align-middle">
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => {
                                    setShowCreateForm(false);
                                    setActiveUpdateTask(null);
                                    setActiveSubTaskParent(sageTask);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap"
                                >
                                  <Plus className="w-3 h-3" /> Create Task
                                </button>
                                <button
                                  onClick={() => {
                                    setShowCreateForm(false);
                                    setActiveSubTaskParent(null);
                                    setActiveUpdateTask(sageTask);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap"
                                >
                                  <Pencil className="w-3 h-3" /> Update Task
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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

    </div>
  );
}

export default TasksTab;