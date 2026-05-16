import { useEffect, useState } from "react";

import {
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Euro,
  ClipboardList,
  Clock3,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function Dashboard() {
  const [dadosIPSS, setDadosIPSS] = useState({});
  const [stocks, setStocks] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [fichas, setFichas] = useState([]);

  useEffect(() => {
    setDadosIPSS(
      JSON.parse(localStorage.getItem("dadosIPSS")) || {}
    );

    setStocks(
      JSON.parse(localStorage.getItem("ipssStocks")) || []
    );

    setMovimentos(
      JSON.parse(localStorage.getItem("ipssMovimentosStock")) || []
    );

    setFichas(
      JSON.parse(localStorage.getItem("ipssFichasTecnicas")) || []
    );
  }, []);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  function diasAteValidade(data) {
    if (!data) return null;

    const validade = new Date(data);
    validade.setHours(0, 0, 0, 0);

    const diferenca = validade - hoje;

    return Math.ceil(
      diferenca / (1000 * 60 * 60 * 24)
    );
  }

  const produtosStockBaixo = stocks.filter(
    (item) =>
      Number(item.quantidade) <=
      Number(item.stockMinimo || 0)
  );

  const produtosExpirados = stocks.filter((item) => {
    const dias = diasAteValidade(item.validade);

    return dias !== null && dias < 0;
  });

  const produtosAExpirar = stocks.filter((item) => {
    const dias = diasAteValidade(item.validade);

    return dias !== null && dias >= 0 && dias <= 7;
  });

  const totalEntradas = movimentos.filter((m) =>
    String(m.tipo || "")
      .toLowerCase()
      .includes("entrada")
  ).length;

  const totalSaidas = movimentos.filter((m) =>
    String(m.tipo || "")
      .toLowerCase()
      .includes("saída")
  ).length;

  const custoTotalReceitas = fichas.reduce(
    (total, ficha) =>
      total + Number(ficha.custoTotal || 0),
    0
  );

  const custoMedioReceita =
    fichas.length > 0
      ? custoTotalReceitas / fichas.length
      : 0;

  const comprasPendentes =
    produtosStockBaixo.length +
    produtosExpirados.length;

  const dadosGrafico = stocks
    .slice(0, 8)
    .map((item) => ({
      nome: item.nome || item.produto,
      quantidade: Number(item.quantidade) || 0,
    }));

  return (
    <div className="dashboard">
      <div className="topo-dashboard">
        <div>
          <h1>Dashboard Geral</h1>

          <p className="dashboard-subtitle">
            Gestão alimentar inteligente da IPSS.
          </p>
        </div>

        <div className="data-box">
          {new Date().toLocaleDateString("pt-PT")}
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Identificação da Instituição</h2>

        <div className="summary-grid">
          <div className="summary-box">
            <strong>Instituição</strong>

            <p>
              {dadosIPSS.nomeInstituicao ||
                "Não preenchido"}
            </p>
          </div>

          <div className="summary-box">
            <strong>Localidade</strong>

            <p>
              {dadosIPSS.localidade ||
                "Não preenchido"}
            </p>
          </div>

          <div className="summary-box">
            <strong>Responsável</strong>

            <p>
              {dadosIPSS.responsavelCozinha ||
                "Não preenchido"}
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <ClipboardList size={32} />

          <h3>Receitas</h3>

          <p>{fichas.length}</p>

          <span>Fichas técnicas</span>
        </div>

        <div className="dashboard-card">
          <Package size={32} />

          <h3>Produtos</h3>

          <p>{stocks.length}</p>

          <span>Produtos em stock</span>
        </div>

        <div className="dashboard-card">
          <AlertTriangle size={32} />

          <h3>Stock baixo</h3>

          <p>{produtosStockBaixo.length}</p>

          <span>Produtos críticos</span>
        </div>

        <div className="dashboard-card">
          <ShieldAlert size={32} />

          <h3>Expirados</h3>

          <p>{produtosExpirados.length}</p>

          <span>Produtos vencidos</span>
        </div>

        <div className="dashboard-card">
          <Clock3 size={32} />

          <h3>A expirar</h3>

          <p>{produtosAExpirar.length}</p>

          <span>Próximos 7 dias</span>
        </div>

        <div className="dashboard-card">
          <TrendingUp size={32} />

          <h3>Entradas</h3>

          <p>{totalEntradas}</p>

          <span>Movimentos entrada</span>
        </div>

        <div className="dashboard-card">
          <TrendingDown size={32} />

          <h3>Saídas</h3>

          <p>{totalSaidas}</p>

          <span>Movimentos saída</span>
        </div>

        <div className="dashboard-card">
          <Euro size={32} />

          <h3>Custo médio</h3>

          <p>
            {custoMedioReceita.toFixed(2)} €
          </p>

          <span>Por receita</span>
        </div>

        <div className="dashboard-card destaque">
          <ShoppingCart size={32} />

          <h3>Compras</h3>

          <p>{comprasPendentes}</p>

          <span>Pendentes</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Indicadores Operacionais</h2>

        <div className="grafico-movimentos">
          <div className="movimento-card">
            <strong>Receitas registadas</strong>

            <span>{fichas.length}</span>
          </div>

          <div className="movimento-card">
            <strong>Produtos em stock</strong>

            <span>{stocks.length}</span>
          </div>

          <div className="movimento-card">
            <strong>Movimentos</strong>

            <span>{movimentos.length}</span>
          </div>

          <div className="movimento-card">
            <strong>Compras pendentes</strong>

            <span>{comprasPendentes}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Gráfico de Quantidades em Stock</h2>

        {stocks.length === 0 ? (
          <p>
            Ainda não existem produtos
            registados.
          </p>
        ) : (
          <div
            style={{
              width: "100%",
              height: 350,
            }}
          >
            <ResponsiveContainer>
              <BarChart data={dadosGrafico}>
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
        )}
      </div>

      <div className="dashboard-section">
        <h2>Resumo Financeiro</h2>

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <Euro size={32} />

            <h3>Custo total receitas</h3>

            <p>
              {custoTotalReceitas.toFixed(2)} €
            </p>

            <span>
              Soma das fichas técnicas
            </span>
          </div>

          <div className="dashboard-card">
            <TrendingUp size={32} />

            <h3>Custo médio</h3>

            <p>
              {custoMedioReceita.toFixed(2)} €
            </p>

            <span>Por receita</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Alertas críticos</h2>

        {produtosStockBaixo.length === 0 &&
        produtosAExpirar.length === 0 &&
        produtosExpirados.length === 0 ? (
          <p className="success-message">
            <CheckCircle2 size={18} /> Não existem
            alertas críticos.
          </p>
        ) : (
          <>
            {produtosStockBaixo.length >
              0 && (
              <p
                style={{
                  color: "#dc2626",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                ⚠ Existem{" "}
                {
                  produtosStockBaixo.length
                }{" "}
                produtos com stock baixo.
              </p>
            )}

            {produtosAExpirar.length >
              0 && (
              <p
                style={{
                  color: "#ca8a04",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                ⚠ Existem{" "}
                {
                  produtosAExpirar.length
                }{" "}
                produtos a expirar nos
                próximos 7 dias.
              </p>
            )}

            {produtosExpirados.length >
              0 && (
              <p
                style={{
                  color: "#991b1b",
                  fontWeight: "bold",
                }}
              >
                ❌ Existem{" "}
                {
                  produtosExpirados.length
                }{" "}
                produtos expirados.
              </p>
            )}
          </>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Receitas mais recentes</h2>

        {fichas.length === 0 ? (
          <p>
            Ainda não existem fichas
            técnicas registadas.
          </p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Receita</th>
                <th>Categoria</th>
                <th>Doses</th>
                <th>Custo total</th>
              </tr>
            </thead>

            <tbody>
              {fichas
                .slice(-5)
                .reverse()
                .map((ficha, index) => (
                  <tr key={index}>
                    <td>{ficha.nome}</td>

                    <td>
                      {ficha.categoria}
                    </td>

                    <td>{ficha.doses}</td>

                    <td>
                      {Number(
                        ficha.custoTotal || 0
                      ).toFixed(2)}{" "}
                      €
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboard-section">
        <h2>
          Últimos movimentos de stock
        </h2>

        {movimentos.length === 0 ? (
          <p>
            Ainda não existem movimentos
            registados.
          </p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Produto</th>
                <th>Quantidade</th>
              </tr>
            </thead>

            <tbody>
              {movimentos
                .slice(0, 5)
                .map((movimento, index) => (
                  <tr key={index}>
                    <td>
                      {movimento.data ||
                        "Sem data"}
                    </td>

                    <td>
                      {movimento.tipo ||
                        "Movimento"}
                    </td>

                    <td>
                      {movimento.produto}
                    </td>

                    <td>
                      {
                        movimento.quantidade
                      }{" "}
                      {
                        movimento.unidade
                      }
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

export default Dashboard;