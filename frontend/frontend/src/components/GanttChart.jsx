import React, { useMemo } from 'react';
import { Calendar, ChevronRight, Clock, User, Box } from 'lucide-react';

/**
 * Professional Gantt Chart Component
 * Implements a split-pane layout with a fixed task sidebar and a scrollable timeline.
 */
const GanttChart = ({ subtasks = [] }) => {
  // Helper to parse dates
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === '—') return null;
    if (/^\d{6}$/.test(dateStr)) {
      const day = parseInt(dateStr.slice(0, 2), 10);
      const month = parseInt(dateStr.slice(2, 4), 10) - 1;
      const year = 2000 + parseInt(dateStr.slice(4, 6), 10);
      return new Date(year, month, day);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // Process tasks
  const { tasksWithDates, minDate, maxDate, totalDays } = useMemo(() => {
    let min = null;
    let max = null;
    
    const validTasks = subtasks.map(t => {
      const start = parseDate(t.startDate || t.endDate);
      const end = parseDate(t.endDate || t.startDate);
      
      if (start && end) {
        if (!min || start < min) min = new Date(start);
        if (!max || end > max) max = new Date(end);
      }
      
      return { ...t, start, end };
    }).filter(t => t.start && t.end);

    // Default range if no dates found
    if (!min || !max) {
      min = new Date();
      max = new Date();
      max.setDate(max.getDate() + 30);
    } else {
      // Add padding
      min = new Date(min.setDate(min.getDate() - 5));
      max = new Date(max.setDate(max.getDate() + 10));
    }

    const diff = Math.ceil((max - min) / (1000 * 60 * 60 * 24));
    
    return { 
      tasksWithDates: validTasks, 
      minDate: min, 
      maxDate: max, 
      totalDays: diff || 1 
    };
  }, [subtasks]);

  // Status colors matching Task Details table
  const getStatusConfig = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'completed' || s === 'done' || s === '3') {
      return {
        bar: 'bg-emerald-500',
        text: 'text-emerald-600',
        dot: 'bg-emerald-500'
      };
    }
    if (s === 'in-progress' || s === 'active' || s === '2') {
      return {
        bar: 'bg-blue-600',
        text: 'text-blue-600',
        dot: 'bg-blue-600'
      };
    }
    return {
      bar: 'bg-gray-400',
      text: 'text-gray-600',
      dot: 'bg-gray-400'
    };
  };

  // Grid markers
  const gridLines = useMemo(() => {
    const lines = [];
    const current = new Date(minDate);
    for (let i = 0; i <= totalDays; i++) {
      if (i % 7 === 0 || i === 0 || i === totalDays) {
        lines.push({
          label: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          offset: (i / totalDays) * 100
        });
      }
      current.setDate(current.getDate() + 1);
    }
    return lines;
  }, [minDate, totalDays]);

  if (subtasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
        <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500 font-medium italic">No scheduled tasks available for timeline visualization.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl flex flex-col">
      {/* Top Banner - Compact */}
      <div className="px-6 py-4 border-b bg-[#003B52] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-300" />
          <h3 className="font-bold tracking-tight">Project Gantt Schedule</h3>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-400" /><span className="text-[10px] font-bold uppercase">To Do</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[10px] font-bold uppercase">Active</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold uppercase">Done</span></div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden h-[500px]">
        {/* LEFT SIDEBAR: Task Names */}
        <div className="w-[320px] flex-shrink-0 border-r border-gray-200 flex flex-col bg-gray-50/50">
          <div className="h-12 bg-gray-100/80 border-b border-gray-200 flex items-center px-4">
            <span className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Task Details</span>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {tasksWithDates.map((task, idx) => (
              <div 
                key={task.id || idx} 
                className={`h-16 flex flex-col justify-center px-4 border-b border-gray-100 hover:bg-white transition-colors ${idx % 2 === 0 ? 'bg-white/40' : 'bg-transparent'}`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black text-blue-700 whitespace-nowrap">{task.id || 'T-'+(idx+1)}</span>
                  <span className="text-[11px] font-bold text-gray-800 truncate">{task.title}</span>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-gray-400 font-bold uppercase">
                  <span>{task.category || 'PHASE'}</span>
                  <span className="text-gray-200">|</span>
                  <span>{task.progress || 0}% Done</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: Timeline Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Timeline Header */}
          <div className="h-12 border-b border-gray-200 relative bg-gray-50/30 overflow-hidden">
            <div className="absolute inset-0 flex">
              {gridLines.map((line, idx) => (
                <div 
                  key={idx} 
                  className="absolute border-l border-gray-100 h-full flex items-center pl-2"
                  style={{ left: `${line.offset}%` }}
                >
                  <span className="text-[10px] font-black text-gray-400 uppercase">{line.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bars Area */}
          <div className="flex-1 overflow-auto relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
            {/* Grid Overlay for full height */}
            <div className="absolute inset-0 flex pointer-events-none">
              {gridLines.map((line, idx) => (
                <div key={idx} className="absolute border-l border-gray-100/50 h-full" style={{ left: `${line.offset}%` }} />
              ))}
            </div>

            {/* Today marker */}
            <div 
              className="absolute top-0 bottom-0 w-px border-l-2 border-dashed border-red-400 z-20 pointer-events-none"
              style={{ left: `${((new Date() - minDate) / (1000 * 60 * 60 * 24) / totalDays) * 100}%` }}
            >
              <div className="sticky top-2 left-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter">
                Today
              </div>
            </div>

            {/* Bars */}
            <div className="min-h-full">
              {tasksWithDates.map((task, idx) => {
                const startOffset = ((task.start - minDate) / (1000 * 60 * 60 * 24) / totalDays) * 100;
                const durationDays = Math.max(1.2, Math.ceil((task.end - task.start) / (1000 * 60 * 60 * 24)));
                const width = (durationDays / totalDays) * 100;
                const config = getStatusConfig(task.status);
                
                return (
                  <div 
                    key={task.id || idx} 
                    className={`h-16 relative flex items-center border-b border-gray-100/50 hover:bg-blue-50/20 transition-colors ${idx % 2 === 0 ? 'bg-white/20' : 'bg-transparent'}`}
                  >
                    <div 
                      className={`absolute h-7 ${config.bar} rounded-lg shadow-sm flex items-center px-3 overflow-hidden group hover:shadow-lg hover:brightness-110 transition-all duration-300`}
                      style={{ 
                        left: `${Math.max(0, startOffset)}%`, 
                        width: `${Math.min(100 - startOffset, width)}%`,
                        minWidth: '32px'
                      }}
                    >
                      {/* Glossy overlay */}
                      <div className="absolute top-0 inset-x-0 h-1/2 bg-white/10" />
                      
                      {/* Progress bar overlay */}
                      <div 
                        className="absolute inset-y-0 left-0 bg-black/20"
                        style={{ width: `${task.progress || 0}%` }}
                      />

                      {width > 15 && (
                        <div className="flex items-center gap-2 relative z-10 text-white font-black text-[9px] whitespace-nowrap">
                          <User className="w-3 h-3 opacity-70" />
                          <span>{durationDays.toFixed(0)}d</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 bg-gray-100/50 border-t flex justify-between items-center">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Data synchronized with Sage ERP · Project Timeline View
        </p>
        <div className="flex items-center gap-4 text-[10px] font-black text-blue-600">
           <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {totalDays} Day Span</span>
           <ChevronRight className="w-4 h-4"/>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
