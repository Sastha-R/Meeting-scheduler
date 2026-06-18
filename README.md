# MeetFlow - Meeting Scheduler System

MeetFlow is a browser-based Meeting Scheduler application built for managing company meetings, employee participation, meeting status, and dashboard-level meeting visibility. The project uses a static HTML/CSS/JavaScript frontend with JSON Server as a lightweight REST API backed by `db.json`.

The application supports employee registration, login, role-based meeting management for managers, participant-based meeting visibility, status filtering, soft-deleted meeting recovery, dashboard counts, reminders, and persistent light/dark theme preferences.

## Features

-  User registration and login with client-side validation
-  Logged-in user session stored in `localStorage`
-  Manager-only meeting creation, editing, deletion, and restoration
-  Meeting list filtered to meetings organized by or assigned to the logged-in user
-  Dashboard cards for today's meetings, this week's meetings, and total active meetings
-  Date range filtering with From Date and To Date controls
-  Status filtering for `All`, `Scheduled`, `Completed`, and `Cancelled`
-  Soft delete support with a dedicated Deleted Meetings view
-  Meeting reminder alert for meetings starting within 10 minutes
-  Light/dark theme toggle persisted across pages
-  Responsive UI using Bootstrap and custom CSS
-  SweetAlert2 alerts for success, error, confirmation, and reminder messages

##  Technologies Used

- **HTML5** - Page structure for landing, authentication, registration, and dashboard screens
- **CSS3** - Custom styling, responsive layout, light/dark theme variables
- **JavaScript** - Form validation, authentication flow, dashboard logic, API calls
- **Bootstrap 5** - Responsive grid, navbar, buttons, forms, modal, table, utility classes
- **Bootstrap Icons** - UI icons used across navigation, buttons, stats, and branding
- **jQuery 3.7.1** - Form value handling and submit events on login/register pages
- **SweetAlert2** - User-friendly alerts, confirmations, and reminders
- **JSON Server** - Mock REST API for `users` and `meetings`
- **Google Fonts** - Poppins font is loaded on the dashboard page
- **Local Storage API** - Session, theme, and reminder persistence

##  Folder Structure

```text
Meeting_Scheduler_System/
├── db.json
├── README.md
└── meeting_scheduler/
    ├── assets/
    │   └── Business_Meeting_Lottie_Animation.svg
    ├── js/
    │   ├── dashboard.js
    │   ├── login.js
    │   ├── register.js
    │   └── theme.js
    ├── pages/
    │   ├── dashboard.html
    │   ├── index.html
    │   ├── login.html
    │   └── register.html
    └── styles/
        └── style.css
```

##  Major File Purpose

| File | Purpose |
| --- | --- |
| `db.json` | JSON Server database containing `users` and `meetings` collections. |
| `meeting_scheduler/pages/index.html` | Landing page for MeetFlow with Login, Sign Up, theme toggle, and hero visual. |
| `meeting_scheduler/pages/login.html` | Login form page with email/password fields and validation messages. |
| `meeting_scheduler/pages/register.html` | Employee registration page with department, designation, and joining date fields. |
| `meeting_scheduler/pages/dashboard.html` | Main authenticated dashboard with meeting stats, filters, meeting table, and meeting modal. |
| `meeting_scheduler/styles/style.css` | Central stylesheet for layout, cards, forms, dashboard, responsive design, and theme variables. |
| `meeting_scheduler/js/theme.js` | Handles light/dark theme switching and stores the selected theme in `localStorage`. |
| `meeting_scheduler/js/register.js` | Handles registration validation and posts new users to JSON Server. |
| `meeting_scheduler/js/login.js` | Validates login input, authenticates against JSON Server, and stores logged-in user data. |
| `meeting_scheduler/js/dashboard.js` | Handles protected dashboard access, meeting CRUD, filtering, counts, reminders, and role permissions. |
| `meeting_scheduler/assets/Business_Meeting_Lottie_Animation.svg` | Hero image used on the landing page. |

##  Installation Steps

1. Clone the repository:

```bash
git clone <repository-url>
cd Meeting_Scheduler_System
```

2. Install JSON Server if it is not already available:

```bash
npm install -g json-server
```

You can also run JSON Server with `npx` without a global install:

```bash
npx json-server --watch Json/db.json --port 3000
```


##  How to Run the Project

1. Start the JSON Server API from the project root:

```bash
json-server --watch Json/db.json --port 3000
```

