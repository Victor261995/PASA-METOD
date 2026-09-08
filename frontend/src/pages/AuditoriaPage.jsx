import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileCheck2,
  Fingerprint,
  PawPrint,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import api from "../api/api";

import {
  Container,
  ErrorBox,
  Subtitle,
  Title,
} from "../styles/ui";

export default function AuditoriaPage() {
  const [eventos, setEventos] = useState([]);
  const [search, setSearch] = useState("");

  const [animalSeleccionado, setAnimalSeleccionado] =
    useState(null);

  const [timeline, setTimeline] = useState([]);

  const [integridad, setIntegridad] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    cargarAuditoria();
  }, []);

  async function cargarAuditoria() {
    try {
      setLoading(true);
      setError("");

      const { data } =
        await api.get("/api/auditoria");

      setEventos(data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No se pudo cargar la auditoría."
      );
    } finally {
      setLoading(false);
    }
  }

  const animales = useMemo(() => {
    const map = new Map();

    eventos.forEach((evento) => {
      if (!evento.animal_id) {
        return;
      }

      if (!map.has(evento.animal_id)) {
        map.set(evento.animal_id, {
          id: evento.animal_id,
          codigo: evento.animal_codigo,
          nombre: evento.animal_nombre,
          especie: evento.animal_especie,
          estado: evento.animal_estado,
          cantidad: 0,
        });
      }

      map.get(
        evento.animal_id
      ).cantidad++;
    });

    return [...map.values()];
  }, [eventos]);

  const animalesFiltrados =
    animales.filter((animal) => {
      const texto =
        `${animal.codigo} ${animal.nombre} ${animal.especie} ${animal.estado}`
          .toLowerCase();

      return texto.includes(
        search.toLowerCase()
      );
    });

  async function seleccionarAnimal(
    animal
  ) {
    if (
      animalSeleccionado?.id ===
      animal.id
    ) {
      setAnimalSeleccionado(null);
      setTimeline([]);
      setIntegridad(null);
      return;
    }

    setAnimalSeleccionado(animal);

    try {
      setLoadingDetail(true);
      setError("");

      const [
        auditRes,
        verifyRes,
      ] = await Promise.all([
        api.get(
          `/api/animales/${animal.id}/auditoria`
        ),
        api.get(
          `/api/auditoria/verificar/${animal.id}`
        ),
      ]);

      setTimeline(
        auditRes.data.data || []
      );

      setIntegridad(
        verifyRes.data
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No se pudo cargar la trazabilidad."
      );
    } finally {
      setLoadingDetail(false);
    }
  }

  if (loading) {
    return (
      <Container>
        <Subtitle>
          Cargando auditoría...
        </Subtitle>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div>
          <TopBadges>
            <StepBadge>
              PASO 5 · AUDITORÍA
            </StepBadge>

            <CountBadge>
              {eventos.length} eventos
            </CountBadge>
          </TopBadges>

          <Title>
            Trazabilidad del Proceso Sanitario
          </Title>

          <Subtitle>
            Consultá el historial completo de cada
            animal y verificá la integridad de la
            cadena de auditoría.
          </Subtitle>
        </div>
      </Header>

      {error && (
        <ErrorBox>
          {error}
        </ErrorBox>
      )}

      <StatsGrid>
        <StatCard>
          <Activity size={20} />

          <div>
            <strong>
              {eventos.length}
            </strong>

            <span>
              Eventos registrados
            </span>
          </div>
        </StatCard>

        <StatCard>
          <PawPrint size={20} />

          <div>
            <strong>
              {animales.length}
            </strong>

            <span>
              Animales auditados
            </span>
          </div>
        </StatCard>

        <StatCard>
          <Fingerprint size={20} />

          <div>
            <strong>
              SHA-256
            </strong>

            <span>
              Cadena de integridad
            </span>
          </div>
        </StatCard>
      </StatsGrid>

      <SearchBox>
        <Search size={17} />

        <input
          placeholder="Buscar por código, nombre, especie o estado..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />
      </SearchBox>

      <Layout>
        <AnimalList>
          <SectionTitle>
            Animales
          </SectionTitle>

          {animalesFiltrados.length ===
          0 ? (
            <Empty>
              No se encontraron registros.
            </Empty>
          ) : (
            animalesFiltrados.map(
              (animal) => {
                const seleccionado =
                  animalSeleccionado?.id ===
                  animal.id;

                return (
                  <AnimalCard
                    key={animal.id}
                    $selected={
                      seleccionado
                    }
                    onClick={() =>
                      seleccionarAnimal(
                        animal
                      )
                    }
                  >
                    <AnimalIcon>
                      <PawPrint
                        size={20}
                      />
                    </AnimalIcon>

                    <AnimalData>
                      <strong>
                        {animal.nombre}
                      </strong>

                      <span>
                        {animal.codigo}
                        {" · "}
                        {animal.especie}
                      </span>

                      <small>
                        {animal.cantidad} eventos
                      </small>
                    </AnimalData>

                    <AnimalState>
                      {formatState(
                        animal.estado
                      )}
                    </AnimalState>

                    {seleccionado ? (
                      <ChevronUp
                        size={17}
                      />
                    ) : (
                      <ChevronDown
                        size={17}
                      />
                    )}
                  </AnimalCard>
                );
              }
            )
          )}
        </AnimalList>

        <DetailColumn>
          {!animalSeleccionado ? (
            <EmptyDetail>
              <ShieldCheck
                size={35}
              />

              <strong>
                Seleccioná un animal
              </strong>

              <span>
                Vas a poder consultar toda su
                trazabilidad sanitaria y verificar
                la cadena de integridad.
              </span>
            </EmptyDetail>
          ) : loadingDetail ? (
            <EmptyDetail>
              Cargando trazabilidad...
            </EmptyDetail>
          ) : (
            <>
              <IntegrityCard
                $valid={isValid(
                  integridad
                )}
              >
                <IntegrityIcon
                  $valid={isValid(
                    integridad
                  )}
                >
                  {isValid(
                    integridad
                  ) ? (
                    <CheckCircle2
                      size={24}
                    />
                  ) : (
                    <XCircle
                      size={24}
                    />
                  )}
                </IntegrityIcon>

                <div>
                  <strong>
                    {isValid(
                      integridad
                    )
                      ? "Integridad verificada"
                      : "Problema de integridad"}
                  </strong>

                  <span>
                    {isValid(
                      integridad
                    )
                      ? "La cadena de auditoría no presenta alteraciones detectadas."
                      : "La verificación de la cadena devolvió inconsistencias."}
                  </span>
                </div>

                <HashBadge>
                  SHA-256
                </HashBadge>
              </IntegrityCard>

              <TimelineCard>
                <TimelineHeader>
                  <div>
                    <h2>
                      Línea de Tiempo
                    </h2>

                    <p>
                      {animalSeleccionado.nombre}
                      {" · "}
                      {animalSeleccionado.codigo}
                    </p>
                  </div>

                  <TimelineCount>
                    {timeline.length} eventos
                  </TimelineCount>
                </TimelineHeader>

                {timeline.length ===
                0 ? (
                  <Empty>
                    No hay eventos registrados.
                  </Empty>
                ) : (
                  <Timeline>
                    {timeline.map(
                      (
                        evento,
                        index
                      ) => (
                        <TimelineItem
                          key={
                            evento.id
                          }
                        >
                          <TimelineRail>
                            <TimelineDot>
                              {iconEvento(
                                evento.tipo_evento
                              )}
                            </TimelineDot>

                            {index <
                              timeline.length -
                                1 && (
                              <TimelineLine />
                            )}
                          </TimelineRail>

                          <EventCard>
                            <EventTop>
                              <div>
                                <EventTitle>
                                  {labelEvento(
                                    evento.tipo_evento
                                  )}
                                </EventTitle>

                                <EventDate>
                                  {formatDateTime(
                                    evento.fecha
                                  )}
                                </EventDate>
                              </div>

                              <EventId>
                                #{evento.id}
                              </EventId>
                            </EventTop>

                            {(evento.estado_anterior ||
                              evento.estado_nuevo) && (
                              <StateTransition>
                                <StateBox>
                                  {formatState(
                                    evento.estado_anterior
                                  )}
                                </StateBox>

                                <Arrow>
                                  →
                                </Arrow>

                                <StateBox
                                  $new
                                >
                                  {formatState(
                                    evento.estado_nuevo
                                  )}
                                </StateBox>
                              </StateTransition>
                            )}

                            {evento.usuario_nombre && (
                              <UserInfo>
                                <UserRound
                                  size={14}
                                />

                                {evento.usuario_nombre}

                                {evento.usuario_apellido
                                  ? ` ${evento.usuario_apellido}`
                                  : ""}

                                {evento.usuario_rol &&
                                  ` · ${evento.usuario_rol}`}
                              </UserInfo>
                            )}

                            {evento.detalle && (
                              <DetailJson>
                                {formatDetail(
                                  evento.detalle
                                )}
                              </DetailJson>
                            )}

                            <HashSection>
                              <span>
                                Hash
                              </span>

                              <code>
                                {shortHash(
                                  evento.hash_actual
                                )}
                              </code>
                            </HashSection>
                          </EventCard>
                        </TimelineItem>
                      )
                    )}
                  </Timeline>
                )}
              </TimelineCard>
            </>
          )}
        </DetailColumn>
      </Layout>
    </Container>
  );
}

