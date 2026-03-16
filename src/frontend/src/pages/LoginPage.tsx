import { Button } from "@/components/ui/button";
import { Clock, Loader2, MapPin, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-700 text-lg text-foreground">
            GeoAttend
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/15 border border-primary/25 mb-6">
              <MapPin className="w-9 h-9 text-primary" />
            </div>
            <h1 className="text-4xl font-display font-800 text-foreground mb-3 tracking-tight">
              GeoAttend
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Smart attendance tracking with geofencing and photo verification.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="glass-card rounded-2xl p-8 mb-6"
          >
            <Button
              data-ocid="auth.primary_button"
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-12 btn-glow font-display font-600 text-base bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                "Sign in with Internet Identity"
              )}
            </Button>
            <p className="text-center text-muted-foreground text-xs mt-4">
              Secure, decentralized authentication powered by the Internet
              Computer.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              {
                icon: MapPin,
                label: "Geofencing",
                desc: "Location-verified check-in",
              },
              { icon: Clock, label: "Real-time", desc: "Live attendance data" },
              { icon: Shield, label: "Secure", desc: "Privacy-first design" },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="glass-card rounded-xl p-4 text-center"
              >
                <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-foreground text-xs font-display font-600">
                  {label}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">{desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      <footer className="text-center py-5 text-muted-foreground text-xs border-t border-border/30">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
