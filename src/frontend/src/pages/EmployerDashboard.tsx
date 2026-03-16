import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  Clock,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { T } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddZone,
  useAllClockedIn,
  useAttendanceRange,
  useDeleteZone,
  usePurgeOldRecords,
  useWorkplaceZones,
} from "../hooks/useQueries";
import {
  daysAgoNs,
  formatDate,
  formatTime,
  nowNs,
  shortPrincipal,
} from "../utils/helpers";

function LivePanel() {
  const { data: liveData, isLoading, refetch, isFetching } = useAllClockedIn();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <p className="text-muted-foreground text-sm">
            Auto-refreshes every 30 seconds
          </p>
        </div>
        <Button
          data-ocid="live.secondary_button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 text-xs"
        >
          <RefreshCw
            className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="live.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : !liveData || liveData.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12 text-center glass-card rounded-xl"
          data-ocid="live.empty_state"
        >
          <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">
            No employees currently clocked in.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {liveData.map(([principal, record], idx) => (
            <motion.div
              key={principal.toString()}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card rounded-xl p-4 flex items-center gap-4"
              data-ocid={`live.item.${idx + 1}`}
            >
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                <div className="w-3 h-3 rounded-full bg-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm text-foreground truncate">
                  {shortPrincipal(principal)}
                </p>
                {record.clockIn && (
                  <p className="text-muted-foreground text-xs mt-0.5">
                    In since {formatTime(record.clockIn.timestamp)} ·{" "}
                    {record.clockIn.zoneId}
                  </p>
                )}
              </div>
              <Badge className="badge-success text-xs shrink-0">Active</Badge>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttendanceLog() {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  const fromNs = BigInt(new Date(fromDate).getTime()) * 1_000_000n;
  const toNs = BigInt(new Date(`${toDate}T23:59:59`).getTime()) * 1_000_000n;

  const { data, isLoading, refetch } = useAttendanceRange(fromNs, toNs);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-32">
          <Label className="text-xs text-muted-foreground mb-1 block">
            From
          </Label>
          <Input
            data-ocid="attendance.input"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-secondary border-border text-foreground text-sm h-9"
          />
        </div>
        <div className="flex-1 min-w-32">
          <Label className="text-xs text-muted-foreground mb-1 block">To</Label>
          <Input
            data-ocid="attendance.input"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-secondary border-border text-foreground text-sm h-9"
          />
        </div>
        <Button
          data-ocid="attendance.secondary_button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2 text-sm h-9"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Load
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2" data-ocid="attendance.loading_state">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12 text-center glass-card rounded-xl"
          data-ocid="attendance.empty_state"
        >
          <Calendar className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">
            No records found for this date range.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table data-ocid="attendance.table">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">
                  Employee
                </TableHead>
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
                  Photos
                </TableHead>
                <TableHead className="text-muted-foreground text-xs">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(([principal, record], idx) => (
                <TableRow
                  key={`${principal.toString()}-${idx}`}
                  className="border-border"
                  data-ocid={`attendance.row.${idx + 1}`}
                >
                  <TableCell className="font-mono text-xs text-foreground">
                    {shortPrincipal(principal)}
                  </TableCell>
                  <TableCell className="text-sm">
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
                    <div className="flex gap-1">
                      {record.clockIn?.photoId && (
                        <a
                          href={record.clockIn.photoId}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={record.clockIn.photoId}
                            alt="Clock-in selfie"
                            className="w-8 h-8 rounded object-cover border border-border"
                          />
                        </a>
                      )}
                      {record.clockOut?.photoId && (
                        <a
                          href={record.clockOut.photoId}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={record.clockOut.photoId}
                            alt="Clock-out selfie"
                            className="w-8 h-8 rounded object-cover border border-border"
                          />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {record.clockOut ? (
                      <Badge className="badge-muted text-xs">Done</Badge>
                    ) : record.clockIn ? (
                      <Badge className="badge-success text-xs">Active</Badge>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ZonesPanel() {
  const { data: zones, isLoading } = useWorkplaceZones();
  const addZone = useAddZone();
  const deleteZone = useDeleteZone();

  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("100");

  const handleAdd = async () => {
    if (!name.trim() || !lat || !lng || !radius) {
      toast.error("Please fill in all fields.");
      return;
    }
    const latitude = Number.parseFloat(lat);
    const longitude = Number.parseFloat(lng);
    const radiusNum = Number.parseFloat(radius);
    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      Number.isNaN(radiusNum)
    ) {
      toast.error("Please enter valid numbers.");
      return;
    }
    try {
      await addZone.mutateAsync({
        name: name.trim(),
        latitude,
        longitude,
        radius: radiusNum,
      });
      toast.success(`Zone "${name.trim()}" added.`);
      setName("");
      setLat("");
      setLng("");
      setRadius("100");
    } catch {
      toast.error("Failed to add zone.");
    }
  };

  const handleDelete = async (zoneName: string) => {
    try {
      await deleteZone.mutateAsync(zoneName);
      toast.success(`Zone "${zoneName}" deleted.`);
    } catch {
      toast.error("Failed to delete zone.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Add zone form */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-sm flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Add Workplace Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Zone Name
            </Label>
            <Input
              data-ocid="zone.input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Head Office"
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Latitude
              </Label>
              <Input
                data-ocid="zone.input"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="37.7749"
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Longitude
              </Label>
              <Input
                data-ocid="zone.input"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="-122.4194"
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Radius (m)
              </Label>
              <Input
                data-ocid="zone.input"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                placeholder="100"
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
          </div>
          <Button
            data-ocid="zone.submit_button"
            onClick={handleAdd}
            disabled={addZone.isPending}
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {addZone.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add Zone
          </Button>
        </CardContent>
      </Card>

      {/* Zone list */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="zones.loading_state">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !zones || zones.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-10 text-center glass-card rounded-xl"
          data-ocid="zones.empty_state"
        >
          <MapPin className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">
            No zones configured yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zone: T, idx: number) => (
            <motion.div
              key={zone.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card rounded-xl p-4 flex items-start gap-3"
              data-ocid={`zones.item.${idx + 1}`}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-600 text-foreground">
                  {zone.name}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {zone.latitude.toFixed(5)}, {zone.longitude.toFixed(5)}
                </p>
                <p className="text-muted-foreground text-xs">
                  Radius: {zone.radius}m
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    data-ocid={`zones.delete_button.${idx + 1}`}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent
                  className="bg-card border-border"
                  data-ocid="zones.dialog"
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-display">
                      Delete Zone?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      This will permanently delete &ldquo;{zone.name}&rdquo;.
                      Employees will no longer be able to clock in at this
                      location.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      data-ocid="zones.cancel_button"
                      className="bg-secondary border-border text-foreground hover:bg-muted"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      data-ocid="zones.confirm_button"
                      onClick={() => handleDelete(zone.name)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminPanel() {
  const purge = usePurgeOldRecords();
  const queryClient = useQueryClient();
  const { refetch: refetchLive } = useAllClockedIn();

  const handlePurge = async () => {
    try {
      await purge.mutateAsync();
      toast.success(
        "Old records purged successfully. Data older than 3 months removed.",
      );
    } catch {
      toast.error("Failed to purge records.");
    }
  };

  const handleRefreshAll = async () => {
    queryClient.invalidateQueries();
    await refetchLive();
    toast.success("Data refreshed.");
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-display font-600 text-foreground">
                Refresh All Data
              </p>
              <p className="text-muted-foreground text-sm mt-0.5">
                Force refresh all attendance data and live status.
              </p>
            </div>
            <Button
              data-ocid="admin.secondary_button"
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              className="gap-2 shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          <div className="border-t border-border" />

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-destructive/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-display font-600 text-foreground">
                Purge Old Records
              </p>
              <p className="text-muted-foreground text-sm mt-0.5">
                Remove all attendance records older than 3 months. This cannot
                be undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  data-ocid="admin.delete_button"
                  variant="destructive"
                  size="sm"
                  className="gap-2 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  Purge
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent
                className="bg-card border-border"
                data-ocid="admin.dialog"
              >
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">
                    Purge Old Records?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This will permanently delete all attendance records older
                    than 3 months. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    data-ocid="admin.cancel_button"
                    className="bg-secondary border-border text-foreground hover:bg-muted"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-ocid="admin.confirm_button"
                    onClick={handlePurge}
                    disabled={purge.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                  >
                    {purge.isPending && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Yes, Purge Records
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EmployerDashboard() {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: liveData } = useAllClockedIn();

  const handleLogout = () => {
    clear();
    queryClient.clear();
  };

  const principalStr = identity?.getPrincipal().toString() ?? "";
  const shortId =
    principalStr.length > 14
      ? `${principalStr.slice(0, 6)}…${principalStr.slice(-5)}`
      : principalStr;

  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="font-display font-700 text-base text-foreground">
                GeoAttend
              </span>
              <span className="hidden sm:inline text-accent text-xs ml-2 font-display font-600">
                Employer
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(liveData?.length ?? 0) > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/15 border border-success/25">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-success text-xs font-display font-600">
                  {liveData?.length} active
                </span>
              </div>
            )}
            <span className="hidden md:block text-muted-foreground text-xs font-mono">
              {shortId}
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

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          {[
            {
              label: "Currently Active",
              value: liveData?.length ?? 0,
              icon: Users,
              color: "text-success",
            },
            {
              label: "Today",
              value: new Date().toLocaleDateString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
              }),
              icon: Calendar,
              color: "text-primary",
            },
            {
              label: "Data Retention",
              value: "3 Months",
              icon: Clock,
              color: "text-accent",
            },
            {
              label: "Zones",
              value: "Active",
              icon: MapPin,
              color: "text-primary",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-muted-foreground text-xs">{label}</p>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`font-display font-700 text-xl ${color}`}>
                  {value}
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Tabs defaultValue="live">
            <TabsList
              className="bg-secondary border border-border w-full sm:w-auto mb-5"
              data-ocid="dashboard.tab"
            >
              <TabsTrigger
                value="live"
                data-ocid="dashboard.live.tab"
                className="font-display font-600 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Live
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                data-ocid="dashboard.attendance.tab"
                className="font-display font-600 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                Attendance
              </TabsTrigger>
              <TabsTrigger
                value="zones"
                data-ocid="dashboard.zones.tab"
                className="font-display font-600 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <MapPin className="w-3.5 h-3.5 mr-1.5" />
                Zones
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                data-ocid="dashboard.admin.tab"
                className="font-display font-600 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Settings className="w-3.5 h-3.5 mr-1.5" />
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live">
              <LivePanel />
            </TabsContent>
            <TabsContent value="attendance">
              <AttendanceLog />
            </TabsContent>
            <TabsContent value="zones">
              <ZonesPanel />
            </TabsContent>
            <TabsContent value="admin">
              <AdminPanel />
            </TabsContent>
          </Tabs>
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
    </div>
  );
}
