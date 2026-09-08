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

export default function AnimalesPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api
      .get("/api/animales")
      .then((r) => setItems(r.data.data || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <Container>
      <Title>Animales</Title>

      <Subtitle>
        Seguimiento del flujo sanitario y estado actual.
      </Subtitle>

      <Panel style={{ marginTop: 22 }}>
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Especie</th>
                <th>Refugio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.codigo}</td>

                  <td>{a.nombre}</td>

                  <td>{a.especie}</td>

                  <td>{a.refugio}</td>

                  <td>
                    <Badge
                      $good={
                        a.estado ===
                        "APTO_PARA_ADOPCION"
                      }
                    >
                      {a.estado.replaceAll("_", " ")}
                    </Badge>
                  </td>

                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <Link
                        to={`/animales/${a.id}`}
                        style={{
                          color: "#86efac",
                          fontWeight: 800,
                        }}
                      >
                        Ver
                      </Link>

                      <Link
                        to={`/animales/${a.id}/evaluacion`}
                        style={{
                          color: "#7dd3fc",
                          fontWeight: 800,
                        }}
                      >
                        Evaluación
                      </Link>

                      <Link
                        to={`/animales/${a.id}/protocolo`}
                        style={{
                          color: "#c4b5fd",
                          fontWeight: 800,
                        }}
                      >
                        Protocolo
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Panel>
    </Container>
  );
}