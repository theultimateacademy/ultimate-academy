import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoadingSpinner from './components/UI/LoadingSpinner'
import AthleteLayout from './components/Layout/AthleteLayout'
import AdminLayout   from './components/Layout/AdminLayout'
import CookieBanner  from './components/UI/CookieBanner'
import ScrollToTop   from './components/ScrollToTop'

// Pages
import Landing        from './pages/Landing'
import Login          from './pages/auth/Login'
import Register       from './pages/auth/Register'
import ResetPassword  from './pages/auth/ResetPassword'
import Blog           from './pages/Blog'
import BlogArticle    from './pages/BlogArticle'
import CheckoutSuccess from './pages/auth/CheckoutSuccess'
import ProfileWizard  from './pages/onboarding/ProfileWizard'
import Privacy        from './pages/legal/Privacy'
import Terms          from './pages/legal/Terms'
import Cookies        from './pages/legal/Cookies'
import Calculator     from './pages/Calculator'
import Ebooks         from './pages/Ebooks'
import EbookDetail    from './pages/EbookDetail'
import EbookMerci     from './pages/EbookMerci'
import VMACalculator  from './pages/calculators/VMA'
import AlluresCalculator from './pages/calculators/Allures'
import PredictorCalculator from './pages/calculators/Predictor'
import VO2maxCalculator    from './pages/calculators/VO2max'

import AthleteHome         from './pages/athlete/Home'
import AthletePlan         from './pages/athlete/Plan'
import AthleteStrength     from './pages/athlete/Strength'
import AthleteNutrition    from './pages/athlete/Nutrition'
import AthleteMessages     from './pages/athlete/Messages'
import AthleteProfile      from './pages/athlete/Profile'
import AthleticDrills      from './pages/athlete/Drills'
import PreRaceAnalysis     from './pages/athlete/PreRaceAnalysis'
import PostRaceFlow        from './pages/athlete/PostRaceFlow'

import DevLogin        from './pages/DevLogin'
import AdminEbooks          from './pages/admin/Ebooks'
import AdminDashboard       from './pages/admin/Dashboard'
import AdminAthletes        from './pages/admin/Athletes'
import AdminPlans           from './pages/admin/Plans'
import AdminAnalyses        from './pages/admin/Analyses'
import AdminMessaging       from './pages/admin/Messaging'
import AdminSessionLibrary  from './pages/admin/SessionLibrary'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <LoadingSpinner fullPage />
  if (!user)   return <Navigate to="/login" state={{ from: loc }} replace />
  return children
}

function RequireActive({ children }) {
  const { user, profile, loading } = useAuth()
  const loc = useLocation()
  if (loading)  return <LoadingSpinner fullPage />
  if (!user)    return <Navigate to="/login" state={{ from: loc }} replace />
  if (profile?.role === 'coach') return <Navigate to="/admin" replace />
  if (!['active', 'trialing'].includes(profile?.subscription_status))
    return <Navigate to="/welcome" replace />
  if (!profile?.profile_completed)
    return <Navigate to="/onboarding" replace />
  return children
}

function RequireCoach({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading)                    return <LoadingSpinner fullPage />
  if (!user || profile?.role !== 'coach')
    return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"           element={<Landing />} />
      <Route path="/blog"            element={<Blog />} />
      <Route path="/blog/:slug"     element={<BlogArticle />} />
      <Route path="/login"          element={<Login />} />
      <Route path="/register"       element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dev-login" element={<DevLogin />} />
      <Route path="/welcome"  element={<RequireAuth><CheckoutSuccess /></RequireAuth>} />
      <Route path="/onboarding" element={<RequireAuth><ProfileWizard /></RequireAuth>} />
      <Route path="/privacy"      element={<Privacy />} />
      <Route path="/terms"        element={<Terms />} />
      <Route path="/cookies"      element={<Cookies />} />
      <Route path="/ebooks"           element={<Ebooks />} />
      <Route path="/ebooks/merci"     element={<EbookMerci />} />
      <Route path="/ebooks/:slug"     element={<EbookDetail />} />
      <Route path="/calculateur"             element={<Calculator />} />
      <Route path="/calculateur/vma"         element={<VMACalculator />} />
      <Route path="/calculateur/allures"     element={<AlluresCalculator />} />
      <Route path="/calculateur/predicteur"  element={<PredictorCalculator />} />
      <Route path="/calculateur/vo2max"      element={<VO2maxCalculator />} />

      <Route path="/app" element={<RequireActive><AthleteLayout /></RequireActive>}>
        <Route index element={<Navigate to="/app/home" replace />} />
        <Route path="home"       element={<AthleteHome />} />
        <Route path="plan"       element={<AthletePlan />} />
        <Route path="strength"   element={<AthleteStrength />} />
        <Route path="nutrition"  element={<AthleteNutrition />} />
        <Route path="messages"   element={<AthleteMessages />} />
        <Route path="drills"     element={<AthleticDrills />} />
        <Route path="profile"    element={<AthleteProfile />} />
        <Route path="pre-race"   element={<PreRaceAnalysis />} />
        <Route path="post-race"  element={<PostRaceFlow />} />
      </Route>

      <Route path="/admin" element={<RequireCoach><AdminLayout /></RequireCoach>}>
        <Route index            element={<AdminDashboard />} />
        <Route path="athletes"  element={<AdminAthletes />} />
        <Route path="plans"     element={<AdminPlans />} />
        <Route path="analyses"  element={<AdminAnalyses />} />
        <Route path="messages"  element={<AdminMessaging />} />
        <Route path="ebooks"    element={<AdminEbooks />} />
        <Route path="sessions"  element={<AdminSessionLibrary />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <AppRoutes />
        <CookieBanner />
      </AuthProvider>
    </BrowserRouter>
  )
}
