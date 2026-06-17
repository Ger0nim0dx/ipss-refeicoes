import { useEffect, useState } from "react";
import {
  Tag,
  Download,
  Printer,
  UtensilsCrossed,
  Filter,
  CalendarDays,
} from "lucide-react";

import jsPDF from "jspdf";
import QRCode from "qrcode";
import { supabase } from "../supabaseClient";
import { useInstituicao } from "../context/InstituicaoContext";

function EtiquetasAutomaticas() {
  const { instituicaoAtual } = useInstituicao();
  const [utentes, setUtentes] = useState([]);
  const [ementas, setEmentas] = useState([]);
  const [fichas, setFichas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refeicao, setRefeicao] = useState("Almoço");
  const [filtro, setFiltro] = useState("todos");
  const [modoMapaDiario, setModoMapaDiario] = useState(true);
  const [diaSemana, setDiaSemana] = useState("Segunda-feira");

  const diasSemana = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo",
  ];

  useEffect(() => {
    if (instituicaoAtual?.id) {
      carregarDados();
    }
  }, [instituicaoAtual]);

  async function carregarDados() {
    setLoading(true);

    if (!instituicaoAtual?.id) {
      setLoading(false);
      return;
    }

    const { data: utentesData } = await supabase
      .from("utentes")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id)
      .order("nome");

    const { data: ementasData } = await supabase
      .from("ementas")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id)
      .order("created_at", { ascending: false });

    const { data: fichasData } = await supabase
      .from("fichas_tecnicas")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id);

    const fichasFormatadas = (fichasData || []).map((ficha) => ({
      id: ficha.id,
      nome: ficha.nome,
      categoria: ficha.categoria,
      doses: ficha.doses,
      ...ficha.dados,
    }));

    setUtentes(utentesData || []);
    setEmentas(ementasData || []);
    setFichas(fichasFormatadas);
    setLoading(false);
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function obterValor(utente, campos, fallback = "") {
    for (const campo of campos) {
      if (utente?.[campo]) return utente[campo];
    }

    return fallback;
  }

  function obterReceitaAtual() {
    const ementaAtual = ementas[0]?.dados || {};
    const refeicoesDia = ementaAtual?.[diaSemana] || {};

    const receitaId =
      refeicoesDia?.[refeicao] ||
      refeicoesDia?.[refeicao.toLowerCase()] ||
      refeicoesDia?.[normalizarTexto(refeicao)];

    const ficha = fichas.find((item) => String(item.id) === String(receitaId));

    return ficha?.nome || "Sem receita definida";
  }

  const receitaAtual = obterReceitaAtual();

  function obterCorEtiqueta(utente) {
    const dieta = normalizarTexto(
      obterValor(utente, ["dieta", "tipo_dieta"], "")
    );

    const textura = normalizarTexto(
      obterValor(utente, ["textura", "textura_alimentar"], "")
    );

    const alergias = normalizarTexto(
      obterValor(utente, ["alergias", "alergenios"], "")
    );

    if (alergias && alergias !== "sem alergias") {
      return {
        fundo: "#fee2e2",
        borda: "#dc2626",
        titulo: "#991b1b",
        pdfFundo: [254, 226, 226],
        pdfBorda: [220, 38, 38],
        pdfTitulo: [153, 27, 27],
        etiqueta: "ALERGIA",
      };
    }

    if (textura.includes("tritur") || textura.includes("pastosa")) {
      return {
        fundo: "#dbeafe",
        borda: "#2563eb",
        titulo: "#1e40af",
        pdfFundo: [219, 234, 254],
        pdfBorda: [37, 99, 235],
        pdfTitulo: [30, 64, 175],
        etiqueta: "TEXTURA",
      };
    }

    if (dieta.includes("diab")) {
      return {
        fundo: "#fef9c3",
        borda: "#ca8a04",
        titulo: "#854d0e",
        pdfFundo: [254, 249, 195],
        pdfBorda: [202, 138, 4],
        pdfTitulo: [133, 77, 14],
        etiqueta: "DIABÉTICA",
      };
    }

    if (dieta.includes("hiposs") || dieta.includes("sem sal")) {
      return {
        fundo: "#ffedd5",
        borda: "#ea580c",
        titulo: "#9a3412",
        pdfFundo: [255, 237, 213],
        pdfBorda: [234, 88, 12],
        pdfTitulo: [154, 52, 18],
        etiqueta: "HIPOSSÓDICA",
      };
    }

    return {
      fundo: "#dcfce7",
      borda: "#166534",
      titulo: "#166534",
      pdfFundo: [220, 252, 231],
      pdfBorda: [22, 101, 52],
      pdfTitulo: [22, 101, 52],
      etiqueta: "NORMAL",
    };
  }

  function utenteCumpreFiltro(utente) {
    const dieta = normalizarTexto(
      obterValor(utente, ["dieta", "tipo_dieta"], "")
    );

    const textura = normalizarTexto(
      obterValor(utente, ["textura", "textura_alimentar"], "")
    );

    const alergias = normalizarTexto(
      obterValor(utente, ["alergias", "alergenios"], "")
    );

    const dietaEspecial = dieta && dieta !== "normal";
    const texturaAdaptada =
      textura.includes("tritur") || textura.includes("pastosa");
    const temAlergias = alergias && alergias !== "sem alergias";

    if (modoMapaDiario) {
      return dietaEspecial || texturaAdaptada || temAlergias;
    }

    if (filtro === "todos") return true;
    if (filtro === "dietas") return dietaEspecial;
    if (filtro === "texturas") return texturaAdaptada;
    if (filtro === "alergias") return temAlergias;

    return true;
  }

  const utentesFiltrados = utentes.filter(utenteCumpreFiltro);

  function limparTextoPDF(texto) {
    return String(texto || "")
      .replace(/[^\x20-\x7EÀ-ÿ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  async function gerarQRCode(texto) {
    try {
      return await QRCode.toDataURL(texto, {
        width: 120,
        margin: 1,
      });
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async function exportarPDF() {
    const doc = new jsPDF("p", "mm", "a4");

    const larguraEtiqueta = 90;
    const alturaEtiqueta = 55;

    let x = 10;
    let y = 15;

    for (let index = 0; index < utentesFiltrados.length; index++) {
      const utente = utentesFiltrados[index];
      const cores = obterCorEtiqueta(utente);

      const nome = limparTextoPDF(
        obterValor(utente, ["nome", "nome_completo"], "Utente")
      );

      const dieta = limparTextoPDF(
        obterValor(utente, ["dieta", "tipo_dieta"], "Normal")
      );

      const textura = limparTextoPDF(
        obterValor(utente, ["textura", "textura_alimentar"], "Normal")
      );

      const alergias = limparTextoPDF(
        obterValor(utente, ["alergias", "alergenios"], "Sem alergias")
      );

      const observacoes = limparTextoPDF(
        obterValor(utente, ["observacoes", "observacao", "notas"], "")
      );

      doc.setFillColor(...cores.pdfFundo);
      doc.setDrawColor(...cores.pdfBorda);
      doc.setLineWidth(0.8);
      doc.roundedRect(x, y, larguraEtiqueta, alturaEtiqueta, 3, 3, "FD");

      doc.setFillColor(...cores.pdfBorda);
      doc.roundedRect(x + 64, y + 4, 21, 7, 2, 2, "F");

      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(cores.etiqueta, x + 66, y + 9);

      doc.setFontSize(14);
      doc.setTextColor(...cores.pdfTitulo);

      const linhasNome = doc.splitTextToSize(nome, 50);
      doc.text(linhasNome.slice(0, 2), x + 4, y + 10);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Dieta: ${dieta || "Normal"}`, x + 4, y + 22);
      doc.text(`Textura: ${textura || "Normal"}`, x + 4, y + 30);
      doc.text(`Alergias: ${alergias || "Sem alergias"}`, x + 4, y + 38);

      doc.setFontSize(12);
      doc.setTextColor(...cores.pdfBorda);
      doc.text(limparTextoPDF(refeicao), x + 4, y + 47);

      doc.setFontSize(8);
      doc.setTextColor(80);
      doc.text(limparTextoPDF(diaSemana), x + 4, y + 52);

      doc.setFontSize(8);
      doc.setTextColor(80);
      doc.text(new Date().toLocaleDateString("pt-PT"), x + 58, y + 47);

      if (observacoes) {
        doc.setFontSize(7);
        doc.setTextColor(90);

        const linhasObs = doc.splitTextToSize(observacoes, 48);
        doc.text(linhasObs.slice(0, 1), x + 4, y + 55);
      }

      const qrTexto = `
Utente: ${nome}
Dia: ${diaSemana}
Refeição: ${refeicao}
Receita: ${receitaAtual}
Data: ${new Date().toLocaleDateString("pt-PT")}
Dieta: ${dieta}
Textura: ${textura}
Alergias: ${alergias}
Observações: ${observacoes || "-"}
      `.trim();

      const qrCode = await gerarQRCode(qrTexto);

      if (qrCode) {
        doc.addImage(qrCode, "PNG", x + 66, y + 15, 18, 18);
      }

      if (x === 10) {
        x = 110;
      } else {
        x = 10;
        y += 65;
      }

      if (y > 240 && index < utentesFiltrados.length - 1) {
        doc.addPage();
        x = 10;
        y = 15;
      }
    }

    doc.save(
      `etiquetas-${diaSemana}-${refeicao}-${
        modoMapaDiario ? "mapa-diario" : filtro
      }.pdf`
    );
  }

  return (
    <div className="pagina">
      <h1>
        <Tag size={34} />
        Etiquetas Automáticas
      </h1>

      <p className="descricao">
        {instituicaoAtual?.nome} — Etiquetas profissionais para refeições
        institucionais, dietas, texturas e alergias, com QR Code, cores
        automáticas e ligação à ementa do dia.
      </p>

      <div className="dashboard-cards">
        <div className="dashboard-card destaque">
          <Tag size={30} />
          <h3>Etiquetas</h3>
          <p>{utentesFiltrados.length}</p>
          <span>
            {modoMapaDiario ? "Casos relevantes" : "Etiquetas filtradas"}
          </span>
        </div>

        <div className="dashboard-card">
          <Printer size={30} />
          <h3>Impressão</h3>
          <p>A4</p>
          <span>Com QR Code</span>
        </div>

        <div className="dashboard-card">
          <UtensilsCrossed size={30} />
          <h3>Refeição</h3>
          <p>{refeicao}</p>
          <span>{receitaAtual}</span>
        </div>

        <div className="dashboard-card">
          <Filter size={30} />
          <h3>Modo</h3>
          <p>{modoMapaDiario ? "Mapa" : filtro}</p>
          <span>Seleção atual</span>
        </div>
      </div>

      <div
        className="dashboard-section"
        style={{
          background: "#ecfdf5",
          border: "2px solid #166534",
        }}
      >
        <h2>
          <CalendarDays size={24} /> Ementa automática do dia
        </h2>

        <p className="descricao">
          Seleciona o dia e a refeição para gerar etiquetas alinhadas com a
          ementa/mapeamento diário da cozinha.
        </p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "18px",
          }}
        >
          {diasSemana.map((dia) => (
            <button
              key={dia}
              className={diaSemana === dia ? "botao-principal" : "botao-secundario"}
              onClick={() => setDiaSemana(dia)}
            >
              {dia}
            </button>
          ))}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "14px",
            padding: "18px",
            border: "1px solid #bbf7d0",
          }}
        >
          <p>
            <strong>Dia:</strong> {diaSemana}
          </p>

          <p>
            <strong>Refeição:</strong> {refeicao}
          </p>

          <p>
            <strong>Receita ativa:</strong> {receitaAtual}
          </p>
        </div>
      </div>

      <div className="dashboard-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "25px",
          }}
        >
          <div>
            <h2>Etiquetas por refeição</h2>

            <p>
              No modo mapa diário, aparecem apenas utentes com dietas especiais,
              alergias ou texturas adaptadas.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              className={modoMapaDiario ? "botao-principal" : "botao-secundario"}
              onClick={() => setModoMapaDiario(!modoMapaDiario)}
            >
              {modoMapaDiario ? "Mapa diário ativo" : "Modo completo"}
            </button>

            {!modoMapaDiario && (
              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="input-form"
              >
                <option value="todos">Todos</option>
                <option value="dietas">Dietas especiais</option>
                <option value="texturas">Texturas adaptadas</option>
                <option value="alergias">Alergias</option>
              </select>
            )}

            <select
              value={refeicao}
              onChange={(e) => setRefeicao(e.target.value)}
              className="input-form"
            >
              <option>Pequeno-almoço</option>
              <option>Reforço da manhã</option>
              <option>Almoço</option>
              <option>Lanche</option>
              <option>Jantar</option>
              <option>Reforço da noite</option>
            </select>

            <button className="botao-principal" onClick={exportarPDF}>
              <Download size={18} />
              Exportar PDF com QR
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "22px",
          }}
        >
          <span className="badge badge-success">Normal</span>
          <span className="badge badge-warning">Diabética</span>
          <span className="badge badge-info">Textura adaptada</span>
          <span className="badge badge-danger">Alergias</span>
        </div>

        {loading ? (
          <p>A carregar etiquetas...</p>
        ) : utentesFiltrados.length === 0 ? (
          <p>Não existem etiquetas para o modo/filtro selecionado.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "20px",
            }}
          >
            {utentesFiltrados.map((utente) => {
              const cores = obterCorEtiqueta(utente);

              const nome = obterValor(
                utente,
                ["nome", "nome_completo"],
                "Utente"
              );

              const dieta = obterValor(
                utente,
                ["dieta", "tipo_dieta"],
                "Normal"
              );

              const textura = obterValor(
                utente,
                ["textura", "textura_alimentar"],
                "Normal"
              );

              const alergias = obterValor(
                utente,
                ["alergias", "alergenios"],
                "Sem alergias"
              );

              const observacoes = obterValor(
                utente,
                ["observacoes", "observacao", "notas"],
                "-"
              );

              return (
                <div
                  key={utente.id}
                  style={{
                    border: `2px solid ${cores.borda}`,
                    borderRadius: "16px",
                    padding: "22px",
                    background: cores.fundo,
                    minHeight: "250px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        alignItems: "flex-start",
                        marginBottom: "14px",
                      }}
                    >
                      <h2 style={{ color: cores.titulo, marginBottom: 0 }}>
                        {nome}
                      </h2>

                      <span
                        style={{
                          background: cores.borda,
                          color: "white",
                          borderRadius: "999px",
                          padding: "6px 10px",
                          fontSize: "11px",
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cores.etiqueta}
                      </span>
                    </div>

                    <p>
                      <strong>Dieta:</strong> {dieta || "Normal"}
                    </p>

                    <p>
                      <strong>Textura:</strong> {textura || "Normal"}
                    </p>

                    <p>
                      <strong>Alergias:</strong> {alergias || "Sem alergias"}
                    </p>

                    <p>
                      <strong>Observações:</strong> {observacoes || "-"}
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: "20px",
                      paddingTop: "14px",
                      borderTop: `1px dashed ${cores.borda}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <strong style={{ color: cores.borda }}>{refeicao}</strong>

                      <p
                        style={{
                          fontSize: "12px",
                          marginTop: "4px",
                          color: "#475569",
                        }}
                      >
                        {diaSemana} · {receitaAtual}
                      </p>
                    </div>

                    <span style={{ fontSize: "13px", color: "#475569" }}>
                      QR no PDF
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default EtiquetasAutomaticas;