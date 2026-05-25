import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Package,
  ShieldAlert,
  ShoppingCart,
  Factory,
} from "lucide-react";

import { supabase } from "../supabaseClient";

function Analytics() {
  const [stocks, setStocks] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [haccp, setHaccp] = useState([]);
  const [dietas, setDietas] = useState([]);
  const [producoes, setProducoes] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return;

    const { data: stocksData } = await supabase
      .from("stocks")
      .select("*")
      .eq("user_id", user.id);

    const { data: movimentosData } = await supabase
      .from("movimentos_stock")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: haccpData } = await supabase
      .from("haccp")
      .select("*")
      .eq("user_id", user.id);

    const { data: dietasData } = await supabase
      .from("dietas")
      .select("*")
      .eq("user_id", user.id);

    const { data: producoesData } = await supabase
      .from("producoes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setStocks(stocksData || []);
    setMovimentos(movimentosData || []);
    setHaccp(haccpData || []);
    setDietas(dietasData || []);
    setProducoes(producoesData || []);
  }

  const produtosCriticos = stocks.filter(
    (item) =>
      Number(item.quantidade || 0) <= Number(item.stock_minimo || 0)
  );

  const alertasHaccp = haccp.filter(
    (item) =>
      item.tipo_registo === "nao_conformidade" ||
      item.estado === "Crítico" ||
      item.estado === "Não conforme"
  );

  const entradas = movimentos.filter((item) =>
    String(item.tipo || "").toLowerCase().includes("entrada")
  );

  const saidas = movimentos.filter(
    (item) =>
      String(item.tipo || "").toLowerCase().includes("saída") ||
      String(item.tipo || "").toLowerCase().includes("produção")
  );

  const dadosGraficoStock = stocks.slice(0, 8).map((item) => ({
    produto: item.produto || item.nome,
    quantidade: Number(item.quantidade || 0),
  }));

  const dadosMovimentos = [
    { tipo: "Entradas", total: entradas.length },
    { tipo: "Saídas/Produção", total: saidas.length },
    { tipo: "Produções", total: producoes.length },
    { tipo: "HACCP", total: alertasHaccp.length },
  ];

  const eficiencia =
    stocks.length > 0
      ? Math.round(((stocks.length - produtosCriticos.length) / stocks.length) * 100)
      : 100;

  const riscoOperacional =
    produtosCriticos.length + alertasHaccp.length > 0 ? "Atenção" : "Estável";

  const insights = [];

  if (produtosCriticos.length > 0) {
    insights.push(
      `Existem ${produtosCriticos.length} produtos críticos. Recomenda-se rever compras.`
    );
  }

  if (alertasHaccp.length > 0) {
    insights.push(
      `Existem ${alertasHaccp.length} alertas HACCP. Deve ser feita validação prioritária.`
    );
  }

  if (producoes.length === 0) {
    insights.push("Ainda não existem produções registadas para análise histórica.");
  }

  if (insights.length === 0) {
    insights.push("A operação apresenta indicadores estáveis neste momento.");
  }

  return (
    <div className="pagina">
      <h1>
        <BarChart3 size={32} /> Analytics Inteligente
      </h1>

      <p className="descricao">
        Centro de análise estratégica da operação alimentar.
      </p>

      <div className="dashboard-cards">
        <div className="dashboard-card destaque">
          <TrendingUp size={30} />
          <h3>Eficiência</h3>
          <p>{eficiencia}%</p>
          <span>Produtos acima do mínimo</span>
        </div>

        <div className="dashboard-card">
          <Package size={30} />
          <h3>Produtos críticos</h3>
          <p>{produtosCriticos.length}</p>
          <span>Stock baixo</span>
        </div>

        <div className="dashboard-card">
          <ShieldAlert size={30} />
          <h3>Risco HACCP</h3>
          <p>{alertasHaccp.length}</p>
          <span>Alertas ativos</span>
        </div>

        <div className="dashboard-card">
          <Factory size={30} />
          <h3>Produções</h3>
          <p>{producoes.length}</p>
          <span>Registos históricos</span>
        </div>

        <div className="dashboard-card">
          <ShoppingCart size={30} />
          <h3>Movimentos</h3>
          <p>{movimentos.length}</p>
          <span>Stock / produção</span>
        </div>

        <div className="dashboard-card">
          <BarChart3 size={30} />
          <h3>Estado</h3>
          <p>{riscoOperacional}</p>
          <span>Risco operacional</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Stock atual</h2>

        {stocks.length === 0 ? (
          <p>Ainda não existem produtos registados.</p>
        ) : (
          <div style={{ width: "100%", height: 340 }}>
            <ResponsiveContainer>
              <BarChart data={dadosGraficoStock}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="produto" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Movimentos operacionais</h2>

        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={dadosMovimentos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tipo" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Insights automáticos</h2>

        {insights.map((item, index) => (
          <p key={index} className="success-message">
            • {item}
          </p>
        ))}
      </div>

      <div className="dashboard-section">
        <h2>Produtos críticos</h2>

        {produtosCriticos.length === 0 ? (
          <p>Não existem produtos críticos neste momento.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Stock mínimo</th>
              </tr>
            </thead>

            <tbody>
              {produtosCriticos.map((item, index) => (
                <tr key={index}>
                  <td>{item.produto || item.nome}</td>
                  <td>
                    {item.quantidade} {item.unidade}
                  </td>
                  <td>
                    {item.stock_minimo || 0} {item.unidade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Analytics;