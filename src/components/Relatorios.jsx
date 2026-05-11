import { useEffect, useState } from "react";

function Relatorios() {
  const [dadosIPSS, setDadosIPSS] = useState({});
  const [stocks, setStocks] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [dataRelatorio, setDataRelatorio] = useState("");

  useEffect(() => {
    const dadosGuardados = JSON.parse(localStorage.getItem("dadosIPSS")) || {};
    const stocksGuardados =
      JSON.parse(localStorage.getItem("stocks")) ||
      JSON.parse(localStorage.getItem("stock")) ||
      [];

    const movimentosGuardados =
      JSON.parse(localStorage.getItem("movimentosStock")) ||
      JSON.parse(localStorage.getItem("movimentos")) ||
      [];

    setDadosIPSS(dadosGuardados);
    setStocks(stocksGuardados);
    setMovimentos(movimentosGuardados);

    const hoje = new Date().toISOString().split("T")[0];
    setDataRelatorio(hoje);
  }, []);

  const produtosStockBaixo = stocks.filter(
    (item) => Number(item.quantidade) <= Number(item.stockMinimo || 0)
  );

  function imprimirRelatorio() {
    window.print();
  }

  return (
    <div className="pagina">
      <h1>Relatórios Automáticos</h1>

      <p className="descricao">
        Geração automática de relatórios com base nos dados registados na app.
      </p>

      <div className="cartao-resumo area-impressao">
        <h2>Relatório Automático de Stocks</h2>

        <p>
          <strong>Data:</strong> {dataRelatorio}
        </p>

        <p>
          <strong>Instituição:</strong>{" "}
          {dadosIPSS.nomeInstituicao || "Não preenchido"}
        </p>

        <p>
          <strong>Responsável pela cozinha:</strong>{" "}
          {dadosIPSS.responsavelCozinha || "Não preenchido"}
        </p>

        <p>
          <strong>Técnico responsável:</strong> Frederico Pinto
        </p>

        <h3>1. Síntese geral</h3>

        <p>
          O presente relatório apresenta uma síntese automática da situação de
          stocks registada na aplicação, permitindo identificar os produtos
          existentes, os níveis de stock mínimo e eventuais necessidades de
          reposição.
        </p>

        <p>
          No total, encontram-se registados <strong>{stocks.length}</strong>{" "}
          produtos em stock.
        </p>

        <p>
          Foram identificados <strong>{produtosStockBaixo.length}</strong>{" "}
          produtos com quantidade igual ou inferior ao stock mínimo definido.
        </p>

        <h3>2. Produtos com stock baixo</h3>

        {produtosStockBaixo.length === 0 ? (
          <p>Não foram identificados produtos com stock baixo.</p>
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

        <h3>3. Lista geral de produtos em stock</h3>

        {stocks.length === 0 ? (
          <p>Não existem produtos registados no módulo de stocks.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Stock mínimo</th>
                <th>Unidade</th>
              </tr>
            </thead>

            <tbody>
              {stocks.map((item, index) => (
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

        <h3>4. Movimentos de stock</h3>

        {movimentos.length === 0 ? (
          <p>Não existem movimentos de stock registados.</p>
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
              {movimentos.map((movimento, index) => (
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

        <h3>5. Conclusão automática</h3>

        {produtosStockBaixo.length > 0 ? (
          <p>
            Recomenda-se a reposição dos produtos identificados com stock baixo,
            de forma a garantir a continuidade da confeção das refeições e a
            adequada organização da cozinha.
          </p>
        ) : (
          <p>
            A situação de stock encontra-se globalmente controlada, não havendo,
            neste momento, produtos abaixo do stock mínimo definido.
          </p>
        )}
      </div>

      <div className="botoes-formulario">
        <button className="botao-principal" onClick={imprimirRelatorio}>
          Imprimir / Guardar em PDF
        </button>
      </div>
    </div>
  );
}

export default Relatorios;