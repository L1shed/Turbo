import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { QueryOptions, SupabaseHookReturn } from  "../types";


export function useSupabase(): SupabaseHookReturn {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Generic insert function
  const insertData = async (
    table: string,
    data: Record<string, any>
  ): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();

      if (error) throw error;
      return result;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Generic fetch function
  const fetchData = async (
    table: string,
    query: QueryOptions = {}
  ): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      let supabaseQuery = supabase.from(table).select("*");

      // Apply filters if provided
      if (query.eq) {
        Object.entries(query.eq).forEach(([column, value]) => {
          supabaseQuery = supabaseQuery.eq(column, value);
        });
      }

      if (query.orderBy) {
        supabaseQuery = supabaseQuery.order(query.orderBy.column, {
          ascending: query.orderBy.ascending ?? true,
        });
      }

      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }

      const { data, error } = await supabaseQuery;

      if (error) throw error;
      return data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Generic update function
  const updateData = async (
    table: string,
    id: string,
    updates: Record<string, any>
  ): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq("id", id)
        .select();

      if (error) throw error;
      return data;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Generic delete function
  const deleteData = async (table: string, id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) throw error;
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    insertData,
    fetchData,
    updateData,
    deleteData,
    loading,
    error,
  };
}
