import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import { Page } from "./styles/ui";

import LoginPage from "./pages/LoginPage";

import RegistroPage from "./pages/RegistroPage";

import AnimalesPage from "./pages/AnimalesPage";
import AnimalPage from "./pages/AnimalPage";

import EvaluacionesPage from "./pages/EvaluacionesPage";
import EvaluacionPage from "./pages/EvaluacionPage";

import ProtocolosPage from "./pages/ProtocolosPage";
import ProtocoloPage from "./pages/ProtocoloPage";

import ValidacionesPage from "./pages/ValidacionesPage";
import AuditoriaPage from "./pages/AuditoriaPage";

import CatalogoPage from "./pages/CatalogoPage";
import AnimalPublicoPage from "./pages/AnimalPublicoPage";

export default function App() {
  return (
    <Page>
      <Navbar />

      <Routes>

        {/* PÚBLICO */}

        <Route
          path="/"
          element={
            <Navigate
              to="/adopciones"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/adopciones"
          element={<CatalogoPage />}
        />

        <Route
          path="/adopciones/:id"
          element={<AnimalPublicoPage />}
        />

        {/* REGISTRO */}

        <Route
          path="/registro"
          element={
            <ProtectedRoute
              roles={["OPERADOR", "ADMIN"]}
            >
              <RegistroPage />
            </ProtectedRoute>
          }
        />

        {/* ANIMALES */}

        <Route
          path="/animales"
          element={
            <ProtectedRoute>
              <AnimalesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/animales/:id"
          element={
            <ProtectedRoute>
              <AnimalPage />
            </ProtectedRoute>
          }
        />

        {/* EVALUACIONES */}

        <Route
          path="/evaluaciones"
          element={
            <ProtectedRoute
              roles={["OPERADOR", "ADMIN"]}
            >
              <EvaluacionesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/animales/:id/evaluacion"
          element={
            <ProtectedRoute
              roles={["OPERADOR", "ADMIN"]}
            >
              <EvaluacionPage />
            </ProtectedRoute>
          }
        />

        {/* PROTOCOLOS */}

        <Route
          path="/protocolos"
          element={
            <ProtectedRoute
              roles={["OPERADOR", "ADMIN"]}
            >
              <ProtocolosPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/animales/:id/protocolo"
          element={
            <ProtectedRoute
              roles={["OPERADOR", "ADMIN"]}
            >
              <ProtocoloPage />
            </ProtectedRoute>
          }
        />

        {/* VALIDACIONES */}

        <Route
          path="/validaciones"
          element={
            <ProtectedRoute
              roles={["VALIDADOR", "ADMIN"]}
            >
              <ValidacionesPage />
            </ProtectedRoute>
          }
        />

        {/* AUDITORÍA */}

        <Route
          path="/auditoria"
          element={
            <ProtectedRoute
              roles={["AUDITOR", "ADMIN"]}
            >
              <AuditoriaPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </Page>
  );
}