# GeoAttend

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Role-based access: Employee and Employer roles
- Employee attendance marking with:
  - Geofence validation (check if employee is within allowed radius of workplace)
  - Mandatory selfie photo capture before marking attendance
  - Clock-in and clock-out actions
- Employer dashboard:
  - Real-time attendance overview (who is clocked in/out)
  - Per-employee attendance history
  - Manage geofence zones (set workplace location + radius)
  - View attendance photos
- Data retention: attendance records older than 3 months are automatically purged
- Employer can add/manage workplace locations (lat, lng, radius in meters)

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: Attendance canister with
   - Workplace/geofence zone management (CRUD by employer)
   - Clock-in / clock-out with geolocation + photo blob reference
   - Query attendance records with filters (by date, by employee)
   - Auto-purge records older than 90 days
   - Role check: employer vs employee
2. Frontend:
   - Auth flow (login, role selection/assignment)
   - Employee view: camera capture + location check + clock-in/out button
   - Employer view: live dashboard, attendance table, zone settings
   - Blob storage integration for photo upload
