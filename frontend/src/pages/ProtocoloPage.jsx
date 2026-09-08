import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  FileUp,
  PawPrint,
  Send,
  ShieldCheck,
  Syringe,
} from "lucide-react";

import api from "../api/api";
import {
  Container,
  ErrorBox,
  Subtitle,
  Title,
} from "../styles/ui";

const initialEvidence = {
  tipo: "DESPARASITACION",
  fecha_emision: "",
  fecha_vencimiento: "",
  archivo: null,
};

export default function ProtocoloPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [animal, setAnimal] = useState(null);
  const [protocolo, setProtocolo] = useState(null);
  const [evidence, setEvidence] = useState(initialEvidence);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    cargar();
  }, [id]);

  async function cargar() {
    try {
      setLoading(true);
      setError("");

      const [animalRes, protocoloRes] =
        await Promise.all([
          api.get(`/api/animales/${id}`),
          api.get(`/api/animales/${id}/protocolo`),
        ]);

      setAnimal(animalRes.data.animal);
      setProtocolo(protocoloRes.data.protocolo);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No se pudo cargar el protocolo."
      );
    } finally {
      setLoading(false);
    }
  }

  function set(campo, valor) {
    setEvidence((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  async function subirEvidencia(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!evidence.tipo) {
      setError("Seleccioná el tipo de evidencia.");
      return;
    }

    if (!evidence.archivo) {
      setError("Seleccioná un archivo.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append(
        "tipo",
        evidence.tipo
      );

      formData.append(
        "archivo",
        evidence.archivo
      );

      if (evidence.fecha_emision) {
        formData.append(
          "fecha_emision",
          evidence.fecha_emision
        );
      }

      if (evidence.fecha_vencimiento) {
        formData.append(
          "fecha_vencimiento",
          evidence.fecha_vencimiento
        );
      }

      const { data } = await api.post(
        `/api/animales/${id}/evidencias`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setProtocolo(data.protocolo);

      setAnimal((prev) => ({
        ...prev,
        estado: "PROTOCOLO_SANITARIO",
      }));

      setEvidence(initialEvidence);

      const fileInput =
        document.getElementById(
          "evidencia-archivo"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      setSuccess(
        "Evidencia registrada correctamente."
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No se pudo registrar la evidencia."
      );
    } finally {
      setUploading(false);
    }
  }

  async function solicitarValidacion() {
    setError("");
    setSuccess("");

    try {
      setRequesting(true);

      await api.post(
        `/api/animales/${id}/solicitar-validacion`
      );

      setSuccess(
        "Solicitud enviada al Validador."
      );

      setAnimal((prev) => ({
        ...prev,
        estado: "VALIDACION",
      }));

      setTimeout(() => {
        navigate("/protocolos");
      }, 900);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No se pudo solicitar la validación."
      );
    } finally {
      setRequesting(false);
    }
  }

  if (loading) {
    return (
      <Container>
        <Subtitle>
          Cargando protocolo sanitario...
        </Subtitle>
      </Container>
    );
  }

  if (!animal || !protocolo) {
    return (
      <Container>
        <ErrorBox>
          No se pudo cargar el protocolo.
        </ErrorBox>
      </Container>
    );
  }

  const puedeOperar =
    animal.estado === "EVALUACION" ||
    animal.estado ===
      "PROTOCOLO_SANITARIO";

  const enValidacion =
    animal.estado === "VALIDACION";

  const completo =
    Number(protocolo.completo) === 1 ||
    Number(
      protocolo.porcentaje_cumplimiento
    ) === 100;

  const parasitos =
    Number(
      protocolo.control_parasitos
    ) === 1;

  const rabia =
    Number(
      protocolo.vacuna_antirrabica
    ) === 1;

  const porcentaje =
    Number(
      protocolo.porcentaje_cumplimiento
    ) || 0;

  return (
    <Container>
      <BackButton
        type="button"
        onClick={() =>
          navigate("/protocolos")
        }
      >
        <ArrowLeft size={16} />
        Volver a protocolos
      </BackButton>

      <Header>
        <div>
          <TopBadges>
            <StepBadge>
              PASO 3 · PROTOCOLO SANITARIO
            </StepBadge>

            <CodeBadge>
              {animal.codigo}
            </CodeBadge>
          </TopBadges>

          <Title>
            Ficha de Evaluación Sanitaria
          </Title>

          <Subtitle>
            Completá los requisitos sanitarios y
            adjuntá las evidencias necesarias antes
            de solicitar la validación.
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

      <AnimalCard>
        <AnimalIcon>
          <PawPrint size={26} />
        </AnimalIcon>

        <AnimalInfo>
          <strong>
            {animal.nombre}
          </strong>

          <span>
            {animal.especie}
            {animal.raza
              ? ` · ${animal.raza}`
              : ""}
            {animal.sexo
              ? ` · ${animal.sexo}`
              : ""}
            {animal.edad_estimada !== null
              ? ` · ${animal.edad_estimada} años`
              : ""}
          </span>

          <small>
            {animal.refugio}
            {animal.sector
              ? ` · ${animal.sector}`
              : ""}
          </small>
        </AnimalInfo>

        <StateBadge>
          {animal.estado.replaceAll(
            "_",
            " "
          )}
        </StateBadge>
      </AnimalCard>

      {enValidacion && (
        <ValidationNotice>
          <ShieldCheck size={20} />

          <div>
            <strong>
              Protocolo enviado a validación
            </strong>

            <span>
              El animal está siendo revisado por un
              usuario Validador. No se pueden cargar
              nuevas evidencias mientras permanezca
              en este estado.
            </span>
          </div>
        </ValidationNotice>
      )}

      {!puedeOperar && !enValidacion && (
        <Warning>
          <AlertTriangle size={18} />

          <div>
            <strong>
              El protocolo no puede modificarse en
              el estado actual.
            </strong>

            <span>
              Estado actual: {animal.estado}
            </span>
          </div>
        </Warning>
      )}

      <Layout>
        <MainColumn>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>
                  <ShieldCheck size={18} />
                  Cumplimiento del Protocolo
                </CardTitle>

                <Description>
                  El motor de reglas requiere ambos
                  controles obligatorios antes de
                  enviar el caso al Validador.
                </Description>
              </div>

              <Percentage>
                {porcentaje}%
              </Percentage>
            </CardHeader>

            <ProgressTrack>
              <ProgressBar
                style={{
                  width: `${porcentaje}%`,
                }}
              />
            </ProgressTrack>

            <Requirements>
              <Requirement
                $complete={parasitos}
              >
                <RequirementIcon
                  $complete={parasitos}
                >
                  {parasitos ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <FileCheck2 size={20} />
                  )}
                </RequirementIcon>

                <div>
                  <strong>
                    Control de parásitos
                  </strong>

                  <span>
                    Evidencia de desparasitación
                    vigente.
                  </span>
                </div>

                <RequirementStatus
                  $complete={parasitos}
                >
                  {parasitos
                    ? "CUMPLIDO"
                    : "PENDIENTE"}
                </RequirementStatus>
              </Requirement>

              <Requirement
                $complete={rabia}
              >
                <RequirementIcon
                  $complete={rabia}
                >
                  {rabia ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <Syringe size={20} />
                  )}
                </RequirementIcon>

                <div>
                  <strong>
                    Vacuna antirrábica
                  </strong>

                  <span>
                    Certificación de vacunación
                    vigente.
                  </span>
                </div>

                <RequirementStatus
                  $complete={rabia}
                >
                  {rabia
                    ? "CUMPLIDO"
                    : "PENDIENTE"}
                </RequirementStatus>
              </Requirement>
            </Requirements>
          </Card>

          <Card>
            <CardTitle>
              <FileUp size={18} />
              Cargar Evidencia Sanitaria
            </CardTitle>

            <Description>
              Los archivos quedan asociados al
              animal y al protocolo sanitario.
            </Description>

            <form onSubmit={subirEvidencia}>
              <FormGrid>
                <Field>
                  <label>
                    Tipo de evidencia *
                  </label>

                  <select
                    value={evidence.tipo}
                    onChange={(e) =>
                      set(
                        "tipo",
                        e.target.value
                      )
                    }
                    disabled={!puedeOperar}
                  >
                    <option value="DESPARASITACION">
                      Desparasitación
                    </option>

                    <option value="VACUNACION">
                      Vacunación
                    </option>

                    <option value="CERTIFICADO">
                      Certificado
                    </option>

                    <option value="FOTO">
                      Fotografía
                    </option>

                    <option value="OTRO">
                      Otro
                    </option>
                  </select>
                </Field>

                <Field>
                  <label>
                    Archivo *
                  </label>

                  <input
                    id="evidencia-archivo"
                    type="file"
                    onChange={(e) =>
                      set(
                        "archivo",
                        e.target.files?.[0] ||
                          null
                      )
                    }
                    disabled={!puedeOperar}
                  />
                </Field>

                <Field>
                  <label>
                    Fecha de emisión
                  </label>

                  <input
                    type="date"
                    value={
                      evidence.fecha_emision
                    }
                    onChange={(e) =>
                      set(
                        "fecha_emision",
                        e.target.value
                      )
                    }
                    disabled={!puedeOperar}
                  />
                </Field>

                <Field>
                  <label>
                    Fecha de vencimiento
                  </label>

                  <input
                    type="date"
                    value={
                      evidence.fecha_vencimiento
                    }
                    onChange={(e) =>
                      set(
                        "fecha_vencimiento",
                        e.target.value
                      )
                    }
                    disabled={!puedeOperar}
                  />
                </Field>
              </FormGrid>

              <UploadButton
                type="submit"
                disabled={
                  uploading ||
                  !puedeOperar
                }
              >
                <FileUp size={17} />

                {uploading
                  ? "Subiendo evidencia..."
                  : "Registrar evidencia"}
              </UploadButton>
            </form>
          </Card>
        </MainColumn>

        <SideColumn>
          <Card>
            <CardTitle>
              <ShieldCheck size={18} />
              Estado del Protocolo
            </CardTitle>

            <Summary>
              <SummaryRow>
                <span>
                  Control de parásitos
                </span>

                <SummaryValue
                  $good={parasitos}
                >
                  {parasitos
                    ? "Cumplido"
                    : "Pendiente"}
                </SummaryValue>
              </SummaryRow>

              <SummaryRow>
                <span>
                  Vacuna antirrábica
                </span>

                <SummaryValue
                  $good={rabia}
                >
                  {rabia
                    ? "Cumplida"
                    : "Pendiente"}
                </SummaryValue>
              </SummaryRow>

              <SummaryRow>
                <span>
                  Cumplimiento
                </span>

                <strong>
                  {porcentaje}%
                </strong>
              </SummaryRow>

              <SummaryRow>
                <span>
                  Estado
                </span>

                <strong>
                  {completo
                    ? "COMPLETO"
                    : "INCOMPLETO"}
                </strong>
              </SummaryRow>
            </Summary>
          </Card>

          <RulesCard $complete={completo}>
            {completo ? (
              <>
                <CheckCircle2 size={25} />

                <strong>
                  Protocolo completo
                </strong>

                <span>
                  Se cumplen las reglas necesarias
                  para solicitar la revisión del
                  Validador.
                </span>
              </>
            ) : (
              <>
                <AlertTriangle size={25} />

                <strong>
                  Requisitos pendientes
                </strong>

                <span>
                  Deben completarse todos los
                  requisitos obligatorios antes de
                  solicitar validación.
                </span>
              </>
            )}
          </RulesCard>

          <RequestButton
            type="button"
            onClick={solicitarValidacion}
            disabled={
              requesting ||
              !completo ||
              !puedeOperar
            }
          >
            <Send size={17} />

            {requesting
              ? "Enviando..."
              : "Solicitar Validación"}
          </RequestButton>

          <HelpText>
            Al solicitar validación, el animal
            cambiará a estado{" "}
            <strong>VALIDACION</strong> y aparecerá
            en la bandeja del Validador.
          </HelpText>
        </SideColumn>
      </Layout>
    </Container>
  );
}

