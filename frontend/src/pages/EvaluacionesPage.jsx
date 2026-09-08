import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import {
  Badge,
  Container,
  Panel,
  Subtitle,
  TableWrap,
  Title,
} from "../styles/ui";

export default function EvaluacionesPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const response = await api.get("/api/animales");

        const animales = response.data.data || [];

        // Solamente animales que todavía necesitan evaluación.
        const pendientes = animales.filter(
          (animal) => animal.estado === "INGRESADO"
        );

        setItems(pendientes);
      } catch {
        setError("No se pudieron cargar las evaluaciones pendientes.");
      }
    }

    cargar();
  }, []);

  return (
    <Container>
      <Title>Evaluación</Title>

      <Subtitle>
        Animales pendientes de evaluación clínica.
      </Subtitle>

      <Panel style={{ marginTop: 22 }}>
        {error && (
          <p style={{ marginBottom: 16 }}>
            {error}
          </p>
        )}

        <TableWrap>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Especie</th>
                <th>Refugio</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    No hay animales pendientes de evaluación.
                  </td>
                </tr>
              ) : (
                items.map((animal) => (
                  <tr key={animal.id}>
                    <td>{animal.codigo}</td>

                    <td>{animal.nombre}</td>

                    <td>{animal.especie}</td>

                    <td>{animal.refugio}</td>

                    <td>
                      <Badge>
                        {animal.estado.replaceAll("_", " ")}
                      </Badge>
                    </td>

                    <td>
                      <Link
                        to={`/animales/${animal.id}/evaluacion`}
                        style={{
                          color: "#86efac",
                          fontWeight: 800,
                        }}
                      >
                        Evaluar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWrap>
      </Panel>
    </Container>
  );
}