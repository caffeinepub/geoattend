import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { UserRole } from "./backend.d";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerRole } from "./hooks/useQueries";
import EmployeePage from "./pages/EmployeePage";
import EmployerDashboard from "./pages/EmployerDashboard";
import LoginPage from "./pages/LoginPage";
import RoleSelectPage from "./pages/RoleSelectPage";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-muted-foreground text-sm font-body">
          Loading GeoAttend…
        </p>
      </div>
    </div>
  );
}

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const {
    data: role,
    isLoading: roleLoading,
    isFetched: roleFetched,
  } = useCallerRole();

  const isAuthenticated = !!identity;

  if (isInitializing || (isAuthenticated && (actorFetching || roleLoading))) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (!roleFetched || !role || role === UserRole.guest) {
    return <RoleSelectPage />;
  }

  if (role === UserRole.user) {
    return <EmployeePage />;
  }

  if (role === UserRole.admin) {
    return <EmployerDashboard />;
  }

  return <LoginPage />;
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: "bg-card border-border text-foreground font-body",
            title: "text-foreground",
            description: "text-muted-foreground",
          },
        }}
      />
    </>
  );
}
