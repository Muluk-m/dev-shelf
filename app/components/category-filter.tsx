"use client"

import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Code, Rocket, TestTube, Users, BarChart3, Wrench, Grid3X3 } from "lucide-react"
import type { ToolCategory } from "~/types/tool"

const iconMap = {
  Code,
  Rocket,
  TestTube,
  Users,
  BarChart3,
  Wrench,
  Grid3X3,
}

interface CategoryFilterProps {
  categories: ToolCategory[]
  selectedCategory: string | null
  onCategoryChange: (categoryId: string | null) => void
  toolCounts: Record<string, number>
}

export function CategoryFilter({ categories, selectedCategory, onCategoryChange, toolCounts }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        size="sm"
        onClick={() => onCategoryChange(null)}
        className="gap-2"
      >
        <Grid3X3 className="h-4 w-4" />
        全部工具
        <Badge variant="secondary" className="ml-1">
          {Object.values(toolCounts).reduce((sum, count) => sum + count, 0)}
        </Badge>
      </Button>

      {categories.map((category) => {
        const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Code
        const isSelected = selectedCategory === category.id
        const count = toolCounts[category.id] || 0

        return (
          <Button
            key={category.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category.id)}
            className="gap-2"
          >
            <IconComponent className="h-4 w-4" />
            {category.name}
            <Badge variant="secondary" className="ml-1">
              {count}
            </Badge>
          </Button>
        )
      })}
    </div>
  )
}
