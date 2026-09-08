import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";

import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  Home,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  Send,
  UserRound,
} from "lucide-react";

import api from "../api/api";

import {
  Container,
  ErrorBox,
  Subtitle,
  Title,
} from "../styles/ui";

export default function AnimalPublicoPage() {
  const { id } = useParams();

  const [animal, setAnimal] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
    tipo_vivienda: "",
    composicion_hogar: "",
    mensaje: "",
  });

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    cargarAnimal();
  }, [id]);

  async function cargarAnimal() {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get(
        `/api/public/animales/${id}`
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

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function enviarSolicitud(e) {
    e.preventDefault();

    if (!form.nombre.trim() || !form.email.trim()) {
      setError(
        "Nombre y email son obligatorios."
      );
      return;
    }

    try {
      setSending(true);
      setError("");

      await api.post(
        `/api/public/animales/${id}/solicitudes`,
        {
          nombre: form.nombre.trim(),
          telefono:
            form.telefono.trim() || null,
          email: form.email.trim(),
          tipo_vivienda:
            form.tipo_vivienda || null,
          composicion_hogar:
            form.composicion_hogar.trim() ||
            null,
          mensaje:
            form.mensaje.trim() || null,
        }
      );

      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No se pudo enviar la solicitud."
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <Container>
        <Subtitle>
          Cargando perfil...
        </Subtitle>
      </Container>
    );
  }

  if (!animal) {
    return (
      <Container>
        <ErrorBox>
          No se encontró el animal.
        </ErrorBox>
      </Container>
    );
  }

  const foto =
    animal.foto_url ||
    animal.foto_principal ||
    null;

  return (
    <Container>
      <BackLink to="/adopciones">
        <ArrowLeft size={16} />
        Volver al catálogo
      </BackLink>

      {error && (
        <ErrorBox>
          {error}
        </ErrorBox>
      )}

      <Layout>
        <ProfileCard>
          <PhotoArea>
            {foto ? (
              <img
                src={foto}
                alt={animal.nombre}
              />
            ) : (
              <Placeholder>
                <PawPrint size={52} />
              </Placeholder>
            )}

            <AvailableBadge>
              <CheckCircle2 size={14} />
              Apto para adopción
            </AvailableBadge>
          </PhotoArea>

          <ProfileContent>
            <NameRow>
              <div>
                <Title>
                  {animal.nombre}
                </Title>

                <Subtitle>
                  {animal.raza ||
                    formatEspecie(
                      animal.especie
                    )}
                </Subtitle>
              </div>

              <Heart size={24} />
            </NameRow>

            <InfoGrid>
              <InfoCard>
                <PawPrint size={17} />

                <div>
                  <span>
                    Especie
                  </span>

                  <strong>
                    {formatEspecie(
                      animal.especie
                    )}
                  </strong>
                </div>
              </InfoCard>

              <InfoCard>
                <UserRound size={17} />

                <div>
                  <span>
                    Sexo
                  </span>

                  <strong>
                    {formatSexo(
                      animal.sexo
                    )}
                  </strong>
                </div>
              </InfoCard>

              <InfoCard>
                <span>
                  Edad estimada
                </span>

                <strong>
                  {animal.edad_estimada !=
                  null
                    ? `${animal.edad_estimada} años`
                    : "Sin especificar"}
                </strong>
              </InfoCard>

              <InfoCard>
                <span>
                  Color
                </span>

                <strong>
                  {animal.color ||
                    "Sin especificar"}
                </strong>
              </InfoCard>
            </InfoGrid>

            {animal.refugio && (
              <Location>
                <MapPin size={16} />

                <div>
                  <span>
                    Refugio
                  </span>

                  <strong>
                    {animal.refugio}
                  </strong>
                </div>
              </Location>
            )}

            {animal.descripcion_fisica && (
              <Description>
                <h3>
                  Descripción
                </h3>

                <p>
                  {
                    animal.descripcion_fisica
                  }
                </p>
              </Description>
            )}
          </ProfileContent>
        </ProfileCard>

        <ApplicationCard>
          {!success ? (
            <>
              <ApplicationHeader>
                <div>
                  <StepBadge>
                    SOLICITUD DE ADOPCIÓN
                  </StepBadge>

                  <h2>
                    Quiero adoptar a{" "}
                    {animal.nombre}
                  </h2>

                  <p>
                    Completá tus datos y el refugio
                    podrá ponerse en contacto con vos.
                  </p>
                </div>
              </ApplicationHeader>

              <form
                onSubmit={
                  enviarSolicitud
                }
              >
                <Field>
                  <label>
                    Nombre completo *
                  </label>

                  <InputWrapper>
                    <UserRound
                      size={16}
                    />

                    <input
                      name="nombre"
                      value={
                        form.nombre
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Nombre y apellido"
                      required
                    />
                  </InputWrapper>
                </Field>

                <Field>
                  <label>
                    Email *
                  </label>

                  <InputWrapper>
                    <Mail size={16} />

                    <input
                      type="email"
                      name="email"
                      value={
                        form.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="correo@email.com"
                      required
                    />
                  </InputWrapper>
                </Field>

                <Field>
                  <label>
                    Teléfono
                  </label>

                  <InputWrapper>
                    <Phone size={16} />

                    <input
                      name="telefono"
                      value={
                        form.telefono
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="223..."
                    />
                  </InputWrapper>
                </Field>

                <Field>
                  <label>
                    Tipo de vivienda
                  </label>

                  <InputWrapper>
                    <Home size={16} />

                    <select
                      name="tipo_vivienda"
                      value={
                        form.tipo_vivienda
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="">
                        Seleccionar
                      </option>

                      <option value="CASA">
                        Casa
                      </option>

                      <option value="DEPARTAMENTO">
                        Departamento
                      </option>

                      <option value="PH">
                        PH
                      </option>

                      <option value="OTRO">
                        Otro
                      </option>
                    </select>
                  </InputWrapper>
                </Field>

                <Field>
                  <label>
                    Composición del hogar
                  </label>

                  <textarea
                    name="composicion_hogar"
                    value={
                      form.composicion_hogar
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Personas que viven en el hogar, otros animales, niños, etc."
                    rows={4}
                  />
                </Field>

                <Field>
                  <label>
                    Mensaje
                  </label>

                  <textarea
                    name="mensaje"
                    value={
                      form.mensaje
                    }
                    onChange={
                      handleChange
                    }
                    placeholder={`Contanos por qué te gustaría adoptar a ${animal.nombre}.`}
                    rows={5}
                  />
                </Field>

                <SubmitButton
                  type="submit"
                  disabled={sending}
                >
                  <Send size={16} />

                  {sending
                    ? "Enviando..."
                    : "Enviar solicitud"}
                </SubmitButton>
              </form>
            </>
          ) : (
            <SuccessBox>
              <SuccessIcon>
                <CheckCircle2
                  size={34}
                />
              </SuccessIcon>

              <h2>
                Solicitud enviada
              </h2>

              <p>
                El refugio recibió tu
                solicitud para adoptar a{" "}
                <strong>
                  {animal.nombre}
                </strong>
                .
              </p>

              <p>
                Podrán contactarte a
                través de los datos que
                ingresaste.
              </p>

              <BackButton
                to="/adopciones"
              >
                Volver al catálogo
              </BackButton>
            </SuccessBox>
          )}
        </ApplicationCard>
      </Layout>
    </Container>
  );
}

function formatSexo(value) {
  if (value === "MACHO") {
    return "Macho";
  }

  if (value === "HEMBRA") {
    return "Hembra";
  }

  return "Desconocido";
}

function formatEspecie(value) {
  if (value === "PERRO") {
    return "Perro";
  }

  if (value === "GATO") {
    return "Gato";
  }

  return "Otro";
}

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 18px;

  color: #7b9185;
  text-decoration: none;
  font-size: 0.72rem;

  &:hover {
    color: #4ade80;
  }
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns:
    minmax(0, 1.35fr)
    minmax(320px, 0.85fr);

  gap: 22px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ProfileCard = styled.article`
  overflow: hidden;

  background:
    rgba(13, 27, 20, 0.85);

  border:
    1px solid #20392d;

  border-radius: 18px;
`;

const PhotoArea = styled.div`
  position: relative;
  height: 380px;
  background: #08130d;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 600px) {
    height: 280px;
  }
`;

const Placeholder = styled.div`
  height: 100%;
  display: grid;
  place-items: center;
  color: #31513f;
`;

const AvailableBadge = styled.div`
  position: absolute;
  left: 16px;
  bottom: 16px;

  display: flex;
  align-items: center;
  gap: 6px;

  padding: 7px 11px;
  border-radius: 999px;

  color: #dcfce7;
  background:
    rgba(22, 163, 74, 0.92);

  font-size: 0.68rem;
  font-weight: 800;
`;

const ProfileContent = styled.div`
  padding: 22px;
`;

const NameRow = styled.div`
  display: flex;
  justify-content:
    space-between;
  gap: 15px;

  svg {
    color: #4ade80;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));

  gap: 10px;
  margin-top: 22px;

  @media (max-width: 550px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 13px;

  background: #09150f;
  border: 1px solid #213b2e;
  border-radius: 11px;

  svg {
    color: #4ade80;
  }

  span {
    display: block;
    color: #60766a;
    font-size: 0.63rem;
  }

  strong {
    display: block;
    margin-top: 2px;
    color: #deebe3;
    font-size: 0.73rem;
  }
`;

const Location = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  margin-top: 12px;
  padding: 13px;

  background:
    rgba(34, 197, 94, 0.05);

  border:
    1px solid
    rgba(34, 197, 94, 0.15);

  border-radius: 11px;

  svg {
    color: #4ade80;
  }

  span {
    display: block;
    color: #60766a;
    font-size: 0.63rem;
  }

  strong {
    display: block;
    margin-top: 2px;
    color: #dce9e1;
    font-size: 0.73rem;
  }
`;

const Description = styled.div`
  margin-top: 20px;

  h3 {
    color: #dde9e2;
    font-size: 0.8rem;
  }

  p {
    color: #74897e;
    font-size: 0.72rem;
    line-height: 1.7;
  }
`;

const ApplicationCard = styled.section`
  position: sticky;
  top: 90px;

  padding: 20px;

  background:
    rgba(13, 27, 20, 0.87);

  border:
    1px solid #20392d;

  border-radius: 18px;

  @media (max-width: 900px) {
    position: static;
  }
`;

const ApplicationHeader = styled.div`
  margin-bottom: 18px;

  h2 {
    margin: 10px 0 5px;
    color: #e8f1ec;
    font-size: 1rem;
  }

  p {
    margin: 0;
    color: #6c8176;
    font-size: 0.69rem;
    line-height: 1.5;
  }
`;

const StepBadge = styled.span`
  display: inline-block;

  color: #4ade80;
  background:
    rgba(34, 197, 94, 0.07);

  border:
    1px solid
    rgba(34, 197, 94, 0.2);

  border-radius: 999px;

  padding: 5px 9px;

  font-size: 0.63rem;
  font-weight: 900;
`;

const Field = styled.div`
  margin-bottom: 13px;

  label {
    display: block;
    margin-bottom: 6px;

    color: #6c8176;
    font-size: 0.64rem;
    font-weight: 700;
  }

  textarea {
    width: 100%;
    resize: vertical;

    padding: 10px 12px;

    color: #e7f0eb;
    background: #09150f;

    border:
      1px solid #294638;

    border-radius: 10px;

    outline: none;
    font: inherit;
    font-size: 0.72rem;

    &:focus {
      border-color:
        rgba(34, 197, 94, 0.45);
    }
  }
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 0 11px;

  background: #09150f;

  border:
    1px solid #294638;

  border-radius: 10px;

  svg {
    color: #60766a;
  }

  input,
  select {
    flex: 1;

    padding: 10px 0;

    color: #e7f0eb;
    background: transparent;

    border: 0;
    outline: 0;

    font: inherit;
    font-size: 0.72rem;
  }

  select option {
    background: #0d1b14;
  }
`;

const SubmitButton = styled.button`
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  margin-top: 6px;
  padding: 11px;

  border: 0;
  border-radius: 10px;

  cursor: pointer;

  color: white;

  background:
    linear-gradient(
      135deg,
      #22c55e,
      #16a34a
    );

  font-weight: 800;

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

const SuccessBox = styled.div`
  min-height: 390px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  text-align: center;

  h2 {
    color: #e9f3ed;
    margin-bottom: 7px;
  }

  p {
    max-width: 330px;
    margin: 4px 0;

    color: #71867b;
    font-size: 0.72rem;
    line-height: 1.6;
  }
`;

const SuccessIcon = styled.div`
  width: 64px;
  height: 64px;

  display: grid;
  place-items: center;

  margin-bottom: 10px;

  border-radius: 50%;

  color: #4ade80;

  background:
    rgba(34, 197, 94, 0.1);

  border:
    1px solid
    rgba(34, 197, 94, 0.25);
`;

const BackButton = styled(Link)`
  display: inline-block;

  margin-top: 18px;
  padding: 10px 14px;

  color: white;
  text-decoration: none;

  background:
    linear-gradient(
      135deg,
      #22c55e,
      #16a34a
    );

  border-radius: 9px;

  font-size: 0.7rem;
  font-weight: 800;
`;