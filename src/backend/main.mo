import Time "mo:core/Time";
import List "mo:core/List";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";

actor {
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  /////////////////////////
  // DATA TYPES & STATE //
  ////////////////////////

  module ClockInData {
    public type T = {
      timestamp : Int;
      latitude : Float;
      longitude : Float;
      photoId : Text;
      zoneId : Text;
    };
    public func compare(a : T, b : T) : Order.Order {
      Int.compare(a.timestamp, b.timestamp);
    };
  };

  module ClockOutData {
    public type T = {
      timestamp : Int;
      latitude : Float;
      longitude : Float;
      photoId : Text;
    };
    public func compare(a : T, b : T) : Order.Order {
      Int.compare(a.timestamp, b.timestamp);
    };
  };

  module Zone {
    public type T = {
      name : Text;
      latitude : Float;
      longitude : Float;
      radius : Float;
    };
    public func compare(a : T, b : T) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  module AttendanceRecord {
    public type T = {
      clockIn : ?ClockInData.T;
      clockOut : ?ClockOutData.T;
    };

    public func compare(a : T, b : T) : Order.Order {
      switch (a.clockIn, b.clockIn) {
        case (null, null) { #equal };
        case (null, ?_) { #less };
        case (?_, null) { #greater };
        case (?d1, ?d2) { ClockInData.compare(d1, d2) };
      };
    };
  };

  let zones = Map.empty<Text, Zone.T>();
  let attendanceRecords = Map.empty<Principal, List.List<AttendanceRecord.T>>();

  ///////////////////////////
  // Distance Calculation  //
  ///////////////////////////

  func toRadians(degrees : Float) : Float {
    degrees * 3.141592653589793 / 180.0;
  };

  func haversineDistance(
    lat1 : Float,
    lon1 : Float,
    lat2 : Float,
    lon2 : Float,
  ) : Float {
    let r = 6371000.0;
    let dLat = toRadians(lat2 - lat1);
    let dLon = toRadians(lon2 - lon1);

    let a =
      (Float.sin(dLat / 2.0)) ** 2.0 +
      Float.cos(toRadians(lat1)) *
      Float.cos(toRadians(lat2)) *
      (Float.sin(dLon / 2.0)) ** 2.0;
    let c = 2.0 * Float.sqrt(a);
    r * c;
  };

  ////////////////////////
  // Zone Management    //
  ////////////////////////

  public shared ({ caller }) func addWorkplaceZone(name : Text, latitude : Float, longitude : Float, radius : Float) : async () {
    assertIsAdmin(caller);
    switch (zones.get(name)) {
      case (?_) { Runtime.trap("Zone already exists!") };
      case (null) {};
    };

    let zone : Zone.T = {
      name;
      latitude;
      longitude;
      radius;
    };

    zones.add(name, zone);
  };

  public query ({ caller }) func listWorkplaceZones() : async [Zone.T] {
    assertIsAdmin(caller);
    zones.values().toArray().sort();
  };

  public shared ({ caller }) func deleteWorkplaceZone(name : Text) : async () {
    assertIsAdmin(caller);
    switch (zones.get(name)) {
      case (null) { Runtime.trap("Zone does not exist!") };
      case (?_) { zones.remove(name) };
    };
  };

  ///////////////////////////
  // Attendance Functions  //
  ///////////////////////////

  public shared ({ caller }) func clockIn(latitude : Float, longitude : Float, photoId : Text, zoneId : Text) : async () {
    assertIsUser(caller);
    let zone = switch (zones.get(zoneId)) {
      case (null) { Runtime.trap("Zone does not exist!") };
      case (?z) { z };
    };

    let distance = haversineDistance(latitude, longitude, zone.latitude, zone.longitude);
    if (distance > zone.radius) { Runtime.trap("Not within zone radius!") };

    let clockInData : ClockInData.T = {
      timestamp = Time.now();
      latitude;
      longitude;
      photoId;
      zoneId;
    };

    let record : AttendanceRecord.T = {
      clockIn = ?clockInData;
      clockOut = null;
    };

    let existingRecords = switch (attendanceRecords.get(caller)) {
      case (null) {
        let list = List.empty<AttendanceRecord.T>();
        list.add(record);
        list;
      };
      case (?records) {
        records.add(record);
        records;
      };
    };

    attendanceRecords.add(caller, existingRecords);
  };

  public shared ({ caller }) func clockOut(latitude : Float, longitude : Float, photoId : Text) : async () {
    assertIsUser(caller);
    let clockOutData : ClockOutData.T = {
      timestamp = Time.now();
      latitude;
      longitude;
      photoId;
    };

    let records = switch (attendanceRecords.get(caller)) {
      case (null) { Runtime.trap("No clock-in record found!") };
      case (?r) { r };
    };

    let updatedRecords = records.map<AttendanceRecord.T, AttendanceRecord.T>(
      func(record) {
        if (record.clockOut == null) {
          {
            clockIn = record.clockIn;
            clockOut = ?clockOutData;
          };
        } else {
          record;
        };
      }
    );

    attendanceRecords.add(caller, updatedRecords);
  };

  // Get current clock-in status for caller
  public query ({ caller }) func getCurrentClockInStatus() : async ?AttendanceRecord.T {
    assertIsUser(caller);
    switch (attendanceRecords.get(caller)) {
      case (null) { null };
      case (?records) {
        records.values().find(
          func(record) { switch (record.clockOut) { case (null) { true }; case (?_) { false } } }
        );
      };
    };
  };

  // Query attendance records for a date range
  public query ({ caller }) func getAttendanceRecords(user : Principal, from : Int, to : Int) : async [AttendanceRecord.T] {
    if (caller != user) { assertIsAdmin(caller) };

    let records = switch (attendanceRecords.get(user)) {
      case (null) { List.empty<AttendanceRecord.T>() };
      case (?r) { r };
    };

    let filteredRecords = records.filter(
      func(record) {
        switch (record.clockIn) {
          case (null) { false };
          case (?clockIn) {
            // Inclusive filtering of records within the specified range
            clockIn.timestamp >= from and clockIn.timestamp <= to;
          };
        };
      }
    );

    filteredRecords.toArray().sort();
  };

  // Get all currently clocked-in employees (live)
  public query ({ caller }) func getAllCurrentlyClockedIn() : async [(Principal, AttendanceRecord.T)] {
    assertIsAdmin(caller);

    let result = List.empty<(Principal, AttendanceRecord.T)>();
    let now = Time.now();

    attendanceRecords.keys().forEach(
      func(principal) {
        switch (attendanceRecords.get(principal)) {
          case (null) {};
          case (?records) {
            records.values().forEach(
              func(record) {
                if (
                  switch (record.clockIn, record.clockOut) {
                    case (?clockIn, null) { now - clockIn.timestamp < 8 * 3600 * 1_000_000_000 };
                    case (_) { false };
                  }
                ) {
                  result.add((principal, record));
                };
              }
            );
          };
        };
      }
    );

    result.toArray();
  };

  // Get full attendance list for today or a date range
  public query ({ caller }) func getAttendanceForTodayOrRange(from : Int, to : Int) : async [(Principal, AttendanceRecord.T)] {
    assertIsAdmin(caller);

    let result = List.empty<(Principal, AttendanceRecord.T)>();

    attendanceRecords.keys().forEach(
      func(principal) {
        switch (attendanceRecords.get(principal)) {
          case (null) {};
          case (?records) {
            records.forEach(
              func(record) {
                switch (record.clockIn) {
                  case (null) {};
                  case (?clockIn) {
                    // Inclusive filtering of records within the specified range
                    if (clockIn.timestamp >= from and clockIn.timestamp <= to) {
                      result.add((principal, record));
                    };
                  };
                };
              }
            );
          };
        };
      }
    );

    result.toArray();
  };

  // Purge old records
  public shared ({ caller }) func purgeOldRecords() : async () {
    assertIsAdmin(caller);
    let now = Time.now();
    let retentionPeriod : Int = 90 * 24 * 3600 * 1_000_000_000;
    let safeAttendanceRecords = List.empty<(Principal, List.List<AttendanceRecord.T>)>();

    attendanceRecords.forEach(
      func(principal, records) {
        let filteredRecords = records.filter(
          func(record) {
            switch (record.clockIn) {
              case (null) { false };
              case (?clockIn) { now - clockIn.timestamp < retentionPeriod };
            };
          }
        );

        if (not filteredRecords.isEmpty()) {
          safeAttendanceRecords.add((principal, filteredRecords));
        };
      }
    );

    attendanceRecords.clear();
    safeAttendanceRecords.forEach(
      func((principal, records)) {
        if (not records.isEmpty()) {
          attendanceRecords.add(principal, records);
        };
      }
    );
  };

  // Helper functions to enforce authorization
  func assertIsAdmin(caller : Principal) : () {
    switch (AccessControl.getUserRole(accessControlState, caller)) {
      case (#admin) { () };
      case (_) { Runtime.trap("Unauthorized: Admin access required.") };
    };
  };

  func assertIsUser(caller : Principal) : () {
    switch (AccessControl.getUserRole(accessControlState, caller)) {
      case (#user) { () };
      case (_) { Runtime.trap("Unauthorized: User access required.") };
    };
  };
};
