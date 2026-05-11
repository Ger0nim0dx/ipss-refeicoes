import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Dietas() {
  const dietasGuardadas =
    JSON.parse(localStorage.getItem("ipssDietas")) || [];

  const dadosInstituicao =
    JSON.parse(localStorage.getItem("ipssRefeicoes")) || {};

  const [utente, setUtente] = useState("");
  const [valencia, setValencia] = useState("Lar");
  const [dieta, setDieta] = useState("Normal");
  const [alergias, setAlergias] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [listaDietas, setListaDietas] = useState(dietasGuardadas);

  function adicionarDieta() {
    if (!utente) return;

    const novaDieta = {
      id: Date.now(),
      utente,
      valencia,
      dieta,
      alergias,
      observacoes,
    };

    const novaLista = [novaDieta, ...listaDietas];

    setListaDietas(novaLista);
    localStorage.setItem("ipssDietas", JSON.stringify(novaLista));

    setUtente("");
    setAlergias("");
    setObservacoes("");
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
          </div>
        ))}
      </div>
    </div>
  );
}