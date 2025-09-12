"use client"

import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
import { X, Filter } from "lucide-react"
import type { SearchFilters } from "~/hooks/use-search"
import { getToolCategories } from "~/lib/api"
import { useState, useEffect } from "react"

interface SearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: Partial<SearchFilters>) => void
  onClearFilters: () => void
  resultCount: number
}

const statusOptions = [
  { value: "active", label: "正常运行", color: "bg-green-500" },
  { value: "maintenance", label: "维护中", color: "bg-yellow-500" },
  { value: "deprecated", label: "已废弃", color: "bg-red-500" },
]

export function SearchFiltersComponent({ filters, onFiltersChange, onClearFilters, resultCount }: SearchFiltersProps) {
  const [toolCategories, setToolCategories] = useState<any[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await getToolCategories();
        setToolCategories(categories);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof SearchFilters]
    return value && (Array.isArray(value) ? value.length > 0 : true)
  })

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({
      category: filters.category === categoryId ? undefined : categoryId,
    })
  }

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      status: filters.status === status ? undefined : status,
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            筛选条件
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-auto p-1 text-xs">
              <X className="h-3 w-3 mr-1" />
              清除
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">找到 {resultCount} 个结果</div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 分类筛选 */}
        <div>
          <h4 className="text-sm font-medium mb-2">分类</h4>
          <div className="flex flex-wrap gap-2">
            {toolCategories.map((category) => (
              <Badge
                key={category.id}
                variant={filters.category === category.id ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => handleCategoryChange(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* 状态筛选 */}
        <div>
          <h4 className="text-sm font-medium mb-2">状态</h4>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <Badge
                key={status.value}
                variant={filters.status === status.value ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => handleStatusChange(status.value)}
              >
                <div className={`w-2 h-2 rounded-full ${status.color} mr-1`} />
                {status.label}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
