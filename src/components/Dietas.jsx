import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "../supabaseClient";

export default function Dietas() {
  const [utente, setUtente] = useState("");
  const [valencia, setValencia] = useState("Lar");
  const [dieta, setDieta] = useState("Normal");
  const [alergias, setAlergias] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [listaDietas, setListaDietas] = useState([]);

  const dadosInstituicao =
    JSON.parse(localStorage.getItem("ipssRefeicoes")) || {};

  useEffect(() => {
    carregarDietas();
  }, []);

  async function carregarDietas() {
    const { data, error } = await supabase
      .from("dietas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      console.error(error);
      return;
    }

    const dietasFormatadas = (data || []).map((item) => ({
      id: item.id,
      utente: item.nome_utente,
      valencia: item.tipo_dieta,
      dieta: item.restricoes,
      alergias: item.observacoes,
      observacoes: item.dados?.observacoes || "",
    }));

    setListaDietas(dietasFormatadas);
  }

  async function adicionarDieta() {
    if (!utente) {
      alert("Indica o nome do utente.");
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
        nome_utente: utente,
        tipo_dieta: valencia,
        restricoes: dieta,
        observacoes: alergias,
        dados: {
          observacoes,
        },
      },
    ]);

    if (error) {
      alert(error.message);
      console.error(error);
      return;
    }

    setUtente("");
    setAlergias("");
    setObservacoes("");

    await carregarDietas();
  }

  async function eliminarDieta(id) {
    const confirmar = window.confirm(
      "Tem a certeza que pretende eliminar esta dieta?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("dietas")
      .delete()
      .eq("id", id);

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
    doc.text("Responsável: Frederico Pinto", 14, 44);

    const tabela = listaDietas.map((item) => [
      item.utente,
      item.valencia,
      item.dieta,
      item.alergias || "Nenhuma",
      item.observacoes || "-",
    ]);

    autoTable(doc, {
      head: [["Utente", "Valência", "Dieta", "Alergias", "Observações"]],
      body: tabela,
      startY: 55,
    });

    doc.text("Assinatura do responsável: __________________________", 14, 280);

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
        <h3>Adicionar utente</h3>

        <label>Nome do utente</label>

        <input
          type="text"
          value={utente}
          onChange={(e) => setUtente(e.target.value)}
        />

        <label>Valência</label>

        <select
          value={valencia}
          onChange={(e) => setValencia(e.target.value)}
        >
          <option>Lar</option>
          <option>Creche</option>
          <option>Apoio Domiciliário</option>
          <option>Trabalhador</option>
        </select>

        <label>Tipo de dieta</label>

        <select value={dieta} onChange={(e) => setDieta(e.target.value)}>
          <option>Normal</option>
          <option>Sem sal</option>
          <option>Diabética</option>
          <option>Triturada</option>
          <option>Vegetariana</option>
          <option>Hipocalórica</option>
        </select>

        <label>Alergias / intolerâncias</label>

        <input
          type="text"
          value={alergias}
          onChange={(e) => setAlergias(e.target.value)}
        />

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

            <p>
              <strong>Valência:</strong> {item.valencia}
            </p>

            <p>
              <strong>Dieta:</strong> {item.dieta}
            </p>

            <p>
              <strong>Alergias:</strong> {item.alergias || "Nenhuma"}
            </p>

            <p>
              <strong>Observações:</strong> {item.observacoes || "-"}
            </p>

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