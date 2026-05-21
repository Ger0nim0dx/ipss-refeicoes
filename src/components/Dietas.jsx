import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "../supabaseClient";

export default function Dietas() {
  const [utentes, setUtentes] = useState([]);
  const [utenteSelecionado, setUtenteSelecionado] = useState("");

  const [valencia, setValencia] = useState("");
  const [dieta, setDieta] = useState("");
  const [alergias, setAlergias] = useState("");
  const [quarto, setQuarto] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [listaDietas, setListaDietas] = useState([]);

  const dadosInstituicao =
    JSON.parse(localStorage.getItem("ipssRefeicoes")) || {};

  useEffect(() => {
    carregarDietas();
    carregarUtentes();
  }, []);

  async function carregarUtentes() {
    const { data, error } = await supabase
      .from("utentes")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setUtentes(data || []);
  }

  async function carregarDietas() {
    const { data, error } = await supabase
      .from("dietas")
      .select(`
        *,
        utentes (
          nome,
          valencia,
          dieta,
          alergias,
          quarto
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      console.error(error);
      return;
    }

    const dietasFormatadas = (data || []).map((item) => ({
      id: item.id,
      utente: item.utentes?.nome || "-",
      valencia: item.utentes?.valencia || "-",
      dieta: item.utentes?.dieta || "-",
      alergias: item.utentes?.alergias || "Nenhuma",
      quarto: item.utentes?.quarto || "-",
      observacoes: item.observacoes || "",
    }));

    setListaDietas(dietasFormatadas);
  }

  function selecionarUtente(id) {
    setUtenteSelecionado(id);

    const utente = utentes.find((u) => String(u.id) === String(id));

    if (!utente) return;

    setValencia(utente.valencia || "");
    setDieta(utente.dieta || "");
    setAlergias(utente.alergias || "");
    setQuarto(utente.quarto || "");
  }

  async function adicionarDieta() {
    if (!utenteSelecionado) {
      alert("Seleciona um utente.");
      return;
    }

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData?.user) {
      alert("Precisas de iniciar sessão.");
      console.error(userError);
      return;
    }

    const { error } = await supabase.from("dietas").insert([
      {
        user_id: userData.user.id,
        utente_id: Number(utenteSelecionado),
        data: new Date().toISOString().split("T")[0],
        refeicao: "Geral",
        observacoes,
      },
    ]);

    if (error) {
      alert(error.message);
      console.error(error);
      return;
    }

    setUtenteSelecionado("");
    setValencia("");
    setDieta("");
    setAlergias("");
    setQuarto("");
    setObservacoes("");

    await carregarDietas();
  }

  async function eliminarDieta(id) {
    const confirmar = window.confirm(
      "Tem a certeza que pretende eliminar esta dieta?"
    );

    if (!confirmar) return;

    const { error } = await supabase.from("dietas").delete().eq("id", id);

    if (error) {
      alert(error.message);
      console.error(error);
      return;
    }

    await carregarDietas();
  }

  function exportarPDF() {
    const doc = new jsPDF();

    const instituicao =
      dadosInstituicao.instituicao || "Centro Social / IPSS";

    doc.setFontSize(18);
    doc.text("Relatório Diário de Dietas", 14, 20);

    doc.setFontSize(11);
    doc.text(`Instituição: ${instituicao}`, 14, 30);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-PT")}`, 14, 37);

    const tabela = listaDietas.map((item) => [
      item.utente,
      item.quarto,
      item.valencia,
      item.dieta,
      item.alergias,
      item.observacoes || "-",
    ]);

    autoTable(doc, {
      head: [["Utente", "Quarto", "Valência", "Dieta", "Alergias", "Observações"]],
      body: tabela,
      startY: 50,
    });

    doc.save("relatorio-dietas-ipss.pdf");
  }

  return (
    <div>
      <div className="historico-topo">
        <h2>Dietas e Alergias</h2>

        <button className="botao-principal" onClick={exportarPDF}>
          Exportar PDF
        </button>
      </div>

      <div className="painel">
        <h3>Adicionar Dieta</h3>

        <label>Utente</label>
        <select
          value={utenteSelecionado}
          onChange={(e) => selecionarUtente(e.target.value)}
        >
          <option value="">Selecionar utente</option>
          {utentes.map((utente) => (
            <option key={utente.id} value={utente.id}>
              {utente.nome}
            </option>
          ))}
        </select>

        <label>Valência</label>
        <input type="text" value={valencia} readOnly />

        <label>Quarto</label>
        <input type="text" value={quarto} readOnly />

        <label>Tipo de dieta</label>
        <input type="text" value={dieta} readOnly />

        <label>Alergias / intolerâncias</label>
        <input type="text" value={alergias} readOnly />

        <label>Observações</label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        <button className="botao-principal" onClick={adicionarDieta}>
          Guardar dieta
        </button>
      </div>

      <div className="historico-grid">
        {listaDietas.map((item) => (
          <div className="historico-card" key={item.id}>
            <h3>{item.utente}</h3>

            <p><strong>Quarto:</strong> {item.quarto}</p>
            <p><strong>Valência:</strong> {item.valencia}</p>
            <p><strong>Dieta:</strong> {item.dieta}</p>
            <p><strong>Alergias:</strong> {item.alergias}</p>
            <p><strong>Observações:</strong> {item.observacoes || "-"}</p>

            <button
              className="botao-secundario"
              onClick={() => eliminarDieta(item.id)}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}