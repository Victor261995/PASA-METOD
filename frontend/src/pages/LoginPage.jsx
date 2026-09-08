import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Container, ErrorBox, Field, Panel, Subtitle, Title } from "../styles/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("operador@pasa.local");
  const [password, setPassword] = useState("pasa123");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await login(email, password);
      navigate(user.rol === "VALIDADOR" ? "/validaciones" : user.rol === "AUDITOR" ? "/auditoria" : "/animales");
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo iniciar sesión.");
    }
  }

  return (
    <Container style={{maxWidth:520}}>
      <Panel>
        <Title>Acceso interno</Title>
        <Subtitle>Operadores, validadores, auditores y administradores.</Subtitle>
        {error && <ErrorBox>{error}</ErrorBox>}
        <form onSubmit={submit} style={{display:"grid",gap:14,marginTop:22}}>
          <Field>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required/></Field>
          <Field>Contraseña<input value={password} onChange={e=>setPassword(e.target.value)} type="password" required/></Field>
          <Button>Ingresar</Button>
        </form>
      </Panel>
    </Container>
  );
}
