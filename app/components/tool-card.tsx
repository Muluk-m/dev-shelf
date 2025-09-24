"use client";

import {
  ChevronDown,
  Clock,
  Code,
  ExternalLink,
  Globe,
  Server,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { Tool, ToolEnvironment } from "~/types/tool";

const statusConfig = {
  active: {
    label: "正常",
    variant: "default" as const,
    color: "text-green-600",
  },
  maintenance: {
    label: "维护中",
    variant: "secondary" as const,
    color: "text-yellow-600",
  },
  deprecated: {
    label: "已废弃",
    variant: "destructive" as const,
    color: "text-red-600",
  },
};

interface ToolCardProps {
  tool: Tool;
  onViewDetails?: (tool: Tool) => void;
}

export function ToolCard({ tool, onViewDetails }: ToolCardProps) {
  const navigate = useNavigate();
  const statusInfo = statusConfig[tool.status];

  const [selectedEnv, setSelectedEnv] = useState<ToolEnvironment>(
    tool.environments?.[0] || {
      name: "default",
      label: "默认环境",
      url: "#",
      isExternal: false,
    }
  );

  const handleAccessTool = (environment: ToolEnvironment) => {
    // 检查是否为内部工具
    if (tool.isInternal) {
      navigate(environment.url);
    } else {
      // 外部工具：根据环境配置打开链接或跳转
      if (environment.isExternal) {
        window.open(environment.url, "_blank");
      } else {
        window.location.href = environment.url;
      }
    }
  };

  const handleViewDetails = () => {
    if (tool.isInternal) {
      // 内部工具：直接打开工具页面
      navigate(`/tools/${tool.id}`);
    } else {
      // 外部工具：打开详情页
      if (onViewDetails) {
        onViewDetails(tool);
      } else {
        navigate(`/tools/${tool.id}`);
      }
    }
  };

  return (
    <Card className="group gap-4">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {tool.icon ? (
                <Avatar>
                  <AvatarImage src={tool.icon} />
                  <AvatarFallback>{tool.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ) : (
                <Code className="h-5 w-5" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {tool.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusInfo.variant} className="text-xs">
                  {statusInfo.label}
                </Badge>
                {tool.isInternal && (
                  <Badge variant="outline" className="text-xs">
                    内部工具
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-1">
        <CardDescription className="text-sm leading-relaxed mb-4">
          {tool.description}
        </CardDescription>

        <div className="flex flex-wrap gap-1 mb-3">
          {tool.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tool.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{tool.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>更新于 {tool.lastUpdated}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex gap-2 w-full">
          {/* 内部工具不显示环境选择 */}

          {tool.environments.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 bg-transparent"
                >
                  {selectedEnv.isExternal ? (
                    <Globe className="h-3 w-3" />
                  ) : (
                    <Server className="h-3 w-3" />
                  )}
                  {selectedEnv.label}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {tool.environments.map((env) => (
                  <DropdownMenuItem
                    key={env.name}
                    onClick={() => setSelectedEnv(env)}
                    className="gap-2"
                  >
                    {env.isExternal ? (
                      <Globe className="h-3 w-3" />
                    ) : (
                      <Server className="h-3 w-3" />
                    )}
                    {env.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-1">
              {selectedEnv.isExternal ? (
                <Globe className="h-3 w-3" />
              ) : (
                <Server className="h-3 w-3" />
              )}
              {selectedEnv.label}
            </div>
          )}

          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={handleViewDetails}>
              详情
            </Button>
          )}

          <Button
            size="sm"
            className="flex-1 gap-2"
            onClick={() => handleAccessTool(selectedEnv)}
          >
            {!tool.isInternal && selectedEnv.isExternal && (
              <ExternalLink className="h-3 w-3" />
            )}
            {tool.isInternal ? "使用工具" : "打开工具"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
