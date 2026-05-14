import { useEffect, useState } from "react";

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

  const maxQuantidade = Math.max(
    ...stocks.map(
      (item) => Number(item.quantidade) || 0
    ),
    1
  );

  const comprasPendentes =
    produtosStockBaixo.length +
    produtosExpirados.length;

  return (
    <div className="dashboard">
      <h1>Dashboard Geral</h1>

      <p className="dashboard-subtitle">
        Visão global da gestão alimentar da IPSS.
      </p>

      <div className="dashboard-section">
        <h2>Identificação da IPSS</h2>

        <p>
          <strong>Instituição:</strong>{" "}
          {dadosIPSS.nomeInstituicao ||
            "Não preenchido"}
        </p>

        <p>
          <strong>Localidade:</strong>{" "}
          {dadosIPSS.localidade ||
            "Não preenchido"}
        </p>

        <p>
          <strong>
            Responsável pela cozinha:
          </strong>{" "}
          {dadosIPSS.responsavelCozinha ||
            "Não preenchido"}
        </p>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Receitas</h3>

          <p>{fichas.length}</p>

          <span>Fichas técnicas</span>
        </div>

        <div className="dashboard-card">
          <h3>Produtos</h3>

          <p>{stocks.length}</p>

          <span>Produtos em stock</span>
        </div>

        <div className="dashboard-card">
          <h3>Stock baixo</h3>

          <p>{produtosStockBaixo.length}</p>

          <span>Produtos críticos</span>
        </div>

        <div className="dashboard-card">
          <h3>Expirados</h3>

          <p>{produtosExpirados.length}</p>

          <span>Produtos vencidos</span>
        </div>

        <div className="dashboard-card">
          <h3>A expirar</h3>

          <p>{produtosAExpirar.length}</p>

          <span>Próximos 7 dias</span>
        </div>

        <div className="dashboard-card">
          <h3>Entradas</h3>

          <p>{totalEntradas}</p>

          <span>Movimentos entrada</span>
        </div>

        <div className="dashboard-card">
          <h3>Saídas</h3>

          <p>{totalSaidas}</p>

          <span>Movimentos saída</span>
        </div>

        <div className="dashboard-card">
          <h3>Custo médio</h3>

          <p>
            {custoMedioReceita.toFixed(2)} €
          </p>

          <span>Por receita</span>
        </div>

        <div className="dashboard-card">
          <h3>Compras</h3>

          <p>{comprasPendentes}</p>

          <span>Pendentes</span>
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
          <div className="grafico-barras">
            {stocks
              .slice(0, 8)
              .map((item, index) => {
                const percentagem =
                  (Number(item.quantidade) /
                    maxQuantidade) *
                  100;

                return (
                  <div
                    className="linha-grafico"
                    key={index}
                  >
                    <span className="nome-produto">
                      {item.nome ||
                        item.produto}
                    </span>

                    <div className="barra-fundo">
                      <div
                        className="barra-preenchida"
                        style={{
                          width: `${percentagem}%`,
                        }}
                      ></div>
                    </div>

                    <span className="valor-produto">
                      {item.quantidade}{" "}
                      {item.unidade}
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Resumo financeiro</h2>

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>Custo total receitas</h3>

            <p>
              {custoTotalReceitas.toFixed(2)} €
            </p>

            <span>
              Soma das fichas técnicas
            </span>
          </div>

          <div className="dashboard-card">
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
            Não existem alertas críticos.
          </p>
        ) : (
          <>
            {produtosStockBaixo.length >
              0 && (
              <p
                style={{
                  color: "#dc2626",
                  fontWeight: "bold",
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
        <h2>
          Receitas mais recentes
        </h2>

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