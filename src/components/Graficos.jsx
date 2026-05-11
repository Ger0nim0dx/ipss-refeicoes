import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Graficos({
  creche,
  lar,
  apoio,
  trabalhadores,
}) {
  const dados = [
    {
      nome: "Creche",
      refeições: creche,
    },
    {
      nome: "Lar",
      refeições: lar,
    },
    {
      nome: "Apoio",
      refeições: apoio,
    },
    {
      nome: "Trabalhadores",
      refeições: trabalhadores,
    },
  ];

  return (
    <div className="grafico-container">
      <h3>Distribuição de refeições</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={dados}>
          <XAxis dataKey="nome" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="refeições" fill="#145c2a" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}