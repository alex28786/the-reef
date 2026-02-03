import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './features/auth'
import { LoginPage } from './features/auth/LoginPage'
import { ProtectedRoute } from './app/routes/ProtectedRoute'
import { HomePage } from './app/pages/HomePage'
import { BridgePage } from './features/bridge/pages/BridgePage'
import { RetroPage } from './features/retro/pages/RetroPage'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/bridge/*" element={<BridgePage />} />
            <Route path="/retro/*" element={<RetroPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
