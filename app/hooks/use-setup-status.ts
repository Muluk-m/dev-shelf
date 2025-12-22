import { useCallback, useEffect, useState } from "react";
import { getSetupStatus } from "~/lib/api";

interface SetupStatusState {
	needsSetup: boolean | null;
	loading: boolean;
	error: string | null;
}

/**
 * Hook to check if the system needs first-run setup.
 * Returns needsSetup: true when the DB has no users, false when initialized, null while loading.
 */
export function useSetupStatus() {
	const [state, setState] = useState<SetupStatusState>({
		needsSetup: null,
		loading: true,
		error: null,
	});

	const refresh = useCallback(async () => {
		setState((prev) => ({ ...prev, loading: true, error: null }));
		try {
			const data = await getSetupStatus();
			setState({
				needsSetup: data.needsSetup,
				loading: false,
				error: null,
			});
		} catch (err) {
			// Default to needsSetup: false on error to avoid blocking the app
			setState({
				needsSetup: false,
				loading: false,
				error: err instanceof Error ? err.message : "Failed to check setup status",
			});
		}
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return { ...state, refresh };
}
