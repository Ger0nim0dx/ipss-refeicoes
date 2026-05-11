import { useEffect, useState } from "react";

function Dashboard() {
  const [dadosIPSS, setDadosIPSS] = useState({});
  const [stocks, setStocks] = useState([]);
  const [movimentos, setMovimentos] = useState([]);

  useEffect(() => {
    setDadosIPSS(JSON.parse(localStorage.getItem("dadosIPSS")) || {});
    setStocks(JSON.parse(localStorage.getItem("ipssStocks")) || []);
    setMovimentos(JSON.parse(localStorage.getItem("ipssMovimentosStock")) || []);
  }, []);

  const produtosStockBaixo = stocks.filter(
    (item) => Number(item.quantidade) <= Number(item.stockMinimo || 0)
  );

  const totalEntradas = movimentos.filter((m) => m.tipo === "Entrada").length;
  const totalSaidas = movimentos.filter((m) => m.tipo === "Saída").length;

  const maxQuantidade = Math.max(
    ...stocks.map((item) => Number(item.quantidade) || 0),
    1
  );

  return (
    <div className="dashboard">
      <h1>Dashboard Geral</h1>

      <p className="dashboard-subtitle">
        Visão global da gestão alimentar da IPSS.
      </p>

      <div className="dashboard-section">
        <h2>Identificação da IPSS</h2>
        <p><strong>Instituição:</strong> {dadosIPSS.nomeInstituicao || "Não preenchido"}</p>
        <p><strong>Localidade:</strong> {dadosIPSS.localidade || "Não preenchido"}</p>
        <p><strong>Responsável pela cozinha:</strong> {dadosIPSS.responsavelCozinha || "Não preenchido"}</p>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Produtos em Stock</h3>
          <p>{stocks.length}</p>
          <span>produtos registados</span>
        </div>

        <div className="dashboard-card">
          <h3>Stock Baixo</h3>
          <p>{produtosStockBaixo.length}</p>
          <span>produtos a repor</span>
        </div>

        <div className="dashboard-card">
          <h3>Entradas</h3>
          <p>{totalEntradas}</p>
          <span>movimentos de entrada</span>
        </div>

        <div className="dashboard-card">
          <h3>Saídas</h3>
          <p>{totalSaidas}</p>
          <span>movimentos de saída</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Gráfico de Quantidades em Stock</h2>

        {stocks.length === 0 ? (
          <p>Ainda não existem produtos registados.</p>
        ) : (
          <div className="grafico-barras">
            {stocks.slice(0, 8).map((item, index) => {
              const percentagem =
                (Number(item.quantidade) / maxQuantidade) * 100;

              return (
                <div className="linha-grafico" key={index}>
                  <span className="nome-produto">
                    {item.nome || item.produto}
                  </span>

                  <div className="barra-fundo">
                    <div
                      className="barra-preenchida"
                      style={{ width: `${percentagem}%` }}
                    ></div>
                  </div>

                  <span className="valor-produto">
                    {item.quantidade} {item.unidade}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Resumo de Movimentos</h2>

        <div className="grafico-movimentos">
          <div className="movimento-card">
            <strong>Entradas</strong>
            <span>{totalEntradas}</span>
          </div>

          <div className="movimento-card">
            <strong>Saídas</strong>
            <span>{totalSaidas}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Alertas de Stock</h2>

        {produtosStockBaixo.length === 0 ? (
          <p className="success-message">Não existem produtos com stock baixo.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade atual</th>
                <th>Stock mínimo</th>
                <th>Unidade</th>
              </tr>
            </thead>

            <tbody>
              {produtosStockBaixo.map((item, index) => (
                <tr key={index}>
                  <td>{item.nome || item.produto}</td>
                  <td>{item.quantidade}</td>
                  <td>{item.stockMinimo}</td>
                  <td>{item.unidade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Últimos movimentos de stock</h2>

        {movimentos.length === 0 ? (
          <p>Ainda não existem movimentos registados.</p>
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
              {movimentos.slice(-5).reverse().map((movimento, index) => (
                <tr key={index}>
                  <td>{movimento.data || "Sem data"}</td>
                  <td>{movimento.tipo || "Movimento"}</td>
                  <td>{movimento.produto}</td>
                  <td>
                    {movimento.quantidade} {movimento.unidade}
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