"use client";

import { useEffect, useMemo, useState } from "react";
import { UAParser } from "ua-parser-js";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";

type UaInfo = {
  browserName?: string;
  browserVersion?: string;
  engineName?: string;
  engineVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceModel?: string;
  deviceType?: string;
  deviceVendor?: string;
  cpuArch?: string;
};

function parseUserAgent(ua: string): UaInfo {
  const parser = new UAParser(ua);
  const browser = parser.getBrowser();
  const engine = parser.getEngine();
  const os = parser.getOS();
  const device = parser.getDevice();
  const cpu = parser.getCPU();

  return {
    browserName: browser.name || undefined,
    browserVersion: browser.version || undefined,
    engineName: engine.name || undefined,
    engineVersion: engine.version || undefined,
    osName: os.name || undefined,
    osVersion: os.version || undefined,
    deviceModel: device.model || undefined,
    deviceType: device.type || undefined,
    deviceVendor: device.vendor || undefined,
    cpuArch: cpu.architecture || undefined,
  };
}

export default function UAParserPage() {
  const [ua, setUa] = useState<string>("");

  // 默认填入当前浏览器 UA，便于打开即用
  useEffect(() => {
    if (!ua && typeof navigator !== "undefined") {
      setUa(navigator.userAgent);
    }
  }, [ua]);

  const info = useMemo(() => parseUserAgent(ua), [ua]);

  const Item = ({
    title,
    name,
    version,
    placeholders,
  }: {
    title: string;
    name?: string;
    version?: string;
    placeholders: string[];
  }) => (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!name && !version ? (
          <div className="text-sm text-muted-foreground space-y-1">
            {placeholders.map((t) => (
              <div key={t}>{t}</div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            {name ? <Badge variant="secondary">{name}</Badge> : null}
            {version ? <Badge variant="secondary">{version}</Badge> : null}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-background flex flex-col min-h-[60vh]">
      <div className="w-full flex-1 flex">
        <div className="mx-auto w-full px-4 py-6">
          {/* 响应式居中内容区域宽度 */}
          <div className="mx-auto w-full max-w-[680px] sm:max-w-[720px] md:max-w-[860px] lg:max-w-[920px] xl:max-w-[980px] 2xl:max-w-[1100px]">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold">User-agent parser</h1>
              <p className="text-sm text-muted-foreground">
                Detect and parse Browser, Engine, OS, CPU, and Device type/model
                from an user-agent string.
              </p>
            </div>

            <Card className="mb-4">
              <CardContent className="pt-4">
                <div className="mb-2 text-sm text-muted-foreground">
                  User agent string
                </div>
                <Textarea
                  value={ua}
                  onChange={(e) => setUa(e.target.value)}
                  placeholder="在此输入或粘贴 UA 字符串"
                  className="font-mono text-sm min-h-24"
                />
              </CardContent>
            </Card>

            {/* 结果区块 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Item
                title="Browser"
                name={info.browserName}
                version={info.browserVersion}
                placeholders={[
                  "No browser name available",
                  "No browser version available",
                ]}
              />
              <Item
                title="Engine"
                name={info.engineName}
                version={info.engineVersion}
                placeholders={[
                  "No engine name available",
                  "No engine version available",
                ]}
              />
              <Item
                title="OS"
                name={info.osName}
                version={info.osVersion}
                placeholders={[
                  "No OS name available",
                  "No OS version available",
                ]}
              />
              <Item
                title="Device"
                name={info.deviceModel || info.deviceVendor}
                version={info.deviceType}
                placeholders={[
                  "No device model available",
                  "No device type available",
                  "No device vendor available",
                ]}
              />
              <Item
                title="CPU"
                name={info.cpuArch}
                version={undefined}
                placeholders={["No CPU architecture available"]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
