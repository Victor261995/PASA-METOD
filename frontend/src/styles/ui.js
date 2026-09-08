import styled from "styled-components";

export const Page = styled.div`
  min-height: 100vh;
  padding-top: 76px;
`;

export const Container = styled.main`
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0 64px;
`;

export const Panel = styled.section`
  background: rgba(13, 27, 20, .82);
  border: 1px solid #20392d;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 18px 50px rgba(0,0,0,.22);
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(${p => p.$cols || 2}, minmax(0, 1fr));
  gap: 16px;
  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

export const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.7rem, 3vw, 2.5rem);
  letter-spacing: -.03em;
`;

export const Subtitle = styled.p`
  margin: 8px 0 0;
  color: #92a79d;
  line-height: 1.6;
`;

export const SectionTitle = styled.h2`
  font-size: 1.1rem;
  margin: 0 0 16px;
`;

export const Field = styled.label`
  display: grid;
  gap: 7px;
  color: #b9c9c1;
  font-size: .9rem;

  input, select, textarea {
    width: 100%;
    color: #ecf8f1;
    background: #09150f;
    border: 1px solid #294638;
    border-radius: 12px;
    padding: 12px 13px;
    outline: none;
  }

  textarea { min-height: 100px; resize: vertical; }

  input:focus, select:focus, textarea:focus {
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34,197,94,.10);
  }
`;

export const Button = styled.button`
  border: 0;
  border-radius: 12px;
  padding: 11px 15px;
  font-weight: 800;
  color: ${p => p.$variant === "danger" ? "#ffdede" : p.$variant === "secondary" ? "#dce8e1" : "#041008"};
  background: ${p => p.$variant === "danger" ? "#7f1d1d" : p.$variant === "secondary" ? "#20352b" : "#22c55e"};
  transition: .18s ease;
  &:hover { transform: translateY(-1px); filter: brightness(1.08); }
  &:disabled { opacity: .45; cursor: not-allowed; transform: none; }
`;

export const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid ${p => p.$good ? "#225b39" : "#394d43"};
  background: ${p => p.$good ? "rgba(34,197,94,.10)" : "#122018"};
  color: ${p => p.$good ? "#86efac" : "#c2d1c9"};
  padding: 6px 9px;
  border-radius: 999px;
  font-size: .78rem;
  font-weight: 800;
`;

export const Card = styled.article`
  border: 1px solid #243d31;
  background: #0b1711;
  border-radius: 16px;
  padding: 18px;
`;

export const ErrorBox = styled.div`
  border: 1px solid #7f1d1d;
  background: rgba(127,29,29,.18);
  color: #fecaca;
  padding: 12px;
  border-radius: 12px;
  margin: 14px 0;
`;

export const SuccessBox = styled.div`
  border: 1px solid #166534;
  background: rgba(22,101,52,.18);
  color: #bbf7d0;
  padding: 12px;
  border-radius: 12px;
  margin: 14px 0;
`;

export const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid #243d31;
  border-radius: 14px;
  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 760px;
  }
  th, td {
    text-align: left;
    padding: 13px 14px;
    border-bottom: 1px solid #1e3329;
  }
  th { color: #83a091; font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; }
  tr:last-child td { border-bottom: 0; }
`;

export const Meta = styled.div`
  color: #92a79d;
  font-size: .86rem;
`;
