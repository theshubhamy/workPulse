# workPulse - Field Tracking SaaS - Project Documentation

## 1. Overview

Field Tracking SaaS is a multi-tenant platform that enables businesses to monitor field employees, manage attendance, assign tasks, and track real-time location via a mobile app and web dashboard.

---

## 2. Objectives

* Track employee attendance (check-in/check-out)
* Monitor real-time location of field employees
* Assign and manage tasks
* Provide analytics for productivity
* Enable businesses to manage distributed workforce efficiently

---

## 3. Target Users

* Small & medium businesses
* Delivery services
* Sales teams
* Maintenance/service providers

---

## 4. Product Components

### 4.1 Mobile App (React Native)

Features:

* OTP Login
* Check-in / Check-out
* GPS Tracking
* Task Management
* Photo Upload (proof of work)

---

### 4.2 Web Dashboard (Next.js)

Features:

* Admin login
* Employee management
* Attendance reports
* Task assignment
* Live map tracking

---

## 5. System Architecture

* Frontend: React Native (App), Next.js (Dashboard)
* Backend: Node.js / Next.js API Routes
* Database: MongoDB
* Queue: Redis
* Notifications: Firebase

---

## 6. Database Schema

### Users

* id
* name
* phone
* role (admin/employee)
* companyId

### Companies

* id
* name
* plan

### Attendance

* userId
* checkIn (time, location)
* checkOut (time, location)

### Tasks

* title
* assignedTo
* status
* proofImage
* location

### Location Logs

* userId
* lat
* lng
* timestamp

---

## 7. API Design

### Auth

* POST /auth/send-otp
* POST /auth/verify-otp

### Attendance

* POST /check-in
* POST /check-out

### Location

* POST /location/update

### Tasks

* GET /tasks
* POST /tasks
* PATCH /tasks/:id

### Admin

* GET /employees
* GET /attendance
* GET /locations

---

## 8. Core Workflows

### Employee Flow

1. Login via OTP
2. Check-in
3. Location tracking starts
4. Complete assigned tasks
5. Check-out

### Admin Flow

1. Login to dashboard
2. Add employees
3. Assign tasks
4. Monitor attendance & location

---

## 9. Real-Time Tracking

* Use polling (10–30 seconds) or WebSockets
* Location updates sent periodically (5–10 minutes)

---

## 10. Security Considerations

* JWT authentication
* Role-based access control
* Secure API endpoints

---

## 11. Deployment

* Frontend: Vercel
* Backend: Railway / AWS
* Database: MongoDB Atlas
* Redis: Upstash

---

## 12. Pricing Model

* Free: up to 3 employees
* Basic: ₹999/month
* Pro: ₹2999/month

---

## 13. Roadmap

### Phase 1 (MVP)

* Auth
* Attendance
* Location tracking

### Phase 2

* Task management
* Notifications

### Phase 3

* Analytics dashboard
* Reports

---

## 14. Future Enhancements

* Geofencing
* Offline mode
* Payroll integration
* AI insights

---

## 15. Success Metrics

* Daily active users
* Retention rate
* Monthly recurring revenue
* Customer acquisition rate

---

## 16. Conclusion

This SaaS product focuses on solving real-world problems for businesses managing field employees. A lean MVP approach with rapid iteration and customer feedback will ensure early traction and scalability.