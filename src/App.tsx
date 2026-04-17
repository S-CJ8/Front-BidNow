import { useState } from "react";
import { AuctionGrid } from "./components/AuctionGrid";
import { DashboardPage } from "./components/DashboardPage";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { LoginPage } from "./components/LoginPage";
import { NormalizedUser } from "./services/usersApi";

export default function App() {
  const [view, setView] = useState<"home" | "login" | "dashboard">("home");
  const [currentUser, setCurrentUser] = useState<NormalizedUser | null>(null);

  if (view === "login") {
    return (
      <LoginPage
        onSuccess={(user) => {
          setCurrentUser(user);
          setView("dashboard");
        }}
        onBackHome={() => setView("home")}
      />
    );
  }

  if (view === "dashboard" && currentUser) {
    return (
      <DashboardPage
        user={currentUser}
        onLogout={() => {
          setCurrentUser(null);
          setView("home");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header
        loggedIn={Boolean(currentUser)}
        userName={currentUser?.name}
        onLoginClick={() => setView("login")}
        onLogout={() => {
          setCurrentUser(null);
          setView("home");
        }}
      />
      <main>
        <Hero />
        <AuctionGrid />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
