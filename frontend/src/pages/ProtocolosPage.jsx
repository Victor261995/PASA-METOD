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

export default function ProtocolosPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const response = await api.get("/api/animales");

        const animales = response.data.data || [];

        const enProtocolo = animales.filter((animal) =>
          [
            "EVALUACION",
            "PROTOCOLO_SANITARIO",
          ].includes(animal.estado)
        );

        setItems(enProtocolo);
      } catch {
        setError(
          "No se pudieron cargar los protocolos sanitarios."
        );
      }
    }

    cargar();
  }, []);

  return (
    <Container>
      <Title>Protocolo sanitario</Title>

      <Subtitle>
        Seguimiento del cumplimiento sanitario de los animales.
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
                    No hay animales en protocolo sanitario.
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
                        to={`/animales/${animal.id}/protocolo`}
                        style={{
                          color: "#86efac",
                          fontWeight: 800,
                        }}
                      >
                        Abrir protocolo
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