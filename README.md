# CampusConnect

CampusConnect is a full-stack web application designed to centralize the management and display of inter-college events, catering to both College Administrators and Students.

## 🚀 Features

### For Students
*   **Dynamic Dashboard**: Browse and filter events, symposiums, workshops, and sports by category or search term.
*   **One-Click Apply**: Easily view event details, the organizing college, and submit applications directly with optional notes.
*   **Comprehensive Profile**: Manage personal and academic details, including Age, Gender, College Address, and Department.
*   **Certificate & ID Uploads**: Securely upload student ID cards (front & back) and upload PDF event certificates directly to your profile.
*   **Shareable Link**: Quickly share your profile or event information using the native Web Share API.
*   **Theme Toggle**: Seamlessly switch between beautiful Light and Dark modes.

### For Colleges
*   **Event Management**: Post new events with details like categories, entry fees, locations, and instructional videos.
*   **Application Tracking**: Manage student event applications.

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), React Router DOM, Axios, Lucide-React (Icons)
*   **Styling**: Custom CSS with Glassmorphism, Theme Variables (Dark/Light Mode)
*   **Backend**: Node.js, Express.js
*   **Database**: MongoDB, Mongoose
*   **Authentication**: JWT (JSON Web Tokens), bcryptjs
*   **File Uploads**: Multer (for images and PDF certificates)

## ⚙️ Local Setup Instructions

### 1. Prerequisites
*   [Node.js](https://nodejs.org/) installed
*   [MongoDB Community Server](https://www.mongodb.com/try/download/community) installed and running locally on port `27017`

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/campusconnect.git
cd campusconnect
```

### 3. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory (DO NOT commit this file) and add:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/campusconnect-overhaul
   JWT_SECRET=your_super_secret_jwt_key
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

### 4. Frontend Setup
1. Open a *new* terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.
