/** Records the folder the desktop app has open. */
export function rememberFolder(folder: string): Promise<void>;
/** The folder the desktop app last had open, or null if none. */
export function recallFolder(): Promise<string | null>;
