import { NavLink, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { PawPrint } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Bar = styled.header`
  position: fixed;
  inset: 0 0 auto 0;
  height: 76px;
  z-index: 30;
  background: rgba(5, 14, 9, 0.88);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid #1c3428;
`;

const Inner = styled.div`
  width: min(1180px, calc(100% - 32px));
  height: 100%;
  margin: auto;
  display: flex;
  align-items: center;
  gap: 18px;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  font-weight: 900;
  color: #79e99d;
  white-space: nowrap;
`;

const Nav = styled.nav`
  display: flex;
  gap: 5px;
  flex: 1;
  overflow: auto;

  a {
    padding: 9px 10px;
    border-radius: 10px;
    color: #8fa59a;
    font-size: 0.87rem;
    font-weight: 700;
    white-space: nowrap;
    text-decoration: none;
  }

  a.active {
    background: #143121;
    color: #b9f6cd;
  }
`;

const User = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  color: #9cb0a6;
  font-size: 0.82rem;
  white-space: nowrap;
`;

const Out = styled.button`
  background: #1b3026;
  color: #d7e8df;
  border: 0;
  border-radius: 9px;
  padding: 8px 10px;
  cursor: pointer;
`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function salir() {
    await logout();
    navigate("/login");
  }

  const esOperador =
    user && ["OPERADOR", "ADMIN"].includes(user.rol);

  const esValidador =
    user && ["VALIDADOR", "ADMIN"].includes(user.rol);

  const esAuditor =
    user && ["AUDITOR", "ADMIN"].includes(user.rol);

  return (
    <Bar>
      <Inner>
        <Brand>
          <PawPrint size={22} />
          PASA
        </Brand>

        {user ? (
          <>
            <Nav>
              {esOperador && (
                <NavLink to="/registro">
                  Registro
                </NavLink>
              )}

              <NavLink to="/animales">
                Animales
              </NavLink>

              {esOperador && (
                <NavLink to="/evaluaciones">
                  Evaluación
                </NavLink>
              )}

              {esOperador && (
                <NavLink to="/protocolos">
                  Protocolo
                </NavLink>
              )}

              {esValidador && (
                <NavLink to="/validaciones">
                  Validador
                </NavLink>
              )}

              {esAuditor && (
                <NavLink to="/auditoria">
                  Auditoría
                </NavLink>
              )}

              <NavLink to="/adopciones">
                Adoptante
              </NavLink>
            </Nav>

            <User>
              {user.nombre} · {user.rol}

              <Out onClick={salir}>
                Salir
              </Out>
            </User>
          </>
        ) : (
          <Nav>
            <NavLink to="/adopciones">
              Adopciones
            </NavLink>

            <NavLink to="/login">
              Iniciar sesión
            </NavLink>
          </Nav>
        )}
      </Inner>
    </Bar>
  );
}