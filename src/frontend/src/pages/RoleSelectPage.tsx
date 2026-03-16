import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Briefcase, HardHat, Loader2, LogOut, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { UserRole } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAssignRole } from "../hooks/useQueries";

export default function RoleSelectPage() {
  const { identity, clear } = useInternetIdentity();
  const assignRole = useAssignRole();
  const queryClient = useQueryClient();

  const handleSelect = async (role: UserRole) => {
    if (!identity) return;
    try {
      await assignRole.mutateAsync({ user: identity.getPrincipal(), role });
      toast.success(
        role === UserRole.admin ? "Welcome, Employer!" : "Welcome, Employee!",
      );
    } catch {
      toast.error("Failed to set role. Please try again.");
    }
  };

  const handleLogout = () => {
    clear();
    queryClient.clear();
  };

  const isPending = assignRole.isPending;

  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-5 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-700 text-lg text-foreground">
            GeoAttend
          </span>
        </div>
        <Button
          data-ocid="nav.button"
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl font-display font-700 text-foreground mb-2">
              Who are you?
            </h1>
            <p className="text-muted-foreground">
              Select your role to get started. This can only be set once.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.button
              data-ocid="role.employee.button"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => handleSelect(UserRole.user)}
              disabled={isPending}
              className="glass-card rounded-2xl p-8 text-left hover:border-primary/50 transition-all hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-5 group-hover:bg-primary/25 transition-colors">
                {isPending ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : (
                  <HardHat className="w-6 h-6 text-primary" />
                )}
              </div>
              <h2 className="font-display font-700 text-xl text-foreground mb-1">
                Employee
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Clock in and out with geofencing and photo verification.
              </p>
            </motion.button>

            <motion.button
              data-ocid="role.employer.button"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              onClick={() => handleSelect(UserRole.admin)}
              disabled={isPending}
              className="glass-card rounded-2xl p-8 text-left hover:border-accent/50 transition-all hover:bg-accent/5 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-14 h-14 rounded-xl bg-accent/15 flex items-center justify-center mb-5 group-hover:bg-accent/25 transition-colors">
                {isPending ? (
                  <Loader2 className="w-6 h-6 text-accent animate-spin" />
                ) : (
                  <Briefcase className="w-6 h-6 text-accent" />
                )}
              </div>
              <h2 className="font-display font-700 text-xl text-foreground mb-1">
                Employer
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Monitor live attendance, manage workplace zones and records.
              </p>
            </motion.button>
          </div>
        </div>
      </main>
    </div>
  );
}
