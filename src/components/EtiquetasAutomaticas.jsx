import { useEffect, useState } from "react";
import { Tag, Download, Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "../supabaseClient";

function EtiquetasAutomaticas() {
  const [utentes, setUtentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarUtentes();
  }, []);

  async function carregarUtentes() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return;

    const { data } = await supabase
      .from("utentes")
      .select("*")
      .eq("user_id", user.id)
      .order("nome");

    setUtentes(data || []);
    setLoading(false);
  }

  function exportarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("Etiquetas Automáticas", 14, 20);

    doc.setFontSize(10);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString("pt-PT")}`,
      14,
      28
    );

    autoTable(doc, {
      startY: 40,
      head: [
        [
          "Utente",
          "Dieta",
          "Textura",
          "Alergias",
          "Observações",
        ],
      ],
      body: utentes.map((u) => [
        u.nome || "-",
        u.dieta || "-",
        u.textura || "-",
        u.alergias || "-",
        u.observacoes || "-",
      ]),
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [22, 101, 52],
      },
    });

    doc.save("etiquetas-utentes.pdf");
  }

  return (
    <div className="pagina">
      <h1>
        <Tag size={34} />
        Etiquetas Automáticas
      </h1>

      <p className="descricao">
        Geração automática de etiquetas alimentares para cozinha,
        dietas, texturas e alergias.
      </p>

      <div className="dashboard-cards">
        <div className="dashboard-card destaque">
          <Tag size={30} />
          <h3>Etiquetas</h3>
          <p>{utentes.length}</p>
          <span>Total de utentes</span>
        </div>

        <div className="dashboard-card">
          <Printer size={30} />
          <h3>Impressão</h3>
          <p>PDF</p>
          <span>Formato profissional</span>
        </div>
      </div>

      <div className="dashboard-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2>Etiquetas geradas</h2>

          <button
            className="botao-principal"
            onClick={exportarPDF}
          >
            <Download size={18} />
            Exportar PDF
          </button>
        </div>

        {loading ? (
          <p>A carregar utentes...</p>
        ) : utentes.length === 0 ? (
          <p>Não existem utentes registados.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {utentes.map((utente) => (
              <div
                key={utente.id}
                style={{
                  border: "2px solid #166534",
                  borderRadius: "16px",
                  padding: "20px",
                  background: "#ffffff",
                }}
              >
                <h3
                  style={{
                    marginBottom: "10px",
                    color: "#166534",
                  }}
                >
                  {utente.nome}
                </h3>

                <p>
                  <strong>Dieta:</strong>{" "}
                  {utente.dieta || "Normal"}
                </p>

                <p>
                  <strong>Textura:</strong>{" "}
                  {utente.textura || "Normal"}
                </p>

                <p>
                  <strong>Alergias:</strong>{" "}
                  {utente.alergias || "Sem alergias"}
                </p>

                <p>
                  <strong>Observações:</strong>{" "}
                  {utente.observacoes || "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EtiquetasAutomaticas;