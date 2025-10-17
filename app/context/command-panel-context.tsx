"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { CommandPanel } from "~/components/command-panel/command-panel";
import { useCommandPanel } from "~/hooks/use-command-panel";
import type { Tool } from "~/types/tool";

const CommandPanelContext = createContext<ReturnType<
	typeof useCommandPanel
> | null>(null);

interface CommandPanelProviderProps {
	tools: Tool[];
	children: ReactNode;
}

export function CommandPanelProvider({
	tools,
	children,
}: CommandPanelProviderProps) {
	const panel = useCommandPanel(tools);

	return (
		<CommandPanelContext.Provider value={panel}>
			{children}
			<CommandPanel
				isOpen={panel.isOpen}
				onClose={panel.closePanel}
				query={panel.query}
				onQueryChange={panel.setQuery}
				selectedIndex={panel.selectedIndex}
				onSelectedIndexChange={panel.setSelectedIndex}
				groupedCommands={panel.groupedCommands}
				onExecuteCommand={panel.executeCommand}
			/>
		</CommandPanelContext.Provider>
	);
}

export function useCommandPanelContext() {
	const context = useContext(CommandPanelContext);
	if (!context) {
		return null;
	}
	return context;
}
