import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSupabase() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Generic insert function
  const insertData = async (table, data) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
      
      if (error) throw error
      return result
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Generic fetch function
  const fetchData = async (table, query = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      let supabaseQuery = supabase.from(table).select('*')
      
      // Apply filters if provided
      if (query.eq) {
        Object.entries(query.eq).forEach(([column, value]) => {
          supabaseQuery = supabaseQuery.eq(column, value)
        })
      }
      
      if (query.orderBy) {
        supabaseQuery = supabaseQuery.order(query.orderBy.column, { 
          ascending: query.orderBy.ascending ?? true 
        })
      }
      
      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit)
      }
      
      const { data, error } = await supabaseQuery
      
      if (error) throw error
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Generic update function
  const updateData = async (table, id, updates) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Generic delete function
  const deleteData = async (table, id) => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    insertData,
    fetchData,
    updateData,
    deleteData,
    loading,
    error
  }
}