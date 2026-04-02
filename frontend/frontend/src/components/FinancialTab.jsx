import { useState, useRef, useEffect } from 'react';
import {
  Users, Clock, Target, DollarSign, Edit2, Check,
  AlertTriangle, UserCheck, Timer, TrendingUp, Layers, Calendar
} from 'lucide-react';
import { TEAM_MEMBERS } from './TasksTab';

// ─── INLINE EDITABLE RATE CELL ───────────────────────────────────────────────
function EditableRate({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const commit = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed >= 0) onChange(parsed);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-gray-500 text-sm">$</span>
        <input
          ref={inputRef}
          className="w-16 border border-blue-400 rounded px-1.5 py-0.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <button onClick={commit} className="p-0.5 text-green-600 hover:text-green-700">
          <Check className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      className="flex items-center gap-1.5 group px-2 py-1 rounded hover:bg-blue-50 transition-colors"
    >
      <span className="text-sm font-bold text-gray-900">${value}/hr</span>
      <Edit2 className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
    </button>
  );
}

// ─── DEFAULT HOURLY RATES (fallback) ─────────────────────────────────────────
const DEFAULT_HOURLY_RATES = {
  "Sarah Mitchell": 75,
  "Michael Chen": 90,
  "Emma Rodriguez": 65,
  "David Kim": 85,
};

// ─── DATE/TIME FORMATTER ─────────────────────────────────────────────────────
function formatShortDateTime(dateStr, timeStr) {
  if (!dateStr) return '—';
  try {
    const dt = new Date(`${dateStr}T${timeStr || '00:00'}`);
    return dt.toLocaleString('en-US', {
      weekday: 'short',
      month:   'short',
      day:     'numeric',
      year:    'numeric',
      hour:    '2-digit',
      minute:  '2-digit',
      hour12:  true,
    });
  } catch {
    return `${dateStr} ${timeStr || ''}`;
  }
}

