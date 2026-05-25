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
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error(userError);
      return;
    }

    const user = userData.user;

    const { data: dadosData } = await supabase
      .from("dados_ipss")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

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

    const { data: movimentosData } = await supabase
      .from("movimentos_stock")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setDadosIPSS(dadosData || {});
    setStocks(stocksData || []);
    setDietas(dietasData || []);
    setHaccp(haccpData || []);
    setMovimentos(movimentosData || []);

    setDataRelatorio(new Date().toISOString().split("T")[0]);
  }

  const produtosStockBaixo = stocks.filter(
    (item) =>
      Number(item.quantidade || 0) <= Number(item.stock_minimo || 0)
  );

  const naoConformidades = haccp.filter(
    (item) => item.tipo_registo === "nao_conformidade"
  );

  const eficienciaOperacional =
    stocks.length > 0
      ? Math.round(((stocks.length - produtosStockBaixo.length) / stocks.length) * 100)
      : 100;

  function imprimirRelatorio() {
    window.print();
  }

  function exportarExcel() {
    const workbook = XLSX.utils.book_new();

    const stocksSheet = XLSX.utils.json_to_sheet(
      stocks.map((item) => ({
        Produto: item.produto || item.nome,
        Quantidade: item.quantidade,
        Unidade: item.unidade,
        StockMinimo: item.stock_minimo,
        Validade: item.validade,
      }))
    );

    const dietasSheet = XLSX.utils.json_to_sheet(
      dietas.map((item) => ({
        Utente: item.nome_utente,
        Dieta: item.tipo_dieta,
        Restricoes: item.restricoes,
        Observacoes: item.observacoes,
      }))
    );

    const haccpSheet = XLSX.utils.json_to_sheet(
      haccp.map((item) => ({
        Tipo: item.tipo_registo,
        Data: item.data_registo,
        Area: item.area,
        Estado: item.estado,
        Responsavel: item.responsavel,
      }))
    );

    const movimentosSheet = XLSX.utils.json_to_sheet(
      movimentos.map((item) => ({
        Data: item.created_at
          ? new Date(item.created_at).toLocaleDateString("pt-PT")
          : "",
        Produto: item.produto,
        Tipo: item.tipo,
        Quantidade: item.quantidade,
        Unidade: item.unidade,
        Observacoes: item.observacoes,
      }))
    );

    XLSX.utils.book_append_sheet(workbook, stocksSheet, "Stocks");
    XLSX.utils.book_append_sheet(workbook, dietasSheet, "Dietas");
    XLSX.utils.book_append_sheet(workbook, haccpSheet, "HACCP");
    XLSX.utils.book_append_sheet(workbook, movimentosSheet, "Movimentos");

    XLSX.writeFile(workbook, "relatorio-ipss.xlsx");
  }

  function exportarPDF() {
    const doc = new jsPDF();

    const dataAtual = new Date().toLocaleDateString("pt-PT");

    doc.setFontSize(22);
    doc.text("IPSS Gestão", 14, 20);

    doc.setFontSize(17);
    doc.text("Relatório Executivo", 14, 32);

    doc.setFontSize(11);
    doc.text(
      `Instituição: ${dadosIPSS.nomeinstituicao || dadosIPSS.nomeInstituicao || "IPSS"}`,
      14,
      42
    );

    doc.text(`Data: ${dataAtual}`, 14, 49);

    doc.text(
      `Responsável: ${
        dadosIPSS.responsavelcozinha ||
        dadosIPSS.responsavelCozinha ||
        "-"
      }`,
      14,
      56
    );

    autoTable(doc, {
      startY: 68,
      head: [["Indicador", "Valor"]],
      body: [
        ["Produtos em stock", stocks.length],
        ["Produtos críticos", produtosStockBaixo.length],
        ["Dietas especiais", dietas.length],
        ["Não conformidades HACCP", naoConformidades.length],
        ["Movimentos de stock", movimentos.length],
        ["Eficiência operacional", `${eficienciaOperacional}%`],
      ],
      headStyles: {
        fillColor: [41, 128, 185],
      },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Produto", "Quantidade", "Stock mínimo"]],
      body:
        produtosStockBaixo.length > 0
          ? produtosStockBaixo.map((item) => [
              item.produto || item.nome,
              `${item.quantidade} ${item.unidade || ""}`,
              `${item.stock_minimo || 0} ${item.unidade || ""}`,
            ])
          : [["Sem produtos críticos", "-", "-"]],
      headStyles: {
        fillColor: [192, 57, 43],
      },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Data", "Descrição", "Responsável"]],
      body:
        naoConformidades.length > 0
          ? naoConformidades.map((item) => [
              item.data_registo || "-",
              item.descricao || "-",
              item.responsavel || "-",
            ])
          : [["Sem não conformidades", "-", "-"]],
      headStyles: {
        fillColor: [243, 156, 18],
      },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Data", "Tipo", "Produto", "Quantidade"]],
      body:
        movimentos.length > 0
          ? movimentos.slice(0, 10).map((item) => [
              item.created_at
                ? new Date(item.created_at).toLocaleDateString("pt-PT")
                : "-",
              item.tipo || "-",
              item.produto || "-",
              `${item.quantidade || 0} ${item.unidade || ""}`,
            ])
          : [["Sem movimentos registados", "-", "-", "-"]],
      headStyles: {
        fillColor: [39, 174, 96],
      },
    });

    const finalY = doc.lastAutoTable.finalY + 25;

    doc.setFontSize(11);
    doc.text("Responsável Técnico:", 14, finalY);
    doc.line(60, finalY, 150, finalY);

    doc.save(`relatorio-executivo-${dataAtual}.pdf`);
  }

  return (
    <div className="pagina">
      <h1>Relatórios Automáticos</h1>

      <p className="descricao">
        Geração automática de relatórios com base nos dados registados na app.
      </p>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Produtos</h3>
          <p>{stocks.length}</p>
          <span>Em stock</span>
        </div>

        <div className="dashboard-card">
          <h3>Stock baixo</h3>
          <p>{produtosStockBaixo.length}</p>
          <span>Produtos críticos</span>
        </div>

        <div className="dashboard-card">
          <h3>Dietas</h3>
          <p>{dietas.length}</p>
          <span>Dietas especiais</span>
        </div>

        <div className="dashboard-card">
          <h3>HACCP</h3>
          <p>{naoConformidades.length}</p>
          <span>Não conformidades</span>
        </div>

        <div className="dashboard-card">
          <h3>Movimentos</h3>
          <p>{movimentos.length}</p>
          <span>Stock / produção</span>
        </div>

        <div className="dashboard-card destaque">
          <h3>Eficiência</h3>
          <p>{eficienciaOperacional}%</p>
          <span>Operação atual</span>
        </div>
      </div>

      <div className="cartao-resumo area-impressao">
        <h2>Relatório Automático de Gestão Alimentar</h2>

        <p>
          <strong>Data:</strong> {dataRelatorio}
        </p>

        <p>
          <strong>Instituição:</strong>{" "}
          {dadosIPSS.nomeinstituicao ||
            dadosIPSS.nomeInstituicao ||
            "Não preenchido"}
        </p>

        <p>
          <strong>Responsável pela cozinha:</strong>{" "}
          {dadosIPSS.responsavelcozinha ||
            dadosIPSS.responsavelCozinha ||
            "Não preenchido"}
        </p>

        <h3>Produtos com stock baixo</h3>

        {produtosStockBaixo.length === 0 ? (
          <p>Não foram identificados produtos com stock baixo.</p>
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
              {produtosStockBaixo.map((item, index) => (
                <tr key={index}>
                  <td>{item.produto || item.nome}</td>
                  <td>
                    {item.quantidade} {item.unidade}
                  </td>
                  <td>
                    {item.stock_minimo} {item.unidade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h3>Dietas registadas</h3>

        {dietas.length === 0 ? (
          <p>Não existem dietas registadas.</p>
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
              {dietas.map((item, index) => (
                <tr key={index}>
                  <td>{item.nome_utente}</td>
                  <td>{item.tipo_dieta}</td>
                  <td>{item.restricoes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h3>Não conformidades HACCP</h3>

        {naoConformidades.length === 0 ? (
          <p>Não existem não conformidades registadas.</p>
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
              {naoConformidades.map((item, index) => (
                <tr key={index}>
                  <td>{item.data_registo}</td>
                  <td>{item.descricao}</td>
                  <td>{item.responsavel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h3>Últimos movimentos de stock</h3>

        {movimentos.length === 0 ? (
          <p>Não existem movimentos registados.</p>
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
              {movimentos.slice(0, 10).map((item, index) => (
                <tr key={index}>
                  <td>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString("pt-PT")
                      : "-"}
                  </td>
                  <td>{item.tipo}</td>
                  <td>{item.produto}</td>
                  <td>
                    {item.quantidade} {item.unidade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="botoes-formulario">
        <button className="botao-principal" onClick={imprimirRelatorio}>
          Imprimir / PDF
        </button>

        <button className="botao-secundario" onClick={exportarPDF}>
          Exportar PDF Executivo
        </button>

        <button className="botao-secundario" onClick={exportarExcel}>
          Exportar Excel
        </button>
      </div>
    </div>
  );
}

export default Relatorios;