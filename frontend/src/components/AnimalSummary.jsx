import { Card, Badge, Meta } from "../styles/ui";
export default function AnimalSummary({ animal }) {
  return (
    <Card>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start"}}>
        <div>
          <h3 style={{margin:"0 0 6px"}}>{animal.nombre}</h3>
          <Meta>{animal.codigo} · {animal.especie} · {animal.raza || "Sin raza informada"}</Meta>
        </div>
        <Badge $good={animal.estado === "APTO_PARA_ADOPCION"}>{animal.estado?.replaceAll("_"," ")}</Badge>
      </div>
    </Card>
  );
}
