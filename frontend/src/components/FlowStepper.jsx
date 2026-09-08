import styled from "styled-components";

const steps = ["INGRESADO","EVALUACION","PROTOCOLO_SANITARIO","VALIDACION","APTO_PARA_ADOPCION"];
const Wrap = styled.div`display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin:22px 0 28px;`;
const Step = styled.div`
  padding:9px 6px;border-radius:10px;text-align:center;font-size:.69rem;font-weight:800;
  border:1px solid ${p => p.$on ? "#288a4a" : "#273b31"};
  background:${p => p.$on ? "rgba(34,197,94,.12)" : "#0d1812"};
  color:${p => p.$on ? "#9bf3b7" : "#6f8479"};
  @media(max-width:700px){font-size:.55rem;padding:8px 3px}
`;
export default function FlowStepper({ estado }) {
  const idx = steps.indexOf(estado);
  return <Wrap>{steps.map((s,i)=><Step key={s} $on={i<=idx}>{s.replaceAll("_"," ")}</Step>)}</Wrap>;
}
