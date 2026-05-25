import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function PDFRelatorio({
  titulo = "Relatório",
  subtitulo = "",
  dados = [],
  colunas = [],
}) {
  function gerarPDF() {
    const doc = new jsPDF();

    const dataAtual = new Date().toLocaleDateString("pt-PT");

    doc.setFontSize(22);
    doc.text("IPSS Gestão", 14, 20);

    doc.setFontSize(16);
    doc.text(titulo, 14, 35);

    doc.setFontSize(11);
    doc.text(subtitulo, 14, 43);

    doc.setFontSize(10);
    doc.text(`Gerado em: ${dataAtual}`, 14, 50);

    autoTable(doc, {
      startY: 60,
      head: [colunas],
      body: dados,
      styles: {
        fontSize: 9,
      },
      headStyles: {
        fillColor: [41, 128, 185],
      },
    });

    doc.save(`${titulo}.pdf`);
  }

  return (
    <button className="botao-principal" onClick={gerarPDF}>
      Exportar PDF
    </button>
  );
}

export default PDFRelatorio;