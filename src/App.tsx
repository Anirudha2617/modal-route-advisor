import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import ResearchPaper from "./components/ResearchPaper";
import NewExperiment from "./components/NewExperiment";
import Results from "./components/Results";
import Leaderboard from "./components/Leaderboard";
import NotFound from "./pages/NotFound";
import { Analytics } from "@vercel/analytics/next"

const queryClient = new QueryClient();

const App = () => (
  <>
  {process.env.NODE_ENV === 'production' && <Analytics />}
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="min-h-screen bg-background">
        <BrowserRouter>
          <Header />
          <main className="container py-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/paper" element={<ResearchPaper />} />
              <Route path="/new" element={<NewExperiment />} />
              <Route path="/results" element={<Results />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/calculator" element={<Calculator />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
  </>
);

export default App;
