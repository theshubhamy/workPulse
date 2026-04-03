/**
 * WorkPulse API Layer — Firebase-only backend.
 *
 * All data operations go through Firestore, Storage, and Auth.
 * This file re-exports the service modules for convenience.
 */

export * from '../services/attendanceService';
export * from '../services/taskService';
export * from '../services/locationService';
export * from '../services/userService';