function FinancialTab({ project, taskAssignments = {} }) {
  // Early return if no project
  if (!project) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">
        <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium">No project data available</p>
      </div>
    );
  }

  const p = project;
  const fin = p.sageX3?.fin || {
    revenues: 0,
    invoiced: 0,
    toInvoice: 0,
    budgeted: 0,
    margin: 0,
    marginPct: 0
  };

  // ─── COMPUTE TASK-ASSIGNMENT FINANCIALS ──────────────────────────────────────
  // Flatten all assignments across all tasks
  const allAssignments = Object.entries(taskAssignments).flatMap(([taskId, assignments]) =>
    assignments.map(a => ({ ...a, taskId }))
  );

  // Per-member aggregation from task assignments
  const memberFinancials = TEAM_MEMBERS.map(member => {
    const memberAssignments = allAssignments.filter(a => a.memberId === member.id);
    const totalHours = memberAssignments.reduce((s, a) => s + (a.hours || 0), 0);
    const totalCost = memberAssignments.reduce((s, a) => s + (a.cost || 0), 0);
    const taskCount = memberAssignments.length;
    return {
      ...member,
      totalHours,
      totalCost,
      taskCount,
      assignments: memberAssignments,
    };
  }).filter(m => m.taskCount > 0); // only show members with assignments

  // Per-task financials from taskAssignments
  const taskFinancials = Object.entries(taskAssignments).map(([taskId, assignments]) => {
    // Find task info from project subtasks
    const taskInfo = (p.subtasks || []).find(t => String(t.id) === String(taskId));
    const totalHours = assignments.reduce((s, a) => s + (a.hours || 0), 0);
    const totalCost = assignments.reduce((s, a) => s + (a.cost || 0), 0);
    return {
      taskId,
      taskTitle: taskInfo?.title || `Task #${taskId}`,
      taskBudget: taskInfo?.expense || 0,
      assignments,
      totalHours,
      totalCost,
    };
  });

  const grandTotalCost = allAssignments.reduce((s, a) => s + (a.cost || 0), 0);
  const grandTotalHours = allAssignments.reduce((s, a) => s + (a.hours || 0), 0);
  const totalTaskBudget = taskFinancials.reduce((s, t) => s + t.taskBudget, 0);

  // ─── LEGACY RESOURCE FINANCIALS (for Sage projects) ─────────────────────────
  const hasResources = p.resources && Array.isArray(p.resources) && p.resources.length > 0;

  const [rates, setRates] = useState(() => {
    const init = {};
    if (hasResources) {
      p.resources.forEach((r) => {
        init[r.name] = DEFAULT_HOURLY_RATES[r.name] || 70;
      });
    }
    return init;
  });

  const updateRate = (name, val) => {
    setRates((prev) => ({ ...prev, [name]: val }));
  };

  const resourceCosts = hasResources ? p.resources.map((r) => {
    const rate = rates[r.name] || 70;
    const estCost = (r.estHours || 0) * rate;
    const spentCost = (r.spentHours || 0) * rate;
    const remaining = estCost - spentCost;
    const pct = r.estHours > 0 ? Math.round((r.spentHours / r.estHours) * 100) : 0;
    return { ...r, rate, estCost, spentCost, remaining, pct };
  }) : [];

  const totalEstCost = resourceCosts.reduce((sum, r) => sum + r.estCost, 0);
  const totalSpentCost = resourceCosts.reduce((sum, r) => sum + r.spentCost, 0);
  const totalRemaining = totalEstCost - totalSpentCost;
  const overallPct = totalEstCost > 0 ? Math.round((totalSpentCost / totalEstCost) * 100) : 0;

  const taskCosts = (p.tasks || []).map((t) => {
    const rate = rates[t.assignee] || 70;
    const spentCost = (t.timeSpent || 0) * rate;
    const estCost = (t.estTime || 0) * rate;
    return { ...t, rate, spentCost, estCost };
  });

  const hasTaskAssignments = allAssignments.length > 0;

  return (
    <div className="space-y-8 pb-6">

      {/* Sage X3 header */}
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center shadow-sm">
          <span className="text-white text-xs font-black">X3</span>
        </div>
        <span className="text-sm font-semibold text-indigo-700">Sage X3 - Financial Status</span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION A: TASK ASSIGNMENT COSTS (from Log Hours)
         ═══════════════════════════════════════════════════════════════════════ */}
      {hasTaskAssignments ? (
        <>
          {/* A1. Assignment Summary Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-5 h-5 text-indigo-200" />
              <span className="text-indigo-200 text-sm font-semibold uppercase tracking-wide">Task Assignment Summary</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/15 rounded-2xl p-4 text-center">
                <p className="text-indigo-200 text-xs font-semibold uppercase mb-1">Total Cost Assigned</p>
                <p className="text-3xl font-bold">${grandTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-indigo-200 text-xs mt-1">across {taskFinancials.length} task{taskFinancials.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="bg-white/15 rounded-2xl p-4 text-center">
                <p className="text-indigo-200 text-xs font-semibold uppercase mb-1">Total Hours Logged</p>
                <p className="text-3xl font-bold">{grandTotalHours.toLocaleString()}h</p>
                <p className="text-indigo-200 text-xs mt-1">by {memberFinancials.length} member{memberFinancials.length !== 1 ? 's' : ''}</p>
              </div>
                            <div className="bg-white/15 rounded-2xl p-4 text-center">
                <p className="text-indigo-200 text-xs font-semibold uppercase mb-1">vs Task Budgets</p>
                <p className={`text-3xl font-bold ${
                  grandTotalCost > totalTaskBudget ? 'text-red-300' : 'text-emerald-300'
                }`}>
                  {grandTotalCost > totalTaskBudget 
                    ? `-$${ (grandTotalCost - totalTaskBudget).toLocaleString(undefined, { minimumFractionDigits: 2 }) }` 
                    : `+$${ (totalTaskBudget - grandTotalCost).toLocaleString(undefined, { minimumFractionDigits: 2 }) }`
                  }
                </p>
                <p className="text-indigo-200 text-xs mt-1">
                  {grandTotalCost > totalTaskBudget ? 'over budget' : 'under budget'}
                </p>
              </div>
            </div>
          </div>

          {/* A2. Per-Member Cost Table */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              Assigned Members — Cost Breakdown
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Member</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Role</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600">Hourly Rate</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600">Tasks</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600">Hours Logged</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Scheduled Date & Time</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {memberFinancials.map(member => (
                    <tr key={member.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${member.color} rounded-2xl flex items-center justify-center text-white text-sm font-bold`}>
                            {member.avatar}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{member.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{member.role}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-emerald-700">${member.hourlyRate}/hr</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-full">
                          {member.taskCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-blue-700">
                        {member.totalHours}h
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          // find the most recent workDate across this member's assignments
                          const latestLog = member.assignments
                            .filter(a => a.workDate)
                            .sort((a, b) => {
                              const da = new Date(`${a.workDate}T${a.workTime || '00:00'}`);
                              const db = new Date(`${b.workDate}T${b.workTime || '00:00'}`);
                              return db - da;
                            })[0];
                          return latestLog ? (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                              <span className="text-xs text-indigo-600 font-medium">
                                {formatShortDateTime(latestLog.workDate, latestLog.workTime)}
                              </span>
                            </div>
                          ) : <span className="text-xs text-gray-400">—</span>;
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        ${member.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-indigo-50 border-t-2 border-indigo-200 font-bold">
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-gray-800">Total</td>
                    <td className="px-6 py-4 text-center text-blue-700">{grandTotalHours}h</td>
                    <td className="px-6 py-4 text-right text-indigo-700 text-lg">
                      ${grandTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* A3. Per-Task Cost Breakdown */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-gray-700" />
              Per Task — Assignment Details
            </h3>
            <div className="space-y-4">
              {taskFinancials.map(tf => {
                const overBudget = tf.totalCost > tf.taskBudget && tf.taskBudget > 0;
                return (
                  <div key={tf.taskId} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    {/* Task header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <Target className="w-4 h-4 text-indigo-500" />
                        <span className="font-semibold text-gray-900">{tf.taskTitle}</span>
                        {overBudget && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Over Budget</span>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Task Budget</p>
                          <p className="font-semibold text-gray-700">${tf.taskBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Assigned Cost</p>
                          <p className={`font-bold ${overBudget ? 'text-red-600' : 'text-indigo-700'}`}>
                            ${tf.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Hours</p>
                          <p className="font-semibold text-blue-700">{tf.totalHours}h</p>
                        </div>
                      </div>
                    </div>

                    {/* Assignment rows */}
                    <div className="divide-y divide-gray-50">
                      {tf.assignments.map((a, idx) => (
                        <div key={idx} className="flex items-center gap-4 px-5 py-3">
                          <div className={`w-8 h-8 bg-gradient-to-br ${a.memberColor} rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {a.memberAvatar}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{a.memberName}</p>
                            <p className="text-xs text-gray-500">{a.memberRole}</p>
                            {/* Scheduled date/time — chosen by the resource */}
                            {a.workDate && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3 text-indigo-400" />
                                <span className="text-[11px] text-indigo-500 font-medium">
                                  Scheduled: {formatShortDateTime(a.workDate, a.workTime)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-6 text-sm flex-shrink-0">
                            <span className="text-gray-500">${a.hourlyRate}/hr</span>
                            <span className="font-medium text-blue-700">{a.hours}h</span>
                            <span className="font-bold text-gray-900 min-w-[80px] text-right">
                              ${a.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* No assignments yet — friendly placeholder */
        <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl p-10 text-center">
          <Timer className="w-12 h-12 mx-auto mb-4 text-indigo-300" />
          <p className="text-lg font-semibold text-indigo-700">No hours logged yet</p>
          <p className="text-sm text-indigo-400 mt-1">Go to the <strong>Tasks</strong> tab and click <strong>"+ Log Hours"</strong> on any task to assign members and log hours. The costs will appear here automatically.</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION B: LEGACY RESOURCE TABLE (Sage projects only)
         ═══════════════════════════════════════════════════════════════════════ */}
      {hasResources && (
        <>
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-700" /> Per Resource — Hours & Rates
            </h3>

            {/* Overall Cost Summary */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide mb-1">Total Budget</p>
                  <p className="text-3xl font-bold text-gray-900">${totalEstCost.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">from estimated hours × rates</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide mb-1">Spent So Far</p>
                  <p className="text-3xl font-bold text-blue-700">${totalSpentCost.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{overallPct}% of budget used</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 uppercase font-semibold tracking-wide mb-1">Remaining</p>
                  <p className={`text-3xl font-bold ${totalRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totalRemaining < 0 ? '-' : ''}${Math.abs(totalRemaining).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{totalRemaining < 0 ? 'over budget' : 'left to spend'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-700">
                  <span className="font-medium">Overall Progress</span>
                  <span className="font-bold">{overallPct}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      overallPct > 90 ? 'bg-red-500' :
                      overallPct > 70 ? 'bg-yellow-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(overallPct, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full min-w-[950px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Resource</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Role</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600">Hourly Rate (editable)</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600">Est. Hours</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600">Spent Hours</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600">Hours Used</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600">Est. Cost</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600">Spent Cost</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resourceCosts.map((r) => (
                    <tr key={r.name} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {r.av || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{r.name}</p>
                            <p className="text-xs text-gray-500">{r.dept || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{r.role || '—'}</td>
                      <td className="px-6 py-4 text-center">
                        <EditableRate value={r.rate} onChange={(v) => updateRate(r.name, v)} />
                      </td>
                      <td className="px-6 py-4 text-center font-medium">{r.estHours || 0}h</td>
                      <td className="px-6 py-4 text-center font-bold">
                        <span className={r.spentHours >= r.estHours ? "text-red-600" : "text-blue-700"}>
                          {r.spentHours || 0}h
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-center min-w-[100px]">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                r.pct >= 90 ? 'bg-red-500' :
                                r.pct >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(r.pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600">{r.pct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">${r.estCost.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-700">${r.spentCost.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold">
                        <span className={r.remaining < 0 ? "text-red-600" : "text-green-600"}>
                          {r.remaining < 0 ? '-' : ''}${Math.abs(r.remaining).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-gray-800">Total</td>
                    <td className="px-6 py-4 text-right text-gray-800">${totalEstCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-blue-700">${totalSpentCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={totalRemaining < 0 ? "text-red-600" : "text-green-600"}>
                        {totalRemaining < 0 ? '-' : ''}${Math.abs(totalRemaining).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Per-Task Cost Breakdown (legacy) */}
          {taskCosts.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-gray-700" /> Per Task — Cost Breakdown
              </h3>
              <div className="space-y-3">
                {taskCosts.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-200 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="text-gray-600">{task.assignee}</span>
                        <span className="text-blue-600 font-medium">${task.rate}/hr</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 sm:gap-10 flex-shrink-0">
                      <div className="text-right min-w-[80px]">
                        <p className="text-xs text-gray-500">Hours</p>
                        <p className="font-medium">
                          {task.timeSpent || 0} <span className="text-gray-400">/ {task.estTime || 0}</span>
                        </p>
                      </div>
                      <div className="w-24">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              task.timeSpent >= task.estTime ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(((task.timeSpent || 0) / (task.estTime || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right min-w-[90px]">
                        <p className="text-xs text-gray-500">Spent</p>
                        <p className="font-bold text-blue-700">${task.spentCost.toLocaleString()}</p>
                      </div>
                      <div className="text-right min-w-[90px]">
                        <p className="text-xs text-gray-500">Budget</p>
                        <p className="font-medium">${task.estCost.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}

export default FinancialTab;