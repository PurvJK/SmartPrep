import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import StudyMaterials from "./pages/StudyMaterials";
import Quizzes from "./pages/Quizzes";
import CodingPractice from "./pages/CodingPractice";
import InterviewPrep from "./pages/InterviewPrep";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
// DSA Topic Components
import ArrayDataStructure from "./pages/StudyMaterials/DSA/ArrayDataStructure";
import StringDataStructure from "./pages/StudyMaterials/DSA/StringDataStructure";
import HashingDataStructure from "./pages/StudyMaterials/DSA/HashingDataStructure";
import LinkedListDataStructure from "./pages/StudyMaterials/DSA/LinkedListDataStructure";
import StackDataStructure from "./pages/StudyMaterials/DSA/StackDataStructure";
import QueueDataStructure from "./pages/StudyMaterials/DSA/QueueDataStructure";
import TreeDataStructure from "./pages/StudyMaterials/DSA/TreeDataStructure";
import GraphDataStructure from "./pages/StudyMaterials/DSA/GraphDataStructure";
import TrieDataStructure from "./pages/StudyMaterials/DSA/TrieDataStructure";
import CompetitionAnalytics from "./pages/CompetitionAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute requireStudent={true}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/study-materials" element={
              <ProtectedRoute requireStudent={true}>
                <StudyMaterials />
              </ProtectedRoute>
            } />
            {/* DSA Topic Routes */}
            <Route path="/study-materials/dsa/array" element={
              <ProtectedRoute requireStudent={true}>
                <ArrayDataStructure />
              </ProtectedRoute>
            } />
            <Route path="/study-materials/dsa/string" element={
              <ProtectedRoute requireStudent={true}>
                <StringDataStructure />
              </ProtectedRoute>
            } />
            <Route path="/study-materials/dsa/hashing" element={
              <ProtectedRoute requireStudent={true}>
                <HashingDataStructure />
              </ProtectedRoute>
            } />
            <Route path="/study-materials/dsa/linked-list" element={
              <ProtectedRoute requireStudent={true}>
                <LinkedListDataStructure />
              </ProtectedRoute>
            } />
            <Route path="/study-materials/dsa/stack" element={
              <ProtectedRoute requireStudent={true}>
                <StackDataStructure />
              </ProtectedRoute>
            } />
            <Route path="/study-materials/dsa/queue" element={
              <ProtectedRoute requireStudent={true}>
                <QueueDataStructure />
              </ProtectedRoute>
            } />
            <Route path="/study-materials/dsa/tree" element={
              <ProtectedRoute requireStudent={true}>
                <TreeDataStructure />
              </ProtectedRoute>
            } />
            <Route path="/study-materials/dsa/graph" element={
              <ProtectedRoute requireStudent={true}>
                <GraphDataStructure />
              </ProtectedRoute>
            } />
            <Route path="/study-materials/dsa/trie" element={
              <ProtectedRoute requireStudent={true}>
                <TrieDataStructure />
              </ProtectedRoute>
            } />
            <Route path="/quizzes" element={
              <ProtectedRoute requireStudent={true}>
                <Quizzes />
              </ProtectedRoute>
            } />
            <Route path="/coding-practice" element={
              <ProtectedRoute requireStudent={true}>
                <CodingPractice />
              </ProtectedRoute>
            } />
            <Route path="/interview-prep" element={
              <ProtectedRoute requireStudent={true}>
                <InterviewPrep />
              </ProtectedRoute>
            } />
            <Route path="/resume-analyzer" element={
              <ProtectedRoute requireStudent={true}>
                <ResumeAnalyzer />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/admin/content" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/admin/quizzes" element={
              <ProtectedRoute requireAdmin={true} allowFaculty={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/admin/competitions" element={
              <ProtectedRoute requireAdmin={true} allowFaculty={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/admin/results" element={
              <ProtectedRoute requireAdmin={true} allowFaculty={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/admin/competition/:competitionId" element={
              <ProtectedRoute requireAdmin={true} allowFaculty={true}>
                <CompetitionAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/admin/interviews" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/admin/coding" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