const BackButton = styled.button`
  border: 0;
  background: transparent;
  color: #7e9388;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0;
  margin-bottom: 22px;
  cursor: pointer;
  font-size: 0.82rem;

  &:hover {
    color: #86efac;
  }
`;

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
  color: #4ade80;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.22);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.7rem;
  font-weight: 900;
`;

const CodeBadge = styled.span`
  color: #64748b;
  font-family: monospace;
  font-size: 0.75rem;
`;

const SuccessBox = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  color: #86efac;
  background: rgba(34, 197, 94, 0.07);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 18px;
  font-size: 0.8rem;
`;

const AnimalCard = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(13, 27, 20, 0.85);
  border: 1px solid #20392d;
  border-radius: 17px;
  padding: 18px;
  margin-bottom: 20px;
`;

const AnimalIcon = styled.div`
  width: 54px;
  height: 54px;
  border-radius: 15px;
  background: rgba(34, 197, 94, 0.09);
  border: 1px solid rgba(34, 197, 94, 0.18);
  display: grid;
  place-items: center;

  svg {
    color: #4ade80;
  }
`;

const AnimalInfo = styled.div`
  flex: 1;

  strong {
    display: block;
    color: #f1f5f9;
    font-size: 1rem;
  }

  span {
    display: block;
    color: #8ba096;
    font-size: 0.78rem;
    margin-top: 4px;
  }

  small {
    display: block;
    color: #62766c;
    margin-top: 4px;
    font-size: 0.72rem;
  }
