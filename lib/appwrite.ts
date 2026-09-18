import { Account, Client, ID, Permission, Query, Role, TablesDB } from "appwrite";

const publicEnv: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {};

export const appwriteConfig = {
  endpoint: publicEnv.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1",
  projectId: publicEnv.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "6aabf0f3003c88993bba",
  databaseId: publicEnv.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "6aabf1350013c770ea82",
  tables: {
    athletes: publicEnv.NEXT_PUBLIC_APPWRITE_ATHLETES_TABLE_ID || "athletes",
    runs: publicEnv.NEXT_PUBLIC_APPWRITE_RUNS_TABLE_ID || "runs",
    runSplits: publicEnv.NEXT_PUBLIC_APPWRITE_RUN_SPLITS_TABLE_ID || "run_splits",
    weightEntries: publicEnv.NEXT_PUBLIC_APPWRITE_WEIGHT_ENTRIES_TABLE_ID || "weight_entries",
  },
};

export const isAppwriteConfigured = Boolean(
  appwriteConfig.endpoint && appwriteConfig.projectId && appwriteConfig.databaseId,
);

export const appwriteClient = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

export const account = new Account(appwriteClient);
export const tablesDB = new TablesDB(appwriteClient);

export { ID, Permission, Query, Role };

export function ownerPermissions(userId: string) {
  const owner = Role.user(userId);
  return [Permission.read(owner), Permission.update(owner), Permission.delete(owner)];
}

export function toAppwriteDate(date: string) {
  return `${date.slice(0, 10)}T12:00:00.000Z`;
}

export function fromAppwriteDate(date: unknown) {
  return String(date || "").slice(0, 10);
}
