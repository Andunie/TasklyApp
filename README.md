# TasklyApp

**TasklyApp is a modern, AI-powered task management and team collaboration platform designed to streamline workflows and boost productivity. Built with a robust backend using .NET 8 and a dynamic frontend with React, TasklyApp offers real-time updates, intelligent insights, and seamless integration with collaboration tools.**

---

## 🚀 Core Features

TasklyApp is more than just a to-do list. It's a comprehensive suite of tools designed for both individual users and teams.

*   **Projects & Tasks Management:** Create projects, define tasks with priorities, set due dates, and assign them to team members. Visualize your workflow with intuitive Kanban boards and lists.
*   **Real-time Collaboration:** Powered by **SignalR**, the application provides instant updates. Add comments, attach files to activities, and get real-time notifications without ever hitting the refresh button.
*   **Intelligent Dashboard:** A comprehensive dashboard for team leaders to monitor project health, track task completion rates, analyze team velocity, and identify potential bottlenecks at a glance.
*   **Interactive Calendar:** A full-featured calendar to visualize deadlines and plan workloads. Tasks are automatically synced and displayed for a clear overview of the team's schedule.
*   **Integrated Video Meetings:** Launch embedded video meetings directly from the app using **Jitsi Meet**. Create instant meeting rooms and invite team members without leaving TasklyApp.
*   **AI-Powered Assistant (Gemini AI):**
    *   **Calendar Summary:** Get intelligent, natural-language summaries of your team's weekly schedule.
    *   **Interactive Q&A:** Ask questions about your tasks and projects in plain English, such as "Who is the busiest this week?" or "List all overdue tasks."
*   **Notifications System:** A real-time notification system that keeps users informed about mentions, task assignments, and meeting invitations.

---

## 🛠️ Tech Stack

This project is a demonstration of modern full-stack development practices, utilizing a powerful and scalable technology stack.

### Backend
*   **Framework:** .NET 8
*   **API:** ASP.NET Core Web API
*   **Database:** Entity Framework Core with a relational database (e.g., MySQL(used) SQL Server, PostgreSQL)
*   **Authentication:** ASP.NET Core Identity with JWT
*   **Real-time:** SignalR
*   **AI Integration:** Google Gemini API & Groq API

### Frontend
*   **Framework:** React 18
*   **UI Library:** Material-UI (MUI)
*   **State Management:** React Context API
*   **Routing:** React Router
*   **API Communication:** Axios
*   **Video Conferencing:** Jitsi Meet React SDK

---

## Getting Started

Instructions on how to get a local copy up and running.

### Prerequisites

*   .NET 8 SDK
*   Node.js and npm
*   A relational database (e.g., MySQL, SQL Server)
*   Google Gemini API Key
*   Jitsi Meet is used for video conferencing (no setup required for the free version).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/TasklyApp.git
    cd TasklyApp
    ```

2.  **Backend Setup:**
    *   Navigate to the backend project directory.
    *   Update `appsettings.json` with your database connection string and Gemini API Key.
    *   Run database migrations: `dotnet ef database update`
    *   Run the backend: `dotnet run`

3.  **Frontend Setup:**
    *   Navigate to the React project directory (`cd taskly-react`).
    *   Install dependencies: `npm install`
    *   Start the development server: `npm start`

The application should now be running, with the frontend at `http://localhost:3000` and the backend at `https://localhost:7008`.

---

##  Roadmap & Future Features

TasklyApp is an evolving project. Here are some of the features planned for the future:

-   [ ] **Recurring Tasks:** Automate the creation of repetitive tasks.
-   [ ] **Gantt Chart View:** Visualize project timelines and dependencies.
-   [ ] **Advanced Reporting:** Generate and export custom project reports.
-   [ ] **Third-Party Integrations:** Connect with tools like GitHub, Slack, and Google Drive.

---

## License

This project is licensed under the MIT License - see the `LICENSE.md` file for details.
