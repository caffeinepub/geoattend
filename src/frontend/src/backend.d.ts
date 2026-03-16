import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface T__3 {
    latitude: number;
    longitude: number;
    timestamp: bigint;
    photoId: string;
}
export interface T__2 {
    latitude: number;
    longitude: number;
    timestamp: bigint;
    zoneId: string;
    photoId: string;
}
export interface T__1 {
    clockOut?: T__3;
    clockIn?: T__2;
}
export interface T {
    latitude: number;
    name: string;
    longitude: number;
    radius: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addWorkplaceZone(name: string, latitude: number, longitude: number, radius: number): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clockIn(latitude: number, longitude: number, photoId: string, zoneId: string): Promise<void>;
    clockOut(latitude: number, longitude: number, photoId: string): Promise<void>;
    deleteWorkplaceZone(name: string): Promise<void>;
    getAllCurrentlyClockedIn(): Promise<Array<[Principal, T__1]>>;
    getAttendanceForTodayOrRange(from: bigint, to: bigint): Promise<Array<[Principal, T__1]>>;
    getAttendanceRecords(user: Principal, from: bigint, to: bigint): Promise<Array<T__1>>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentClockInStatus(): Promise<T__1 | null>;
    isCallerAdmin(): Promise<boolean>;
    listWorkplaceZones(): Promise<Array<T>>;
    purgeOldRecords(): Promise<void>;
}
