import { useState, useEffect } from "react";
import { ToastProvider } from "./components/Toast";
import { LayoutContext } from "./components/LayoutContext";
import { TasksProvider } from "./lib/useTasksContext";
import { AppNav } from "./components/AppNav";
import { AppFooter } from "./components/AppFooter";
import { useHashRoute } from "./lib/router";
import { TaskWizardPage } from "./pages/TaskWizardPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { BotsManagePage } from "./pages/BotsManagePage";
import { SavedTasksPage } from "./pages/SavedTasksPage";
import { CompletedTasksPage } from "./pages/CompletedTasksPage";
import { PausedTasksPage } from "./pages/PausedTasksPage";
import { EmptyStatePage } from "./pages/EmptyStatePage";
import { ErrorBoundary } from "./components/ErrorBoundary";

function Page() {
  const route = useHashRoute();
  if (route.type === "wizard") return <TaskWizardPage fromSavedId={route.fromSavedId} />;
  if (route.type === "task") return <TaskDetailPage taskId={route.taskId} />;
  if (route.type === "paused") return <PausedTasksPage />;
  if (route.type === "completed") return <CompletedTasksPage />;
  if (route.type === "bots") return <BotsManagePage />;
  if (route.type === "saved-tasks") return <SavedTasksPage />;
  return <EmptyStatePage />;
}

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("tg_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("tg_sidebar_collapsed", String(sidebarCollapsed));
    } catch {
      // ignore
    }
  }, [sidebarCollapsed]);

  const toggleSidebar = () => setSidebarCollapsed((c) => !c);

  return (
    <ToastProvider>
      <TasksProvider>
        <LayoutContext.Provider
          value={{
            sidebarCollapsed,
            drawerOpen,
            toggleSidebar,
            setDrawerOpen,
          }}
        >
          <div className="app-shell">
            <AppNav />
            <div className="main-layout">
              <main className="main-panel">
                <ErrorBoundary>
                  <Page />
                </ErrorBoundary>
              </main>
              <AppFooter />
            </div>
          </div>
        </LayoutContext.Provider>
      </TasksProvider>
    </ToastProvider>
  );
}
