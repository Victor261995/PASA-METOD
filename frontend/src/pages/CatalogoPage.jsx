import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import {
  Heart,
  MapPin,
  PawPrint,
  Search,
} from "lucide-react";

import api from "../api/api";
import {
  Container,
  ErrorBox,
  Subtitle,
  Title,
} from "../styles/ui";

export default function CatalogoPage() {
  const [animales, setAnimales] = useState([]);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarAnimales();
  }, []);

  async function cargarAnimales() {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/api/public/animales");

      setAnimales(data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No se pudo cargar el catálogo."
      );
    } finally {
      setLoading(false);
    }
  }

  const filtrados = useMemo(() => {
    return animales.filter((animal) => {
      const texto = `${animal.nombre} ${animal.raza || ""} ${animal.refugio || ""}`
        .toLowerCase();

      const coincideTexto = texto.includes(
        search.toLowerCase()
      );

      const coincideEspecie =
        filtro === "TODOS" ||
        animal.especie === filtro;

      return coincideTexto && coincideEspecie;
    });
  }, [animales, search, filtro]);

  if (loading) {
    return (
      <Container>
        <Subtitle>
          Cargando animales disponibles...
        </Subtitle>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div>
          <PublicBadge>
            CATÁLOGO PÚBLICO
          </PublicBadge>

          <Title>
            Animales en adopción
          </Title>

          <Subtitle>
            Conocé animales que completaron el
            proceso sanitario y están aptos para
            adopción.
          </Subtitle>
        </div>
      </Header>

      {error && (
        <ErrorBox>
          {error}
        </ErrorBox>
      )}

      <Toolbar>
        <SearchBox>
          <Search size={17} />

          <input
            placeholder="Buscar por nombre, raza o refugio..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </SearchBox>

        <Filters>
          <FilterButton
            $active={filtro === "TODOS"}
            onClick={() => setFiltro("TODOS")}
          >
            Todos
          </FilterButton>

          <FilterButton
            $active={filtro === "PERRO"}
            onClick={() => setFiltro("PERRO")}
          >
            Perros
          </FilterButton>

          <FilterButton
            $active={filtro === "GATO"}
            onClick={() => setFiltro("GATO")}
          >
            Gatos
          </FilterButton>
        </Filters>
      </Toolbar>

      {filtrados.length === 0 ? (
        <EmptyState>
          <PawPrint size={34} />
          <strong>
            No hay animales disponibles
          </strong>
          <span>
            No encontramos animales con esos filtros.
          </span>
        </EmptyState>
      ) : (
        <Grid>
          {filtrados.map((animal) => (
            <Card key={animal.id}>
              <PhotoArea>
                {animal.foto_url ||
                animal.foto_principal ? (
                  <img
                    src={
                      animal.foto_url ||
                      animal.foto_principal
                    }
                    alt={animal.nombre}
                  />
                ) : (
                  <PhotoPlaceholder>
                    <PawPrint size={42} />
                  </PhotoPlaceholder>
                )}

                <AvailableBadge>
                  Disponible
                </AvailableBadge>
              </PhotoArea>

              <CardBody>
                <CardTop>
                  <div>
                    <h2>
                      {animal.nombre}
                    </h2>

                    <span>
                      {animal.raza ||
                        animal.especie}
                    </span>
                  </div>

                  <Heart
                    size={19}
                  />
                </CardTop>

                <InfoRow>
                  <PawPrint size={14} />

                  {animal.especie}

                  {animal.sexo &&
                    ` · ${formatSexo(
                      animal.sexo
                    )}`}
                </InfoRow>

                {animal.edad_estimada != null && (
                  <InfoRow>
                    Edad estimada:{" "}
                    {animal.edad_estimada}
                  </InfoRow>
                )}

                {animal.refugio && (
                  <InfoRow>
                    <MapPin size={14} />
                    {animal.refugio}
                  </InfoRow>
                )}

                <DetailLink
                  to={`/adopciones/${animal.id}`}
                >
                  Ver perfil
                </DetailLink>
              </CardBody>
            </Card>
          ))}
        </Grid>
      )}
    </Container>
  );
}

function formatSexo(value) {
  if (value === "MACHO") return "Macho";
  if (value === "HEMBRA") return "Hembra";
  return "Sexo desconocido";
}

const Header = styled.div`
  margin-bottom: 24px;
`;

const PublicBadge = styled.span`
  display: inline-block;
  margin-bottom: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  color: #4ade80;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.22);
  font-size: 0.68rem;
  font-weight: 900;
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 22px;

  @media (max-width: 750px) {
    flex-direction: column;
  }
`;

const SearchBox = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 13px;
  background: #09150f;
  border: 1px solid #294638;
  border-radius: 11px;

  svg {
    color: #60766a;
  }

  input {
    flex: 1;
    padding: 12px 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: #edf7f1;
    font: inherit;
  }
`;

const Filters = styled.div`
  display: flex;
  gap: 7px;
`;

const FilterButton = styled.button`
  border-radius: 999px;
  padding: 9px 13px;
  cursor: pointer;

  color: ${(p) =>
    p.$active ? "#4ade80" : "#71867b"};

  background: ${(p) =>
    p.$active
      ? "rgba(34,197,94,.08)"
      : "#0d1b14"};

  border: 1px solid
    ${(p) =>
      p.$active
        ? "rgba(34,197,94,.25)"
        : "#20392d"};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns:
    repeat(auto-fill, minmax(245px, 1fr));
  gap: 18px;
`;

const Card = styled.article`
  overflow: hidden;
  background: rgba(13, 27, 20, 0.85);
  border: 1px solid #20392d;
  border-radius: 16px;
`;

const PhotoArea = styled.div`
  position: relative;
  height: 220px;
  background: #0a1610;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PhotoPlaceholder = styled.div`
  height: 100%;
  display: grid;
  place-items: center;
  color: #31513f;
`;

const AvailableBadge = styled.span`
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 5px 9px;
  border-radius: 999px;
  color: #dcfce7;
  background: rgba(22, 163, 74, 0.9);
  font-size: 0.65rem;
  font-weight: 800;
`;

const CardBody = styled.div`
  padding: 16px;
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;

  h2 {
    margin: 0;
    color: #ecf5ef;
    font-size: 1rem;
  }

  span {
    display: block;
    margin-top: 3px;
    color: #74897e;
    font-size: 0.7rem;
  }

  svg {
    color: #4ade80;
  }
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  color: #71867b;
  font-size: 0.68rem;
`;

const DetailLink = styled(Link)`
  display: block;
  margin-top: 15px;
  text-align: center;
  padding: 10px;
  border-radius: 10px;
  text-decoration: none;
  color: white;
  background: linear-gradient(
    135deg,
    #22c55e,
    #16a34a
  );
  font-size: 0.72rem;
  font-weight: 800;
`;

const EmptyState = styled.div`
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;

  color: #64796e;

  svg {
    color: #31513f;
    margin-bottom: 10px;
  }

  strong {
    color: #dce8e1;
  }

  span {
    margin-top: 5px;
    font-size: 0.72rem;
  }
`;