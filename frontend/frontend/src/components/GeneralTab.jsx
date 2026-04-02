import React, { useState } from 'react';
import { 
  FileText, 
  MapPin, 
  Building2, 
  Calendar, 
  Clock, 
  Briefcase, 
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

function GeneralTab({ project }) {
  if (!project) return null;

  const sx = project.sageX3 || {};

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    if (dateStr.length === 6) {
      const day = dateStr.slice(0,2);
      const month = dateStr.slice(2,4);
      const year = `20${dateStr.slice(4)}`;
      return `${day}/${month}/${year}`;
    }
    return new Date(dateStr).toLocaleDateString('en-GB', { 
      day: '2-digit', month: '2-digit', year: '2-digit' 
    });
  };

  const [showProjectHeader, setShowProjectHeader] = useState(true);

  return (
    <div className="space-y-6">
      {/* Sage X3 Badge */}
      <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg w-fit">
        <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
          <span className="text-white text-xs font-black">X3</span>
        </div>
        <span className="text-sm font-semibold text-indigo-700">Sage X3 — Project General Tab</span>
      </div>

      {/* ==================== PROJECT HEADER ==================== */}
      <div>
        <div 
          onClick={() => setShowProjectHeader(!showProjectHeader)}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6 py-5 rounded-t-2xl flex flex-col justify-between cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6" />
              <span className="font-bold text-xl">
                {sx.projectName || project.name || 'Unnamed Project'}
              </span>
            </div>
            {showProjectHeader ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </div>
          <span className="text-sm opacity-90 mt-1">Sage X3 — Project Details</span>
        </div>

        {showProjectHeader && (
          <div className="bg-white border border-gray-200 border-t-0 rounded-b-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Number */}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">PROJECT NUMBER</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900">
                  {sx.projectNum}
                </div>
              </div>

              {/* Row 1 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">SALES SITE</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />{sx.salesSite || '—'}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">OPERATING SITE</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />OP-MAD-01
                </div>
              </div>

              {/* Row 2 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">CUSTOMER BP</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">{sx.customerBP || '—'}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">SALES REP</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">{sx.salesRep || '—'}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">CURRENCY</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium">{sx.currency}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">RATE TYPE</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                  {sx.rateType === "1" ? "Standard" : sx.rateType || '—'}
                </div>
              </div>

              {/* Row 3 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">PROJECT TYPE</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">{sx.projectType || '—'}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">CONTACT RELATION</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">{sx.contactRelation || '—'}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">OPEN DATE</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                  {formatDate(sx.openDate)}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">STATUS</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium">
                  {sx.closeFlag === "1" ? "Closed" : "Open"}
                </div>
              </div>

              {/* Audit Fields */}
              <div className="col-span-2 grid grid-cols-2 gap-6 mt-2">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">CREATED ON</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                    {formatDate(sx.creationTime)} by {sx.creationUser || '—'}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">LAST MODIFIED</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                    {formatDate(sx.changeDate)} by {sx.changeUser || '—'}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">DESCRIPTION</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 leading-relaxed min-h-[80px]">
                  {sx.projectName || project.name} project details
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer */}
      {/* <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Customer</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-gray-500">Name</div>
            <div className="font-medium text-gray-900">{project.customer?.name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Contact Person</div>
            <div className="font-medium">{project.customer?.contactName || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Sales Representative</div>
            <div className="font-medium">{project.customer?.salesRepName}</div>
          </div>
        </div>
      </div> */}

      {/* Project Timeline */}
      {/* <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Project Timeline</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-gray-500">Start Date</div>
            <div className="font-medium">{project.startDate || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Due Date</div>
            <div className="font-medium">{project.endDate || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Duration</div>
            <div className="font-medium">{project.duration} days</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Current Phase</div>
            <div className="font-medium capitalize">{project.currentPhase || 'N/A'}</div>
          </div>
        </div>
      </div> */}

      {/* Time Tracking */}
      {/* <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Time Tracking</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-gray-500">Time Spent</div>
            <div className="font-medium text-blue-700">{project.timeSpent}h / {project.estimatedTime}h</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Typical Start</div>
            <div className="font-medium">09:00 AM</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Typical End</div>
            <div className="font-medium">05:30 PM</div>
          </div>
        </div>
      </div> */}

      {/* Management */}
      {/* <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Briefcase className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Management</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-gray-500">Person Responsible</div>
            <div className="font-medium flex items-center gap-2">
              <User className="w-4 h-4" />{project.personResponsible}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Overall Progress</div>
            <div className="font-medium">{project.progress}%</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Status</div>
            <div className="font-medium capitalize">{project.status}</div>
          </div>
        </div>
      </div> */}
    </div>
  );
}

export default GeneralTab;