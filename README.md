# WorkPulse - Field Tracking SaaS

WorkPulse is a multi-tenant platform designed for businesses to monitor field employees, manage attendance, assign tasks, and track real-time locations via a mobile app and web dashboard.

---

## 🚀 Features

### **Mobile App (React Native)**
- **OTP Login**: Secure authentication using phone numbers.
- **Check-in / Check-out**: Log attendance with precise location and timestamps.
- **GPS Tracking**: Real-time monitoring of field personnel.
- **Task Management**: Receive, view, and update task statuses.
- **Photo Upload**: Attach images as proof of work.

### **Web Dashboard (Next.js)**
- **Admin Management**: Oversee employees, companies, and workflows.
- **Attendance Reports**: Generate detailed logs of employee presence.
- **Live Map Tracking**: Visualize the real-time distribution of your workforce.
- **Task Assignment**: Delegate jobs efficiently from a central hub.

---

## 🛠️ Tech Stack

- **Mobile**: React Native (TypeScript)
- **Dashboard**: Next.js
- **Backend API**: Node.js / Next.js API Routes
- **Database**: MongoDB
- **Real-Time/Queue**: Redis (Upstash)
- **Auth & Notifications**: Firebase (Authentication & Cloud Messaging)
- **Deployment**: Vercel (Frontend), Railway/AWS (Backend), MongoDB Atlas (Database)

---

## 📦 Getting Started

### **Prerequisites**
- Node.js (>= 22.11.0)
- Watchman
- React Native CLI
- CocoaPods (for iOS)
- Android Studio / Xcode

### **Installation**
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd workPulse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install iOS dependencies (macOS only):**
   ```bash
   cd ios && pod install && cd ..
   ```

### **Running the App**
- **Android:**
  ```bash
  npm run android
  ```
- **iOS:**
  ```bash
  npm run ios
  ```

---

## 🔧 Configuration (Firebase Setup)

To enable authentication and notifications, follow these steps:

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. **Android Setup**:
   - Add an Android app with the package name `com.workpulse`.
   - Download `google-services.json` and place it in `android/app/`.
3. **iOS Setup**:
   - Add an iOS app with the bundle ID `com.workpulse`.
   - Download `GoogleService-Info.plist` and place it in `ios/`.
4. Install native pods: `cd ios && pod install`.

---

## 🗂️ Project Structure

```text
├── android/          # Android native code
├── ios/              # iOS native code
├── src/
│   ├── api/          # API integration
│   ├── components/   # Reusable UI components
│   ├── screens/      # Application screens
│   ├── utils/        # Helper functions
│   └── store/        # State management
├── App.tsx           # Entry point
└── index.js
```

---

## 🛣️ Roadmap

- [ ] Phase 1: Auth & Core Attendance Tracking
- [ ] Phase 2: Task Management & Notifications
- [ ] Phase 3: Advanced Analytics & Reporting

---

## 🤝 Contributing
Contributions are welcome! Please read the contributing guidelines before submitting a PR.
