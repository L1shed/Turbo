import { useState, useEffect } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import { useAuth } from '@/hooks/useAuth'

export default function SupabaseExample() {
  const { insertData, fetchData, updateData, deleteData, loading, error } = useSupabase()
  const { user, signIn, signOut, loading: authLoading } = useAuth()
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState('')

  // Fetch data on component mount
  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    const data = await fetchData('items', {
      orderBy: { column: 'created_at', ascending: false }
    })
    if (data) setItems(data)
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    if (!newItem.trim()) return

    const result = await insertData('items', {
      name: newItem,
      user_id: user?.id,
      created_at: new Date().toISOString()
    })

    if (result) {
      setNewItem('')
      loadItems() // Refresh the list
    }
  }

  const handleDeleteItem = async (id) => {
    const success = await deleteData('items', id)
    if (success) {
      loadItems() // Refresh the list
    }
  }

  const handleAuth = async () => {
    if (user) {
      await signOut()
    } else {
      // Simple demo - you'd normally have a proper login form
      await signIn('demo@example.com', 'password123')
    }
  }

  if (authLoading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Supabase Demo</h2>
      
      {/* Auth Section */}
      <div className="mb-6">
        <button
          onClick={handleAuth}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          {user ? 'Sign Out' : 'Sign In'}
        </button>
        {user && (
          <p className="text-sm text-gray-600 mt-2">
            Signed in as: {user.email}
          </p>
        )}
      </div>

      {/* Data Section */}
      {user && (
        <>
          <form onSubmit={handleAddItem} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add new item..."
                className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>{item.name}</span>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {items.length === 0 && !loading && (
            <p className="text-gray-500 text-center py-4">No items yet. Add one above!</p>
          )}
        </>
      )}
    </div>
  )
}