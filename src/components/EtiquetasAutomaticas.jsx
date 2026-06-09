import { useEffect, useState } from "react";
import {
  Tag,
  Download,
  Printer,
  UtensilsCrossed,
} from "lucide-react";

import jsPDF from "jspdf";
import { supabase } from "../supabaseClient";

function EtiquetasAutomaticas() {
  const [utentes, setUtentes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [refeicao, setRefeicao] =
    useState("Almoço");

  useEffect(() => {
    carregarUtentes();
  }, []);

  async function carregarUtentes() {
    setLoading(true);

    const { data: userData } =
      await supabase.auth.getUser();

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
    const doc = new jsPDF("p", "mm", "a4");

    const larguraEtiqueta = 90;
    const alturaEtiqueta = 55;

    let x = 10;
    let y = 15;

    utentes.forEach((utente, index) => {
      doc.setDrawColor(22, 101, 52);
      doc.setLineWidth(0.8);

      doc.roundedRect(
        x,
        y,
        larguraEtiqueta,
        alturaEtiqueta,
        3,
        3
      );

      doc.setFontSize(15);
      doc.setTextColor(22, 101, 52);

      doc.text(
        String(utente.nome || "Utente"),
        x + 4,
        y + 10
      );

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      doc.text(
        `Dieta: ${
          utente.dieta || "Normal"
        }`,
        x + 4,
        y + 20
      );

      doc.text(
        `Textura: ${
          utente.textura || "Normal"
        }`,
        x + 4,
        y + 28
      );

      doc.text(
        `Alergias: ${
          utente.alergias ||
          "Sem alergias"
        }`,
        x + 4,
        y + 36
      );

      doc.setFontSize(12);
      doc.setTextColor(220, 38, 38);

      doc.text(refeicao, x + 4, y + 46);

      doc.setFontSize(9);
      doc.setTextColor(80);

      doc.text(
        new Date().toLocaleDateString(
          "pt-PT"
        ),
        x + 60,
        y + 46
      );

      if (
        utente.observacoes &&
        utente.observacoes !== "-"
      ) {
        doc.setFontSize(8);
        doc.setTextColor(120);

        doc.text(
          utente.observacoes,
          x + 4,
          y + 52
        );
      }

      if (x === 10) {
        x = 110;
      } else {
        x = 10;
        y += 65;
      }

      if (y > 240 && index < utentes.length - 1) {
        doc.addPage();
        x = 10;
        y = 15;
      }
    });

    doc.save(
      `etiquetas-${refeicao}.pdf`
    );
  }

  return (
    <div className="pagina">
      <h1>
        <Tag size={34} />
        Etiquetas Automáticas
      </h1>

      <p className="descricao">
        Etiquetas profissionais para
        refeições institucionais,
        dietas, texturas e alergias.
      </p>

      <div className="dashboard-cards">
        <div className="dashboard-card destaque">
          <Tag size={30} />
          <h3>Etiquetas</h3>
          <p>{utentes.length}</p>
          <span>
            Etiquetas geradas
          </span>
        </div>

        <div className="dashboard-card">
          <Printer size={30} />
          <h3>Impressão</h3>
          <p>A4</p>
          <span>
            Formato profissional
          </span>
        </div>

        <div className="dashboard-card">
          <UtensilsCrossed size={30} />
          <h3>Refeição</h3>
          <p>{refeicao}</p>
          <span>
            Etiquetas ativas
          </span>
        </div>
      </div>

      <div className="dashboard-section">
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "25px",
          }}
        >
          <div>
            <h2>
              Etiquetas individuais
            </h2>

            <p>
              Preparadas para impressão
              institucional.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <select
              value={refeicao}
              onChange={(e) =>
                setRefeicao(
                  e.target.value
                )
              }
              className="input-form"
            >
              <option>
                Pequeno-almoço
              </option>

              <option>Almoço</option>

              <option>Lanche</option>

              <option>Jantar</option>
            </select>

            <button
              className="botao-principal"
              onClick={exportarPDF}
            >
              <Download size={18} />
              Exportar PDF
            </button>
          </div>
        </div>

        {loading ? (
          <p>
            A carregar etiquetas...
          </p>
        ) : utentes.length === 0 ? (
          <p>
            Não existem utentes
            registados.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "20px",
            }}
          >
            {utentes.map((utente) => (
              <div
                key={utente.id}
                style={{
                  border:
                    "2px solid #166534",
                  borderRadius: "16px",
                  padding: "22px",
                  background:
                    "#ffffff",
                  minHeight: "230px",
                  display: "flex",
                  flexDirection:
                    "column",
                  justifyContent:
                    "space-between",
                }}
              >
                <div>
                  <h2
                    style={{
                      color: "#166534",
                      marginBottom:
                        "16px",
                    }}
                  >
                    {utente.nome}
                  </h2>

                  <p>
                    <strong>
                      Dieta:
                    </strong>{" "}
                    {utente.dieta ||
                      "Normal"}
                  </p>

                  <p>
                    <strong>
                      Textura:
                    </strong>{" "}
                    {utente.textura ||
                      "Normal"}
                  </p>

                  <p>
                    <strong>
                      Alergias:
                    </strong>{" "}
                    {utente.alergias ||
                      "Sem alergias"}
                  </p>

                  <p>
                    <strong>
                      Observações:
                    </strong>{" "}
                    {utente.observacoes ||
                      "-"}
                  </p>
                </div>

                <div
                  style={{
                    marginTop: "20px",
                    paddingTop: "14px",
                    borderTop:
                      "1px dashed #ccc",
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                  }}
                >
                  <strong
                    style={{
                      color: "#dc2626",
                    }}
                  >
                    {refeicao}
                  </strong>

                  <span
                    style={{
                      fontSize: "13px",
                      color: "#666",
                    }}
                  >
                    {new Date().toLocaleDateString(
                      "pt-PT"
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EtiquetasAutomaticas;