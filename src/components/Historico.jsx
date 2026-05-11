import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Historico() {
  const historico =
    JSON.parse(localStorage.getItem("ipssHistorico")) || [];

  function exportarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Relatório IPSS - Histórico", 14, 20);

    const tabela = historico.map((item) => [
      item.data,
      item.instituicao,
      item.totalRefeicoes,
      `${item.custoDiario.toFixed(2)}€`,
      `${item.custoMensal.toFixed(2)}€`,
      `${item.litrosSopa.toFixed(1)}L`,
    ]);

    autoTable(doc, {
      head: [
        [
          "Data",
          "Instituição",
          "Refeições",
          "Custo Diário",
          "Custo Mensal",
          "Sopa",
        ],
      ],
      body: tabela,
      startY: 30,
    });

    doc.save("relatorio-ipss.pdf");
  }

  return (
    <div>
      <div className="historico-topo">
        <h2>Histórico</h2>

        <button
          className="botao-principal"
          onClick={exportarPDF}
        >
          Exportar PDF
        </button>
      </div>

      {historico.length === 0 ? (
        <p>Nenhum registo guardado.</p>
      ) : (
        <div className="historico-grid">
          {historico.map((item) => (
            <div
              className="historico-card"
              key={item.id}
            >
              <h3>{item.data}</h3>

              <p>
                <strong>Instituição:</strong>{" "}
                {item.instituicao}
              </p>

              <p>
                <strong>Total refeições:</strong>{" "}
                {item.totalRefeicoes}
              </p>

              <p>
                <strong>Custo diário:</strong>{" "}
                {item.custoDiario.toFixed(2)}€
              </p>

              <p>
                <strong>Custo mensal:</strong>{" "}
                {item.custoMensal.toFixed(2)}€
              </p>

              <p>
                <strong>Litros sopa:</strong>{" "}
                {item.litrosSopa.toFixed(1)}L
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}