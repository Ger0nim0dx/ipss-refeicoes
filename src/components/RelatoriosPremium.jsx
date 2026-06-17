import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FileText,
  Download,
  Euro,
  Package,
  ShieldAlert,
  Users,
  ClipboardList,
  BrainCircuit,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import { useInstituicao } from "../context/InstituicaoContext";

export default function RelatoriosPremium() {
  const { instituicaoAtual } = useInstituicao();
  const [dadosIPSS, setDadosIPSS] = useState({});
  const [stocks, setStocks] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [ementas, setEmentas] = useState([]);
  const [haccp, setHaccp] = useState([]);
  const [utentes, setUtentes] = useState([]);

  useEffect(() => {
    if (instituicaoAtual?.id) {
      carregarDados();
    }
  }, [instituicaoAtual]);

  async function carregarDados() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user || !instituicaoAtual?.id) return;

    const user = userData.user;

    const { data: dadosData } = await supabase
      .from("dados_ipss")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id)
      .maybeSingle();

    const { data: stocksData } = await supabase
      .from("stocks")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id);

    const { data: fichasData } = await supabase
      .from("fichas_tecnicas")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id);

    const { data: ementasData } = await supabase
      .from("ementas")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id)
      .order("created_at", { ascending: false });

    const { data: haccpData } = await supabase
      .from("haccp")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id);

    const { data: utentesData } = await supabase
      .from("utentes")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id);

    const fichasFormatadas = (fichasData || []).map((ficha) => ({
      id: ficha.id,
      nome: ficha.nome,
      categoria: ficha.categoria,
      doses: ficha.doses,
      ...ficha.dados,
    }));

    setDadosIPSS(dadosData || {});
    setStocks(stocksData || []);
    setFichas(fichasFormatadas);
    setEmentas(ementasData || []);
    setHaccp(haccpData || []);
    setUtentes(utentesData || []);
  }

  const hoje = new Date();

  const produtosCriticos = stocks.filter(
    (item) =>
      Number(item.quantidade || 0) <=
      Number(item.stock_minimo || item.stockMinimo || 0)
  );

  const produtosExpirar = stocks.filter((item) => {
    if (!item.validade) return false;

    const validade = new Date(item.validade);
    const dias = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

    return dias >= 0 && dias <= 7;
  });

  const alertasHaccp = haccp.filter(
    (item) =>
      item.tipo_registo === "nao_conformidade" ||
      item.estado === "Crítico" ||
      item.estado === "Não conforme"
  );

  const custoTotalReceitas = fichas.reduce(
    (total, ficha) => total + Number(ficha.custoTotal || 0),
    0
  );

  const custoMedioReceita =
    fichas.length > 0 ? custoTotalReceitas / fichas.length : 0;

  const ementaAtual = ementas[0]?.dados || {};

  const totalRefeicoesPlaneadas = Object.values(ementaAtual).reduce(
    (total, refeicoesDia) => total + Object.values(refeicoesDia || {}).filter(Boolean).length,
    0
  );

  function exportarPDFExecutivo() {
    const doc = new jsPDF();

    const nomeInstituicao =
      dadosIPSS.nomeinstituicao ||
      dadosIPSS.nome ||
      "IPSS Gestão";

    doc.setFontSize(18);
    doc.text("Relatório Executivo de Gestão Alimentar", 14, 20);

    doc.setFontSize(11);
    doc.text(`Instituição: ${nomeInstituicao}`, 14, 30);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-PT")}`, 14, 38);

    doc.setFontSize(13);
    doc.text("1. Indicadores gerais", 14, 52);

    autoTable(doc, {
      startY: 58,
      head: [["Indicador", "Valor"]],
      body: [
        ["Produtos em stock", stocks.length],
        ["Produtos críticos", produtosCriticos.length],
        ["Produtos a expirar em 7 dias", produtosExpirar.length],
        ["Fichas técnicas", fichas.length],
        ["Refeições planeadas", totalRefeicoesPlaneadas],
        ["Utentes registados", utentes.length],
        ["Alertas HACCP", alertasHaccp.length],
        ["Custo total das receitas", `${custoTotalReceitas.toFixed(2)} €`],
        ["Custo médio por receita", `${custoMedioReceita.toFixed(2)} €`],
      ],
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Produto", "Quantidade", "Stock mínimo", "Validade"]],
      body: produtosCriticos.map((item) => [
        item.produto || item.nome || "-",
        `${item.quantidade || 0} ${item.unidade || ""}`,
        `${item.stock_minimo || item.stockMinimo || 0} ${item.unidade || ""}`,
        item.validade || "-",
      ]),
      didDrawPage: () => {},
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Receita", "Categoria", "Doses", "Custo total", "Custo/dose"]],
      body: fichas.slice(0, 15).map((ficha) => [
        ficha.nome || "-",
        ficha.categoria || "-",
        ficha.doses || "-",
        `${Number(ficha.custoTotal || 0).toFixed(2)} €`,
        `${Number(ficha.custoPorDose || 0).toFixed(2)} €`,
      ]),
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Registo HACCP", "Estado", "Descrição"]],
      body: alertasHaccp.slice(0, 10).map((item) => [
        item.tipo_registo || "-",
        item.estado || "-",
        item.descricao || item.observacoes || "-",
      ]),
    });

    const y = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(11);
    doc.text(
      "Síntese automática: recomenda-se validar os produtos críticos, rever os produtos com validade próxima e acompanhar os registos HACCP não conformes.",
      14,
      y,
      { maxWidth: 180 }
    );

    doc.text(
      "Assinatura do responsável: ______________________________",
      14,
      280
    );

    doc.save("relatorio-executivo-ipss.pdf");
  }

  function exportarPDFStocks() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Relatório de Stocks", 14, 20);

    doc.setFontSize(11);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-PT")}`, 14, 30);

    autoTable(doc, {
      startY: 42,
      head: [["Produto", "Categoria", "Quantidade", "Stock mínimo", "Validade"]],
      body: stocks.map((item) => [
        item.produto || item.nome || "-",
        item.categoria || "-",
        `${item.quantidade || 0} ${item.unidade || ""}`,
        `${item.stock_minimo || item.stockMinimo || 0} ${item.unidade || ""}`,
        item.validade || "-",
      ]),
    });

    doc.save("relatorio-stocks-ipss.pdf");
  }

  function exportarPDFHACCP() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Relatório HACCP", 14, 20);

    doc.setFontSize(11);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-PT")}`, 14, 30);

    autoTable(doc, {
      startY: 42,
      head: [["Tipo", "Estado", "Descrição", "Data"]],
      body: haccp.map((item) => [
        item.tipo_registo || "-",
        item.estado || "-",
        item.descricao || item.observacoes || "-",
        item.created_at
          ? new Date(item.created_at).toLocaleDateString("pt-PT")
          : "-",
      ]),
    });

    doc.save("relatorio-haccp-ipss.pdf");
  }

  return (
    <div className="dashboard">
      <div className="topo-dashboard">
        <div>
          <h1>Relatórios Premium</h1>
          <p className="dashboard-subtitle">
            {instituicaoAtual?.nome || "IPSS"} — Geração de relatórios profissionais para direção, cozinha, nutrição,
            HACCP e auditorias.
          </p>
        </div>

        <div className="data-box">
          <FileText size={18} /> Relatórios
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card destaque">
          <FileText size={30} />
          <h3>Relatório executivo</h3>
          <p>PDF</p>
          <span>Visão global da operação</span>
        </div>

        <div className="dashboard-card">
          <Package size={30} />
          <h3>Stocks</h3>
          <p>{stocks.length}</p>
          <span>Produtos registados</span>
        </div>

        <div className="dashboard-card">
          <ShieldAlert size={30} />
          <h3>HACCP</h3>
          <p>{alertasHaccp.length}</p>
          <span>Alertas críticos</span>
        </div>

        <div className="dashboard-card">
          <ClipboardList size={30} />
          <h3>Fichas técnicas</h3>
          <p>{fichas.length}</p>
          <span>Receitas registadas</span>
        </div>

        <div className="dashboard-card">
          <Users size={30} />
          <h3>Utentes</h3>
          <p>{utentes.length}</p>
          <span>Registos ativos</span>
        </div>

        <div className="dashboard-card">
          <Euro size={30} />
          <h3>Custo médio</h3>
          <p>{custoMedioReceita.toFixed(2)} €</p>
          <span>Por receita</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Exportação de relatórios</h2>

        <div className="historico-grid">
          <div className="historico-card">
            <h3>Relatório Executivo</h3>
            <p>
              Inclui indicadores gerais, stocks críticos, fichas técnicas,
              HACCP e síntese automática.
            </p>

            <button className="botao-principal" onClick={exportarPDFExecutivo}>
              <Download size={18} /> Exportar PDF executivo
            </button>
          </div>

          <div className="historico-card">
            <h3>Relatório de Stocks</h3>
            <p>
              Lista de produtos, quantidades, stock mínimo e validade.
            </p>

            <button className="botao-secundario" onClick={exportarPDFStocks}>
              <Download size={18} /> Exportar PDF stocks
            </button>
          </div>

          <div className="historico-card">
            <h3>Relatório HACCP</h3>
            <p>
              Registos HACCP, não conformidades, estados e observações.
            </p>

            <button className="botao-secundario" onClick={exportarPDFHACCP}>
              <Download size={18} /> Exportar PDF HACCP
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>
          <BrainCircuit size={22} /> Síntese inteligente
        </h2>

        <div className="historico-card">
          <p>
            Existem <strong>{produtosCriticos.length}</strong> produto(s)
            críticos, <strong>{produtosExpirar.length}</strong> produto(s) a
            expirar nos próximos 7 dias e <strong>{alertasHaccp.length}</strong>{" "}
            alerta(s) HACCP.
          </p>

          <p>
            O custo médio atual por receita é de{" "}
            <strong>{custoMedioReceita.toFixed(2)} €</strong>.
          </p>

          <p>
            Recomenda-se utilizar este relatório em reuniões de direção,
            auditorias internas, acompanhamento HACCP e planeamento de compras.
          </p>
        </div>
      </div>
    </div>
  );
}