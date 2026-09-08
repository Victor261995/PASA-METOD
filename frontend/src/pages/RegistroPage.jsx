import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  Camera,
  Clock3,
  MapPin,
  PawPrint,
  Plus,
  UserRound,
  X,
} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
  Container,
  ErrorBox,
  Title,
  Subtitle,
} from "../styles/ui";

const initialForm = {
  nombre: "",
  especie: "",
  raza: "",
  edad_estimada: "",
  sexo: "",
  color: "",
  descripcion_fisica: "",
  refugio: "Refugio Norte",
  sector: "Sector B",
  forma_ingreso: "RESCATE",
  observaciones_ingreso: "",
};

const formasIngreso = [
  {
    value: "RESCATE",
    titulo: "Rescate",
    descripcion: "Calle",
  },
  {
    value: "DONACION",
    titulo: "Donación",
    descripcion: "Dueño",
  },
  {
    value: "TRASLADO",
    titulo: "Traslado",
    descripcion: "Otro refugio",
  },
  {
    value: "DECOMISO",
    titulo: "Decomiso",
    descripcion: "Municipal",
  },
];

export default function RegistroPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);

  const inputFoto = useRef(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  function set(campo, valor) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function seleccionarFoto(file) {
    if (!file) return;

    const formatosPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!formatosPermitidos.includes(file.type)) {
      setError("La fotografía debe ser JPG, PNG o WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La fotografía no puede superar los 5 MB.");
      return;
    }

    setError("");
    setFoto(file);

    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function eliminarFoto() {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFoto(null);
    setPreview(null);

    if (inputFoto.current) {
      inputFoto.current.value = "";
    }
  }

  function manejarDrop(e) {
    e.preventDefault();

    const file = e.dataTransfer.files?.[0];

    if (file) {
      seleccionarFoto(file);
    }
  }

  async function submit(e) {
    e.preventDefault();

    setError("");

    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!form.especie) {
      setError("Seleccioná una especie.");
      return;
    }

    if (!form.sexo) {
      setError("Seleccioná el sexo.");
      return;
    }

    if (!form.refugio.trim()) {
      setError("El refugio es obligatorio.");
      return;
    }

    try {
      setSaving(true);

      const { data } = await api.post("/api/animales", {
        ...form,

        nombre: form.nombre.trim(),
        raza: form.raza.trim() || null,
        color: form.color.trim() || null,

        edad_estimada:
          form.edad_estimada === ""
            ? null
            : Number(form.edad_estimada),

        descripcion_fisica:
          form.descripcion_fisica.trim() || null,

        sector:
          form.sector.trim() || null,

        observaciones_ingreso:
          form.observaciones_ingreso.trim() || null,
      });

      const animal = data.animal;

      /*
       * La foto se va a guardar mediante el endpoint
       * /api/animales/:id/foto que agregamos abajo.
       */
      if (foto) {
        const formData = new FormData();

        formData.append("foto", foto);

        await api.post(
          `/api/animales/${animal.id}/foto`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      navigate(`/animales/${animal.id}`);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "No se pudo registrar el animal."
      );
    } finally {
      setSaving(false);
    }
  }

  const iniciales = user?.nombre
    ? `${user.nombre?.[0] ?? ""}${user.apellido?.[0] ?? ""}`
        .toUpperCase()
    : "OP";

  return (
    <Container>
      <Header>
        <div>
          <TopBadges>
            <StepBadge>PASO 1 · REGISTRO</StepBadge>
            <CodeBadge>#NUEVO REGISTRO</CodeBadge>
          </TopBadges>

          <Title>Registro de Animal</Title>

          <Subtitle>
            Ingresá los datos del animal. El sistema asignará
            automáticamente el estado inicial{" "}
            <StateText>INGRESADO</StateText>.
          </Subtitle>
        </div>
      </Header>

      {error && <ErrorBox>{error}</ErrorBox>}

      <form onSubmit={submit}>
        <Layout>
          <MainColumn>
            <Card>
              <CardTitle>
                <PawPrint size={18} />
                Identificación del Animal
              </CardTitle>

              <FormGrid>
                <Field>
                  <label>Nombre *</label>

                  <input
                    type="text"
                    placeholder="ej. Rocco"
                    value={form.nombre}
                    onChange={(e) =>
                      set("nombre", e.target.value)
                    }
                  />
                </Field>

                <Field>
                  <label>Especie *</label>

                  <select
                    value={form.especie}
                    onChange={(e) =>
                      set("especie", e.target.value)
                    }
                  >
                    <option value="">
                      Seleccioná...
                    </option>

                    <option value="PERRO">
                      Perro
                    </option>

                    <option value="GATO">
                      Gato
                    </option>

                    <option value="OTRO">
                      Otro
                    </option>
                  </select>
                </Field>

                <Field>
                  <label>Raza</label>

                  <input
                    type="text"
                    placeholder="ej. Mestizo"
                    value={form.raza}
                    onChange={(e) =>
                      set("raza", e.target.value)
                    }
                  />
                </Field>

                <Field>
                  <label>Edad estimada</label>

                  <input
                    type="number"
                    min="0"
                    placeholder="ej. 2"
                    value={form.edad_estimada}
                    onChange={(e) =>
                      set(
                        "edad_estimada",
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field>
                  <label>Sexo *</label>

                  <select
                    value={form.sexo}
                    onChange={(e) =>
                      set("sexo", e.target.value)
                    }
                  >
                    <option value="">
                      Seleccioná...
                    </option>

                    <option value="MACHO">
                      Macho
                    </option>

                    <option value="HEMBRA">
                      Hembra
                    </option>

                    <option value="DESCONOCIDO">
                      Desconocido
                    </option>
                  </select>
                </Field>

                <Field>
                  <label>Color / Pelaje</label>

                  <input
                    type="text"
                    placeholder="ej. Negro con blanco"
                    value={form.color}
                    onChange={(e) =>
                      set("color", e.target.value)
                    }
                  />
                </Field>
              </FormGrid>

              <Field>
                <label>Descripción física</label>

                <textarea
                  rows="3"
                  placeholder="Marcas distintivas, tamaño, contextura..."
                  value={form.descripcion_fisica}
                  onChange={(e) =>
                    set(
                      "descripcion_fisica",
                      e.target.value
                    )
                  }
                />
              </Field>
            </Card>

            <Card>
              <CardTitle>
                <MapPin size={18} />
                Procedencia y Ubicación
              </CardTitle>

              <FormGrid>
                <Field>
                  <label>Refugio *</label>

                  <select
                    value={form.refugio}
                    onChange={(e) =>
                      set("refugio", e.target.value)
                    }
                  >
                    <option value="Refugio Norte">
                      Refugio Norte
                    </option>

                    <option value="Refugio Sur">
                      Refugio Sur
                    </option>

                    <option value="Refugio Centro">
                      Refugio Centro
                    </option>
                  </select>
                </Field>

                <Field>
                  <label>Sector</label>

                  <select
                    value={form.sector}
                    onChange={(e) =>
                      set("sector", e.target.value)
                    }
                  >
                    <option value="Sector A">
                      Sector A
                    </option>

                    <option value="Sector B">
                      Sector B
                    </option>

                    <option value="Sector C">
                      Sector C
                    </option>
                  </select>
                </Field>
              </FormGrid>

              <IngresoSection>
                <SmallLabel>
                  Forma de ingreso *
                </SmallLabel>

                <IngresoGrid>
                  {formasIngreso.map((item) => (
                    <IngresoCard
                      key={item.value}
                      type="button"
                      $selected={
                        form.forma_ingreso ===
                        item.value
                      }
                      onClick={() =>
                        set(
                          "forma_ingreso",
                          item.value
                        )
                      }
                    >
                      <strong>
                        {item.titulo}
                      </strong>

                      <span>
                        {item.descripcion}
                      </span>
                    </IngresoCard>
                  ))}
                </IngresoGrid>
              </IngresoSection>

              <Field>
                <label>
                  Observaciones de ingreso
                </label>

                <textarea
                  rows="3"
                  placeholder="Estado aparente al ingresar, comportamiento inicial, contexto del rescate..."
                  value={
                    form.observaciones_ingreso
                  }
                  onChange={(e) =>
                    set(
                      "observaciones_ingreso",
                      e.target.value
                    )
                  }
                />
              </Field>
            </Card>
          </MainColumn>

          <SideColumn>
            <Card>
              <CardTitle>
                <Camera size={18} />
                Fotografía
              </CardTitle>

              {!preview ? (
                <DropZone
                  type="button"
                  onClick={() =>
                    inputFoto.current?.click()
                  }
                  onDragOver={(e) =>
                    e.preventDefault()
                  }
                  onDrop={manejarDrop}
                >
                  <CameraCircle>
                    <Camera size={25} />
                  </CameraCircle>

                  <strong>
                    Arrastrá una foto aquí
                  </strong>

                  <span>
                    o hacé clic para seleccionar
                  </span>

                  <small>
                    JPG · PNG · WEBP · máx 5 MB
                  </small>
                </DropZone>
              ) : (
                <PreviewWrap>
                  <PreviewImage
                    src={preview}
                    alt="Vista previa"
                  />

                  <RemovePhoto
                    type="button"
                    onClick={eliminarFoto}
                  >
                    <X size={16} />
                  </RemovePhoto>

                  <PhotoName>
                    {foto?.name}
                  </PhotoName>
                </PreviewWrap>
              )}

              <input
                ref={inputFoto}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) =>
                  seleccionarFoto(
                    e.target.files?.[0]
                  )
                }
              />
            </Card>

            <Card>
              <CardTitle>
                <Clock3 size={18} />
                Estado Inicial Asignado
              </CardTitle>

              <InitialState>
                <StateIcon>
                  <Plus size={18} />
                </StateIcon>

                <div>
                  <StateName>
                    INGRESADO
                  </StateName>

                  <StateDescription>
                    Asignado automáticamente
                  </StateDescription>
                </div>
              </InitialState>

              <Explanation>
                El sistema asigna el estado{" "}
                <strong>INGRESADO</strong> al crear
                el registro. Luego el operador
                realizará la evaluación clínica
                inicial.
              </Explanation>
            </Card>

            <Card>
              <CardTitle>
                <UserRound size={18} />
                Operador Responsable
              </CardTitle>

              <Operator>
                <Avatar>
                  {iniciales}
                </Avatar>

                <div>
                  <OperatorName>
                    {user
                      ? `${user.nombre ?? ""} ${
                          user.apellido ?? ""
                        }`.trim()
                      : "Operador"}
                  </OperatorName>

                  <OperatorRole>
                    {user?.rol ?? "OPERADOR"}
                  </OperatorRole>
                </div>
              </Operator>
            </Card>

            <SubmitButton
              type="submit"
              disabled={saving}
            >
              <Plus size={18} />

              {saving
                ? "Registrando..."
                : "Registrar Animal"}
            </SubmitButton>
          </SideColumn>
        </Layout>
      </form>
    </Container>
  );
}

