import { useEffect, useState } from "react";

import {
  Euro,
  TrendingUp,
  Package,
  ClipboardList,
  ShieldAlert,
  Users,
  BrainCircuit,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

import { supabase } from "../supabaseClient";
import { useInstituicao } from "../context/InstituicaoContext";

function Estatisticas() {
  const { instituicaoAtual } = useInstituicao();

  const [fichas, setFichas] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [haccp, setHaccp] = useState([]);

  useEffect(() => {
    if (instituicaoAtual?.id) {
      carregarDados();
    }
  }, [instituicaoAtual]);

  async function carregarDados() {
    if (!instituicaoAtual?.id) return;

    const { data: fichasData, error: fichasError } = await supabase
      .from("fichas_tecnicas")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id);

    if (fichasError) {
      console.error("Erro ao carregar fichas técnicas:", fichasError);
    }

    const { data: stocksData, error: stocksError } = await supabase
      .from("stocks")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id);

    if (stocksError) {
      console.error("Erro ao carregar stocks:", stocksError);
    }

    const { data: movimentosData, error: movimentosError } = await supabase
      .from("movimentos_stock")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id);

    if (movimentosError) {
      console.error("Erro ao carregar movimentos de stock:", movimentosError);
    }

    const { data: haccpData, error: haccpError } = await supabase
      .from("haccp")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id);

    if (haccpError) {
      console.error("Erro ao carregar HACCP:", haccpError);
    }

    setFichas(fichasData || []);
    setStocks(stocksData || []);
    setMovimentos(movimentosData || []);
    setHaccp(haccpData || []);
  }

  const custoTotalReceitas = fichas.reduce(
    (total, ficha) =>
      total + Number(ficha?.dados?.custoTotal || ficha?.custoTotal || 0),
    0
  );

  const custoMedio =
    fichas.length > 0
      ? custoTotalReceitas / fichas.length
      : 0;

  const produtosCriticos = stocks.filter(
    (item) =>
      Number(item.quantidade || 0) <=
      Number(item.stock_minimo || item.stockMinimo || 0)
  );

  const alertasHaccp = haccp.filter(
    (item) =>
      item.estado === "Crítico" ||
      item.estado === "Não conforme" ||
      item.tipo_registo === "nao_conformidade"
  );

  const totalEntradas = movimentos.filter((m) =>
    String(m.tipo || "")
      .toLowerCase()
      .includes("entrada")
  ).length;

  const totalSaidas = movimentos.filter((m) => {
    const tipo = String(m.tipo || "").toLowerCase();

    return tipo.includes("produção") || tipo.includes("saída");
  }).length;

  const topReceitas = [...fichas]
    .sort(
      (a, b) =>
        Number(b?.dados?.custoTotal || b?.custoTotal || 0) -
        Number(a?.dados?.custoTotal || a?.custoTotal || 0)
    )
    .slice(0, 5)
    .map((item) => ({
      nome: item.nome,
      custo: Number(item?.dados?.custoTotal || item?.custoTotal || 0),
    }));

  const graficoStock = stocks.slice(0, 8).map((item) => ({
    nome: item.produto || item.nome,
    quantidade: Number(item.quantidade || 0),
  }));

  const graficoFinanceiro = [
    { nome: "Receitas", valor: fichas.length },
    { nome: "Stock crítico", valor: produtosCriticos.length },
    { nome: "HACCP", valor: alertasHaccp.length },
    { nome: "Movimentos", valor: movimentos.length },
  ];

  const cores = [
    "#145c2a",
    "#2563eb",
    "#dc2626",
    "#7c3aed",
  ];

  const tendencia = [
    { mes: "Jan", valor: 420 },
    { mes: "Fev", valor: 510 },
    { mes: "Mar", valor: 480 },
    { mes: "Abr", valor: 620 },
    { mes: "Mai", valor: 590 },
    { mes: "Jun", valor: 710 },
  ];

  return (
    <div className="dashboard">
      <div className="topo-dashboard">
        <div>
          <h1>Estatísticas</h1>

          <p className="dashboard-subtitle">
            {instituicaoAtual?.nome} — Indicadores estratégicos e análise da
            operação alimentar.
          </p>
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card destaque">
          <Euro size={30} />
          <h3>Custo total receitas</h3>
          <p>{custoTotalReceitas.toFixed(2)} €</p>
          <span>Total registado</span>
        </div>

        <div className="dashboard-card">
          <ClipboardList size={30} />
          <h3>Custo médio</h3>
          <p>{custoMedio.toFixed(2)} €</p>
          <span>Por receita</span>
        </div>

        <div className="dashboard-card">
          <Package size={30} />
          <h3>Produtos críticos</h3>
          <p>{produtosCriticos.length}</p>
          <span>Stock baixo</span>
        </div>

        <div className="dashboard-card">
          <ShieldAlert size={30} />
          <h3>Alertas HACCP</h3>
          <p>{alertasHaccp.length}</p>
          <span>Não conformidades</span>
        </div>

        <div className="dashboard-card">
          <TrendingUp size={30} />
          <h3>Entradas</h3>
          <p>{totalEntradas}</p>
          <span>Movimentos stock</span>
        </div>

        <div className="dashboard-card">
          <Users size={30} />
          <h3>Saídas</h3>
          <p>{totalSaidas}</p>
          <span>Produção</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Top receitas mais caras</h2>

        <div style={{ width: "100%", height: 350 }}>
          <ResponsiveContainer>
            <BarChart data={topReceitas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="custo" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Distribuição operacional</h2>

        <div style={{ width: "100%", height: 350 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={graficoFinanceiro}
                dataKey="valor"
                nameKey="nome"
                outerRadius={120}
                label
              >
                {graficoFinanceiro.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={cores[index % cores.length]}
                  />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Tendência financeira</h2>

        <div style={{ width: "100%", height: 350 }}>
          <ResponsiveContainer>
            <LineChart data={tendencia}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="mes" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="valor"
                stroke="#145c2a"
                strokeWidth={4}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Quantidades em stock</h2>

        <div style={{ width: "100%", height: 350 }}>
          <ResponsiveContainer>
            <BarChart data={graficoStock}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="quantidade"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>
          <BrainCircuit size={22} /> IA Analítica
        </h2>

        <div className="historico-grid">
          <div className="historico-card">
            <h3>Resumo automático</h3>

            <p>
              O sistema identificou{" "}
              <strong>{produtosCriticos.length}</strong>{" "}
              produto(s) críticos e{" "}
              <strong>{alertasHaccp.length}</strong>{" "}
              alerta(s) HACCP.
            </p>

            <p>
              O custo médio atual por receita é de{" "}
              <strong>{custoMedio.toFixed(2)}€</strong>.
            </p>

            <p>
              Recomenda-se reforçar a monitorização dos
              produtos críticos e otimizar compras.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Estatisticas;
