import { useEffect, useState } from "react";

import * as XLSX from "xlsx";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { supabase } from "../supabaseClient";

function Relatorios() {
  const [dadosIPSS, setDadosIPSS] = useState({});
  const [stocks, setStocks] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [dietas, setDietas] = useState([]);
  const [haccp, setHaccp] = useState([]);

  const [dataRelatorio, setDataRelatorio] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error(userError);
      return;
    }

    const user = userData.user;

    setDadosIPSS(
      JSON.parse(localStorage.getItem("dadosIPSS")) || {}
    );

    const { data: stocksData } = await supabase
      .from("stocks")
      .select("*")
      .eq("user_id", user.id);

    const { data: dietasData } = await supabase
      .from("dietas")
      .select("*")
      .eq("user_id", user.id);

    const { data: haccpData } = await supabase
      .from("haccp")
      .select("*")
      .eq("user_id", user.id);

    setStocks(stocksData || []);
    setDietas(dietasData || []);
    setHaccp(haccpData || []);

    setMovimentos(
      JSON.parse(
        localStorage.getItem("ipssMovimentosStock")
      ) || []
    );

    const hoje = new Date()
      .toISOString()
      .split("T")[0];

    setDataRelatorio(hoje);
  }

  const produtosStockBaixo = stocks.filter(
    (item) =>
      Number(item.quantidade) <=
      Number(item.stock_minimo || 0)
  );

  const naoConformidades = haccp.filter(
    (item) =>
      item.tipo_registo ===
      "nao_conformidade"
  );

  function imprimirRelatorio() {
    window.print();
  }

  function exportarExcel() {
    const workbook =
      XLSX.utils.book_new();

    const stocksSheet =
      XLSX.utils.json_to_sheet(
        stocks.map((item) => ({
          Produto:
            item.produto ||
            item.nome,
          Quantidade:
            item.quantidade,
          Unidade: item.unidade,
          StockMinimo:
            item.stock_minimo,
          Validade:
            item.validade,
        }))
      );

    const dietasSheet =
      XLSX.utils.json_to_sheet(
        dietas.map((item) => ({
          Utente:
            item.nome_utente,
          Dieta:
            item.tipo_dieta,
          Restricoes:
            item.restricoes,
          Observacoes:
            item.observacoes,
        }))
      );

    const haccpSheet =
      XLSX.utils.json_to_sheet(
        haccp.map((item) => ({
          Tipo:
            item.tipo_registo,
          Data:
            item.data_registo,
          Area: item.area,
          Estado:
            item.estado,
          Responsavel:
            item.responsavel,
        }))
      );

    XLSX.utils.book_append_sheet(
      workbook,
      stocksSheet,
      "Stocks"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      dietasSheet,
      "Dietas"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      haccpSheet,
      "HACCP"
    );

    XLSX.writeFile(
      workbook,
      "relatorio-ipss.xlsx"
    );
  }

  function exportarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text(
      "Relatório Global IPSS",
      14,
      20
    );

    doc.setFontSize(11);

    doc.text(
      `Instituição: ${
        dadosIPSS.nomeInstituicao ||
        "IPSS"
      }`,
      14,
      30
    );

    doc.text(
      `Data: ${dataRelatorio}`,
      14,
      38
    );

    autoTable(doc, {
      startY: 50,
      head: [
        [
          "Indicador",
          "Total",
        ],
      ],
      body: [
        [
          "Produtos em stock",
          stocks.length,
        ],
        [
          "Produtos stock baixo",
          produtosStockBaixo.length,
        ],
        [
          "Dietas",
          dietas.length,
        ],
        [
          "Não conformidades HACCP",
          naoConformidades.length,
        ],
      ],
    });

    doc.save(
      "relatorio-global-ipss.pdf"
    );
  }

  return (
    <div className="pagina">
      <h1>
        Relatórios Automáticos
      </h1>

      <p className="descricao">
        Geração automática de
        relatórios com base nos dados
        registados na app.
      </p>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Produtos</h3>

          <p>{stocks.length}</p>

          <span>
            Em stock
          </span>
        </div>

        <div className="dashboard-card">
          <h3>Stock baixo</h3>

          <p>
            {
              produtosStockBaixo.length
            }
          </p>

          <span>
            Produtos críticos
          </span>
        </div>

        <div className="dashboard-card">
          <h3>Dietas</h3>

          <p>{dietas.length}</p>

          <span>
            Dietas especiais
          </span>
        </div>

        <div className="dashboard-card">
          <h3>HACCP</h3>

          <p>
            {
              naoConformidades.length
            }
          </p>

          <span>
            Não conformidades
          </span>
        </div>
      </div>

      <div className="cartao-resumo area-impressao">
        <h2>
          Relatório Automático de
          Stocks
        </h2>

        <p>
          <strong>Data:</strong>{" "}
          {dataRelatorio}
        </p>

        <p>
          <strong>
            Instituição:
          </strong>{" "}
          {dadosIPSS.nomeInstituicao ||
            "Não preenchido"}
        </p>

        <p>
          <strong>
            Responsável pela cozinha:
          </strong>{" "}
          {dadosIPSS.responsavelCozinha ||
            "Não preenchido"}
        </p>

        <h3>
          Produtos com stock baixo
        </h3>

        {produtosStockBaixo.length ===
        0 ? (
          <p>
            Não foram identificados
            produtos com stock
            baixo.
          </p>
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
              {produtosStockBaixo.map(
                (item, index) => (
                  <tr key={index}>
                    <td>
                      {item.produto}
                    </td>

                    <td>
                      {
                        item.quantidade
                      }
                    </td>

                    <td>
                      {
                        item.stock_minimo
                      }
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}

        <h3>Dietas registadas</h3>

        {dietas.length === 0 ? (
          <p>
            Não existem dietas
            registadas.
          </p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Utente</th>
                <th>Dieta</th>
                <th>Restrições</th>
              </tr>
            </thead>

            <tbody>
              {dietas.map(
                (item, index) => (
                  <tr key={index}>
                    <td>
                      {
                        item.nome_utente
                      }
                    </td>

                    <td>
                      {
                        item.tipo_dieta
                      }
                    </td>

                    <td>
                      {
                        item.restricoes
                      }
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}

        <h3>
          Não conformidades HACCP
        </h3>

        {naoConformidades.length ===
        0 ? (
          <p>
            Não existem não
            conformidades registadas.
          </p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Responsável</th>
              </tr>
            </thead>

            <tbody>
              {naoConformidades.map(
                (item, index) => (
                  <tr key={index}>
                    <td>
                      {
                        item.data_registo
                      }
                    </td>

                    <td>
                      {
                        item.descricao
                      }
                    </td>

                    <td>
                      {
                        item.responsavel
                      }
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="botoes-formulario">
        <button
          className="botao-principal"
          onClick={imprimirRelatorio}
        >
          Imprimir / PDF
        </button>

        <button
          className="botao-secundario"
          onClick={exportarPDF}
        >
          Exportar PDF
        </button>

        <button
          className="botao-secundario"
          onClick={exportarExcel}
        >
          Exportar Excel
        </button>
      </div>
    </div>
  );
}

export default Relatorios;