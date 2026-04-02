function AICommander() {
  return (
    <div className="bg-primary text-white rounded-2xl p-8 mb-8">
      <h2 className="text-2xl font-semibold mb-4">AI Project Commander</h2>
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Create Task"
          className="flex-1 px-6 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none"
        />
        <button className="bg-white text-primary px-8 py-4 rounded-lg font-medium hover:bg-gray-100 transition">
          Create
        </button>
      </div>
      <p className="mt-4 text-sm opacity-90">
        AI will parse the request and create tasks linked to Sage X3 objects automatically
      </p>
    </div>
  )
}

export default AICommander