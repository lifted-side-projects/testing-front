import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { isAuthenticated, isOnboarded, isDiagnosticDone } from './lib/auth'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider, ToastContainer } from './components/toast'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DiagnosticPage } from './pages/DiagnosticPage'
import { DiagnosticResultPage } from './pages/DiagnosticResultPage'
import { DashboardPage } from './pages/DashboardPage'
import { KnowledgeMapPage } from './pages/KnowledgeMapPage'
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage'
import { LessonPage } from './pages/LessonPage'
import { PresentationPage } from './pages/PresentationPage'
import { QuizPage } from './pages/QuizPage'
import { QuizResultPage } from './pages/QuizResultPage'
import { ProfilePage } from './pages/ProfilePage'
import { LearningPlanPage } from './pages/LearningPlanPage'
import { ChatPage } from './pages/ChatPage'
import { FlashcardPage } from './pages/FlashcardPage'
import { ReviewPage } from './pages/ReviewPage'
import { PeriodicTablePage } from './pages/PeriodicTablePage'
import { LeaderboardPage } from './pages/LeaderboardPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  if (!isOnboarded()) return <Navigate to="/onboarding" replace />
  if (!isDiagnosticDone()) return <Navigate to="/diagnostic" replace />
  return <>{children}</>
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <div className="grain">
          <ErrorBoundary>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/onboarding" element={<AuthRoute><OnboardingPage /></AuthRoute>} />
                <Route path="/diagnostic" element={<AuthRoute><DiagnosticPage /></AuthRoute>} />
                <Route path="/diagnostic/result/:sessionId" element={<AuthRoute><DiagnosticResultPage /></AuthRoute>} />
                <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/knowledge-map" element={<ProtectedRoute><KnowledgeMapPage /></ProtectedRoute>} />
                <Route path="/knowledge-graph" element={<ProtectedRoute><KnowledgeGraphPage /></ProtectedRoute>} />
                <Route path="/lesson/:topicId" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
                <Route path="/presentation/:topicId" element={<ProtectedRoute><PresentationPage /></ProtectedRoute>} />
                <Route path="/chat/:topicId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/quiz/:topicId" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
                <Route path="/quiz/:sessionId/result" element={<ProtectedRoute><QuizResultPage /></ProtectedRoute>} />
                <Route path="/flashcards/:topicId" element={<ProtectedRoute><FlashcardPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/review" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
                <Route path="/periodic-table" element={<ProtectedRoute><PeriodicTablePage /></ProtectedRoute>} />
                <Route path="/plan" element={<ProtectedRoute><LearningPlanPage /></ProtectedRoute>} />
                <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
          </BrowserRouter>
        </ErrorBoundary>
        <ToastContainer />
      </div>
    </ToastProvider>
    </QueryClientProvider>
  )
}
