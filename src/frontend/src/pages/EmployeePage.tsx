import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { T } from "../backend.d";
import CameraCapture from "../components/CameraCapture";
import { useBlobStorage } from "../hooks/useBlobStorage";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useClockIn,
  useClockOut,
  useCurrentClockStatus,
  useMyAttendanceRecords,
  useWorkplaceZones,
} from "../hooks/useQueries";
import {
  formatDate,
  formatTime,
  getGeolocation,
  nsToDate,
} from "../utils/helpers";

type ClockFlow = "idle" | "selecting-zone" | "camera" | "uploading" | null;

export default function EmployeePage() {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const blobStorage = useBlobStorage();

  const { data: status, isLoading: statusLoading } = useCurrentClockStatus();
  const { data: records, isLoading: recordsLoading } = useMyAttendanceRecords();
  const { data: zones, isLoading: zonesLoading } = useWorkplaceZones();
  const clockIn = useClockIn();
  const clockOut = useClockOut();

  const [flow, setFlow] = useState<ClockFlow>(null);
  const [selectedZone, setSelectedZone] = useState<T | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [flowError, setFlowError] = useState<string | null>(null);

  const isClockedIn = !!(status?.clockIn && !status?.clockOut);

  const handleStartClockIn = () => {
    setFlow("selecting-zone");
    setFlowError(null);
    setCapturedPhoto(null);
    setSelectedZone(null);
  };

  const handleStartClockOut = () => {
    setFlow("camera");
    setFlowError(null);
    setCapturedPhoto(null);
  };

  const handleZoneSelected = (zone: T) => {
    setSelectedZone(zone);
    setFlow("camera");
  };

  const handlePhotoCapture = async (file: File) => {
    setCapturedPhoto(file);
    setFlow("uploading");
    setFlowError(null);
    setUploadProgress(0);

    try {
      // Get location
      const coords = await getGeolocation();

      // Upload photo
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
        setUploadProgress(pct),
      );
      const stored = await blobStorage.store(blob);
      const photoId = stored.getDirectURL();

      if (isClockedIn) {
        // Clock out
        await clockOut.mutateAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
          photoId,
        });
        toast.success("Clocked out successfully!");
      } else if (selectedZone) {
        // Clock in
        await clockIn.mutateAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
          photoId,
          zoneId: selectedZone.name,
        });
        toast.success(`Clocked in at ${selectedZone.name}!`);
      }

      setFlow(null);
      setCapturedPhoto(null);
      setSelectedZone(null);
    } catch (err: any) {
      const msg =
        err?.message?.toLowerCase().includes("geofence") ||
        err?.message?.toLowerCase().includes("zone") ||
        err?.message?.toLowerCase().includes("location")
          ? "You are not within the allowed zone."
          : err?.message || "An error occurred. Please try again.";
      setFlowError(msg);
      setFlow(null);
      toast.error(msg);
    }
  };

  const handleLogout = () => {
    clear();
    queryClient.clear();
  };

  const principalStr = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal =
    principalStr.length > 14
      ? `${principalStr.slice(0, 6)}…${principalStr.slice(-5)}`
      : principalStr;

  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="font-display font-700 text-base text-foreground">
                GeoAttend
              </span>
              <span className="hidden sm:inline text-muted-foreground text-xs ml-2">
                Employee
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-muted-foreground text-xs font-mono">
              {shortPrincipal}
            </span>
            <Button
              data-ocid="nav.button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-5">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">
                    Current Status
                  </p>
                  {statusLoading ? (
                    <Skeleton
                      className="h-7 w-32"
                      data-ocid="status.loading_state"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      {isClockedIn ? (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                          <span className="font-display font-700 text-xl text-success">
                            Clocked In
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
                          <span className="font-display font-700 text-xl text-muted-foreground">
                            Clocked Out
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  {isClockedIn && status?.clockIn && (
                    <p className="text-muted-foreground text-sm mt-1">
                      Since {formatTime(status.clockIn.timestamp)} ·{" "}
                      {formatDate(status.clockIn.timestamp)}
                    </p>
                  )}
                </div>
                <div>
                  {isClockedIn ? (
                    <CheckCircle2 className="w-10 h-10 text-success/40" />
                  ) : (
                    <Clock className="w-10 h-10 text-muted-foreground/30" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error state */}
        <AnimatePresence>
          {flowError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-destructive/15 border border-destructive/30"
              data-ocid="attendance.error_state"
            >
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <p className="text-destructive text-sm">{flowError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-4"
        >
          <Button
            data-ocid="attendance.clock_in.primary_button"
            onClick={handleStartClockIn}
            disabled={isClockedIn || statusLoading}
            className="h-14 gap-2 font-display font-600 text-base bg-primary text-primary-foreground hover:bg-primary/90 btn-glow rounded-xl disabled:opacity-40"
          >
            <LogIn className="w-5 h-5" />
            Clock In
          </Button>
          <Button
            data-ocid="attendance.clock_out.primary_button"
            onClick={handleStartClockOut}
            disabled={!isClockedIn || statusLoading}
            variant="outline"
            className="h-14 gap-2 font-display font-600 text-base border-border hover:bg-secondary rounded-xl disabled:opacity-40"
          >
            <LogOut className="w-5 h-5" />
            Clock Out
          </Button>
        </motion.div>

        {/* History Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Last 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recordsLoading ? (
                <div
                  className="p-6 space-y-3"
                  data-ocid="history.loading_state"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !records || records.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-10 text-center"
                  data-ocid="history.empty_state"
                >
                  <Calendar className="w-8 h-8 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    No attendance records yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table data-ocid="history.table">
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-xs">
                          Date
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs">
                          Clock In
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs">
                          Clock Out
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...records].reverse().map((record, idx) => (
                        <TableRow
                          key={
                            record.clockIn
                              ? record.clockIn.timestamp.toString()
                              : `rec-${idx}`
                          }
                          className="border-border"
                          data-ocid={`history.item.${idx + 1}`}
                        >
                          <TableCell className="text-sm text-foreground">
                            {record.clockIn
                              ? formatDate(record.clockIn.timestamp)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {record.clockIn
                              ? formatTime(record.clockIn.timestamp)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {record.clockOut
                              ? formatTime(record.clockOut.timestamp)
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {record.clockOut ? (
                              <Badge className="badge-muted text-xs">
                                Complete
                              </Badge>
                            ) : record.clockIn ? (
                              <Badge className="badge-success text-xs">
                                Active
                              </Badge>
                            ) : (
                              <Badge className="badge-muted text-xs">—</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <footer className="text-center py-4 text-muted-foreground text-xs border-t border-border/30">
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

      {/* Zone selection dialog (for clock-in) */}
      <Dialog
        open={flow === "selecting-zone"}
        onOpenChange={(open) => {
          if (!open) setFlow(null);
        }}
      >
        <DialogContent
          className="bg-card border-border max-w-sm"
          data-ocid="zone.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display font-700">
              Select Workplace Zone
            </DialogTitle>
          </DialogHeader>
          {zonesLoading ? (
            <div className="space-y-3" data-ocid="zone.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !zones || zones.length === 0 ? (
            <div
              className="flex flex-col items-center py-8 text-center"
              data-ocid="zone.empty_state"
            >
              <MapPin className="w-8 h-8 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">
                No workplace zones configured. Contact your employer.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {zones.map((zone, idx) => (
                <button
                  type="button"
                  key={zone.name}
                  data-ocid={`zone.item.${idx + 1}`}
                  onClick={() => handleZoneSelected(zone)}
                  className="w-full glass-card rounded-xl p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-display font-600 text-foreground text-sm">
                        {zone.name}
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}{" "}
                        · {zone.radius}m radius
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <Button
            data-ocid="zone.cancel_button"
            variant="outline"
            onClick={() => setFlow(null)}
            className="w-full"
          >
            Cancel
          </Button>
        </DialogContent>
      </Dialog>

      {/* Camera dialog */}
      <Dialog
        open={flow === "camera"}
        onOpenChange={(open) => {
          if (!open) setFlow(null);
        }}
      >
        <DialogContent
          className="bg-card border-border max-w-sm"
          data-ocid="camera.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display font-700">
              {isClockedIn
                ? "Clock Out — Take Selfie"
                : "Clock In — Take Selfie"}
            </DialogTitle>
          </DialogHeader>
          <CameraCapture
            onCapture={handlePhotoCapture}
            onCancel={() => setFlow(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Uploading dialog */}
      <Dialog open={flow === "uploading"} onOpenChange={() => {}}>
        <DialogContent
          className="bg-card border-border max-w-xs text-center"
          data-ocid="upload.dialog"
        >
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div>
              <p className="font-display font-600 text-foreground mb-1">
                {capturedPhoto ? "Uploading…" : "Processing…"}
              </p>
              <p className="text-muted-foreground text-sm">
                {uploadProgress > 0 && uploadProgress < 100
                  ? `${uploadProgress}% uploaded`
                  : "Please wait"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
