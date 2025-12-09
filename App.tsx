import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { View, User, Reminder } from "./types";
import { Login } from "./pages/Login";
import { Admin } from "./pages/Admin";
import { Profile } from "./pages/Profile";
import { Calendar } from "./pages/Calendar";
import { Materials } from "./pages/Materials";
import { Courses } from "./pages/Courses";
import { CourseStudents } from "./pages/CourseStudents";
import { CourseDetails } from "./pages/CourseDetails";
import { CourseRoom } from "./pages/CourseRoom";
import { About } from "./pages/About";
import { API_URL } from "./constants";

const USER_STORAGE_KEY = "gpt_courses_user";

const App: React.FC = () => {
  // Initialize user from localStorage if available
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from storage", error);
      return null;
    }
  });

  const [currentView, setCurrentView] = useState<View>(View.CALENDAR);

  // Sidebar State:
  // On Desktop: true = collapsed (small), false = expanded
  // On Mobile: true = hidden (closed), false = visible (open)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Check screen size to set initial state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true); // Default hidden on mobile
      } else {
        setIsSidebarCollapsed(false); // Default open on desktop
      }
    };

    // Set initial
    if (window.innerWidth < 768) setIsSidebarCollapsed(true);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Navigation State
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Lifted State for Reminders
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(false);

  // Persist User State to LocalStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setCurrentUser(null);
    setCurrentView(View.CALENDAR); // Reset view on logout
  };

  // Fetch reminders logic
  const fetchReminders = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/reminders/НА/1`);
      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      } else {
        console.error("Failed to fetch reminders:", response.statusText);
      }
    } catch (error) {
      console.error("Error connecting to server:", error);
    }
  }, []);

  // Fetch user settings (Group) on login/load
  useEffect(() => {
    const fetchSettings = async () => {
      if (currentUser && !currentUser.groupId) {
        try {
          const res = await fetch(
            `${API_URL}/api/settings/${currentUser.username}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.groupId) {
              // This update will trigger the persistence effect above
              setCurrentUser((prev) =>
                prev ? { ...prev, groupId: data.groupId } : null
              );
            }
          }
        } catch (e) {
          console.error("Failed to load user settings", e);
        }
      }
    };
    fetchSettings();
  }, [currentUser?.username]);

  // Initial fetch on login and polling
  useEffect(() => {
    if (currentUser) {
      setIsLoadingReminders(true);
      fetchReminders().finally(() => setIsLoadingReminders(false));

      const interval = setInterval(() => {
        fetchReminders();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [currentUser, fetchReminders]);

  const handleAddReminder = (newReminder: Reminder) => {
    setReminders((prev) => [newReminder, ...prev]);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...updatedUser } : null));
  };

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case View.CALENDAR:
        return (
          <Calendar
            reminders={reminders}
            isLoading={isLoadingReminders}
            user={currentUser}
            onAddLocalReminder={handleAddReminder}
            onDeleteLocalReminder={handleDeleteReminder}
          />
        );
      case View.MATERIALS:
        return <Materials />;
      case View.COURSES:
        return (
          <Courses
            onNavigate={setCurrentView}
            user={currentUser}
            onCourseSelect={handleCourseSelect}
          />
        );
      case View.COURSE_DETAILS:
        if (!selectedCourseId)
          return (
            <Courses
              onNavigate={setCurrentView}
              user={currentUser}
              onCourseSelect={handleCourseSelect}
            />
          );
        return (
          <CourseDetails
            courseId={selectedCourseId}
            user={currentUser}
            onBack={() => setCurrentView(View.COURSES)}
          />
        );
      case View.COURSE_ROOM:
        if (!selectedCourseId)
          return (
            <Courses
              onNavigate={setCurrentView}
              user={currentUser}
              onCourseSelect={handleCourseSelect}
            />
          );
        return (
          <CourseRoom
            courseId={selectedCourseId}
            user={currentUser}
            onBack={() => setCurrentView(View.COURSES)}
          />
        );
      case View.COURSE_STUDENTS:
        return <CourseStudents onBack={() => setCurrentView(View.COURSES)} />;
      case View.ADMIN:
        return <Admin />;
      case View.PROFILE:
        return <Profile user={currentUser} onUpdateUser={handleUpdateUser} />;
      case View.ABOUT:
        return <About />;
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col w-full mx-auto overflow-hidden h-screen bg-[#e0f2fe]">
      <Header
        user={currentUser}
        onLogout={handleLogout}
        onProfileClick={() => setCurrentView(View.PROFILE)}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      <div className="flex-1 flex px-2 pb-2 md:px-4 md:pb-4 gap-4 overflow-hidden relative">
        {/* Mobile Overlay for Sidebar */}
        {!isSidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}

        <Sidebar
          currentView={currentView}
          role={currentUser.role}
          onChangeView={setCurrentView}
          isCollapsed={isSidebarCollapsed}
          onCloseMobile={() => setIsSidebarCollapsed(true)}
        />

        <main className="flex-1 overflow-hidden relative w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
