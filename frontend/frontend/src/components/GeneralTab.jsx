import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, MapPin, Building2, ChevronDown, ChevronUp, Search, ChevronsUpDown } from 'lucide-react';

function formatDateForView(dateValue) {
  if (!dateValue) return '-';

  if (/^\d{6}$/.test(dateValue)) {
    const day = dateValue.slice(0, 2);
    const month = dateValue.slice(2, 4);
    const year = `20${dateValue.slice(4)}`;
    return `${day}/${month}/${year}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-');
    return `${day}/${month}/${year}`;
  }

  return dateValue;
}

function uiDateToDdMmYyyy(value) {
  if (!value) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  return value;
}

function Field({ label, required = false, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
        {label}
        {required ? <span className="text-red-600 ml-1">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function ReadValue({ icon: Icon, value }) {
  return (
    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 flex items-center gap-2">
      {Icon ? <Icon className="w-4 h-4 text-indigo-600" /> : null}
      {value || '-'}
    </div>
  );
}

function EditInput({ value, onChange, placeholder = '', type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  );
}

function SearchableDropdown({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  disabled = false,
  loading = false,
  showLabel = true,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const selected = options.find((item) => item.id === value);
    setSearchQuery(selected ? selected.id : value || '');
  }, [options, value]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const handleForceClose = () => setIsOpen(false);
    window.addEventListener('close-searchable-dropdowns', handleForceClose);
    return () => window.removeEventListener('close-searchable-dropdowns', handleForceClose);
  }, []);

  const filteredData = options.filter((item) =>
    String(item.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(item.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selected = options.find((item) => item.id === value) || null;

  const applyTypedCodeIfValid = () => {
    const typed = String(searchQuery || '').trim().toLowerCase();
    if (!typed) {
      setSearchQuery(selected ? selected.id : '');
      return;
    }
    const exactByCode = options.find((item) => String(item.id || '').toLowerCase() === typed);
    if (exactByCode) {
      onChange(exactByCode.id);
      setSearchQuery(exactByCode.id);
    } else {
      setSearchQuery(selected ? selected.id : '');
    }
  };

  return (
    <div ref={dropdownRef} className="relative" data-searchable-dropdown="true">
      {showLabel && (
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
          {label}{required ? ' *' : ''}
        </label>
      )}
      <div className={`relative rounded-xl border ${disabled ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}>
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onBlur={(e) => {
            applyTypedCodeIfValid();
            const nextFocused = e.relatedTarget;
            if (!dropdownRef.current?.contains(nextFocused)) {
              setIsOpen(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              applyTypedCodeIfValid();
              setIsOpen(false);
            }
          }}
          className="w-full px-4 py-3 pl-10 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900"
          placeholder={placeholder}
          disabled={disabled}
        />
        <ChevronsUpDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-[200px] overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
          ) : filteredData.length > 0 ? (
            filteredData.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item.id);
                  setSearchQuery(item.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-800"
              >
                {item.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              {options.length === 0 ? 'No data available yet' : 'No results'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GeneralTab({ project }) {
  const navigate = useNavigate();
  if (!project) return null;

  const sx = project.sageX3 || {};
  const isDraft = Boolean(project.sageDraft);
  const BACKEND_URL = 'http://127.0.0.1:8000';

  const [showProjectHeader, setShowProjectHeader] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [sites, setSites] = useState([]);
  const [masterDataError, setMasterDataError] = useState('');
  const [isMasterDataLoading, setIsMasterDataLoading] = useState(true);
  const [draftForm, setDraftForm] = useState({
    projectNumber: '',
    salesSite: '',
    operatingSite: '',
    customerBP: '',
    salesRep: '',
    currency: 'EUR',
    rateType: '',
    projectType: '',
    contactRelation: '',
    openDate: '',
    description: '',
  });

  const mandatoryMissing =
    !String(draftForm.salesSite || '').trim() ||
    !String(draftForm.currency || '').trim() ||
    !String(draftForm.description || '').trim();

  useEffect(() => {
    if (!isDraft) return;

    const cachedCustomers = localStorage.getItem('soap_customers_cache');
    const cachedSites = localStorage.getItem('soap_sites_cache');
    if (cachedCustomers && cachedSites) {
      try {
        const parsedCustomers = JSON.parse(cachedCustomers);
        const parsedSites = JSON.parse(cachedSites);
        if (Array.isArray(parsedCustomers) && Array.isArray(parsedSites)) {
          setCustomers(parsedCustomers);
          setSites(parsedSites);
          setIsMasterDataLoading(false);
        }
      } catch {
        // ignore cache parse errors
      }
    }

    const fetchFromAnyEndpoint = async (paths, errMessage) => {
      let lastError = null;
      for (const path of paths) {
        try {
          const response = await fetch(`${BACKEND_URL}${path}`);
          const payload = await response.json().catch(() => null);
          if (response.ok && Array.isArray(payload)) return payload;
          lastError = new Error(`${errMessage} (${path})`);
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError || new Error(errMessage);
    };

    const fetchMasterData = async () => {
      setMasterDataError('');
      if (!cachedCustomers || !cachedSites) setIsMasterDataLoading(true);
      try {
        const [customersData, sitesData] = await Promise.all([
          fetchFromAnyEndpoint(
            ['/api/soap/customers/', '/api/customers/'],
            'Failed to load customers list.'
          ),
          fetchFromAnyEndpoint(
            ['/api/soap/sites/', '/api/sites/'],
            'Failed to load sites list.'
          ),
        ]);
        setCustomers(customersData);
        setSites(sitesData);
        localStorage.setItem('soap_customers_cache', JSON.stringify(customersData));
        localStorage.setItem('soap_sites_cache', JSON.stringify(sitesData));
      } catch (error) {
        setMasterDataError(error.message || 'Could not load dropdown data.');
      } finally {
        setIsMasterDataLoading(false);
      }
    };

    fetchMasterData();
  }, [BACKEND_URL, isDraft]);

  const isAllowedCode = (value, options) =>
    options.some((item) => String(item.id || '').toLowerCase() === String(value || '').trim().toLowerCase());

  useEffect(() => {
    if (!isDraft) return;
    setDraftForm({
      projectNumber: sx.projectNum || '',
      salesSite: sx.salesSite || '',
      operatingSite: sx.operatingSite || '',
      customerBP: sx.customerBP || '',
      salesRep: sx.salesRep || '',
      currency: sx.currency || 'EUR',
      rateType: sx.rateType || '',
      projectType: sx.projectType || '',
      contactRelation: sx.contactRelation || '',
      openDate: sx.openDate || '',
      description: sx.projectName || project.name || '',
    });
  }, [isDraft, project.id, project.name, sx]);

  const submitDraftToSage = async () => {
    if (mandatoryMissing) {
      setStatusMessage({ type: 'error', text: 'Sales Site, Description and Currency are required.' });
      return;
    }
    if (!isAllowedCode(draftForm.salesSite, sites)) {
      setStatusMessage({ type: 'error', text: 'Please choose a valid Sales Site code from the dropdown list.' });
      return;
    }
    if (draftForm.customerBP && !isAllowedCode(draftForm.customerBP, customers)) {
      setStatusMessage({ type: 'error', text: 'Please choose a valid Customer BP code from the dropdown list.' });
      return;
    }

    const payload = {
      ...draftForm,
      openDate: uiDateToDdMmYyyy(draftForm.openDate),
    };

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/soap/projects/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        setStatusMessage({
          type: 'error',
          text: result.error || `Failed to create project in Sage X3 (HTTP ${response.status}).`,
        });
        return;
      }

      const createdProjectId = String(result.project_id || '').trim() || `sage-${Date.now()}`;
      const createdProject = {
        ...project,
        id: createdProjectId,
        name: draftForm.description || createdProjectId,
        code: createdProjectId,
        status: 'Open',
        sageDraft: false,
        source: 'soap-ui',
        sageX3: {
          ...project.sageX3,
          ...draftForm,
          projectNum: createdProjectId,
          openDate: payload.openDate,
          projectName: draftForm.description || createdProjectId,
        },
      };

      setStatusMessage({
        type: 'success',
        text: `Project created in Sage X3. Project ID: ${createdProjectId}`,
      });

      navigate(`/projects/${createdProjectId}`, {
        replace: true,
        state: { project: createdProject },
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: `Unable to connect to backend: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg w-fit">
        <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
          <span className="text-white text-xs font-black">X3</span>
        </div>
        <span className="text-sm font-semibold text-indigo-700">Sage X3 - Project General Tab</span>
      </div>

      {isDraft && (
        <div
          className={`px-4 py-3 rounded-lg border text-sm ${
            statusMessage?.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : statusMessage?.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
        >
          {statusMessage?.text || 'Fill the fields below, then create the project in Sage X3.'}
        </div>
      )}
      {isDraft && isMasterDataLoading && (
        <div className="px-4 py-3 rounded-lg border text-sm bg-blue-50 border-blue-200 text-blue-700">
          Loading customers and sites...
        </div>
      )}
      {isDraft && masterDataError && (
        <div className="px-4 py-3 rounded-lg border text-sm bg-amber-50 border-amber-200 text-amber-700">
          {masterDataError}
        </div>
      )}

      <div>
        <div
          onClick={() => setShowProjectHeader(!showProjectHeader)}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6 py-5 rounded-t-2xl flex flex-col justify-between cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6" />
              <span className="font-bold text-xl">{sx.projectName || project.name || 'Unnamed Project'}</span>
            </div>
            {showProjectHeader ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </div>
          <span className="text-sm opacity-90 mt-1">Sage X3 - Project Details</span>
        </div>

        {showProjectHeader && (
          <div className="bg-white border border-gray-200 border-t-0 rounded-b-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <Field label="PROJECT NUMBER">
                  {isDraft ? (
                    <ReadValue value="Auto-generated by Sage X3" />
                  ) : (
                    <ReadValue value={sx.projectNum} />
                  )}
                </Field>
              </div>

              <Field label="SALES SITE" required>
                {isDraft ? (
                  <SearchableDropdown
                    label="Sales Site"
                    value={draftForm.salesSite}
                    onChange={(selectedValue) => setDraftForm((prev) => ({ ...prev, salesSite: selectedValue }))}
                    options={sites}
                    placeholder="Search site code..."
                    required
                    disabled={isMasterDataLoading}
                    loading={isMasterDataLoading}
                    showLabel={false}
                  />
                ) : (
                  <ReadValue icon={MapPin} value={sx.salesSite} />
                )}
              </Field>

              <Field label="OPERATING SITE">
                {isDraft ? (
                  <EditInput
                    value={draftForm.operatingSite}
                    onChange={(e) => setDraftForm((prev) => ({ ...prev, operatingSite: e.target.value }))}
                    placeholder="Optional"
                  />
                ) : (
                  <ReadValue icon={Building2} value={sx.operatingSite || 'OP-MAD-01'} />
                )}
              </Field>

              <Field label="CUSTOMER BP">
                {isDraft ? (
                  <SearchableDropdown
                    label="Customer BP"
                    value={draftForm.customerBP}
                    onChange={(selectedValue) => setDraftForm((prev) => ({ ...prev, customerBP: selectedValue }))}
                    options={customers}
                    placeholder="Search customer code..."
                    required
                    disabled={isMasterDataLoading}
                    loading={isMasterDataLoading}
                    showLabel={false}
                  />
                ) : (
                  <ReadValue value={sx.customerBP} />
                )}
              </Field>

              <Field label="SALES REP">
                {isDraft ? (
                  <EditInput
                    value={draftForm.salesRep}
                    onChange={(e) => setDraftForm((prev) => ({ ...prev, salesRep: e.target.value }))}
                    placeholder="Optional"
                  />
                ) : (
                  <ReadValue value={sx.salesRep} />
                )}
              </Field>

              <Field label="CURRENCY" required>
                {isDraft ? (
                  <EditInput
                    value={draftForm.currency}
                    onChange={(e) => setDraftForm((prev) => ({ ...prev, currency: e.target.value }))}
                    placeholder="EUR"
                  />
                ) : (
                  <ReadValue value={sx.currency} />
                )}
              </Field>

              <Field label="RATE TYPE">
                {isDraft ? (
                  <EditInput
                    value={draftForm.rateType}
                    onChange={(e) => setDraftForm((prev) => ({ ...prev, rateType: e.target.value }))}
                    placeholder="Standard"
                  />
                ) : (
                  <ReadValue value={sx.rateType === '1' ? 'Standard' : sx.rateType} />
                )}
              </Field>

              <Field label="PROJECT TYPE">
                {isDraft ? (
                  <EditInput
                    value={draftForm.projectType}
                    onChange={(e) => setDraftForm((prev) => ({ ...prev, projectType: e.target.value }))}
                    placeholder="Optional"
                  />
                ) : (
                  <ReadValue value={sx.projectType} />
                )}
              </Field>

              <Field label="CONTACT RELATION">
                {isDraft ? (
                  <EditInput
                    value={draftForm.contactRelation}
                    onChange={(e) => setDraftForm((prev) => ({ ...prev, contactRelation: e.target.value }))}
                    placeholder="Optional"
                  />
                ) : (
                  <ReadValue value={sx.contactRelation} />
                )}
              </Field>

              <Field label="OPEN DATE">
                {isDraft ? (
                  <EditInput
                    type="date"
                    value={draftForm.openDate}
                    onChange={(e) => setDraftForm((prev) => ({ ...prev, openDate: e.target.value }))}
                  />
                ) : (
                  <ReadValue value={formatDateForView(sx.openDate)} />
                )}
              </Field>

              <Field label="STATUS">
                <ReadValue value="New" />
              </Field>

              <div className="col-span-2">
                <Field label="DESCRIPTION" required>
                  {isDraft ? (
                    <textarea
                      value={draftForm.description}
                      onChange={(e) => setDraftForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Services project details"
                      rows={4}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 leading-relaxed min-h-[80px]">
                      {(sx.projectName || project.name || 'Project').trim()} project details
                    </div>
                  )}
                </Field>
              </div>

              {isDraft && (
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={submitDraftToSage}
                    disabled={isSubmitting || mandatoryMissing}
                    className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-60"
                  >
                    {isSubmitting ? 'Creating...' : 'Create New Sage Project'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GeneralTab;