const Header = styled.div`
  margin-bottom: 24px;
`;

const TopBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const StepBadge = styled.span`
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(56, 189, 248, 0.08);
  color: #38bdf8;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.72rem;
  font-weight: 800;
`;

const CodeBadge = styled.span`
  color: #64748b;
  font-family: monospace;
  font-size: 0.76rem;
`;

const StateText = styled.strong`
  color: #fbbf24;
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
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.18);
`;

const CardTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 20px;
  font-size: 0.95rem;
  color: #f1f5f9;

  svg {
    color: #38bdf8;
  }
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
  margin-bottom: 16px;

  label {
    color: #71877c;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  input,
  select,
  textarea {
    width: 100%;
    color: #ecf8f1;
    background: #09150f;
    border: 1px solid #294638;
    border-radius: 11px;
    padding: 11px 13px;
    outline: none;
    font: inherit;
  }

  input:focus,
  select:focus,
  textarea:focus {
    border-color: #22c55e;
    box-shadow:
      0 0 0 3px rgba(34, 197, 94, 0.1);
  }

  textarea {
    resize: vertical;
  }
`;

const SmallLabel = styled.div`
  color: #71877c;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 9px;
`;

const IngresoSection = styled.div`
  margin: 2px 0 18px;
`;

const IngresoGrid = styled.div`
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 650px) {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }
`;

const IngresoCard = styled.button`
  text-align: left;
  cursor: pointer;
  border-radius: 11px;
  padding: 11px 13px;

  border: 1px solid
    ${(p) =>
      p.$selected
        ? "rgba(34,197,94,.5)"
        : "#294638"};

  background:
    ${(p) =>
      p.$selected
        ? "rgba(34,197,94,.09)"
        : "#0a1710"};

  strong {
    display: block;
    color:
      ${(p) =>
        p.$selected
          ? "#86efac"
          : "#d6e1db"};
    font-size: 0.78rem;
  }

  span {
    display: block;
    margin-top: 3px;
    color: #6f8379;
    font-size: 0.72rem;
  }