`;

const StateBadge = styled.span`
  color: #4ade80;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 999px;
  padding: 7px 10px;
  font-family: monospace;
  font-size: 0.7rem;
  font-weight: 800;
`;

const Warning = styled.div`
  display: flex;
  gap: 11px;
  padding: 14px 16px;
  margin-bottom: 20px;
  border-radius: 13px;
  background: rgba(245, 158, 11, 0.07);
  border: 1px solid rgba(245, 158, 11, 0.2);

  svg {
    flex-shrink: 0;
    color: #fbbf24;
  }

  strong {
    display: block;
    color: #fcd34d;
    font-size: 0.8rem;
  }

  span {
    display: block;
    color: #8d8065;
    font-size: 0.73rem;
    margin-top: 4px;
  }
`;

const ValidationNotice = styled(Warning)`
  background: rgba(56, 189, 248, 0.06);
  border-color: rgba(56, 189, 248, 0.2);

  svg {
    color: #38bdf8;
  }

  strong {
    color: #7dd3fc;
  }

  span {
    color: #668693;
  }
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns:
    minmax(0, 2fr)
    minmax(280px, 1fr);
  gap: 20px;
  align-items: start;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div`
  display: grid;
  gap: 18px;
`;

const SideColumn = styled.div`
  display: grid;
  gap: 18px;
`;

