import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function FichasTecnicas() {
  const fichasGuardadas =
    JSON.parse(localStorage.getItem("ipssFichasTecnicas")) || [];

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("Sopa");
  const [ingredientes, setIngredientes] = useState("");
  const [doses, setDoses] = useState("");
  const [preparacao, setPreparacao] = useState("");
  const [alergenios, setAlergenios] = useState("");
  const [haccp, setHaccp] = useState("");
  const [custo, setCusto] = useState("");

  const [listaFichas, setListaFichas] = useState(fichasGuardadas);

  function guardarFicha() {
    if (!nome) return;

    const novaFicha = {
      id: Date.now(),
      nome,
      categoria,
      ingredientes,
      doses,
      preparacao,
      alergenios,
      haccp,
      custo,
    };

    const novaLista = [novaFicha, ...listaFichas];

    setListaFichas(novaLista);
    localStorage.setItem("ipssFichasTecnicas", JSON.stringify(novaLista));

    setNome("");
    setCategoria("Sopa");
    setIngredientes("");
    setDoses("");
    setPreparacao("");
    setAlergenios("");
    setHaccp("");
    setCusto("");
  }

  function exportarFichaPDF(ficha) {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Ficha Técnica de Receita", 14, 20);

    doc.setFontSize(11);
    doc.text(`Receita: ${ficha.nome}`, 14, 32);
    doc.text(`Categoria: ${ficha.categoria}`, 14, 40);
    doc.text(`Doses: ${ficha.doses || "-"}`, 14, 48);
    doc.text(
      `Custo estimado: ${
        ficha.custo ? `${Number(ficha.custo).toFixed(2)}€` : "-"
      }`,
      14,
      56
    );

    autoTable(doc, {
      startY: 68,
      head: [["Campo", "Informação"]],
      body: [
        ["Ingredientes e quantidades", ficha.ingredientes || "-"],
        ["Modo de preparação", ficha.preparacao || "-"],
        ["Alergénios", ficha.alergenios || "Nenhum"],
        ["Observações HACCP", ficha.haccp || "-"],
      ],
      styles: {
        cellWidth: "wrap",
        valign: "top",
      },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 120 },
      },
    });

    doc.text(
      "Assinatura do responsável: __________________________",
      14,
      280
    );

    doc.save(`ficha-tecnica-${ficha.nome}.pdf`);
  }

  function exportarTodasPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Fichas Técnicas de Receitas", 14, 20);

    const tabela = listaFichas.map((ficha) => [
      ficha.nome,
      ficha.categoria,
      ficha.doses || "-",
      ficha.alergenios || "Nenhum",
      ficha.custo ? `${Number(ficha.custo).toFixed(2)}€` : "-",
    ]);

    autoTable(doc, {
      startY: 32,
      head: [["Receita", "Categoria", "Doses", "Alergénios", "Custo"]],
      body: tabela,
    });

    doc.save("fichas-tecnicas-ipss.pdf");
  }

  return (
    <div>
      <div className="historico-topo">
        <div>
          <h2>Fichas Técnicas</h2>

          <p className="subtitulo">
            Registo e consulta de fichas técnicas de receitas para apoio à
            padronização da produção alimentar.
          </p>
        </div>

        <button className="botao-principal" onClick={exportarTodasPDF}>
          Exportar todas PDF
        </button>
      </div>

      <div className="painel">
        <h3>Nova ficha técnica</h3>

        <label>Nome da receita</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <label>Categoria</label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option>Sopa</option>
          <option>Prato principal</option>
          <option>Sobremesa</option>
          <option>Dieta especial</option>
          <option>Acompanhamento</option>
        </select>

        <label>Ingredientes e quantidades</label>
        <textarea
          value={ingredientes}
          onChange={(e) => setIngredientes(e.target.value)}
          placeholder="Ex.: Batata 2 kg; Cenoura 1 kg; Cebola 500 g..."
        />

        <label>Número de doses</label>
        <input
          type="number"
          value={doses}
          onChange={(e) => setDoses(e.target.value)}
        />

        <label>Modo de preparação</label>
        <textarea
          value={preparacao}
          onChange={(e) => setPreparacao(e.target.value)}
        />

        <label>Alergénios</label>
        <input
          type="text"
          value={alergenios}
          onChange={(e) => setAlergenios(e.target.value)}
          placeholder="Ex.: glúten, leite, ovos..."
        />

        <label>Observações HACCP</label>
        <textarea
          value={haccp}
          onChange={(e) => setHaccp(e.target.value)}
          placeholder="Ex.: temperatura, conservação, cuidados de manipulação..."
        />

        <label>Custo estimado (€)</label>
        <input
          type="number"
          step="0.01"
          value={custo}
          onChange={(e) => setCusto(e.target.value)}
        />

        <button className="botao-principal" onClick={guardarFicha}>
          Guardar ficha técnica
        </button>
      </div>

      <div className="historico-grid">
        {listaFichas.map((item) => (
          <div className="historico-card" key={item.id}>
            <h3>{item.nome}</h3>

            <p>
              <strong>Categoria:</strong> {item.categoria}
            </p>

            <p>
              <strong>Doses:</strong> {item.doses || "-"}
            </p>

            <p>
              <strong>Ingredientes:</strong> {item.ingredientes || "-"}
            </p>

            <p>
              <strong>Preparação:</strong> {item.preparacao || "-"}
            </p>

            <p>
              <strong>Alergénios:</strong> {item.alergenios || "Nenhum"}
            </p>

            <p>
              <strong>HACCP:</strong> {item.haccp || "-"}
            </p>

            <p>
              <strong>Custo estimado:</strong>{" "}
              {item.custo ? `${Number(item.custo).toFixed(2)}€` : "-"}
            </p>

            <button
              className="botao-principal"
              onClick={() => exportarFichaPDF(item)}
            >
              Exportar ficha PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}