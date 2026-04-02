import { useState, useRef, useEffect } from 'react'
import { Sparkles, Plus, Loader2, Send, RotateCcw, Bot, Database, ArrowLeft, PencilLine, CheckCircle2, AlertCircle } from 'lucide-react'

function AICreateProject({ buttonText = 'AI Create Project', onSageProjectCreated }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState(buttonText === 'New Project' ? 'menu' : 'ai')

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const [sageForm, setSageForm] = useState({
    site: 'ES011',
    customer: 'ES008',
    description: '',
    short_desc: '',
    category: '010',
    sales_rep: '',
  })
  const [modifyForm, setModifyForm] = useState({
    project_id: '',
    site: 'ES011',
    customer: 'ES008',
    description: '',
    short_desc: '',
    category: '010',
    sales_rep: '',
  })

  const [isSubmittingSage, setIsSubmittingSage] = useState(false)
  const [isSubmittingModify, setIsSubmittingModify] = useState(false)
  const [modalStatus, setModalStatus] = useState(null)
  const closeTimerRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  const BACKEND_URL = 'http://127.0.0.1:8000'

  const showStatus = (type, message) => {
    setModalStatus({ type, message })
  }

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

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/generate-ideas/`, {
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
      const response = await fetch(`${BACKEND_URL}/api/ai/create-project/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      })

      const result = await response.json().catch(() => ({}))

      if (response.ok && result.success) {
        showStatus('success', `AI project created successfully. Project ID: ${result.project_id || 'N/A'}`)
        closePanelAfterSuccess()
      } else {
        showStatus('error', 'Failed to create AI project: ' + (result.error || `HTTP ${response.status}`))
      }
    } catch (err) {
      showStatus('error', 'Error connecting to server: ' + err.message)
    }
  }

  const submitSageProject = async (e) => {
    e.preventDefault()

    if (!sageForm.site || !sageForm.customer || !sageForm.description || !sageForm.short_desc || !sageForm.category) {
      showStatus('error', 'Please fill all required fields.')
      return
    }

    setIsSubmittingSage(true)
    try {
      const response = await fetch(`${BACKEND_URL}/api/soap/projects/`, {
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

  const submitModifyProject = async (e) => {
    e.preventDefault()

    if (!modifyForm.project_id || !modifyForm.site || !modifyForm.customer || !modifyForm.description || !modifyForm.short_desc || !modifyForm.category) {
      showStatus('error', 'Please fill all required fields for modify.')
      return
    }

    setIsSubmittingModify(true)
    try {
      const { project_id, ...payload } = modifyForm
      const response = await fetch(`${BACKEND_URL}/api/soap/projects/${encodeURIComponent(project_id)}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json().catch(() => ({}))
      if (response.ok && result.success) {
        showStatus('success', `Sage project updated successfully. Project ID: ${result.project_id || project_id}`)
        closePanelAfterSuccess()
      } else {
        showStatus('error', 'Failed to modify Sage project: ' + (result.error || `HTTP ${response.status}`))
      }
    } catch (err) {
      showStatus('error', 'Error connecting to server: ' + err.message)
    } finally {
      setIsSubmittingModify(false)
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
        onClick={() => setMode('sage')}
        className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition"
      >
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-gray-900">Create Sage Project</span>
        </div>
        <p className="text-sm text-gray-600">Open a form and create a project directly in Sage X3 through SOAP.</p>
      </button>

      <button
        onClick={() => setMode('sage-modify')}
        className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-amber-400 hover:shadow-sm transition"
      >
        <div className="flex items-center gap-3 mb-2">
          <PencilLine className="w-5 h-5 text-amber-600" />
          <span className="font-semibold text-gray-900">Modify Sage Project</span>
        </div>
        <p className="text-sm text-gray-600">Update an existing Sage X3 project using project ID and form data.</p>
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Site Code *</label>
        <input
          value={sageForm.site}
          onChange={(e) => setSageForm((prev) => ({ ...prev, site: e.target.value }))}
          className="w-full p-2.5 border border-gray-300 rounded-lg"
          placeholder="ES011"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
        <input
          value={sageForm.customer}
          onChange={(e) => setSageForm((prev) => ({ ...prev, customer: e.target.value }))}
          className="w-full p-2.5 border border-gray-300 rounded-lg"
          placeholder="ES008"
          required
        />
      </div>

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
  disabled={isSubmittingSage}
  className="w-full py-2.5 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-xl font-medium hover:from-green-600 hover:to-green-800 disabled:opacity-60"
>
  {isSubmittingSage ? 'Creating...' : 'Create Sage Project'}
</button>
    </form>
  )

  const renderModifyForm = () => (
    <form onSubmit={submitModifyProject} className="p-5 space-y-3 bg-gray-50 overflow-y-auto h-full">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project ID *</label>
        <input
          value={modifyForm.project_id}
          onChange={(e) => setModifyForm((prev) => ({ ...prev, project_id: e.target.value }))}
          className="w-full p-2.5 border border-gray-300 rounded-lg"
          placeholder="ES0112604000075"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Site Code *</label>
        <input
          value={modifyForm.site}
          onChange={(e) => setModifyForm((prev) => ({ ...prev, site: e.target.value }))}
          className="w-full p-2.5 border border-gray-300 rounded-lg"
          placeholder="ES011"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
        <input
          value={modifyForm.customer}
          onChange={(e) => setModifyForm((prev) => ({ ...prev, customer: e.target.value }))}
          className="w-full p-2.5 border border-gray-300 rounded-lg"
          placeholder="ES008"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <input
          value={modifyForm.description}
          onChange={(e) => setModifyForm((prev) => ({ ...prev, description: e.target.value }))}
          className="w-full p-2.5 border border-gray-300 rounded-lg"
          maxLength={250}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Short Description *</label>
        <input
          value={modifyForm.short_desc}
          onChange={(e) => setModifyForm((prev) => ({ ...prev, short_desc: e.target.value }))}
          className="w-full p-2.5 border border-gray-300 rounded-lg"
          maxLength={80}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
        <select
          value={modifyForm.category}
          onChange={(e) => setModifyForm((prev) => ({ ...prev, category: e.target.value }))}
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
          value={modifyForm.sales_rep}
          onChange={(e) => setModifyForm((prev) => ({ ...prev, sales_rep: e.target.value }))}
          className="w-full p-2.5 border border-gray-300 rounded-lg"
          placeholder="Optional"
        />
      </div>

      <button
  type="submit"
  disabled={isSubmittingModify}
  className="w-full py-2.5 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-xl font-medium hover:from-green-600 hover:to-green-800 disabled:opacity-60"
>
  {isSubmittingModify ? 'Updating...' : 'Modify Sage Project'}
</button>
    </form>
  )

  const renderAIChat = () => (
    <>
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            Describe your project idea or ask for suggestions...
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
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
                    <div
                      key={idx}
                      className="p-5 bg-purple-50 border border-purple-200 rounded-2xl shadow-sm"
                    >
                      <div className="font-bold text-purple-900 text-lg mb-3 border-b border-purple-100 pb-2">
                        {project.name}
                      </div>
                      <div className="space-y-2 text-sm text-gray-700">
                        {project.description && (
                          <div><strong>Description:</strong> {project.description}</div>
                        )}
                        {project.category && (
                          <div><strong>Category:</strong> {project.category}</div>
                        )}
                        {project.dueDate && (
                          <div><strong>Due:</strong> {project.dueDate}</div>
                        )}
                        {(project.estimatedDurationDays || project.duration) && (
                          <div>
                            <strong>Duration:</strong>{' '}
                            {project.estimatedDurationDays || project.duration} days
                          </div>
                        )}
                        {project.teamSize && (
                          <div><strong>Team:</strong> {project.teamSize} members</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleCreateAIProject(project)}
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

        <div ref={messagesEndRef} />
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
        <div className="absolute right-0 top-full mt-2 w-[460px] h-[620px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-50">
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
              <button
                onClick={closePanel}
                className="p-1.5 hover:bg-gray-200 rounded-full transition"
              >
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

          {mode === 'menu' && renderModeMenu()}
          {mode === 'sage' && renderSageForm()}
          {mode === 'sage-modify' && renderModifyForm()}
          {mode === 'ai' && renderAIChat()}
        </div>
      )}
    </div>
  )
}

export default AICreateProject