const Card = styled.section`
  background: rgba(13, 27, 20, 0.82);
  border: 1px solid #20392d;
  border-radius: 18px;
  padding: 22px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
`;

const CardTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 14px;
  color: #f1f5f9;
  font-size: 0.92rem;

  svg {
    color: #4ade80;
  }
`;

const Description = styled.p`
  color: #6e8378;
  font-size: 0.75rem;
  margin: -5px 0 16px;
  line-height: 1.5;
`;

const Percentage = styled.div`
  font-size: 1.4rem;
  color: #86efac;
  font-weight: 900;
  font-family: monospace;
`;

const ProgressTrack = styled.div`
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #09150f;
  border: 1px solid #213b2e;
  margin-bottom: 19px;
`;

const ProgressBar = styled.div`
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    #16a34a,
    #4ade80
  );
  transition: width 0.3s ease;
`;

const Requirements = styled.div`
  display: grid;
  gap: 10px;
`;

const Requirement = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: ${(p) =>
    p.$complete
      ? "rgba(34,197,94,.05)"
      : "#09150f"};
  border: 1px solid
    ${(p) =>
      p.$complete
        ? "rgba(34,197,94,.2)"
        : "#294638"};

  strong {
    display: block;
    color: #e4eee8;
    font-size: 0.8rem;
  }

  span {
    display: block;
    color: #65796f;
    font-size: 0.7rem;
    margin-top: 3px;
  }
`;

