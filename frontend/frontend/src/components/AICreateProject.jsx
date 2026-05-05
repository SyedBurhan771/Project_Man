import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Plus,
  Loader2,
  Send,
  RotateCcw,
  Bot,
  Database,
  ArrowLeft,
  PencilLine,
  Search,
  ChevronsUpDown,
} from 'lucide-react'
import API_URL from '../config'
import customersJson from '../data/masterData/customers.json'
import sitesJson from '../data/masterData/sites.json'

const normalize = (v) => String(v ?? '').trim()

const mapCustomersToOptions = (rows = []) =>
  rows
    .filter((c) => normalize(c.Customer_Code))
    .map((c) => ({
      id: normalize(c.Customer_Code),
      label: `${normalize(c.Customer_Code)} - ${normalize(c.Customer_Name)}`,
    }))
    .sort((a, b) => a.id.localeCompare(b.id))

const mapSitesToOptions = (rows = []) =>
  rows
    .filter((s) => normalize(s.Site_Code))
    .map((s) => ({
      id: normalize(s.Site_Code),
      label: `${normalize(s.Site_Code)} - ${normalize(s.Site_Name)}`,
    }))
    .sort((a, b) => a.id.localeCompare(b.id))

function SearchableDropdown({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  disabled = false,
  loading = false,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const selected = options.find((item) => item.id === value)
    setSearchQuery(selected ? selected.id : value || '')
  }, [options, value])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    const handleForceClose = () => setIsOpen(false)
    window.addEventListener('close-searchable-dropdowns', handleForceClose)
    return () => window.removeEventListener('close-searchable-dropdowns', handleForceClose)
  }, [])

  const filteredData = options.filter((item) =>
    String(item.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(item.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selected = options.find((item) => item.id === value) || null

  const applyTypedCodeIfValid = () => {
    const typed = String(searchQuery || '').trim().toLowerCase()
    if (!typed) {
      setSearchQuery(selected ? selected.id : '')
      return
    }
    const exactByCode = options.find((item) => String(item.id || '').toLowerCase() === typed)
    if (exactByCode) {
      onChange(exactByCode.id)
      setSearchQuery(exactByCode.id)
    } else {
      setSearchQuery(selected ? selected.id : '')
    }
  }

  const handleInputFocus = () => {
    if (!disabled) setIsOpen(true)
  }

  const handleInputChange = (nextValue) => {
    setSearchQuery(nextValue)
    setIsOpen(true)
  }

  const handleSelect = (item) => {
    onChange(item.id)
    setSearchQuery(item.id)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative" data-searchable-dropdown="true">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required ? ' *' : ''}
      </label>
      <div className={`relative rounded-lg border ${disabled ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}>
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={(e) => {
            applyTypedCodeIfValid()
            const nextFocused = e.relatedTarget
            if (!dropdownRef.current?.contains(nextFocused)) {
              setIsOpen(false)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              applyTypedCodeIfValid()
              setIsOpen(false)
            }
          }}
          className="w-full p-2.5 pl-9 pr-9 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                onClick={() => handleSelect(item)}
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
  )
}

function AICreateProject({ buttonText = 'AI Create Project', onSageProjectCreated, onAIProjectCreated }) {
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState(buttonText === 'New Project' ? 'menu' : 'ai')

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatContainerRef = useRef(null)

  const [sageForm, setSageForm] = useState({
    site: '',
    customer: '',
    description: '',
    short_desc: '',
    category: '010',
    sales_rep: '',
  })
  const [isSubmittingSage, setIsSubmittingSage] = useState(false)
  const [modalStatus, setModalStatus] = useState(null)
  const closeTimerRef = useRef(null)

  const [customers, setCustomers] = useState([])
  const [sites, setSites] = useState([])
  const [masterDataError, setMasterDataError] = useState('')
  const [isMasterDataLoading, setIsMasterDataLoading] = useState(true)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages, isLoading])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  // Load master data from local JSON (Burhan's better approach)
  useEffect(() => {
    try {
      setIsMasterDataLoading(true)
      setMasterDataError('')

      const customersData = mapCustomersToOptions(customersJson)
      const sitesData = mapSitesToOptions(sitesJson)

      setCustomers(customersData)
      setSites(sitesData)
    } catch (error) {
      setMasterDataError(error?.message || 'Failed to load local customers/sites JSON.')
    } finally {
      setIsMasterDataLoading(false)
    }
  }, [])

  const showStatus = (type, message) => {
    setModalStatus({ type, message })
  }

  const isAllowedCode = (value, options) =>
    options.some((item) => String(item.id || '').toLowerCase() === String(value || '').trim().toLowerCase())

  const closePanelAfterSuccess = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => {
      closePanel()
    }, 2500)
  }

  const openPanel = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setModalStatus(null)
    setOpen(true)
    setMode(buttonText === 'New Project' ? 'menu' : 'ai')
  }

  const closePanel = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setModalStatus(null)
    setOpen(false)
  }

  // === RAFFAY'S FEATURE: Draft project navigation ===
  const startSageProjectFlow = () => {
    const draftId = `draft-${Date.now()}`
    const draftProject = {
      id: draftId,
      name: 'New Sage Project',
      code: 'Pending ID',
      category: 'Sage / Draft',
      status: 'Draft',
      health: 'good',
      progress: 0,
      endDate: '-',
      duration: 60,
      subtasks: [],
      source: 'sage-draft',
      sageDraft: true,
      sageX3: {
        projectNum: '',
        salesSite: '',
        operatingSite: '',
        customerBP: '',
        salesRep: '',
        currency: 'EUR',
        rateType: '',
        projectType: '',
        contactRelation: '',
        openDate: '',
        projectName: '',
      },
    }

    closePanel()
    navigate(`/projects/${draftId}`, { state: { project: draftProject } })
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/ai/generate-ideas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Server error')
      }

      const data = await response.json()

      let projects = []
      if (data.projects && Array.isArray(data.projects)) {
        projects = data.projects
      } else if (data.text) {
        let text = data.text.trim()
        const jsonStart = Math.max(text.indexOf('['), text.indexOf('{'))
        if (jsonStart !== -1) {
          text = text.substring(jsonStart)
        }

        text = text.replace(/^```json\s*|\s*```$/gm, '').trim()

        try {
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed)) {
            projects = parsed
          } else if (parsed && typeof parsed === 'object' && parsed.name) {
            projects = [parsed]
          }
        } catch {
          const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/)
          if (arrayMatch) {
            try {
              projects = JSON.parse(arrayMatch[0])
            } catch {
              // no-op
            }
          }
        }
      }

      const assistantMsg = {
        role: 'assistant',
        content: data.text || 'No response content',
      }

      if (projects.length > 0) {
        assistantMsg.projects = projects
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}\n(Check if Ollama is running)` },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAIProject = async (project) => {
    try {
      const response = await fetch(`${API_URL}/api/ai/create-project/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok && result.success) {
        // Notify parent so it can add the new project to the list in real-time
        if (typeof onAIProjectCreated === 'function') {
          onAIProjectCreated({
            project_id: result.project_id || '',
            name: project.name || '',
            description: project.description || '',
            category: project.category || '',
            dueDate: project.dueDate || '',
            durationDays: project.estimatedDurationDays || project.duration || 60,
            teamSize: project.teamSize || 1,
            progress: project.progress || 0,
            raw: result.data || null,
          })
        }
        showStatus('success', `AI project created successfully. Project ID: ${result.project_id || 'N/A'}`)
        closePanelAfterSuccess()
      } else {
        showStatus('error', 'Failed to create AI project: ' + (result.error || `HTTP ${response.status}`))
      }
    } catch (err) {
      showStatus('error', 'Error connecting to server: ' + err.message)
    }
  }

  const handleNavigateToDraft = (project) => {
    const draftId = `draft-ai-${Date.now()}`
    const draftProject = {
      id: draftId,
      name: project.name || 'AI Generated Project',
      code: 'Pending ID',
      category: project.category || 'AI / Draft',
      status: 'Draft',
      health: 'good',
      progress: 0,
      endDate: project.dueDate || '-',
      duration: project.estimatedDurationDays || project.duration || 60,
      subtasks: [],
      source: 'ai-draft',
      sageDraft: true,
      description: project.description || '',
      sageX3: {
        projectNum: '',
        salesSite: '',
        operatingSite: '',
        customerBP: '',
        salesRep: '',
        currency: 'EUR',
        rateType: '',
        projectType: '',
        contactRelation: '',
        openDate: '',
        projectName: '',
      },
    }

    closePanel()
    navigate(`/projects/${draftId}`, { state: { project: draftProject } })
  }

  const submitSageProject = async (e) => {
    e.preventDefault()

    if (!sageForm.site || !sageForm.customer || !sageForm.description || !sageForm.short_desc || !sageForm.category) {
      showStatus('error', 'Please fill all required fields.')
      return
    }
    if (!isAllowedCode(sageForm.site, sites)) {
      showStatus('error', 'Please choose a valid Site code from the dropdown list.')
      return
    }
    if (!isAllowedCode(sageForm.customer, customers)) {
      showStatus('error', 'Please choose a valid Customer code from the dropdown list.')
      return
    }

    setIsSubmittingSage(true)
    try {
      const response = await fetch(`${API_URL}/api/soap/projects/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sageForm),
      })

      const result = await response.json().catch(() => ({}))
      if (response.ok && result.success) {
        if (typeof onSageProjectCreated === 'function') {
          onSageProjectCreated({
            project_id: result.project_id || '',
            ...sageForm,
            raw: result.data || null,
          })
        }
        showStatus('success', `Sage project created successfully. Project ID: ${result.project_id || 'N/A'}`)
        setSageForm((prev) => ({ ...prev, description: '', short_desc: '', sales_rep: '' }))
        closePanelAfterSuccess()
      } else {
        showStatus('error', 'Failed to create Sage project: ' + (result.error || `HTTP ${response.status}`))
      }
    } catch (err) {
      showStatus('error', 'Error connecting to server: ' + err.message)
    } finally {
      setIsSubmittingSage(false)
    }
  }



  const resetConversation = () => {
    setMessages([])
    setInput('')
    setModalStatus(null)
  }

  const renderModeMenu = () => (
    <div className="p-5 space-y-4 bg-gray-50 h-full">
      <button
        onClick={startSageProjectFlow}
        className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition"
      >
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Create Sage Project</span>
        </div>
        <p className="text-sm text-gray-600">Go to the project details screen and fill all Sage project fields before submission.</p>
      </button>



      <button
        onClick={() => setMode('ai')}
        className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-sm transition"
      >
        <div className="flex items-center gap-3 mb-2">
          <Bot className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-gray-900">Create AI Project</span>
        </div>
        <p className="text-sm text-gray-600">Start the existing AI chat assistant to generate and refine project ideas.</p>
      </button>
    </div>
  )

  const renderSageForm = () => (
    <form onSubmit={submitSageProject} className="p-5 space-y-3 bg-gray-50 overflow-y-auto h-full">
      {/* ... same dropdowns and inputs as before ... */}
      <SearchableDropdown
        label="Site Code"
        value={sageForm.site}
        onChange={(selectedValue) => setSageForm((prev) => ({ ...prev, site: selectedValue }))}
        options={sites}
        placeholder="Search site code..."
        required
        disabled={isMasterDataLoading}
        loading={isMasterDataLoading}
      />

      <SearchableDropdown
        label="Customer"
        value={sageForm.customer}
        onChange={(selectedValue) => setSageForm((prev) => ({ ...prev, customer: selectedValue }))}
        options={customers}
        placeholder="Search customer..."
        required
        disabled={isMasterDataLoading}
        loading={isMasterDataLoading}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <input
          value={sageForm.description}
          onChange={(e) => setSageForm((prev) => ({ ...prev, description: e.target.value }))}
          className="w-full p-2.5 border border-gray-300 rounded-lg"
          placeholder="New Project from UI"
          maxLength={250}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Short Description *</label>
        <input
          value={sageForm.short_desc}
          onChange={(e) => setSageForm((prev) => ({ ...prev, short_desc: e.target.value }))}
          className="w-full p-2.5 border border-gray-300 rounded-lg"
          placeholder="UI Proj"
          maxLength={80}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
        <select
          value={sageForm.category}
          onChange={(e) => setSageForm((prev) => ({ ...prev, category: e.target.value }))}
          className="w-full p-2.5 border border-gray-300 rounded-lg bg-white"
          required
        >
          <option value="010">010</option>
          <option value="020">020</option>
          <option value="ETO">ETO</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sales Rep</label>
        <input
          value={sageForm.sales_rep}
          onChange={(e) => setSageForm((prev) => ({ ...prev, sales_rep: e.target.value }))}
          className="w-full p-2.5 border border-gray-300 rounded-lg"
          placeholder="Optional"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmittingSage || isMasterDataLoading}
        className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-60"
      >
        {isSubmittingSage ? 'Creating...' : 'Create Sage Project'}
      </button>
    </form>
  )



  const renderAIChat = () => (
    <>
      {/* ... exact same AI chat UI as before (no changes needed) ... */}
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            Describe your project idea or ask for suggestions...
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : 'bg-white shadow-sm border rounded-bl-none'
              }`}
            >
              {(!msg.projects || msg.projects.length === 0) && (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}

              {msg.projects && msg.projects.length > 0 && (
                <div className="mt-4 space-y-4">
                  {msg.projects.map((project, idx) => (
                    <div key={idx} className="p-5 bg-purple-50 border border-purple-200 rounded-2xl shadow-sm">
                      <div className="font-bold text-purple-900 text-lg mb-3 border-b border-purple-100 pb-2">
                        {project.name}
                      </div>
                      <div className="space-y-2 text-sm text-gray-700">
                        {project.description && <div><strong>Description:</strong> {project.description}</div>}
                        {project.category && <div><strong>Category:</strong> {project.category}</div>}
                        {project.dueDate && <div><strong>Due:</strong> {project.dueDate}</div>}
                        {(project.estimatedDurationDays || project.duration) && (
                          <div>
                            <strong>Duration:</strong> {project.estimatedDurationDays || project.duration} days
                          </div>
                        )}
                        {project.teamSize && <div><strong>Team:</strong> {project.teamSize} members</div>}
                      </div>
                      <button
                        onClick={() => handleNavigateToDraft(project)}
                        className="mt-5 w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 text-sm transition-all"
                      >
                        Create This AI Project
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask to generate ideas, refine a project, add features..."
            className="flex-1 p-3 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 max-h-24"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          You can say: "refine the first idea", "make duration 45 days", "add mobile app support"...
        </p>
      </div>
    </>
  )

  const title =
    mode === 'sage'
      ? 'Create Sage Project'
      : mode === 'sage-modify'
      ? 'Modify Sage Project'
      : mode === 'ai'
      ? 'AI Project Assistant'
      : 'Create New Project'

  return (
    <div className="relative">
      <button
        onClick={openPanel}
        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 shadow-md transition-all"
      >
        <Sparkles className="w-5 h-5" />
        <span>{buttonText}</span>
        <Plus className="w-5 h-5" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[460px] h-[620px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-50"
          onMouseDownCapture={(e) => {
            const target = e.target
            if (target instanceof Element && !target.closest('[data-searchable-dropdown="true"]')) {
              window.dispatchEvent(new Event('close-searchable-dropdowns'))
            }
          }}
        >
          <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center gap-2">
              {mode !== 'menu' && buttonText === 'New Project' && (
                <button
                  onClick={() => setMode('menu')}
                  className="p-1.5 hover:bg-gray-200 rounded-full transition"
                  title="Back"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
            </div>
            <div className="flex gap-2">
              {mode === 'ai' && (
                <button
                  onClick={resetConversation}
                  title="Start new conversation"
                  className="p-1.5 hover:bg-gray-200 rounded-full transition"
                >
                  <RotateCcw size={18} />
                </button>
              )}
              <button onClick={closePanel} className="p-1.5 hover:bg-gray-200 rounded-full transition">
                x
              </button>
            </div>
          </div>

          {modalStatus && (
            <div
              className={`mx-4 mt-3 px-3 py-2 rounded-lg text-sm ${
                modalStatus.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {modalStatus.message}
            </div>
          )}

          {isMasterDataLoading && (
            <div className="mx-4 mt-3 px-3 py-2 rounded-lg text-sm bg-blue-50 border border-blue-200 text-blue-700">
              Loading customers and sites...
            </div>
          )}

          {masterDataError && (
            <div className="mx-4 mt-3 px-3 py-2 rounded-lg text-sm bg-amber-50 border border-amber-200 text-amber-700">
              {masterDataError}
            </div>
          )}

          {mode === 'menu' && renderModeMenu()}
          {mode === 'sage' && renderSageForm()}
          {mode === 'ai' && renderAIChat()}
        </div>
      )}
    </div>
  )
}

export default AICreateProject