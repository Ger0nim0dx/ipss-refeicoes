import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RelatorioCozinha() {
  const ementas =
    JSON.parse(localStorage.getItem("ipssEmentas")) || [];

  const dietas =
    JSON.parse(localStorage.getItem("ipssDietas")) || [];

  const refeicoes =
    JSON.parse(localStorage.getItem("ipssRefeicoes")) || {};

  const custos =
    JSON.parse(localStorage.getItem("ipssCustos")) || {};

  const capitacoes =
    JSON.parse(localStorage.getItem("ipssCapitacoes")) || {};

  const ultimaEmenta = ementas[0];

  const totalRefeicoes =
    (refeicoes.creche || 0) +
    (refeicoes.lar || 0) +
    (refeicoes.apoio || 0) +
    (refeicoes.trabalhadores || 0);

  const litrosSopa =
    (totalRefeicoes * (capitacoes.sopaMl || 250)) / 1000;

  const kgCarne =
    (totalRefeicoes *
      (capitacoes.carnePeixeG || 120)) /
    1000;

  const custoEstimado =
    totalRefeicoes * 3.5;

  function exportarRelatorio() {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Relatório Diário da Cozinha", 14, 20);

    doc.setFontSize(11);

    doc.text(
      `Data: ${new Date().toLocaleDateString(
        "pt-PT"
      )}`,
      14,
      30
    );

    doc.text(
      `Total de refeições: ${totalRefeicoes}`,
      14,
      38
    );

    doc.text(
      `Sopa estimada: ${litrosSopa.toFixed(1)}L`,
      14,
      46
    );

    doc.text(
      `Carne/peixe estimado: ${kgCarne.toFixed(
        1
      )}kg`,
      14,
      54
    );

    doc.text(
      `Custo estimado: ${custoEstimado.toFixed(
        2
      )}€`,
      14,
      62
    );

    doc.setFontSize(14);
    doc.text("Ementa do dia", 14, 78);

    autoTable(doc, {
      startY: 84,
      head: [["Campo", "Informação"]],
      body: [
        ["Sopa", ultimaEmenta?.sopa || "-"],
        ["Prato", ultimaEmenta?.prato || "-"],
        [
          "Dieta alternativa",
          ultimaEmenta?.dietaAlternativa || "-",
        ],
        [
          "Sobremesa",
          ultimaEmenta?.sobremesa || "-",
        ],
        [
          "Observações",
          ultimaEmenta?.observacoes || "-",
        ],
      ],
    });

    const tabelaDietas = dietas.map((item) => [
      item.utente,
      item.valencia,
      item.dieta,
      item.alergias || "-",
      item.observacoes || "-",
    ]);

    doc.setFontSize(14);

    doc.text(
      "Dietas e alergias",
      14,
      doc.lastAutoTable.finalY + 20
    );

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 26,
      head: [
        [
          "Utente",
          "Valência",
          "Dieta",
          "Alergias",
          "Observações",
        ],
      ],
      body: tabelaDietas,
    });

    doc.save("relatorio-cozinha-ipss.pdf");
  }

  return (
    <div>
      <h2>Relatório Diário da Cozinha</h2>

      <p className="subtitulo">
        Relatório completo da produção diária.
      </p>

      <div className="cards-grid">
        <div className="card destaque">
          <span>Total refeições</span>
          <strong>{totalRefeicoes}</strong>
        </div>

        <div className="card">
          <span>Sopa estimada</span>
          <strong>{litrosSopa.toFixed(1)}L</strong>
        </div>

        <div className="card">
          <span>Carne/peixe</span>
          <strong>{kgCarne.toFixed(1)}kg</strong>
        </div>

        <div className="card">
          <span>Custo estimado</span>
          <strong>{custoEstimado.toFixed(2)}€</strong>
        </div>
      </div>

      <div className="painel">
        <h3>Ementa atual</h3>

        <p>
          <strong>Sopa:</strong>{" "}
          {ultimaEmenta?.sopa || "-"}
        </p>

        <p>
          <strong>Prato:</strong>{" "}
          {ultimaEmenta?.prato || "-"}
        </p>

        <p>
          <strong>Dieta alternativa:</strong>{" "}
          {ultimaEmenta?.dietaAlternativa || "-"}
        </p>

        <p>
          <strong>Sobremesa:</strong>{" "}
          {ultimaEmenta?.sobremesa || "-"}
        </p>

        <button
          className="botao-principal"
          onClick={exportarRelatorio}
        >
          Exportar relatório PDF
        </button>
      </div>
    </div>
  );
}