const RequirementIcon = styled.div`
  width: 37px;
  height: 37px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: ${(p) =>
    p.$complete
      ? "rgba(34,197,94,.1)"
      : "#14231b"};

  svg {
    color: ${(p) =>
      p.$complete
        ? "#4ade80"
        : "#71867b"};
  }
`;

const RequirementStatus = styled.div`
  color: ${(p) =>
    p.$complete
      ? "#4ade80"
      : "#fbbf24"};
  font-family: monospace;
  font-size: 0.67rem;
  font-weight: 800;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 15px;

  @media (max-width: 650px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: grid;
  gap: 7px;
  margin-bottom: 14px;

  label {
    color: #72877c;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  input,
  select {
    width: 100%;
    padding: 11px 13px;
    color: #edf7f1;
    background: #09150f;
    border: 1px solid #294638;
    border-radius: 11px;
    font: inherit;
    outline: none;
  }

  input:focus,
  select:focus {
    border-color: #22c55e;
  }

  input:disabled,
  select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const UploadButton = styled.button`
  border: 1px solid rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.08);
  color: #86efac;
  border-radius: 11px;
  padding: 11px 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 800;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Summary = styled.div`
  display: grid;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #1c3328;

  &:last-child {
    border-bottom: 0;
  }

  span {
    color: #6c8176;
    font-size: 0.72rem;
  }

  strong {
    color: #d8e5de;
    font-size: 0.72rem;
  }
`;

const SummaryValue = styled.strong`
  color: ${(p) =>
    p.$good
      ? "#4ade80 !important"
      : "#fbbf24 !important"};
`;

const RulesCard = styled.div`
  border-radius: 16px;
  padding: 20px;
  text-align: center;

  background: ${(p) =>
    p.$complete
      ? "rgba(34,197,94,.06)"
      : "rgba(245,158,11,.06)"};

  border: 1px solid
    ${(p) =>
      p.$complete
        ? "rgba(34,197,94,.2)"
        : "rgba(245,158,11,.2)"};

  svg {
    color: ${(p) =>
      p.$complete
        ? "#4ade80"
        : "#fbbf24"};
    margin-bottom: 8px;
  }

  strong {
    display: block;
    color: #e4eee8;
    font-size: 0.82rem;
  }

  span {
    display: block;
    margin-top: 5px;
    color: #6e8378;
    font-size: 0.71rem;
    line-height: 1.5;
  }
`;

const RequestButton = styled.button`
  width: 100%;
  border: 0;
  border-radius: 13px;
  padding: 14px 16px;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  color: #041008;
  background: linear-gradient(
    135deg,
    #22c55e,
    #16a34a
  );

  font-weight: 900;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const HelpText = styled.p`
  margin: -5px 5px 0;
  color: #61766b;
  font-size: 0.7rem;
  line-height: 1.5;
  text-align: center;

  strong {
    color: #38bdf8;
    font-family: monospace;
  }
`;