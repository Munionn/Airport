# Airport Management System - Frontend

A modern React frontend for the Airport Management System built with TypeScript, Redux Toolkit, and Tailwind CSS.

## 🚀 Tech Stack

- **React 18** with TypeScript
- **Redux Toolkit** for state management
- **React Router v6** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Hook Form** for forms
- **Recharts** for analytics
- **date-fns** for date handling
- **Lucide React** for icons
- **Vite** for build tooling

## 📁 Project Structure

```
src/
├── api/              # API client & endpoints
│   ├── client.ts     # Axios configuration
│   ├── flightsApi.ts # Flight-related API calls
│   ├── ticketsApi.ts # Ticket-related API calls
│   ├── passengersApi.ts # Passenger-related API calls
│   ├── usersApi.ts   # User management API calls
│   ├── airportsApi.ts # Airport & city API calls
│   ├── analyticsApi.ts # Analytics API calls
│   └── authApi.ts    # Authentication API calls
├── app/              # Redux store setup
│   ├── store.ts      # Redux store configuration
│   ├── hooks.ts      # Typed Redux hooks
│   └── uiSlice.ts    # UI state management
├── components/        # Reusable UI components
│   ├── ui/           # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── Loading.tsx
│   │   └── Table.tsx
│   └── ProtectedRoute.tsx
├── features/         # Feature-based modules
│   ├── auth/         # Authentication
│   │   └── authSlice.ts
│   ├── flights/      # Flight management
│   │   └── flightsSlice.ts
│   └── tickets/      # Ticket management
│       └── ticketsSlice.ts
├── layouts/          # Layout components
│   ├── PublicLayout.tsx
│   ├── UserLayout.tsx
│   └── AdminLayout.tsx
├── pages/            # Page components
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── FlightSearchPage.tsx
│   ├── FlightDetailsPage.tsx
│   ├── BookingPage.tsx
│   ├── MyTicketsPage.tsx
│   ├── CheckInPage.tsx
│   ├── ProfilePage.tsx
│   └── admin/        # Admin pages
│       ├── AdminDashboard.tsx
│       ├── AdminFlightsPage.tsx
│       ├── AdminAircraftPage.tsx
│       ├── AdminPassengersPage.tsx
│       ├── AdminAnalyticsPage.tsx
│       └── AdminUsersPage.tsx
├── types/            # TypeScript types
│   └── index.ts      # All type definitions
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## 🎯 Features Implemented

### ✅ Core Infrastructure
- [x] Project setup with Vite + TypeScript
- [x] Redux Toolkit store configuration
- [x] API client with Axios
- [x] TypeScript types mirroring backend DTOs
- [x] Tailwind CSS configuration
- [x] React Router setup

### ✅ UI Components
- [x] Button component with variants
- [x] Input component with validation
- [x] Select component
- [x] Card components (Card, CardHeader, CardTitle, etc.)
- [x] Modal component
- [x] StatusBadge component
- [x] Loading components (Spinner, Skeleton, ErrorMessage)
- [x] Table components with sorting

### ✅ Layouts & Navigation
- [x] PublicLayout for unauthenticated users
- [x] UserLayout for passenger users
- [x] AdminLayout for admin users
- [x] Protected routes with role-based access
- [x] Responsive navigation

### ✅ Authentication
- [x] Login page with form validation
- [x] Mock authentication API
- [x] Redux auth slice
- [x] Token storage and management
- [x] Role-based route protection

### ✅ Basic Pages
- [x] Home page with flight search form
- [x] Login page
- [x] Placeholder pages for all routes
- [x] Admin dashboard with metrics cards

## 🚧 Next Steps

### 🔄 In Progress
- [ ] Flight search functionality
- [ ] Booking flow implementation
- [ ] User dashboard features
- [ ] Admin flight management
- [ ] Analytics dashboard

### 📋 Pending Features

#### Passenger Features
- [ ] Flight search with filters
- [ ] Flight results display
- [ ] Flight details page
- [ ] Multi-step booking process
- [ ] Seat selection
- [ ] Payment integration (mock)
- [ ] My tickets page
- [ ] Check-in functionality
- [ ] Profile management

#### Admin Features
- [ ] Flight management CRUD
- [ ] Aircraft management
- [ ] Passenger management
- [ ] User management
- [ ] Analytics dashboard with charts
- [ ] Real-time flight status updates
- [ ] Reporting features

#### Technical Improvements
- [ ] Error boundaries
- [ ] Loading states optimization
- [ ] Responsive design improvements
- [ ] Accessibility enhancements
- [ ] Performance optimization
- [ ] Testing setup

## 🛠️ Development

### Prerequisites
- Node.js 18+
- pnpm package manager

### Installation
```bash
cd client
pnpm install
```

### Development Server
```bash
pnpm dev
```

### Build
```bash
pnpm build
```

### Preview
```bash
pnpm preview
```

## 🔧 Configuration

### Environment Variables
Create `.env` file:
```
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=Airport Management System
VITE_APP_VERSION=1.0.0
```

### API Integration
The frontend is configured to work with the NestJS backend running on `localhost:3000`. The API client includes:
- Session-based authentication (no JWT tokens)
- Request/response interceptors
- Error handling
- Type-safe API calls

**Note**: This frontend uses password-based authentication without JWT tokens. The backend should handle password comparison and return user data directly.

## 🎨 Design System

### Colors
- Primary: Blue shades (aviation theme)
- Status colors: Green (success), Red (error), Yellow (warning), Blue (info)
- Neutral: Gray scale for text and backgrounds

### Components
All components follow a consistent design system with:
- Proper spacing and typography
- Hover and focus states
- Loading states
- Error states
- Responsive design

## 📱 Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Responsive navigation
- Adaptive layouts

## 🔐 Authentication Flow
1. User logs in with email/password
2. Backend validates credentials and returns user data
3. User data stored in localStorage (session-based)
4. User redirected based on role (admin/user)
5. Protected routes check authentication state
6. Session persists until logout or browser close

## 🚀 Getting Started

1. **Start the backend server** (NestJS on port 3000)
2. **Install dependencies**: `pnpm install`
3. **Start development server**: `pnpm dev`
4. **Open browser**: Navigate to `http://localhost:5173`
5. **Login**: Use any email/password (mock authentication)

## 📊 Current Status

The frontend is now functional with:
- ✅ Complete project setup
- ✅ Working authentication system
- ✅ Responsive layouts
- ✅ Basic navigation
- ✅ UI component library
- ✅ Redux state management
- ✅ API integration layer

**Ready for feature development!** 🎉