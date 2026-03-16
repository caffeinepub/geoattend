import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { T, T__1 } from "../backend.d";
import type { UserRole } from "../backend.d";
import { daysAgoNs, nowNs } from "../utils/helpers";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// ── Role ────────────────────────────────────────────────────────────────────
export function useCallerRole() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<UserRole | null>({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("Not connected");
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerRole"] });
    },
  });
}

// ── Employee ─────────────────────────────────────────────────────────────────
export function useCurrentClockStatus() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<T__1 | null>({
    queryKey: ["clockStatus"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCurrentClockInStatus();
    },
    enabled: !!actor && !isFetching && !!identity,
    refetchInterval: 30_000,
  });
}

export function useMyAttendanceRecords() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<T__1[]>({
    queryKey: ["myAttendance"],
    queryFn: async () => {
      if (!actor || !identity) return [];
      const from = daysAgoNs(30);
      const to = nowNs();
      return actor.getAttendanceRecords(identity.getPrincipal(), from, to);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useWorkplaceZones() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<T[]>({
    queryKey: ["zones"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listWorkplaceZones();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useClockIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      latitude,
      longitude,
      photoId,
      zoneId,
    }: {
      latitude: number;
      longitude: number;
      photoId: string;
      zoneId: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.clockIn(latitude, longitude, photoId, zoneId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clockStatus"] });
      queryClient.invalidateQueries({ queryKey: ["myAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["allClockedIn"] });
    },
  });
}

export function useClockOut() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      latitude,
      longitude,
      photoId,
    }: {
      latitude: number;
      longitude: number;
      photoId: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.clockOut(latitude, longitude, photoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clockStatus"] });
      queryClient.invalidateQueries({ queryKey: ["myAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["allClockedIn"] });
    },
  });
}

// ── Employer ─────────────────────────────────────────────────────────────────
export function useAllClockedIn() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<Array<[Principal, T__1]>>({
    queryKey: ["allClockedIn"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCurrentlyClockedIn();
    },
    enabled: !!actor && !isFetching && !!identity,
    refetchInterval: 30_000,
  });
}

export function useAttendanceRange(from: bigint, to: bigint) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<Array<[Principal, T__1]>>({
    queryKey: ["attendanceRange", from.toString(), to.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAttendanceForTodayOrRange(from, to);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAddZone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      latitude,
      longitude,
      radius,
    }: {
      name: string;
      latitude: number;
      longitude: number;
      radius: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addWorkplaceZone(name, latitude, longitude, radius);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function useDeleteZone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteWorkplaceZone(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function usePurgeOldRecords() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.purgeOldRecords();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
