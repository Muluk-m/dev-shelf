"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Switch } from "~/components/ui/switch"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { X, Plus } from "lucide-react"
import { getToolCategories } from "~/lib/api"
import type { Tool, ToolEnvironment, ToolCategory } from "~/types/tool"

interface ToolFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (tool: Omit<Tool, "id">) => void
  initialData?: Tool | null
  title: string
}

export function ToolForm({ isOpen, onClose, onSubmit, initialData, title }: ToolFormProps) {
  // Initialize form data based on Tool interface
  const initializeFormData = (): Omit<Tool, "id"> => ({
    name: "",
    description: "",
    category: "",
    status: "active",
    tags: [],
    environments: [],
    icon: "",
    isInternal: true,
    lastUpdated: new Date().toISOString().split('T')[0]
  });

  const [toolCategories, setToolCategories] = useState<ToolCategory[]>([]);
  const [formData, setFormData] = useState<Omit<Tool, "id">>(() => initializeFormData())

  const [newTag, setNewTag] = useState("")
  const [hasTestEnv, setHasTestEnv] = useState(false)

  // Load tool categories
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

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setHasTestEnv(initialData.environments.some(env => env.name === 'test'));
    } else {
      setFormData(initializeFormData());
      setHasTestEnv(false);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update lastUpdated timestamp
    const submitData = {
      ...formData,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    onSubmit(submitData);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const updateEnvironment = (envName: string, field: keyof ToolEnvironment, value: string | boolean) => {
    setFormData((prev) => {
      const environments = [...prev.environments];
      const envIndex = environments.findIndex(env => env.name === envName);
      
      if (envIndex >= 0) {
        environments[envIndex] = {
          ...environments[envIndex],
          [field]: value,
        };
      } else {
        // Create new environment if it doesn't exist
        environments.push({
          name: envName,
          label: envName === 'production' ? '生产环境' : '测试环境',
          url: field === 'url' ? (value as string) : '',
          isExternal: field === 'isExternal' ? (value as boolean) : true,
        });
      }
      
      return {
        ...prev,
        environments,
      };
    });
  };

  const handleTestEnvToggle = (enabled: boolean) => {
    setHasTestEnv(enabled);
    if (enabled) {
      // Add test environment if it doesn't exist
      const hasTestEnv = formData.environments.some(env => env.name === 'test');
      if (!hasTestEnv) {
        setFormData((prev) => ({
          ...prev,
          environments: [
            ...prev.environments,
            {
              name: 'test',
              label: '测试环境',
              url: '',
              isExternal: true,
            }
          ],
        }));
      }
    } else {
      // Remove test environment
      setFormData((prev) => ({
        ...prev,
        environments: prev.environments.filter(env => env.name !== 'test'),
      }));
    }
  };

  // Helper functions to get environment data
  const getEnvironment = (name: string) => {
    return formData.environments.find(env => env.name === name);
  };

  const getProductionEnv = () => {
    return getEnvironment('production') || {
      name: 'production',
      label: '生产环境',
      url: '',
      isExternal: true
    };
  };

  const getTestEnv = () => {
    return getEnvironment('test');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="environments">环境配置</TabsTrigger>
              <TabsTrigger value="advanced">高级设置</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">工具名称 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="输入工具名称"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">分类 *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {toolCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述 *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="描述工具的功能和用途"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">图标 URL</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                  placeholder="https://example.com/icon.png"
                />
              </div>

              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "maintenance" | "deprecated") =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">正常</SelectItem>
                    <SelectItem value="maintenance">维护中</SelectItem>
                    <SelectItem value="deprecated">已废弃</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="environments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">生产环境 *</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>访问类型</Label>
                    <Select
                      value={getProductionEnv().isExternal ? "external" : "internal"}
                      onValueChange={(value: "internal" | "external") => updateEnvironment("production", "isExternal", value === "external")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">内部路由</SelectItem>
                        <SelectItem value="external">外部链接</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{getProductionEnv().isExternal ? "访问链接" : "路由路径"} *</Label>
                    <Input
                      value={getProductionEnv().url}
                      onChange={(e) => updateEnvironment("production", "url", e.target.value)}
                      placeholder={
                        getProductionEnv().isExternal ? "https://example.com" : "/tools/example"
                      }
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center space-x-2">
                <Switch id="test-env" checked={hasTestEnv} onCheckedChange={handleTestEnvToggle} />
                <Label htmlFor="test-env">启用测试环境</Label>
              </div>

              {hasTestEnv && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">测试环境</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>访问类型</Label>
                      <Select
                        value={getTestEnv()?.isExternal ? "external" : "internal"}
                        onValueChange={(value: "internal" | "external") => updateEnvironment("test", "isExternal", value === "external")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">内部路由</SelectItem>
                          <SelectItem value="external">外部链接</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{getTestEnv()?.isExternal ? "访问链接" : "路由路径"}</Label>
                      <Input
                        value={getTestEnv()?.url || ""}
                        onChange={(e) => updateEnvironment("test", "url", e.target.value)}
                        placeholder={
                          getTestEnv()?.isExternal
                            ? "https://test.example.com"
                            : "/tools/example-test"
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-2">
                <Label>标签</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="添加标签"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit">{initialData ? "更新工具" : "添加工具"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
