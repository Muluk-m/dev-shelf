"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  Video,
  Code,
  Trash2,
  Link as LinkIcon,
  Copy,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";

type UploadPreview = {
  file: File;
  objectUrl?: string;
  kind: "image" | "video" | "text" | "binary";
};

type UploadedItem = {
  name: string;
  size: number;
  type: string;
  url: string;
};

const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:5173"
  : "https://qlj-devhub-homepage.qiliangjia.one";

function classifyFile(file: File): UploadPreview["kind"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (
    file.type.startsWith("text/") ||
    /\.(js|css|json|txt|md|xml)$/i.test(file.name)
  )
    return "text";
  return "binary";
}

export default function FileUploaderTool() {
  const [items, setItems] = useState<UploadPreview[]>([]);
  const [uploaded, setUploaded] = useState<UploadedItem[]>([]);
  const [isDragging, setDragging] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const [target, setTarget] = useState<"r2" | "s3">("r2");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const onFiles = useCallback((files: FileList | File[]) => {
    const next: UploadPreview[] = [];
    Array.from(files).forEach((file) => {
      const kind = classifyFile(file);
      const objectUrl =
        kind === "image" || kind === "video"
          ? URL.createObjectURL(file)
          : undefined;
      next.push({ file, objectUrl, kind });
    });
    setItems((prev) => [...prev, ...next]);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFiles(e.dataTransfer.files);
        e.dataTransfer.clearData();
      }
    },
    [onFiles]
  );

  const onChooseClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const removeItem = useCallback((idx: number) => {
    setItems((prev) => {
      const next = [...prev];
      const it = next[idx];
      if (it?.objectUrl) URL.revokeObjectURL(it.objectUrl);
      next.splice(idx, 1);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems((prev) => {
      prev.forEach((it) => it.objectUrl && URL.revokeObjectURL(it.objectUrl));
      return [];
    });
  }, []);

  const totalSize = useMemo(
    () => items.reduce((acc, it) => acc + it.file.size, 0),
    [items]
  );

  const upload = useCallback(async () => {
    if (items.length === 0) return;
    setUploading(true);
    try {
      const form = new FormData();
      items.forEach((it) => form.append("files", it.file, it.file.name));
      // 新版：单选参数
      form.append("target", target);
      const resp = await fetch(`${API_BASE_URL}/api/uploads`, {
        method: "POST",
        body: form,
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(text || `Upload failed (${resp.status})`);
      }
      const data = (await resp.json()) as {
        files: Array<{
          urls: Record<string, string>;
          name: string;
          size: number;
          type: string;
        }>;
      };
      // 如果多目标，优先展示 r2，否则展示任意第一个
      setUploaded(
        data.files.map((f) => {
          const url = f.urls.r2 || f.urls.s3 || Object.values(f.urls)[0] || "";
          return { name: f.name, size: f.size, type: f.type, url };
        })
      );
      toast({
        title: "上传成功",
        description: `已上传 ${data.files.length} 个文件`,
      });
    } catch (e: any) {
      toast({ title: "上传失败", description: e?.message || "请稍后重试" });
    } finally {
      setUploading(false);
    }
  }, [items, toast, target]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">静态资源上传（CDN）</h1>
        <p className="text-sm text-muted-foreground">
          支持图片、视频、JS、CSS、JSON、TXT 等。可拖拽到下方区域。
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={
          "relative flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center transition-colors " +
          (isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20")
        }
      >
        <Upload className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">拖放文件到此，或</p>
        <Button type="button" variant="secondary" onClick={onChooseClick}>
          选择文件
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) =>
            e.currentTarget.files && onFiles(e.currentTarget.files)
          }
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="upload-target"
            checked={target === "r2"}
            onChange={() => setTarget("r2")}
          />
          上传到 R2
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="upload-target"
            checked={target === "s3"}
            onChange={() => setTarget("s3")}
          />
          上传到 S3
        </label>
      </div>

      {items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              待上传：{items.length} 个文件，合计{" "}
              {(totalSize / 1024).toFixed(1)} KB
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={clearAll}>
                <Trash2 className="h-4 w-4" /> 清空
              </Button>
              <Button onClick={upload} disabled={isUploading}>
                {isUploading ? "上传中..." : "开始上传"}
              </Button>
            </div>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((it, idx) => (
              <li key={idx} className="rounded-md border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {it.kind === "image" ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : it.kind === "video" ? (
                      <Video className="h-4 w-4" />
                    ) : it.kind === "text" ? (
                      <Code className="h-4 w-4" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span
                      className="truncate max-w-[16rem]"
                      title={it.file.name}
                    >
                      {it.file.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {(it.kind === "image" || it.kind === "video") &&
                  it.objectUrl && (
                    <div className="aspect-video overflow-hidden rounded bg-muted/30 flex items-center justify-center">
                      {it.kind === "image" ? (
                        <img
                          src={it.objectUrl}
                          alt={it.file.name}
                          className="object-contain max-h-48"
                        />
                      ) : (
                        <video src={it.objectUrl} controls className="h-48" />
                      )}
                    </div>
                  )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {uploaded.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium">上传结果</h2>
          <ul className="space-y-2">
            {uploaded.map((f, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded border p-3 gap-4"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <LinkIcon className="h-4 w-4 shrink-0" />
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm underline truncate"
                  >
                    {f.url}
                  </a>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(f.url);
                    toast({
                      title: "已复制",
                      description: "CDN 地址已复制到剪贴板",
                    });
                  }}
                >
                  <Copy className="h-4 w-4" /> 复制
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
