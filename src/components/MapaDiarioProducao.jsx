import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  CalendarDays,
  ChefHat,
  ClipboardList,
  FileText,
  Download,
  CheckSquare,
  UserCheck,
} from "lucide-react";

import { supabase } from "../supabaseClient";

export default function MapaDiarioProducao() {
  const [ementa, setEmenta] = useState({});
  const [fichas, setFichas] = useState([]);
  const [utentes, setUtentes] = useState([]);
  const [diaSelecionado, setDiaSelecionado] = useState("Segunda-feira");
  const [responsavel, setResponsavel] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const diasSemana = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo",
  ];

  const refeicoes = [
    "Pequeno-almoço",
    "Reforço da manhã",
    "Almoço",
    "Lanche",
    "Jantar",
    "Reforço da noite",
  ];

  const checklistCozinha = [
    "Confirmar ementa principal do dia",
    "Verificar dietas, alergias e texturas especiais",
    "Confirmar ingredientes disponíveis em stock",
    "Registar temperaturas de confeção e conservação",
    "Identificar e separar porções adaptadas",
    "Registar sobras/desperdício no final do serviço",
  ];

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data: fichasData } = await supabase
      .from("fichas_tecnicas")
      .select("*")
      .order("created_at", { ascending: false });

    const fichasFormatadas = (fichasData || []).map((ficha) => ({
      id: ficha.id,
      nome: ficha.nome,
      categoria: ficha.categoria,
      doses: ficha.doses,
      ...ficha.dados,
    }));

    const { data: ementaData } = await supabase
      .from("ementas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: utentesData } = await supabase
      .from("utentes")
      .select("*")
      .eq("ativo", true);

    setFichas(fichasFormatadas);
    setEmenta(ementaData?.dados || {});
    setUtentes(utentesData || []);
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function limparTextoPDF(texto) {
    return String(texto || "")
      .replace(/[🎂⚠️⚠✅💚🍽🥛🌾🥚🐟🧂💧🥣•]/g, "")
      .replace(/[–—]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  function obterFicha(id) {
    return fichas.find((ficha) => String(ficha.id) === String(id));
  }

  function receitaTemAlergenio(ficha, termo) {
    const texto = normalizarTexto(`
      ${ficha?.nome || ""}
      ${ficha?.categoria || ""}
      ${ficha?.alergenios || ""}
      ${(ficha?.ingredientes || []).map((item) => item.nome).join(" ")}
    `);

    return texto.includes(normalizarTexto(termo));
  }

  function obterNecessidades(ficha) {
    if (!ficha) return [];

    const necessidades = {};

    function adicionar(chave, texto, utente) {
      if (!necessidades[chave]) {
        necessidades[chave] = {
          chave,
          texto,
          quantidade: 0,
          utentes: [],
        };
      }

      necessidades[chave].quantidade += 1;
      necessidades[chave].utentes.push(utente);
    }

    utentes.forEach((utente) => {
      const nome = utente.nome || "Utente";
      const alergias = normalizarTexto(utente.alergias || "");
      const dieta = normalizarTexto(utente.dieta || "");
      const textura = normalizarTexto(utente.textura_alimentar || "");

      if (
        (alergias.includes("leite") || alergias.includes("lactose")) &&
        receitaTemAlergenio(ficha, "leite")
      ) {
        adicionar("sem-lactose", "Preparar alternativa sem lactose", nome);
      }

      if (
        (alergias.includes("gluten") || dieta.includes("gluten")) &&
        receitaTemAlergenio(ficha, "glúten")
      ) {
        adicionar("sem-gluten", "Preparar alternativa sem glúten", nome);
      }

      if (alergias.includes("ovo") && receitaTemAlergenio(ficha, "ovo")) {
        adicionar("sem-ovo", "Preparar alternativa sem ovo", nome);
      }

      if (alergias.includes("peixe") && receitaTemAlergenio(ficha, "peixe")) {
        adicionar("sem-peixe", "Preparar alternativa sem peixe", nome);
      }

      if (dieta.includes("diabet")) {
        adicionar("diabetica", "Atenção a dieta diabética", nome);
      }

      if (dieta.includes("hipossod") || dieta.includes("sem sal")) {
        adicionar("hipossodica", "Preparar porção com restrição de sal", nome);
      }

      if (textura.includes("triturada")) {
        adicionar("triturada", "Preparar textura triturada", nome);
      }

      if (textura.includes("pastosa")) {
        adicionar("pastosa", "Preparar textura pastosa", nome);
      }

      if (textura.includes("espessada")) {
        adicionar("espessada", "Líquidos espessados", nome);
      }

      if (textura.includes("liquida")) {
        adicionar("liquida", "Dieta líquida", nome);
      }
    });

    return Object.values(necessidades);
  }

  function formatarQuantidade(quantidade, unidade = "g") {
    if (quantidade === "" || quantidade === null || quantidade === undefined) {
      return "-";
    }

    const valor = Number(quantidade || 0);

    if (unidade === "g" && valor >= 1000) {
      return `${(valor / 1000).toFixed(2)} kg`;
    }

    if (unidade === "ml" && valor >= 1000) {
      return `${(valor / 1000).toFixed(2)} L`;
    }

    return `${valor} ${unidade || "g"}`;
  }

  function obterIngredientesAjustados(ficha) {
    if (!ficha?.ingredientes) return [];

    return ficha.ingredientes.map((ingrediente) => ({
      nome: ingrediente.nome,
      quantidade: ingrediente.qb ? "q.b." : ingrediente.quantidade,
      unidade: ingrediente.qb ? "" : ingrediente.unidade || "g",
      qb: Boolean(ingrediente.qb),
    }));
  }

  const refeicoesDoDia = refeicoes
    .map((refeicao) => {
      const receitaId = ementa[diaSelecionado]?.[refeicao];
      const ficha = obterFicha(receitaId);

      return {
        refeicao,
        ficha,
        doses: Number(ficha?.doses || 0),
        necessidades: obterNecessidades(ficha),
        ingredientes: obterIngredientesAjustados(ficha),
      };
    })
    .filter((item) => item.ficha);

  const totalReceitas = refeicoesDoDia.length;
  const totalAdaptacoes = refeicoesDoDia.reduce(
    (total, item) =>
      total +
      item.necessidades.reduce(
        (subtotal, necessidade) => subtotal + Number(necessidade.quantidade || 0),
        0
      ),
    0
  );

  const totalDosesBase = refeicoesDoDia.reduce(
    (total, item) => total + Number(item.doses || 0),
    0
  );

  function exportarPDF() {
    const doc = new jsPDF("p", "mm", "a4");
    const verde = [22, 101, 52];
    const cinza = [71, 85, 105];
    const laranja = [194, 65, 12];

    doc.setFontSize(20);
    doc.setTextColor(...verde);
    doc.text("Mapa Diário de Produção", 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(...cinza);
    doc.text(`Dia: ${limparTextoPDF(diaSelecionado)}`, 14, 27);
    doc.text(`Data de impressão: ${new Date().toLocaleDateString("pt-PT")}`, 14, 33);
    doc.text(`Responsável: ${responsavel ? limparTextoPDF(responsavel) : "________________________"}`, 14, 39);

    autoTable(doc, {
      startY: 46,
      head: [["Indicador", "Total"]],
      body: [
        ["Refeições planeadas", String(totalReceitas)],
        ["Doses base das fichas", String(totalDosesBase)],
        ["Adaptações identificadas", String(totalAdaptacoes)],
      ],
      theme: "grid",
      headStyles: { fillColor: verde },
      styles: { fontSize: 9 },
    });

    let y = doc.lastAutoTable.finalY + 10;

    refeicoesDoDia.forEach((item) => {
      if (y > 250) {
        doc.addPage();
        y = 18;
      }

      doc.setFillColor(...verde);
      doc.rect(14, y, 182, 9, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text(limparTextoPDF(item.refeicao), 17, y + 6);
      y += 14;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.text(`Receita principal: ${limparTextoPDF(item.ficha.nome)}`, 16, y);
      y += 6;

      doc.setFontSize(9);
      doc.setTextColor(...cinza);
      doc.text(`Doses base da ficha: ${item.doses || "-"}`, 16, y);
      y += 7;

      if (item.necessidades.length > 0) {
        doc.setTextColor(...laranja);
        doc.setFontSize(10);
        doc.text("Adaptações necessárias:", 16, y);
        y += 5;

        item.necessidades.forEach((necessidade) => {
          const texto = `${necessidade.quantidade} utente(s) - ${necessidade.texto}`;
          doc.setTextColor(0, 0, 0);
          doc.text(limparTextoPDF(texto), 20, y);
          y += 5;

          const nomes = limparTextoPDF(necessidade.utentes.join(", "));
          const linhas = doc.splitTextToSize(`Utentes: ${nomes}`, 165);
          doc.setTextColor(...cinza);
          doc.text(linhas, 24, y);
          y += linhas.length * 4 + 3;
        });
      } else {
        doc.setTextColor(...verde);
        doc.setFontSize(10);
        doc.text("Sem adaptações especiais identificadas.", 16, y);
        y += 7;
      }

      if (item.ingredientes.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Ingrediente", "Quantidade"]],
          body: item.ingredientes.map((ingrediente) => [
            limparTextoPDF(ingrediente.nome),
            ingrediente.qb
              ? "q.b."
              : limparTextoPDF(formatarQuantidade(ingrediente.quantidade, ingrediente.unidade)),
          ]),
          theme: "striped",
          headStyles: { fillColor: verde },
          styles: { fontSize: 8 },
          margin: { left: 16, right: 14 },
        });

        y = doc.lastAutoTable.finalY + 8;
      }
    });

    if (y > 230) {
      doc.addPage();
      y = 18;
    }

    doc.setTextColor(...verde);
    doc.setFontSize(13);
    doc.text("Checklist operacional", 14, y);
    y += 7;

    autoTable(doc, {
      startY: y,
      head: [["Feito", "Procedimento"]],
      body: checklistCozinha.map((item) => ["☐", limparTextoPDF(item)]),
      theme: "grid",
      headStyles: { fillColor: verde },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 18, halign: "center" },
        1: { cellWidth: 160 },
      },
    });

    y = doc.lastAutoTable.finalY + 10;

    if (observacoes.trim()) {
      doc.setFontSize(11);
      doc.setTextColor(...verde);
      doc.text("Observações:", 14, y);
      y += 6;

      doc.setTextColor(0, 0, 0);
      const linhasObs = doc.splitTextToSize(limparTextoPDF(observacoes), 180);
      doc.text(linhasObs, 14, y);
      y += linhasObs.length * 5 + 8;
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text("Assinatura do responsável: ______________________________", 14, 282);

    doc.save(`mapa-diario-producao-${normalizarTexto(diaSelecionado).replaceAll(" ", "-")}.pdf`);
  }

  return (
    <div className="pagina">
      <div className="topo-dashboard">
        <div>
          <h1>
            <ChefHat size={28} /> Mapa Diário de Produção
          </h1>
          <p className="dashboard-subtitle">
            Apoio operacional diário para a cozinha, com refeições principais,
            adaptações, necessidades especiais, checklist e impressão.
          </p>
        </div>

        <div className="data-box">
          <CalendarDays size={18} /> {diaSelecionado}
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card destaque">
          <ClipboardList size={30} />
          <h3>Refeições planeadas</h3>
          <p>{totalReceitas}</p>
          <span>Para o dia selecionado</span>
        </div>

        <div className="dashboard-card">
          <ChefHat size={30} />
          <h3>Doses base</h3>
          <p>{totalDosesBase}</p>
          <span>Total das fichas técnicas</span>
        </div>

        <div className="dashboard-card">
          <UserCheck size={30} />
          <h3>Adaptações</h3>
          <p>{totalAdaptacoes}</p>
          <span>Dietas, alergias e texturas</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Preparação do mapa diário</h2>

        <div className="formulario">
          <label>Selecionar dia</label>
          <select
            value={diaSelecionado}
            onChange={(e) => setDiaSelecionado(e.target.value)}
          >
            {diasSemana.map((dia) => (
              <option key={dia}>{dia}</option>
            ))}
          </select>

          <label>Responsável pela produção</label>
          <input
            type="text"
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
            placeholder="Ex.: Maria Fernandes"
          />

          <label>Observações para a cozinha</label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex.: preparar primeiro as dietas, confirmar textura dos utentes, validar alergénios..."
          />
        </div>

        <div className="botoes-formulario">
          <button className="botao-principal" onClick={exportarPDF}>
            <Download size={18} /> Exportar PDF de produção diária
          </button>
        </div>
      </div>

      {refeicoesDoDia.length === 0 ? (
        <div className="dashboard-section">
          <p>Ainda não existem refeições planeadas para este dia.</p>
        </div>
      ) : (
        <div className="historico-grid">
          {refeicoesDoDia.map((item) => (
            <div className="historico-card" key={item.refeicao}>
              <h3>
                <ClipboardList size={20} /> {item.refeicao}
              </h3>

              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "14px",
                  padding: "14px",
                  marginBottom: "14px",
                }}
              >
                <strong>Receita principal</strong>
                <p style={{ margin: "6px 0 0", fontSize: "18px" }}>
                  {item.ficha.nome}
                </p>
                <small>Doses base da ficha: {item.doses || "-"}</small>
              </div>

              {item.necessidades.length > 0 ? (
                <div
                  style={{
                    background: "#fff7ed",
                    border: "1px solid #fdba74",
                    borderRadius: "14px",
                    padding: "14px",
                    marginBottom: "14px",
                  }}
                >
                  <strong>Adaptações necessárias</strong>

                  {item.necessidades.map((necessidade, index) => (
                    <div key={index} style={{ marginTop: "10px" }}>
                      <p style={{ margin: 0 }}>
                        <strong>{necessidade.quantidade} utente(s)</strong> —{" "}
                        {necessidade.texto}
                      </p>
                      <small>{necessidade.utentes.join(", ")}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="success-message">
                  Sem adaptações especiais identificadas.
                </p>
              )}

              <details>
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: "700",
                    marginTop: "12px",
                  }}
                >
                  <FileText size={16} /> Ver ingredientes
                </summary>

                <table className="dashboard-table" style={{ marginTop: "12px" }}>
                  <thead>
                    <tr>
                      <th>Ingrediente</th>
                      <th>Quantidade</th>
                    </tr>
                  </thead>

                  <tbody>
                    {item.ingredientes.map((ingrediente, index) => (
                      <tr key={index}>
                        <td>{ingrediente.nome}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {ingrediente.qb
                            ? "q.b."
                            : formatarQuantidade(
                                ingrediente.quantidade,
                                ingrediente.unidade
                              )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-section">
        <h2>
          <CheckSquare size={22} /> Checklist operacional da cozinha
        </h2>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th style={{ width: "90px" }}>Feito</th>
              <th>Procedimento</th>
            </tr>
          </thead>

          <tbody>
            {checklistCozinha.map((item, index) => (
              <tr key={index}>
                <td style={{ textAlign: "center", fontSize: "20px" }}>☐</td>
                <td>{item}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
