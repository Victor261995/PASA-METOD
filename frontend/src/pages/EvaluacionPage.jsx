import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  HeartPulse,
  PawPrint,
  Scale,
  Stethoscope,
  Thermometer,
  Users,
} from "lucide-react";

import api from "../api/api";
import {
  Container,
  ErrorBox,
  Subtitle,
  Title,
} from "../styles/ui";

const initialForm = {
  peso: "",
  temperatura: "",
  frecuencia_cardiaca: "",
  frecuencia_respiratoria: "",
  condicion_corporal: "",
  comportamiento: "",
  socializacion_personas: "",
  socializacion_animales: "",
  estado_pelaje: "",
  estado_ojos: "",
  marcha: "",
  observaciones: "",
  criterio_operador: "APTO_PROTOCOLO",
};

export default function EvaluacionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [animal, setAnimal] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarAnimal();
  }, [id]);

  async function cargarAnimal() {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get(
        `/api/animales/${id}`
      );

      setAnimal(data.animal);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No se pudo cargar el animal."
      );
    } finally {
      setLoading(false);
    }
  }

  function set(campo, valor) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  async function submit(e) {
    e.preventDefault();

    setError("");

    if (!form.criterio_operador) {
      setError(
        "Seleccioná un criterio clínico final."
      );
      return;
    }

    if (
      form.condicion_corporal !== "" &&
      (
        Number(form.condicion_corporal) < 1 ||
        Number(form.condicion_corporal) > 9
      )
    ) {
      setError(
        "La condición corporal debe estar entre 1 y 9."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        peso:
          form.peso === ""
            ? null
            : Number(form.peso),

        temperatura:
          form.temperatura === ""
            ? null
            : Number(form.temperatura),

        frecuencia_cardiaca:
          form.frecuencia_cardiaca === ""
            ? null
            : Number(form.frecuencia_cardiaca),

        frecuencia_respiratoria:
          form.frecuencia_respiratoria === ""
            ? null
            : Number(form.frecuencia_respiratoria),

        condicion_corporal:
          form.condicion_corporal === ""
            ? null
            : Number(form.condicion_corporal),

        comportamiento:
          form.comportamiento || null,

        socializacion_personas:
          form.socializacion_personas.trim() ||
          null,

        socializacion_animales:
          form.socializacion_animales.trim() ||
          null,

        estado_pelaje:
          form.estado_pelaje.trim() || null,

        estado_ojos:
          form.estado_ojos.trim() || null,

        marcha:
          form.marcha.trim() || null,

        observaciones:
          form.observaciones.trim() || null,

        criterio_operador:
          form.criterio_operador,
      };

      const { data } = await api.post(
        `/api/animales/${id}/evaluaciones`,
        payload
      );

      if (data.estado === "CUARENTENA") {
        navigate(`/animales/${id}`);
        return;
      }

      navigate(`/animales/${id}/protocolo`);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No se pudo registrar la evaluación."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Container>
        <Subtitle>
          Cargando evaluación...
        </Subtitle>
      </Container>
    );
  }

  if (!animal) {
    return (
      <Container>
        <ErrorBox>
          No se pudo cargar el animal.
        </ErrorBox>
      </Container>
    );
  }

  const puedeEvaluar =
    animal.estado === "INGRESADO";

  return (
    <Container>
      <BackButton
        type="button"
        onClick={() =>
          navigate("/evaluaciones")
        }
      >
        <ArrowLeft size={16} />
        Volver a evaluaciones
      </BackButton>

      <Header>
        <div>
          <TopBadges>
            <StepBadge>
              PASO 2 · EVALUACIÓN CLÍNICA
            </StepBadge>

            <CodeBadge>
              {animal.codigo}
            </CodeBadge>
          </TopBadges>

          <Title>
            Evaluación del Operador
          </Title>

          <Subtitle>
            Registrá la evaluación clínica inicial
            del animal. El resultado determinará si
            continúa al protocolo sanitario o si
            requiere cuarentena.
          </Subtitle>
        </div>
      </Header>

      {error && (
        <ErrorBox>
          {error}
        </ErrorBox>
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

      {!puedeEvaluar && (
        <Warning>
          <AlertTriangle size={18} />

          <div>
            <strong>
              Este animal ya no se encuentra en
              estado INGRESADO.
            </strong>

            <span>
              La evaluación clínica inicial solo
              puede registrarse una vez.
            </span>
          </div>
        </Warning>
      )}

      <form onSubmit={submit}>
        <Layout>
          <MainColumn>
            <Card>
              <CardTitle>
                <HeartPulse size={18} />
                Parámetros Clínicos
              </CardTitle>

              <FormGrid>
                <Field>
                  <label>
                    Peso
                  </label>

                  <InputWithUnit>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="12.40"
                      value={form.peso}
                      onChange={(e) =>
                        set(
                          "peso",
                          e.target.value
                        )
                      }
                      disabled={!puedeEvaluar}
                    />

                    <span>
                      kg
                    </span>
                  </InputWithUnit>
                </Field>

                <Field>
                  <label>
                    Temperatura
                  </label>

                  <InputWithUnit>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="38.5"
                      value={
                        form.temperatura
                      }
                      onChange={(e) =>
                        set(
                          "temperatura",
                          e.target.value
                        )
                      }
                      disabled={!puedeEvaluar}
                    />

                    <span>
                      °C
                    </span>
                  </InputWithUnit>
                </Field>

                <Field>
                  <label>
                    Frecuencia cardíaca
                  </label>

                  <InputWithUnit>
                    <input
                      type="number"
                      min="0"
                      placeholder="90"
                      value={
                        form.frecuencia_cardiaca
                      }
                      onChange={(e) =>
                        set(
                          "frecuencia_cardiaca",
                          e.target.value
                        )
                      }
                      disabled={!puedeEvaluar}
                    />

                    <span>
                      lpm
                    </span>
                  </InputWithUnit>
                </Field>

                <Field>
                  <label>
                    Frecuencia respiratoria
                  </label>

                  <InputWithUnit>
                    <input
                      type="number"
                      min="0"
                      placeholder="24"
                      value={
                        form.frecuencia_respiratoria
                      }
                      onChange={(e) =>
                        set(
                          "frecuencia_respiratoria",
                          e.target.value
                        )
                      }
                      disabled={!puedeEvaluar}
                    />

                    <span>
                      rpm
                    </span>
                  </InputWithUnit>
                </Field>
              </FormGrid>
            </Card>

            <Card>
              <CardTitle>
                <Scale size={18} />
                Condición Corporal
              </CardTitle>

              <Description>
                Escala corporal de 1 a 9.
              </Description>

              <ScoreGrid>
                {[1,2,3,4,5,6,7,8,9].map(
                  (n) => (
                    <ScoreButton
                      key={n}
                      type="button"
                      $selected={
                        Number(
                          form.condicion_corporal
                        ) === n
                      }
                      onClick={() =>
                        set(
                          "condicion_corporal",
                          String(n)
                        )
                      }
                      disabled={!puedeEvaluar}
                    >
                      {n}
                    </ScoreButton>
                  )
                )}
              </ScoreGrid>

              <ScaleLabels>
                <span>
                  Bajo peso
                </span>

                <span>
                  Ideal
                </span>

                <span>
                  Sobrepeso
                </span>
              </ScaleLabels>
            </Card>

            <Card>
              <CardTitle>
                <Activity size={18} />
                Estado General
              </CardTitle>

              <FormGrid>
                <Field>
                  <label>
                    Estado del pelaje
                  </label>

                  <input
                    type="text"
                    placeholder="ej. Limpio, brillante, sin lesiones"
                    value={
                      form.estado_pelaje
                    }
                    onChange={(e) =>
                      set(
                        "estado_pelaje",
                        e.target.value
                      )
                    }
                    disabled={!puedeEvaluar}
                  />
                </Field>

                <Field>
                  <label>
                    Estado de los ojos
                  </label>

                  <input
                    type="text"
                    placeholder="ej. Claros, sin secreciones"
                    value={form.estado_ojos}
                    onChange={(e) =>
                      set(
                        "estado_ojos",
                        e.target.value
                      )
                    }
                    disabled={!puedeEvaluar}
                  />
                </Field>

                <Field>
                  <label>
                    Marcha
                  </label>

                  <input
                    type="text"
                    placeholder="ej. Normal, sin claudicación"
                    value={form.marcha}
                    onChange={(e) =>
                      set(
                        "marcha",
                        e.target.value
                      )
                    }
                    disabled={!puedeEvaluar}
                  />
                </Field>

                <Field>
                  <label>
                    Comportamiento
                  </label>

                  <select
                    value={
                      form.comportamiento
                    }
                    onChange={(e) =>
                      set(
                        "comportamiento",
                        e.target.value
                      )
                    }
                    disabled={!puedeEvaluar}
                  >
                    <option value="">
                      Sin evaluar
                    </option>

                    <option value="DOCIL">
                      Dócil
                    </option>

                    <option value="ANSIOSO">
                      Ansioso
                    </option>

                    <option value="AGRESIVO">
                      Agresivo
                    </option>
                  </select>
                </Field>
              </FormGrid>
            </Card>

            <Card>
              <CardTitle>
                <Users size={18} />
                Socialización
              </CardTitle>

              <FormGrid>
                <Field>
                  <label>
                    Con personas
                  </label>

                  <input
                    type="text"
                    placeholder="ej. Buena, se acerca sin miedo"
                    value={
                      form.socializacion_personas
                    }
                    onChange={(e) =>
                      set(
                        "socializacion_personas",
                        e.target.value
                      )
                    }
                    disabled={!puedeEvaluar}
                  />
                </Field>

                <Field>
                  <label>
                    Con otros animales
                  </label>

                  <input
                    type="text"
                    placeholder="ej. Media, tolera interacción"
                    value={
                      form.socializacion_animales
                    }
                    onChange={(e) =>
                      set(
                        "socializacion_animales",
                        e.target.value
                      )
                    }
                    disabled={!puedeEvaluar}
                  />
                </Field>
              </FormGrid>

              <Field>
                <label>
                  Observaciones clínicas
                </label>

                <textarea
                  rows="5"
                  placeholder="Describí cualquier hallazgo relevante, lesiones, conducta, signos clínicos u observaciones adicionales..."
                  value={
                    form.observaciones
                  }
                  onChange={(e) =>
                    set(
                      "observaciones",
                      e.target.value
                    )
                  }
                  disabled={!puedeEvaluar}
                />
              </Field>
            </Card>
          </MainColumn>

          <SideColumn>
            <Card>
              <CardTitle>
                <Stethoscope size={18} />
                Criterio del Operador
              </CardTitle>

              <Description>
                Seleccioná el resultado de la
                evaluación clínica.
              </Description>

              <CriteriaGrid>
                <CriteriaCard
                  type="button"
                  $selected={
                    form.criterio_operador ===
                    "APTO_PROTOCOLO"
                  }
                  $variant="green"
                  onClick={() =>
                    set(
                      "criterio_operador",
                      "APTO_PROTOCOLO"
                    )
                  }
                  disabled={!puedeEvaluar}
                >
                  <CheckCircle2 size={20} />

                  <div>
                    <strong>
                      Apto para protocolo
                    </strong>

                    <span>
                      Continúa al protocolo
                      sanitario.
                    </span>
                  </div>
                </CriteriaCard>

                <CriteriaCard
                  type="button"
                  $selected={
                    form.criterio_operador ===
                    "REQUIERE_ATENCION"
                  }
                  $variant="yellow"
                  onClick={() =>
                    set(
                      "criterio_operador",
                      "REQUIERE_ATENCION"
                    )
                  }
                  disabled={!puedeEvaluar}
                >
                  <AlertTriangle size={20} />

                  <div>
                    <strong>
                      Requiere atención
                    </strong>

                    <span>
                      Presenta observaciones pero
                      puede continuar.
                    </span>
                  </div>
                </CriteriaCard>

                <CriteriaCard
                  type="button"
                  $selected={
                    form.criterio_operador ===
                    "CUARENTENA"
                  }
                  $variant="red"
                  onClick={() =>
                    set(
                      "criterio_operador",
                      "CUARENTENA"
                    )
                  }
                  disabled={!puedeEvaluar}
                >
                  <Eye size={20} />

                  <div>
                    <strong>
                      Cuarentena
                    </strong>

                    <span>
                      No continúa al protocolo
                      sanitario.
                    </span>
                  </div>
                </CriteriaCard>
              </CriteriaGrid>
            </Card>

            <Card>
              <CardTitle>
                <Thermometer size={18} />
                Resumen de evaluación
              </CardTitle>

              <Summary>
                <SummaryRow>
                  <span>
                    Animal
                  </span>

                  <strong>
                    {animal.nombre}
                  </strong>
                </SummaryRow>

                <SummaryRow>
                  <span>
                    Estado actual
                  </span>

                  <strong>
                    {animal.estado}
                  </strong>
                </SummaryRow>

                <SummaryRow>
                  <span>
                    Peso
                  </span>

                  <strong>
                    {form.peso
                      ? `${form.peso} kg`
                      : "—"}
                  </strong>
                </SummaryRow>

                <SummaryRow>
                  <span>
                    Temperatura
                  </span>

                  <strong>
                    {form.temperatura
                      ? `${form.temperatura} °C`
                      : "—"}
                  </strong>
                </SummaryRow>

                <SummaryRow>
                  <span>
                    Condición corporal
                  </span>

                  <strong>
                    {form.condicion_corporal ||
                      "—"}
                  </strong>
                </SummaryRow>
              </Summary>
            </Card>

            <SubmitButton
              type="submit"
              disabled={
                saving ||
                !puedeEvaluar
              }
            >
              <CheckCircle2 size={18} />

              {saving
                ? "Guardando evaluación..."
                : "Finalizar Evaluación"}
            </SubmitButton>

            <HelpText>
              Al finalizar, el sistema registrará
              el evento en Auditoría y modificará
              automáticamente el estado del animal.
            </HelpText>
          </SideColumn>
        </Layout>
      </form>
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
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.22);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.7rem;
  font-weight: 900;
`;

const CodeBadge = styled.span`
  color: #64748b;
  font-size: 0.75rem;
  font-family: monospace;
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
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 999px;
  padding: 7px 10px;
  font-family: monospace;
  font-size: 0.7rem;
  font-weight: 800;
`;

const Warning = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin-bottom: 20px;
  padding: 14px 16px;
  border-radius: 13px;
  background: rgba(245, 158, 11, 0.07);
  border: 1px solid rgba(245, 158, 11, 0.2);

  svg {
    color: #fbbf24;
    margin-top: 2px;
  }

  strong {
    display: block;
    color: #fcd34d;
    font-size: 0.8rem;
  }

  span {
    display: block;
    color: #8d8065;
    font-size: 0.74rem;
    margin-top: 4px;
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

const CardTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 16px;
  color: #f1f5f9;
  font-size: 0.92rem;

  svg {
    color: #fbbf24;
  }
`;

const Description = styled.p`
  color: #6e8378;
  font-size: 0.75rem;
  margin: -6px 0 15px;
  line-height: 1.5;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 650px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: grid;
  gap: 7px;
  margin-bottom: 15px;

  label {
    color: #72877c;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  input,
  select,
  textarea {
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
  select:focus,
  textarea:focus {
    border-color: #22c55e;
    box-shadow:
      0 0 0 3px rgba(34, 197, 94, 0.08);
  }

  textarea {
    resize: vertical;
  }

  input:disabled,
  select:disabled,
  textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InputWithUnit = styled.div`
  position: relative;

  input {
    padding-right: 50px;
  }

  span {
    position: absolute;
    right: 13px;
    top: 50%;
    transform: translateY(-50%);
    color: #667b70;
    font-size: 0.72rem;
    pointer-events: none;
  }
`;

const ScoreGrid = styled.div`
  display: grid;
  grid-template-columns:
    repeat(9, 1fr);
  gap: 6px;

  @media (max-width: 650px) {
    grid-template-columns:
      repeat(5, 1fr);
  }
`;

const ScoreButton = styled.button`
  border-radius: 9px;
  padding: 9px 3px;
  cursor: pointer;

  border: 1px solid
    ${(p) =>
      p.$selected
        ? "#22c55e"
        : "#294638"};

  background:
    ${(p) =>
      p.$selected
        ? "rgba(34,197,94,.12)"
        : "#09150f"};

  color:
    ${(p) =>
      p.$selected
        ? "#86efac"
        : "#71877c"};

  font-weight: 800;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const ScaleLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: #566b60;
  font-size: 0.66rem;
`;

const CriteriaGrid = styled.div`
  display: grid;
  gap: 9px;
`;

const CriteriaCard = styled.button`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 11px;
  text-align: left;
  padding: 13px;
  border-radius: 12px;
  cursor: pointer;

  background:
    ${(p) =>
      p.$selected
        ? p.$variant === "green"
          ? "rgba(34,197,94,.08)"
          : p.$variant === "yellow"
          ? "rgba(245,158,11,.08)"
          : "rgba(239,68,68,.08)"
        : "#09150f"};

  border: 1px solid
    ${(p) =>
      p.$selected
        ? p.$variant === "green"
          ? "rgba(34,197,94,.42)"
          : p.$variant === "yellow"
          ? "rgba(245,158,11,.42)"
          : "rgba(239,68,68,.42)"
        : "#294638"};

  svg {
    flex-shrink: 0;
    color:
      ${(p) =>
        p.$variant === "green"
          ? "#4ade80"
          : p.$variant === "yellow"
          ? "#fbbf24"
          : "#f87171"};
  }

  strong {
    display: block;
    color: #e5efe9;
    font-size: 0.78rem;
  }

  span {
    display: block;
    color: #667b70;
    font-size: 0.7rem;
    line-height: 1.45;
    margin-top: 3px;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Summary = styled.div`
  display: grid;
  gap: 1px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 15px;
  padding: 9px 0;
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
    text-align: right;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  border: 0;
  border-radius: 13px;
  padding: 14px 16px;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  color: #051209;
  background: linear-gradient(
    135deg,
    #22c55e,
    #16a34a
  );

  font-weight: 900;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HelpText = styled.p`
  margin: -5px 4px 0;
  color: #61766b;
  font-size: 0.7rem;
  line-height: 1.5;
  text-align: center;
`;