The app expects these endpoints:

```text
http://localhost:3000/users
http://localhost:3000/meetings
```

2. Start a frontend server with `meeting_scheduler` as the web root.

3. Open the landing page:

```text
http://localhost:3000/pages/index.html
```

4. Login with an existing user from `db.json` or register a new account.

Example manager account from the current seed data:

```text
Email: hector@gmail.com
Password: 123456789@hH
Designation: Manager
```

##  Usage Guide

### Register

- Go to `register.html`.
- Enter full name, email, password, confirm password, department, designation, and date of joining.
- Submit the form to create a new user in `db.json`.
- After successful registration, the app redirects to the login page.

### Login

- Go to `login.html`.
- Enter a valid email and password.
- The app checks credentials using JSON Server:

```text
GET /users?email=<email>&password=<password>
```

- On success, basic user details are stored in `localStorage`, and the user is redirected to `dashboard.html`.

### Dashboard

- The dashboard is protected. If `loggedInUser` is missing from `localStorage`, the user is redirected to login.
- The navbar displays the logged-in user's name and designation.
- Meeting counts are calculated from active, non-completed, non-cancelled meetings.
- Users can filter meetings by date range and status.
- The meeting table shows meetings where the logged-in user is either the organizer or a participant.

### Manager Actions

Users with `designation: "Manager"` can:

- Create meetings
- Edit meetings
- Update meeting status
- Soft delete meetings
- View deleted meetings
- Restore deleted meetings

Non-manager users can view only meetings related to them and cannot access meeting action controls.

##  Data Storage Details

### JSON Server Data

Persistent application data is stored in `db.json`.

```json
{
  "users": [],
  "meetings": []
}
```

User records include:

- `id`
- `name`
- `email`
- `password`
- `department`
- `designation`
- `dateOfJoin`

Meeting records include:

- `id`
- `title`
- `description`
- `date`
- `time`
- `duration`
- `room`
- `type`
- `participantIds`
- `organizerId`
- `organizerName`
- `status`
- `isDeleted`

### localStorage

The project uses `localStorage` for client-side persistence:

| Key | Purpose |
| --- | --- |
| `loggedInUser` | Stores logged-in user details used for dashboard access and permissions. |
| `meetflowTheme` | Stores selected theme, either `light` or `dark`. |
| `remindedMeetingIds` | Stores meeting IDs that already triggered a reminder alert. |


##  Main Functionalities

- **Authentication:** Login checks user credentials against the JSON Server `users` collection.
- **Registration:** New employee records are posted to `/users`.
- **Authorization:** Manager permissions are based on `designation === "Manager"`.
- **Meeting Creation:** Managers can create meetings with participants, room, type, date, time, and duration.
- **Meeting Editing:** Managers can edit meeting details and update status.
- **Soft Deletion:** Deleted meetings are marked with `isDeleted: true` instead of being removed from the database.
- **Restoration:** Managers can restore soft-deleted meetings.
- **Filtering:** Dashboard supports date range and status-based filtering.
- **Dashboard Counts:** Counts are calculated for active meetings relevant to the current user.
- **Reminder System:** A SweetAlert reminder appears when a related meeting starts within 10 minutes.
- **Theme Management:** Theme preference is applied across all pages.

## Validation Rules Implemented

### Registration Validation

- Name cannot be empty.
- Email is required and must match a valid email format.
- Password must contain:
  - At least 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character from `@$!%*?&`
- Confirm password must match password.
- Department is required.
- Designation is required.
- Date of joining is required and cannot be in the future.

### Login Validation

- Email must match a valid email format.
- Password must follow the same strength rule used during registration.
- Invalid credentials show an error alert.

### Meeting Validation

- Meeting date cannot be in the past.
- The meeting date input uses the current date as the minimum allowed date.
- Only managers can save, edit, delete, or restore meetings.

##  Project Workflow

1. User opens the landing page.
2. User registers a new employee account or logs in with existing credentials.
3. Successful login stores user details in `localStorage`.
4. Dashboard loads user-specific meeting data from JSON Server.
5. The app applies permissions based on the user's designation.
6. Managers can create and manage meetings.
7. Participants and organizers can view related meetings.
8. Dashboard counts and filters update based on the loaded meeting data.
9. Deleted meetings remain in the database and can be restored by managers.
10. The app refreshes meeting data every 60 seconds and checks for reminders.




