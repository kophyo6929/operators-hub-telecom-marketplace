import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthSuccess from "./pages/AuthSuccess";
import Premium from "./pages/Premium";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AdminSetup from "./pages/AdminSetup";
import QuickAdminSetup from "./pages/QuickAdminSetup";
import NotFound from "./pages/NotFound";
import FAQ from "./pages/FAQ";
import SupabaseTest from "./components/SupabaseTest";
import ErrorBoundary from "./components/ErrorBoundary";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "./components/LoadingSpinner";

// Create QueryClient with better error handling and retry logic
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
        toast({
          title: "Something went wrong",
          description: error instanceof Error ? error.message : "Please try again later",
          variant: "destructive"
        });
      }
    }
  }
});

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Index />} />
              <Route path="/browse" element={<Index />} />
              <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
              <Route path="/onauthsuccess" element={<AuthSuccess />} />
              <Route path="/test-supabase" element={<SupabaseTest />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" replace />} />
              <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" replace />} />
              <Route path="/admin" element={user ? <Admin /> : <Navigate to="/auth" replace />} />
              <Route path="/admin-setup" element={<AdminSetup />} />
              <Route path="/quick-admin-setup" element={<QuickAdminSetup />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/help" element={<FAQ />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};



export default App;