function isValid(data) {
  return data?.integridad === true;
}

function formatState(state) {
  if (!state) {
    return "—";
  }

  return state.replaceAll(
    "_",
    " "
  );
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(
    value
  ).toLocaleString(
    "es-AR"
  );
}

function shortHash(hash) {
  if (!hash) {
    return "—";
  }

  if (hash.length <= 24) {
    return hash;
  }

  return `${hash.slice(
    0,
    12
  )}...${hash.slice(-12)}`;
}

function formatDetail(value) {
  if (!value) {
    return "";
  }

  try {
    const data =
      typeof value === "string"
        ? JSON.parse(value)
        : value;

    return JSON.stringify(
      data,
      null,
      2
    );
  } catch {
    return String(value);
  }
}

function labelEvento(tipo) {
  const labels = {
    ANIMAL_REGISTRADO:
      "Animal registrado",

    ANIMAL_ACTUALIZADO:
      "Datos del animal actualizados",

    FOTO_PRINCIPAL_CARGADA:
      "Fotografía principal cargada",

    EVALUACION_CLINICA:
      "Evaluación clínica registrada",

    EVALUACION_REGISTRADA:
      "Evaluación clínica registrada",

    EVIDENCIA_CARGADA:
      "Evidencia sanitaria cargada",

    EVIDENCIA_REGISTRADA:
      "Evidencia sanitaria registrada",

    VALIDACION_SOLICITADA:
      "Validación solicitada",

    VALIDACION_APROBADA:
      "Validación aprobada",

    VALIDACION_RECHAZADA:
      "Validación rechazada",

    ESTADO_ACTUALIZADO:
      "Estado actualizado",
  };

  return (
    labels[tipo] ||
    tipo
      ?.replaceAll("_", " ")
      .toLowerCase()
      .replace(
        /^./,
        (x) =>
          x.toUpperCase()
      )
  );
}

