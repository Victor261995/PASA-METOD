import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import FlowStepper from "../components/FlowStepper";
import AnimalSummary from "../components/AnimalSummary";
import { useAuth } from "../context/AuthContext";
import {
  Badge,
  Button,
  ButtonRow,
  Card,
  Container,
  ErrorBox,
  Field,
  Grid,
  Panel,
  SectionTitle,
  Subtitle,
  SuccessBox,
  Title,
} from "../styles/ui";

export default function AnimalPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [animal, setAnimal] = useState(null);
  const [protocol, setProtocol] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [evalForm, setEvalForm] = useState({
    peso: "",
    temperatura: "",
    frecuencia_cardiaca: "",
    frecuencia_respiratoria: "",
    condicion_corporal: 5,
    comportamiento: "DOCIL",
    socializacion_personas: "BUENA",
    socializacion_animales: "BUENA",
    estado_pelaje: "NORMAL",
    estado_ojos: "NORMAL",
    marcha: "NORMAL",
    observaciones: "",
    criterio_operador: "APTO_PROTOCOLO",
  });

  const [evidence, setEvidence] = useState({
    tipo: "VACUNACION",
    fecha_emision: "",
    fecha_vencimiento: "",
    archivo: null,
  });

  async function load() {
    try {
      const [{ data: a }, { data: p }] = await Promise.all([
        api.get(`/api/animales/${id}`),
        api.get(`/api/animales/${id}/protocolo`),
      ]);
      setAnimal(a.animal);
      setProtocol(p.protocolo);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError("No se pudo cargar la información del animal.");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const canOperate = useMemo(
    () => user && ["OPERADOR", "ADMIN"].includes(user.rol),
    [user],
  );
  const isValidador = useMemo(
    () => user && ["VALIDADOR", "ADMIN"].includes(user.rol),
    [user],
  );

  async function enviarEvaluacion(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);
    try {
      await api.post(`/api/animales/${id}/evaluaciones`, evalForm);
      setMsg("¡Evaluación clínica registrada con éxito!");
      alert("Evaluación registrada exitosamente.");
      await load();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "Error al registrar evaluación.";
      setError(errorMsg);
      alert("Error: " + errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function subirEvidencia(e) {
    e.preventDefault();
    setError("");
    setMsg("");

    if (!evidence.archivo) {
      const ms = "Debes seleccionar un archivo para adjuntar.";
      setError(ms);
      alert(ms);
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("tipo", evidence.tipo);
      if (evidence.fecha_emision)
        fd.append("fecha_emision", evidence.fecha_emision);
      if (evidence.fecha_vencimiento)
        fd.append("fecha_vencimiento", evidence.fecha_vencimiento);
      fd.append("archivo", evidence.archivo);

      await api.post(`/api/animales/${id}/evidencias`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg("¡Evidencia cargada con éxito!");
      alert("Evidencia subida correctamente.");
      setEvidence({
        tipo: "VACUNACION",
        fecha_emision: "",
        fecha_vencimiento: "",
        archivo: null,
      });

      const fileInput = document.getElementById("file-input-evidencia");
      if (fileInput) fileInput.value = "";

      await load();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "No se pudo cargar la evidencia.";
      setError(errorMsg);
      alert("Error: " + errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function solicitar() {
    setError("");
    setMsg("");
    setLoading(true);
    try {
      await api.post(`/api/animales/${id}/solicitar-validacion`);
      setMsg("¡Solicitud enviada al Validador!");
      alert(
        "Solicitud enviada correctamente. El animal ahora está en estado VALIDACION.",
      );
      await load();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        "No se pudo solicitar la validación. Verifique haber cumplido el protocolo.";
      setError(errorMsg);
      alert("No se pudo solicitar validación: " + errorMsg);
    } finally {
      setLoading(false);
    }
  }

  if (!animal) return <Container>{error || "Cargando..."}</Container>;

  const evidenciasCargadas = protocol?.evidencias || [];

  return (
    <Container>
      <Title>{animal.nombre}</Title>
      <Subtitle>{animal.codigo} · Seguimiento Sanitario</Subtitle>
      <FlowStepper estado={animal.estado} />

      {msg && <SuccessBox>{msg}</SuccessBox>}
      {error && <ErrorBox>{error}</ErrorBox>}

      <AnimalSummary animal={animal} />

      {/* EVALUACIÓN CLÍNICA: Operador la llena si está INGRESADO */}
      {canOperate && animal.estado === "INGRESADO" && (
        <Panel style={{ marginTop: 16 }}>
          <SectionTitle>Evaluación clínica</SectionTitle>
          <form onSubmit={enviarEvaluacion}>
            <Grid $cols={4}>
              <Field>
                Peso kg
                <input
                  type="number"
                  step=".01"
                  required
                  value={evalForm.peso}
                  onChange={(e) =>
                    setEvalForm({ ...evalForm, peso: e.target.value })
                  }
                />
              </Field>
              <Field>
                Temperatura
                <input
                  type="number"
                  step=".1"
                  required
                  value={evalForm.temperatura}
                  onChange={(e) =>
                    setEvalForm({ ...evalForm, temperatura: e.target.value })
                  }
                />
              </Field>
              <Field>
                Frecuencia cardíaca
                <input
                  type="number"
                  required
                  value={evalForm.frecuencia_cardiaca}
                  onChange={(e) =>
                    setEvalForm({
                      ...evalForm,
                      frecuencia_cardiaca: e.target.value,
                    })
                  }
                />
              </Field>
              <Field>
                Frecuencia respiratoria
                <input
                  type="number"
                  required
                  value={evalForm.frecuencia_respiratoria}
                  onChange={(e) =>
                    setEvalForm({
                      ...evalForm,
                      frecuencia_respiratoria: e.target.value,
                    })
                  }
                />
              </Field>
              <Field>
                Condición corporal 1-9
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={evalForm.condicion_corporal}
                  onChange={(e) =>
                    setEvalForm({
                      ...evalForm,
                      condicion_corporal: Number(e.target.value),
                    })
                  }
                />
              </Field>
              <Field>
                Comportamiento
                <select
                  value={evalForm.comportamiento}
                  onChange={(e) =>
                    setEvalForm({ ...evalForm, comportamiento: e.target.value })
                  }
                >
                  <option value="DOCIL">DOCIL</option>
                  <option value="ANSIOSO">ANSIOSO</option>
                  <option value="AGRESIVO">AGRESIVO</option>
                </select>
              </Field>
              <Field>
                Criterio
                <select
                  value={evalForm.criterio_operador}
                  onChange={(e) =>
                    setEvalForm({
                      ...evalForm,
                      criterio_operador: e.target.value,
                    })
                  }
                >
                  <option value="APTO_PROTOCOLO">APTO_PROTOCOLO</option>
                  <option value="REQUIERE_ATENCION">REQUIERE_ATENCION</option>
                  <option value="CUARENTENA">CUARENTENA</option>
                </select>
              </Field>
            </Grid>
            <div style={{ marginTop: 14 }}>
              <Field>
                Observaciones
                <textarea
                  value={evalForm.observaciones}
                  onChange={(e) =>
                    setEvalForm({ ...evalForm, observaciones: e.target.value })
                  }
                />
              </Field>
            </div>
            <Button disabled={loading} style={{ marginTop: 16 }}>
              {loading ? "Guardando..." : "Enviar evaluación"}
            </Button>
          </form>
        </Panel>
      )}

      {/* PROTOCOLO SANITARIO Y EVIDENCIAS: Visible tanto para Operador como para Validador */}
      {(canOperate || isValidador) &&
        ["EVALUACION", "PROTOCOLO_SANITARIO", "VALIDACION"].includes(
          animal.estado,
        ) && (
          <Panel style={{ marginTop: 16 }}>
            <SectionTitle>Protocolo sanitario</SectionTitle>
            {protocol && (
              <Card style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    Control de parásitos:{" "}
                    <Badge $good={protocol.control_parasitos == 1}>
                      {protocol.control_parasitos == 1 ? "Válido" : "Pendiente"}
                    </Badge>
                  </div>
                  <div>
                    Antirrábica:{" "}
                    <Badge $good={protocol.vacuna_antirrabica == 1}>
                      {protocol.vacuna_antirrabica == 1
                        ? "Válida"
                        : "Pendiente"}
                    </Badge>
                  </div>
                  <strong>
                    Cumplimiento: {protocol.porcentaje_cumplimiento}%
                  </strong>
                </div>
              </Card>
            )}

            {/* Listado de evidencias cargadas */}
            {evidenciasCargadas.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <strong>
                  Evidencias registradas ({evidenciasCargadas.length}):
                </strong>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  {evidenciasCargadas.map((ev, idx) => (
                    <li key={ev.id || idx}>
                      <b>[{ev.tipo}]</b> {ev.archivo_nombre || "Archivo"} —
                      Emisión: {ev.fecha_emision || "S/D"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Formulario de carga solo para Operador en fase de protocolo */}
            {canOperate &&
              ["EVALUACION", "PROTOCOLO_SANITARIO"].includes(animal.estado) && (
                <form onSubmit={subirEvidencia} style={{ marginTop: 16 }}>
                  <Grid $cols={3}>
                    <Field>
                      Tipo
                      <select
                        value={evidence.tipo}
                        onChange={(e) =>
                          setEvidence({ ...evidence, tipo: e.target.value })
                        }
                      >
                        <option value="VACUNACION">Vacunación</option>
                        <option value="DESPARASITACION">Desparasitación</option>
                        <option value="CERTIFICADO">Certificado</option>
                        <option value="FOTO">Foto</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </Field>
                    <Field>
                      Fecha emisión
                      <input
                        type="date"
                        value={evidence.fecha_emision}
                        onChange={(e) =>
                          setEvidence({
                            ...evidence,
                            fecha_emision: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field>
                      Fecha vencimiento
                      <input
                        type="date"
                        value={evidence.fecha_vencimiento}
                        onChange={(e) =>
                          setEvidence({
                            ...evidence,
                            fecha_vencimiento: e.target.value,
                          })
                        }
                      />
                    </Field>
                  </Grid>
                  <div style={{ marginTop: 14 }}>
                    <Field>
                      Archivo
                      <input
                        id="file-input-evidencia"
                        type="file"
                        onChange={(e) =>
                          setEvidence({
                            ...evidence,
                            archivo: e.target.files?.[0] || null,
                          })
                        }
                      />
                    </Field>
                  </div>
                  <ButtonRow style={{ marginTop: 16 }}>
                    <Button disabled={loading}>
                      {loading ? "Subiendo..." : "Cargar evidencia"}
                    </Button>
                    <Button
                      type="button"
                      $variant="secondary"
                      onClick={solicitar}
                      disabled={
                        loading || protocol?.porcentaje_cumplimiento < 100
                      }
                    >
                      {loading ? "Enviando..." : "Solicitar validación"}
                    </Button>
                  </ButtonRow>
                </form>
              )}
          </Panel>
        )}

      {animal.estado === "VALIDACION" && (
        <Panel style={{ marginTop: 16 }}>
          <SectionTitle>En validación</SectionTitle>
          <p>
            La solicitud está pendiente de decisión por un Validador sanitario.
          </p>
        </Panel>
      )}

      {animal.estado === "RECHAZADO" && (
        <Panel style={{ marginTop: 16 }}>
          <SectionTitle>Protocolo Rechazado</SectionTitle>
          <p style={{ color: "#e74c3c" }}>
            Este animal fue rechazado durante la validación sanitaria.
          </p>
        </Panel>
      )}

      {animal.estado === "APTO_PARA_ADOPCION" && (
        <Panel style={{ marginTop: 16 }}>
          <SectionTitle>Apto para adopción</SectionTitle>
          <p>
            El animal superó el protocolo y es visible en el catálogo público.
          </p>
        </Panel>
      )}
    </Container>
  );
}
