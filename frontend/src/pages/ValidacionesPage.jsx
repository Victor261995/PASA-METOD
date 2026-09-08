import { useEffect, useState } from "react";
import styled from "styled-components";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  PawPrint,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import api from "../api/api";

import {
  Container,
  ErrorBox,
  Subtitle,
  Title,
} from "../styles/ui";

export default function ValidacionesPage() {
  const [items, setItems] = useState([]);
  const [expanded, setExpanded] = useState(null);

  const [protocolos, setProtocolos] =
    useState({});

  const [observaciones, setObservaciones] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      setLoading(true);
      setError("");

      const { data } =
        await api.get(
          "/api/validaciones"
        );

      setItems(data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No se pudieron cargar las validaciones."
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleDetalle(item) {
    if (expanded === item.id) {
      setExpanded(null);
      return;
    }

    setExpanded(item.id);

    if (protocolos[item.animal_id]) {
      return;
    }

    try {
      const { data } =
        await api.get(
          `/api/animales/${item.animal_id}/protocolo`
        );

      setProtocolos((prev) => ({
        ...prev,
        [item.animal_id]: data,
      }));
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No se pudieron cargar las evidencias."
      );
    }
  }

  function setObservacion(id, value) {
    setObservaciones((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  async function resolver(
    validacion,
    accion
  ) {
    setError("");
    setSuccess("");

    try {
      setProcessing(validacion.id);

      await api.post(
        `/api/validaciones/${validacion.id}/${accion}`,
        {
          observaciones:
            observaciones[
              validacion.id
            ]?.trim() || null,
        }
      );

      if (accion === "aprobar") {
        setSuccess(
          `${validacion.nombre} fue aprobado para adopción.`
        );
      } else {
        setSuccess(
          `La validación de ${validacion.nombre} fue rechazada.`
        );
      }

      await cargar();

      setExpanded(null);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No se pudo resolver la validación."
      );
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <Container>
        <Subtitle>
          Cargando solicitudes de
          validación...
        </Subtitle>
      </Container>
    );
  }

  const pendientes =
    items.filter(
      (x) =>
        x.decision === "PENDIENTE"
    );

  const resueltas =
    items.filter(
      (x) =>
        x.decision !== "PENDIENTE"
    );

  return (
    <Container>
      <Header>
        <div>
          <TopBadges>
            <StepBadge>
              PASO 4 · VALIDACIÓN
            </StepBadge>

            <CountBadge>
              {pendientes.length} pendientes
            </CountBadge>
          </TopBadges>

          <Title>
            Bandeja del Validador
          </Title>

          <Subtitle>
            Revisá el protocolo sanitario y
            las evidencias antes de aprobar o
            rechazar el cambio de estado.
          </Subtitle>
        </div>
      </Header>

      {error && (
        <ErrorBox>
          {error}
        </ErrorBox>
      )}

      {success && (
        <SuccessBox>
          <CheckCircle2 size={18} />
          {success}
        </SuccessBox>
      )}

      <SectionTitle>
        Solicitudes pendientes
      </SectionTitle>

      {pendientes.length === 0 ? (
        <EmptyCard>
          <ShieldCheck size={28} />

          <strong>
            No hay validaciones pendientes
          </strong>

          <span>
            Las nuevas solicitudes aparecerán
            aquí.
          </span>
        </EmptyCard>
      ) : (
        <List>
          {pendientes.map((item) => {
            const abierto =
              expanded === item.id;

            const detalle =
              protocolos[
                item.animal_id
              ];

            const protocolo =
              detalle?.protocolo;

            const evidencias =
              detalle?.evidencias || [];

            return (
              <ValidationCard
                key={item.id}
              >
                <ValidationHeader>
                  <AnimalIcon>
                    <PawPrint
                      size={22}
                    />
                  </AnimalIcon>

                  <AnimalData>
                    <strong>
                      {item.nombre}
                    </strong>

                    <span>
                      {item.codigo}
                      {" · "}
                      {item.especie}

                      {item.raza
                        ? ` · ${item.raza}`
                        : ""}
                    </span>

                    <small>
                      Solicitado por{" "}
                      {item.solicitante_nombre}

                      {item.solicitante_apellido
                        ? ` ${item.solicitante_apellido}`
                        : ""}
                    </small>
                  </AnimalData>

                  <PendingBadge>
                    PENDIENTE
                  </PendingBadge>

                  <ExpandButton
                    type="button"
                    onClick={() =>
                      toggleDetalle(
                        item
                      )
                    }
                  >
                    {abierto ? (
                      <ChevronUp
                        size={18}
                      />
                    ) : (
                      <ChevronDown
                        size={18}
                      />
                    )}
                  </ExpandButton>
                </ValidationHeader>

                {abierto && (
                  <Detail>
                    <InfoGrid>
                      <InfoItem>
                        <span>
                          Estado actual
                        </span>

                        <strong>
                          {
                            item.animal_estado
                          }
                        </strong>
                      </InfoItem>

                      <InfoItem>
                        <span>
                          Estado solicitado
                        </span>

                        <strong>
                          {
                            item.estado_solicitado
                          }
                        </strong>
                      </InfoItem>

                      <InfoItem>
                        <span>
                          Refugio
                        </span>

                        <strong>
                          {item.refugio}
                        </strong>
                      </InfoItem>

                      <InfoItem>
                        <span>
                          Sexo
                        </span>

                        <strong>
                          {item.sexo}
                        </strong>
                      </InfoItem>
                    </InfoGrid>

                    {!detalle ? (
                      <LoadingDetail>
                        Cargando protocolo...
                      </LoadingDetail>
                    ) : (
                      <>
                        <ProtocolCard>
                          <ProtocolHeader>
                            <div>
                              <h3>
                                Protocolo
                                Sanitario
                              </h3>

                              <p>
                                Resultado del
                                motor de
                                cumplimiento.
                              </p>
                            </div>

                            <ProtocolPercent>
                              {Number(
                                protocolo
                                  ?.porcentaje_cumplimiento
                              ) || 0}
                              %
                            </ProtocolPercent>
                          </ProtocolHeader>

                          <Progress>
                            <ProgressFill
                              style={{
                                width: `${
                                  Number(
                                    protocolo
                                      ?.porcentaje_cumplimiento
                                  ) || 0
                                }%`,
                              }}
                            />
                          </Progress>

                          <RequirementGrid>
                            <Requirement
                              $good={
                                Number(
                                  protocolo
                                    ?.control_parasitos
                                ) === 1
                              }
                            >
                              <CheckCircle2
                                size={18}
                              />

                              <div>
                                <strong>
                                  Control de
                                  parásitos
                                </strong>

                                <span>
                                  {Number(
                                    protocolo
                                      ?.control_parasitos
                                  ) === 1
                                    ? "Cumplido"
                                    : "Pendiente"}
                                </span>
                              </div>
                            </Requirement>

                            <Requirement
                              $good={
                                Number(
                                  protocolo
                                    ?.vacuna_antirrabica
                                ) === 1
                              }
                            >
                              <CheckCircle2
                                size={18}
                              />

                              <div>
                                <strong>
                                  Vacuna
                                  antirrábica
                                </strong>

                                <span>
                                  {Number(
                                    protocolo
                                      ?.vacuna_antirrabica
                                  ) === 1
                                    ? "Cumplida"
                                    : "Pendiente"}
                                </span>
                              </div>
                            </Requirement>
                          </RequirementGrid>
                        </ProtocolCard>

                        <EvidenceSection>
                          <EvidenceTitle>
                            <FileText
                              size={18}
                            />

                            Evidencias
                            Sanitarias
                          </EvidenceTitle>

                          {evidencias.length ===
                          0 ? (
                            <NoEvidence>
                              No hay evidencias
                              registradas.
                            </NoEvidence>
                          ) : (
                            <EvidenceList>
                              {evidencias.map(
                                (e) => (
                                  <EvidenceItem
                                    key={e.id}
                                  >
                                    <FileIcon>
                                      <FileText
                                        size={17}
                                      />
                                    </FileIcon>

                                    <EvidenceData>
                                      <strong>
                                        {labelTipo(
                                          e.tipo
                                        )}
                                      </strong>

                                      <span>
                                        {e.nombre_archivo ||
                                          "Sin archivo"}
                                      </span>

                                      <small>
                                        Emisión:{" "}
                                        {formatDate(
                                          e.fecha_emision
                                        )}
                                        {" · "}
                                        Vencimiento:{" "}
                                        {formatDate(
                                          e.fecha_vencimiento
                                        )}
                                      </small>
                                    </EvidenceData>

                                    <EvidenceStatus
                                      $status={
                                        e.estado
                                      }
                                    >
                                      {
                                        e.estado
                                      }
                                    </EvidenceStatus>
                                  </EvidenceItem>
                                )
                              )}
                            </EvidenceList>
                          )}
                        </EvidenceSection>
                      </>
                    )}

                    <DecisionSection>
                      <label>
                        Observaciones del
                        Validador
                      </label>

                      <textarea
                        rows="4"
                        placeholder="Observaciones, fundamentos del rechazo o comentarios de validación..."
                        value={
                          observaciones[
                            item.id
                          ] || ""
                        }
                        onChange={(e) =>
                          setObservacion(
                            item.id,
                            e.target.value
                          )
                        }
                      />

                      <Actions>
                        <RejectButton
                          type="button"
                          disabled={
                            processing ===
                            item.id
                          }
                          onClick={() =>
                            resolver(
                              item,
                              "rechazar"
                            )
                          }
                        >
                          <XCircle
                            size={18}
                          />

                          Rechazar
                        </RejectButton>

                        <ApproveButton
                          type="button"
                          disabled={
                            processing ===
                            item.id
                          }
                          onClick={() =>
                            resolver(
                              item,
                              "aprobar"
                            )
                          }
                        >
                          <CheckCircle2
                            size={18}
                          />

                          {processing ===
                          item.id
                            ? "Procesando..."
                            : "Aprobar"}
                        </ApproveButton>
                      </Actions>
                    </DecisionSection>
                  </Detail>
                )}
              </ValidationCard>
            );
          })}
        </List>
      )}

      {resueltas.length > 0 && (
        <>
          <SectionTitle
            style={{
              marginTop: 30,
            }}
          >
            Historial reciente
          </SectionTitle>

          <HistoryList>
            {resueltas.map(
              (item) => (
                <HistoryItem
                  key={item.id}
                >
                  <div>
                    <strong>
                      {item.nombre}
                    </strong>

                    <span>
                      {item.codigo}
                    </span>
                  </div>

                  <DecisionBadge
                    $decision={
                      item.decision
                    }
                  >
                    {item.decision}
                  </DecisionBadge>
                </HistoryItem>
              )
            )}
          </HistoryList>
        </>
      )}
    </Container>
  );
}

function labelTipo(tipo) {
  const labels = {
    VACUNACION: "Vacunación",
    DESPARASITACION:
      "Desparasitación",
    CERTIFICADO: "Certificado",
    FOTO: "Fotografía",
    OTRO: "Otro",
  };

  return labels[tipo] || tipo;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(
    `${value}T00:00:00`
  );

  return date.toLocaleDateString(
    "es-AR"
  );
}

const Header = styled.div`
  margin-bottom: 24px;
`;

const TopBadges = styled.div`
  display: flex;
  gap: 9px;
  align-items: center;
  margin-bottom: 11px;
`;

const StepBadge = styled.span`
  color: #38bdf8;
  background: rgba(56,189,248,.08);
  border: 1px solid rgba(56,189,248,.22);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: .7rem;
  font-weight: 900;
`;

const CountBadge = styled.span`
  color: #fbbf24;
  font-family: monospace;
  font-size: .72rem;
`;

const SuccessBox = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 13px 15px;
  margin-bottom: 18px;
  border-radius: 12px;
  color: #86efac;
  background: rgba(34,197,94,.07);
  border: 1px solid rgba(34,197,94,.2);
  font-size: .8rem;
`;

const SectionTitle = styled.h2`
  color: #dce8e1;
  font-size: .9rem;
  margin: 0 0 13px;
`;

const List = styled.div`
  display: grid;
  gap: 13px;
`;

const ValidationCard = styled.article`
  background: rgba(13,27,20,.84);
  border: 1px solid #20392d;
  border-radius: 17px;
  overflow: hidden;
`;

const ValidationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 17px;
`;

const AnimalIcon = styled.div`
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: rgba(34,197,94,.08);

  svg {
    color: #4ade80;
  }
`;

const AnimalData = styled.div`
  flex: 1;

  strong {
    display: block;
    color: #edf7f1;
    font-size: .88rem;
  }

  span {
    display: block;
    color: #7c9186;
    font-size: .73rem;
    margin-top: 3px;
  }

  small {
    display: block;
    color: #596f64;
    font-size: .68rem;
    margin-top: 3px;
  }
`;

const PendingBadge = styled.span`
  color: #fbbf24;
  background: rgba(245,158,11,.08);
  border: 1px solid rgba(245,158,11,.2);
  padding: 6px 9px;
  border-radius: 999px;
  font-family: monospace;
  font-size: .66rem;
  font-weight: 900;
`;

const ExpandButton = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1px solid #294638;
  background: #09150f;
  color: #80958a;
  cursor: pointer;
  display: grid;
  place-items: center;
`;

const Detail = styled.div`
  border-top: 1px solid #20392d;
  padding: 20px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns:
    repeat(4,minmax(0,1fr));
  gap: 10px;
  margin-bottom: 17px;

  @media(max-width:750px) {
    grid-template-columns:
      repeat(2,minmax(0,1fr));
  }
`;

const InfoItem = styled.div`
  padding: 11px;
  background: #09150f;
  border-radius: 10px;

  span {
    display: block;
    color: #657a70;
    font-size: .66rem;
  }

  strong {
    display: block;
    color: #d8e5de;
    margin-top: 5px;
    font-size: .73rem;
  }
`;

const ProtocolCard = styled.div`
  background: #09150f;
  border: 1px solid #294638;
  border-radius: 14px;
  padding: 17px;
`;

const ProtocolHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 15px;

  h3 {
    margin: 0;
    color: #edf7f1;
    font-size: .85rem;
  }

  p {
    color: #657a70;
    font-size: .68rem;
    margin: 4px 0 0;
  }
`;

const ProtocolPercent = styled.strong`
  color: #86efac;
  font-family: monospace;
  font-size: 1.2rem;
`;

const Progress = styled.div`
  margin: 14px 0;
  height: 7px;
  border-radius: 999px;
  background: #172a20;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background:
    linear-gradient(
      90deg,
      #16a34a,
      #4ade80
    );
`;

const RequirementGrid = styled.div`
  display: grid;
  grid-template-columns:
    repeat(2,minmax(0,1fr));
  gap: 9px;
`;

const Requirement = styled.div`
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 10px;
  border-radius: 10px;
  background:
    ${(p) =>
      p.$good
        ? "rgba(34,197,94,.06)"
        : "rgba(245,158,11,.05)"};

  svg {
    color:
      ${(p) =>
        p.$good
          ? "#4ade80"
          : "#fbbf24"};
  }

  strong {
    display: block;
    color: #dce8e1;
    font-size: .72rem;
  }

  span {
    display: block;
    color: #64796e;
    font-size: .66rem;
    margin-top: 2px;
  }
`;

const EvidenceSection = styled.div`
  margin-top: 18px;
`;

const EvidenceTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e5eee9;
  font-size: .82rem;
`;

const EvidenceList = styled.div`
  display: grid;
  gap: 8px;
`;

const EvidenceItem = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  background: #09150f;
  border: 1px solid #233e30;
  border-radius: 11px;
  padding: 11px;
`;

const FileIcon = styled.div`
  width: 35px;
  height: 35px;
  border-radius: 9px;
  background: rgba(56,189,248,.08);
  display: grid;
  place-items: center;

  svg {
    color: #38bdf8;
  }
`;

const EvidenceData = styled.div`
  flex: 1;

  strong {
    display: block;
    color: #dbe7e0;
    font-size: .73rem;
  }

  span {
    display: block;
    color: #72877c;
    font-size: .68rem;
    margin-top: 2px;
  }

  small {
    display: block;
    color: #566c61;
    font-size: .64rem;
    margin-top: 3px;
  }
`;

const EvidenceStatus = styled.span`
  color:
    ${(p) =>
      p.$status === "VALIDA"
        ? "#4ade80"
        : p.$status === "VENCIDA"
        ? "#fbbf24"
        : "#f87171"};

  font-family: monospace;
  font-size: .65rem;
  font-weight: 900;
`;

const NoEvidence = styled.div`
  color: #687d72;
  background: #09150f;
  padding: 13px;
  border-radius: 10px;
  font-size: .72rem;
`;

const LoadingDetail = styled.div`
  color: #6e8378;
  padding: 20px 0;
`;

const DecisionSection = styled.div`
  margin-top: 20px;

  label {
    display: block;
    color: #72877c;
    text-transform: uppercase;
    font-size: .67rem;
    font-weight: 800;
    margin-bottom: 7px;
  }

  textarea {
    width: 100%;
    background: #09150f;
    color: #edf7f1;
    border: 1px solid #294638;
    border-radius: 11px;
    padding: 11px 13px;
    resize: vertical;
    font: inherit;
  }

  textarea:focus {
    outline: none;
    border-color: #22c55e;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 13px;
`;

const RejectButton = styled.button`
  border: 1px solid rgba(239,68,68,.28);
  background: rgba(239,68,68,.06);
  color: #f87171;
  border-radius: 11px;
  padding: 11px 16px;
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 800;
  cursor: pointer;
`;

const ApproveButton = styled.button`
  border: 0;
  background:
    linear-gradient(
      135deg,
      #22c55e,
      #16a34a
    );
  color: #041008;
  border-radius: 11px;
  padding: 11px 16px;
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 900;
  cursor: pointer;
`;

const EmptyCard = styled.div`
  min-height: 170px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #667b70;
  background: rgba(13,27,20,.7);
  border: 1px solid #20392d;
  border-radius: 16px;

  svg {
    color: #4ade80;
    margin-bottom: 10px;
  }

  strong {
    color: #cddbd3;
    font-size: .82rem;
  }

  span {
    font-size: .7rem;
    margin-top: 4px;
  }
`;

const HistoryList = styled.div`
  display: grid;
  gap: 8px;
`;

const HistoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(13,27,20,.7);
  border: 1px solid #20392d;
  border-radius: 11px;
  padding: 12px 14px;

  strong {
    display: block;
    color: #dce7e1;
    font-size: .76rem;
  }

  span {
    color: #62776c;
    font-size: .67rem;
  }
`;

const DecisionBadge = styled.span`
  color:
    ${(p) =>
      p.$decision === "APROBADO"
        ? "#4ade80 !important"
        : "#f87171 !important"};

  font-family: monospace;
  font-weight: 900;
  font-size: .67rem !important;
`;