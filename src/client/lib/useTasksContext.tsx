import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { listAllTasks } from "./api";
import type { TaskSummary } from "../../shared/rpcTypes";

export function isTaskCompleted(t: TaskSummary): boolean {
  return (
    !!t.stop_reason ||
    t.backfill_status === "cancelled" ||
    t.backfill_status === "failed" ||
    (t.backfill_status === "complete" && !t.live_enabled)
  );
}

export function isTaskActive(t: TaskSummary): boolean {
  if (isTaskCompleted(t)) return false;
  return Boolean(t.live_enabled || t.backfill_status === "running" || t.backfill_status === "pending");
}

export function isTaskPaused(t: TaskSummary): boolean {
  if (isTaskCompleted(t)) return false;
  return (
    t.backfill_status === "paused" ||
    (!t.live_enabled && t.backfill_status !== "running" && t.backfill_status !== "pending")
  );
}

interface TasksContextValue {
  tasks: TaskSummary[];
  activeTasks: TaskSummary[];
  pausedTasks: TaskSummary[];
  completedTasks: TaskSummary[];
  activeCount: number;
  liveCount: number;
  pausedCount: number;
  completedCount: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

const TasksContext = createContext<TasksContextValue | null>(null);

const ACTIVE_POLL_INTERVAL_MS = 8_000;
const IDLE_POLL_INTERVAL_MS = 15_000;

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchTasks = async () => {
    const res = await listAllTasks();
    if (res.ok && mountedRef.current) {
      setTasks(res.data);
      setLoading(false);
    }
  };

  const activeTasks = useMemo(() => {
    return tasks.filter(isTaskActive);
  }, [tasks]);

  const pausedTasks = useMemo(() => {
    return tasks.filter(isTaskPaused);
  }, [tasks]);

  const completedTasks = useMemo(() => {
    return tasks.filter(isTaskCompleted);
  }, [tasks]);

  const liveCount = useMemo(() => {
    return tasks.filter((t) => t.live_enabled && !t.stop_reason).length;
  }, [tasks]);

  const activeCount = useMemo(() => activeTasks.length, [activeTasks]);
  const pausedCount = useMemo(() => pausedTasks.length, [pausedTasks]);
  const completedCount = useMemo(() => completedTasks.length, [completedTasks]);

  useEffect(() => {
    mountedRef.current = true;
    fetchTasks();

    let timeoutId: number | undefined;

    const scheduleNext = () => {
      // Dynamic interval: poll faster when active tasks are running, slower when idle
      const interval = activeTasks.length > 0 ? ACTIVE_POLL_INTERVAL_MS : IDLE_POLL_INTERVAL_MS;
      timeoutId = window.setTimeout(async () => {
        if (document.visibilityState === "visible") {
          await fetchTasks();
        }
        scheduleNext();
      }, interval);
    };

    scheduleNext();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchTasks();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mountedRef.current = false;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeTasks.length]);

  return (
    <TasksContext.Provider
      value={{
        tasks,
        activeTasks,
        pausedTasks,
        completedTasks,
        activeCount,
        liveCount,
        pausedCount,
        completedCount,
        loading,
        refetch: fetchTasks,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return ctx;
}
