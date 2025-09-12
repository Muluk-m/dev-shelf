"use client"

import { useState, useMemo, useCallback } from "react"
import type { Tool } from "~/types/tool"

export interface SearchFilters {
  category?: string
  status?: string
  tags?: string[]
}

export interface SearchResult {
  tools: Tool[]
  totalCount: number
  hasMore: boolean
}

export function useSearch(tools: Tool[]) {
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<SearchFilters>({})
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // 搜索逻辑
  const searchResults = useMemo(() => {
    if (!query.trim() && Object.keys(filters).length === 0) {
      return {
        tools,
        totalCount: tools.length,
        hasMore: false,
      }
    }

    let filteredTools = tools

    // 文本搜索
    if (query.trim()) {
      const searchTerm = query.toLowerCase().trim()
      filteredTools = filteredTools.filter((tool) => {
        return (
          tool.name.toLowerCase().includes(searchTerm) ||
          tool.description.toLowerCase().includes(searchTerm) ||
          tool.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm))
        )
      })
    }

    // 分类过滤
    if (filters.category) {
      filteredTools = filteredTools.filter((tool) => tool.category === filters.category)
    }

    // 状态过滤
    if (filters.status) {
      filteredTools = filteredTools.filter((tool) => tool.status === filters.status)
    }

    // 标签过滤
    if (filters.tags && filters.tags.length > 0) {
      filteredTools = filteredTools.filter((tool) => filters.tags!.some((tag) => tool.tags.includes(tag)))
    }

    return {
      tools: filteredTools,
      totalCount: filteredTools.length,
      hasMore: false,
    }
  }, [tools, query, filters])

  // 搜索建议
  const suggestions = useMemo(() => {
    if (!query.trim()) return []

    const searchTerm = query.toLowerCase().trim()
    const suggestions = new Set<string>()

    tools.forEach((tool) => {
      // 工具名称建议
      if (tool.name.toLowerCase().includes(searchTerm)) {
        suggestions.add(tool.name)
      }

      // 标签建议
      tool.tags.forEach((tag: string) => {
        if (tag.toLowerCase().includes(searchTerm)) {
          suggestions.add(tag)
        }
      })
    })

    return Array.from(suggestions).slice(0, 5)
  }, [tools, query])

  const addToHistory = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return

    setSearchHistory((prev) => {
      const newHistory = [searchTerm, ...prev.filter((item) => item !== searchTerm)]
      return newHistory.slice(0, 10) // 保留最近10条搜索记录
    })
  }, [])

  const clearHistory = useCallback(() => {
    setSearchHistory([])
  }, [])

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const performSearch = useCallback(
    (searchTerm: string) => {
      setQuery(searchTerm)
      addToHistory(searchTerm)
    },
    [addToHistory],
  )

  return {
    query,
    setQuery,
    filters,
    updateFilters,
    clearFilters,
    searchResults,
    suggestions,
    searchHistory,
    clearHistory,
    performSearch,
  }
}