function iconEvento(tipo = "") {
  if (
    tipo.includes(
      "VALIDACION"
    )
  ) {
    return (
      <ShieldCheck
        size={15}
      />
    );
  }

  if (
    tipo.includes(
      "EVIDENCIA"
    )
  ) {
    return (
      <FileCheck2
        size={15}
      />
    );
  }

  if (
    tipo.includes(
      "EVALUACION"
    )
  ) {
    return (
      <ClipboardCheck
        size={15}
      />
    );
  }

  return (
    <Activity
      size={15}
    />
  );
}

const Header = styled.div`
  margin-bottom: 22px;
`;

const TopBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 11px;
`;

const StepBadge = styled.span`
  color: #a78bfa;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.22);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.7rem;
  font-weight: 900;
`;

const CountBadge = styled.span`
  color: #758b80;
  font-family: monospace;
  font-size: 0.7rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(13, 27, 20, 0.8);
  border: 1px solid #20392d;
  border-radius: 14px;

  svg {
    color: #4ade80;
  }

  strong {
    display: block;
    color: #eef6f1;
    font-size: 1rem;
  }

  span {
    color: #64796e;
    font-size: 0.69rem;
  }
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 13px;
  margin-bottom: 20px;
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
    color: #edf7f1;
    background: transparent;
    font: inherit;
  }
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns:
    minmax(280px, 0.8fr)
    minmax(0, 1.6fr);
  gap: 20px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const AnimalList = styled.div`
  display: grid;
  gap: 8px;
`;

const SectionTitle = styled.h2`
  margin: 0 0 6px;
  color: #d8e5de;
  font-size: 0.82rem;
`;

const AnimalCard = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  padding: 13px;
  cursor: pointer;

  color: inherit;
  background:
    ${(p) =>
      p.$selected
        ? "rgba(34,197,94,.07)"
        : "rgba(13,27,20,.8)"};

  border: 1px solid
    ${(p) =>
      p.$selected
        ? "rgba(34,197,94,.3)"
        : "#20392d"};

  border-radius: 12px;
`;

const AnimalIcon = styled.div`
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgba(34, 197, 94, 0.08);

  svg {
    color: #4ade80;
  }
`;

const AnimalData = styled.div`
  min-width: 0;
  flex: 1;

  strong {
    display: block;
    color: #e8f1ec;
    font-size: 0.76rem;
  }

  span {
    display: block;
    color: #71867b;
    font-size: 0.66rem;
    margin-top: 2px;
  }

  small {
    display: block;
    color: #50665a;
    font-size: 0.63rem;
    margin-top: 3px;
  }
`;

const AnimalState = styled.span`
  max-width: 100px;
  color: #38bdf8;
  font-size: 0.59rem;
  font-family: monospace;
  text-align: right;
`;

const DetailColumn = styled.div`
  display: grid;
  gap: 14px;
