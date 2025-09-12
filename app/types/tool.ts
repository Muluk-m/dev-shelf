export interface ToolEnvironment {
  name: string
  label: string
  url: string
  isExternal: boolean
}

export interface Tool {
  id: string
  name: string
  description: string
  category: string
  icon: string
  environments: ToolEnvironment[]
  tags: string[]
  isInternal: boolean
  status: "active" | "maintenance" | "deprecated"
  lastUpdated: string
}

export interface ToolCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
}
