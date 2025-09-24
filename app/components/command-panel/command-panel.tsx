"use client";

import {
  BarChart3,
  BookOpen,
  Code,
  Database,
  FileText,
  Globe,
  Home,
  Info,
  Palette,
  RefreshCw,
  Rocket,
  Search,
  Server,
  TestTube,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import type { CommandAction } from "~/hooks/use-command-panel";
import { cn } from "~/lib/utils";

const iconMap = {
  Home,
  Search,
  RefreshCw,
  Palette,
  Info,
  Code,
  Rocket,
  TestTube,
  Users,
  BarChart3,
  Wrench,
  Database,
  FileText,
  BookOpen,
  Globe,
  Server,
};

const categoryLabels = {
  navigation: "导航",
  tools: "工具",
  actions: "操作",
  settings: "设置",
  "tools-test": "测试环境工具",
  "tools-prod": "生产环境工具",
};

interface CommandPanelProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  groupedCommands: Record<string, CommandAction[]>;
  onExecuteCommand: (command: CommandAction) => void;
}

export function CommandPanel({
  isOpen,
  onClose,
  query,
  onQueryChange,
  selectedIndex,
  onSelectedIndexChange,
  groupedCommands,
  onExecuteCommand,
}: CommandPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 计算所有命令的扁平列表用于索引计算
  const flatCommands = Object.values(groupedCommands).flat();

  const handleCommandClick = (command: CommandAction, index: number) => {
    onSelectedIndexChange(index);
    onExecuteCommand(command);
  };

  const handleCommandHover = (index: number) => {
    onSelectedIndexChange(index);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="sr-only">命令面板</DialogTitle>
          <DialogDescription className="sr-only">
            快速搜索和执行命令
          </DialogDescription>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="搜索工具和命令..."
              className="pl-10 border-0 focus-visible:ring-0 text-base"
            />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          <div className="p-2">
            {Object.keys(groupedCommands).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  未找到匹配的命令
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedCommands).map(
                  ([category, commands], categoryIndex) => {
                    // 计算当前分类之前的命令总数
                    const previousCommandsCount = Object.entries(
                      groupedCommands
                    )
                      .slice(0, categoryIndex)
                      .reduce((sum, [, cmds]) => sum + cmds.length, 0);

                    return (
                      <div key={category}>
                        <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {categoryLabels[
                            category as keyof typeof categoryLabels
                          ] || category}
                        </div>
                        <div className="space-y-1">
                          {commands.map((command, commandIndex) => {
                            const globalIndex =
                              previousCommandsCount + commandIndex;
                            const isSelected = globalIndex === selectedIndex;
                            const IconComponent =
                              iconMap[command.icon as keyof typeof iconMap] ||
                              Search;

                            return (
                              <button
                                type="button"
                                key={command.id}
                                onClick={() =>
                                  handleCommandClick(command, globalIndex)
                                }
                                onMouseEnter={() =>
                                  handleCommandHover(globalIndex)
                                }
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-150",
                                  "hover:bg-accent hover:text-accent-foreground",
                                  "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                                  isSelected &&
                                    "bg-accent text-accent-foreground shadow-sm"
                                )}
                              >
                                <div className="flex-shrink-0">
                                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">
                                    {command.title}
                                  </div>
                                  {command.description && (
                                    <div className="text-xs text-muted-foreground truncate">
                                      {command.description}
                                    </div>
                                  )}
                                </div>
                                {command.category === "tools" && (
                                  <div className="flex-shrink-0">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      工具
                                    </Badge>
                                  </div>
                                )}
                                {command.shortcut && (
                                  <div className="flex-shrink-0">
                                    <div className="flex items-center gap-1">
                                      {command.shortcut.map((key, index) => (
                                        <Badge
                                          key={index}
                                          variant="secondary"
                                          className="text-xs px-1.5 py-0.5"
                                        >
                                          {key}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {categoryIndex <
                          Object.keys(groupedCommands).length - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-4 py-2 border-t bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs px-1">
                  ↑↓
                </Badge>
                导航
              </span>
              <span className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs px-1">
                  ↵
                </Badge>
                选择
              </span>
              <span className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs px-1">
                  ESC
                </Badge>
                关闭
              </span>
            </div>
            <span>
              <Badge variant="outline" className="text-xs px-1">
                ⌘K
              </Badge>
              打开命令面板
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
