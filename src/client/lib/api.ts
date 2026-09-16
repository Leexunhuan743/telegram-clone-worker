import type { BotSummary, Result, TaskSummary } from "../../shared/rpcTypes";

async function request<T>(path: string, init?: RequestInit): Promise<Result<T>> {
  try {
    const res = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
    const body = (await res.json()) as Result<T>;
    return body;
  } catch (e) {
    return { ok: false, errorCode: 0, description: e instanceof Error ? e.message : String(e), reason: "unknown" };
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Fetches all tasks across all bots in a single query. */
export async function listAllTasks(): Promise<Result<TaskSummary[]>> {
  return api.get<TaskSummary[]>("/api/tasks");
}