`;

const DropZone = styled.button`
  width: 100%;
  min-height: 210px;
  border: 1.5px dashed #385245;
  border-radius: 14px;
  background: rgba(34, 197, 94, 0.025);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  cursor: pointer;
  color: #91a59b;

  &:hover {
    border-color: #22c55e;
    background: rgba(34, 197, 94, 0.06);
  }

  strong {
    font-size: 0.82rem;
  }

  span,
  small {
    color: #61766b;
    font-size: 0.72rem;
  }
`;

const CameraCircle = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #172a20;
  display: grid;
  place-items: center;
  margin-bottom: 5px;

  svg {
    color: #8ba096;
  }
`;

const PreviewWrap = styled.div`
  position: relative;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 14px;
  border: 1px solid #294638;
`;

const RemovePhoto = styled.button`
  position: absolute;
  top: 9px;
  right: 9px;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: white;
  background: rgba(0, 0, 0, 0.7);
`;

const PhotoName = styled.div`
  margin-top: 8px;
  color: #80968b;
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const InitialState = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: #0a1710;
  border: 1px solid #233c30;
  border-radius: 12px;
  padding: 13px;
`;

const StateIcon = styled.div`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  display: grid;
  place-items: center;

  svg {
    color: #38bdf8;
  }
`;

const StateName = styled.div`
  color: #38bdf8;
  font-size: 0.78rem;
  font-weight: 900;
  font-family: monospace;
`;