`;

const Empty = styled.div`
  color: #657a6f;
  padding: 18px;
  background: rgba(13, 27, 20, 0.7);
  border: 1px solid #20392d;
  border-radius: 12px;
  font-size: 0.72rem;
`;

const EmptyDetail = styled(Empty)`
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  svg {
    color: #4ade80;
    margin-bottom: 10px;
  }

  strong {
    color: #d9e6df;
    font-size: 0.84rem;
  }

  span {
    max-width: 360px;
    margin-top: 5px;
    line-height: 1.5;
  }
`;

const IntegrityCard = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
  border-radius: 15px;
  padding: 16px;

  background:
    ${(p) =>
      p.$valid
        ? "rgba(34,197,94,.06)"
        : "rgba(239,68,68,.06)"};

  border: 1px solid
    ${(p) =>
      p.$valid
        ? "rgba(34,197,94,.22)"
        : "rgba(239,68,68,.22)"};

  > div:nth-child(2) {
    flex: 1;
  }

  strong {
    display: block;
    color: #e3eee7;
    font-size: 0.8rem;
  }

  span {
    display: block;
    color: #667c70;
    font-size: 0.68rem;
    margin-top: 3px;
  }
`;

const IntegrityIcon = styled.div`
  width: 43px;
  height: 43px;
  display: grid;
  place-items: center;
  border-radius: 50%;

  background:
    ${(p) =>
      p.$valid
        ? "rgba(34,197,94,.1)"
        : "rgba(239,68,68,.1)"};

  svg {
    color:
      ${(p) =>
        p.$valid
          ? "#4ade80"
          : "#f87171"};
  }
`;

const HashBadge = styled.div`
  color: #a78bfa;
  font-family: monospace;
  font-size: 0.67rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  background: rgba(139, 92, 246, 0.07);
  padding: 6px 9px;
  border-radius: 999px;
`;

const TimelineCard = styled.div`
  padding: 20px;
  background: rgba(13, 27, 20, 0.82);
  border: 1px solid #20392d;
  border-radius: 16px;
`;

const TimelineHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 22px;

  h2 {
    margin: 0;
    color: #ebf4ef;
    font-size: 0.9rem;
  }

  p {
    margin: 4px 0 0;
    color: #64796e;
    font-size: 0.68rem;
  }
`;

const TimelineCount = styled.span`
  color: #74897e;
  font-family: monospace;
  font-size: 0.67rem;
`;

const Timeline = styled.div`
  display: grid;
`;

const TimelineItem = styled.div`
  display: grid;
  grid-template-columns:
    34px minmax(0, 1fr);
`;

const TimelineRail = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
`;

const TimelineDot = styled.div`
  z-index: 2;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #10241a;
  border: 1px solid rgba(34, 197, 94, 0.35);

  svg {
    color: #4ade80;
  }
`;

const TimelineLine = styled.div`
  position: absolute;
  width: 2px;
  top: 28px;
  bottom: 0;
  background:
    linear-gradient(
      #22c55e,
      rgba(34, 197, 94, 0.15)
    );
`;

const EventCard = styled.div`
  margin-left: 8px;
  margin-bottom: 18px;
  padding: 14px;
  background: #09150f;
  border: 1px solid #233e30;
  border-radius: 12px;
`;

const EventTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
`;

const EventTitle = styled.strong`
  display: block;
  color: #e6f0ea;
  font-size: 0.76rem;
`;

const EventDate = styled.span`
  display: block;
  color: #60766a;
  font-size: 0.64rem;
  margin-top: 3px;
`;

const EventId = styled.span`
  color: #52675c;
  font-family: monospace;
  font-size: 0.62rem;
`;

const StateTransition = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 11px;
`;

const StateBox = styled.span`
  color:
    ${(p) =>
      p.$new
        ? "#4ade80"
        : "#82958b"};

  background:
    ${(p) =>
      p.$new
        ? "rgba(34,197,94,.07)"
        : "#142219"};

  border: 1px solid
    ${(p) =>
      p.$new
        ? "rgba(34,197,94,.2)"
        : "#294638"};

  border-radius: 7px;
  padding: 5px 7px;
  font-family: monospace;
  font-size: 0.6rem;
`;

const Arrow = styled.span`
  color: #52675c;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  color: #71867b;
  font-size: 0.66rem;
`;

const DetailJson = styled.pre`
  white-space: pre-wrap;
  word-break: break-word;
  margin: 11px 0 0;
  padding: 9px;
  color: #81978b;
  background: #06100b;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.61rem;
`;

const HashSection = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px solid #1c3328;

  span {
    color: #586e62;
    font-size: 0.61rem;
  }

  code {
    color: #a78bfa;
    font-size: 0.6rem;
  }
`;