const StateDescription = styled.div`
  color: #657a70;
  font-size: 0.72rem;
  margin-top: 2px;
`;

const Explanation = styled.p`
  color: #71867b;
  line-height: 1.6;
  font-size: 0.77rem;
  margin: 13px 0 0;

  strong {
    color: #38bdf8;
    font-family: monospace;
  }
`;

const Operator = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  background: #0a1710;
  border-radius: 12px;
  padding: 12px;
`;

const Avatar = styled.div`
  width: 37px;
  height: 37px;
  border-radius: 50%;
  background: rgba(139, 92, 246, 0.12);
  border: 1px solid rgba(139, 92, 246, 0.28);
  color: #c4b5fd;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.75rem;
`;

const OperatorName = styled.div`
  color: #e3eee8;
  font-size: 0.82rem;
  font-weight: 700;
`;

const OperatorRole = styled.div`
  color: #667a70;
  font-size: 0.69rem;
  font-family: monospace;
  margin-top: 3px;
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

  color: #041008;
  background: linear-gradient(
    135deg,
    #22c55e,
    #16a34a
  );

  font-size: 0.86rem;
  font-weight: 900;
  cursor: pointer;

  box-shadow:
    0 8px 25px rgba(34, 197, 94, 0.2);

  &:hover:not(:disabled) {
    filter: brightness(1.08);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;
