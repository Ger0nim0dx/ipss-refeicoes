import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { supabase } from "../supabaseClient";
import { useInstituicao } from "../context/InstituicaoContext";

export default function Utentes() {
  const { instituicaoAtual } =
    useInstituicao();

  const [utentes, setUtentes] =
    useState([]);

  const [dietas, setDietas] =
    useState([]);

  const [modoEdicao, setModoEdicao] =
    useState(false);

  const [
    utenteEditarId,
    setUtenteEditarId,
  ] = useState(null);

  const [nome, setNome] =
    useState("");

  const [quarto, setQuarto] =
    useState("");

  const [valencia, setValencia] =
    useState("Lar");

  const [dieta, setDieta] =
    useState("Normal");

  const [
    texturaAlimentar,
    setTexturaAlimentar,
  ] = useState("Normal");

  const [alergias, setAlergias] =
    useState("");

  const [
    observacoesClinicas,
    setObservacoesClinicas,
  ] = useState("");

  const [
    observacoes,
    setObservacoes,
  ] = useState("");

  useEffect(() => {
    if (instituicaoAtual?.id) {
      carregarDados();
    }
  }, [instituicaoAtual]);

  async function carregarDados() {
    const {
      data: utentesData,
      error: utentesError,
    } = await supabase
      .from("utentes")
      .select("*")
      .eq(
        "instituicao_id",
        instituicaoAtual.id
      )
      .order("created_at", {
        ascending: false,
      });

    if (utentesError) {
      alert(
        utentesError.message
      );

      console.error(
        utentesError
      );

      return;
    }

    const {
      data: dietasData,
      error: dietasError,
    } = await supabase
      .from("dietas")
      .select("*")
      .eq(
        "instituicao_id",
        instituicaoAtual.id
      );

    if (dietasError) {
      console.error(
        dietasError
      );
    }

    setUtentes(
      utentesData || []
    );

    setDietas(
      dietasData || []
    );
  }

  function limparFormulario() {
    setNome("");
    setQuarto("");
    setValencia("Lar");
    setDieta("Normal");

    setTexturaAlimentar(
      "Normal"
    );

    setAlergias("");

    setObservacoesClinicas(
      ""
    );

    setObservacoes("");

    setModoEdicao(false);

    setUtenteEditarId(
      null
    );
  }

  async function guardarUtente() {
    if (!nome) {
      alert(
        "Indica o nome do utente."
      );

      return;
    }

    if (modoEdicao) {
      await atualizarUtente();
      return;
    }

    const {
      data: userData,
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !userData?.user
    ) {
      alert(
        "Precisas de iniciar sessão."
      );

      console.error(
        userError
      );

      return;
    }

    const { error } =
      await supabase
        .from("utentes")
        .insert([
          {
            user_id:
              userData.user.id,

            instituicao_id:
              instituicaoAtual.id,

            nome,
            quarto,
            valencia,
            dieta,

            textura_alimentar:
              texturaAlimentar,

            alergias,

            observacoes_clinicas:
              observacoesClinicas,

            observacoes,

            ativo: true,
          },
        ]);

    if (error) {
      alert(error.message);

      console.error(error);

      return;
    }

    limparFormulario();

    await carregarDados();
  }

  async function atualizarUtente() {
    const { error } =
      await supabase
        .from("utentes")
        .update({
          nome,
          quarto,
          valencia,
          dieta,

          textura_alimentar:
            texturaAlimentar,

          alergias,

          observacoes_clinicas:
            observacoesClinicas,

          observacoes,
        })
        .eq(
          "id",
          utenteEditarId
        );

    if (error) {
      alert(error.message);

      console.error(error);

      return;
    }

    limparFormulario();

    await carregarDados();
  }

  function editarUtente(
    utente
  ) {
    setModoEdicao(true);

    setUtenteEditarId(
      utente.id
    );

    setNome(
      utente.nome || ""
    );

    setQuarto(
      utente.quarto || ""
    );

    setValencia(
      utente.valencia ||
        "Lar"
    );

    setDieta(
      utente.dieta ||
        "Normal"
    );

    setTexturaAlimentar(
      utente.textura_alimentar ||
        "Normal"
    );

    setAlergias(
      utente.alergias || ""
    );

    setObservacoesClinicas(
      utente.observacoes_clinicas ||
        ""
    );

    setObservacoes(
      utente.observacoes || ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function eliminarUtente(
    id
  ) {
    const confirmar =
      window.confirm(
        "Tem a certeza que pretende eliminar este utente?"
      );

    if (!confirmar) return;

    const { error } =
      await supabase
        .from("utentes")
        .delete()
        .eq("id", id);

    if (error) {
      alert(error.message);

      console.error(error);

      return;
    }

    await carregarDados();
  }

  async function alternarAtivo(
    utente
  ) {
    const { error } =
      await supabase
        .from("utentes")
        .update({
          ativo:
            !utente.ativo,
        })
        .eq("id", utente.id);

    if (error) {
      alert(error.message);

      console.error(error);

      return;
    }

    await carregarDados();
  }

  function exportarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text(
      `Relatório de Utentes - ${
        instituicaoAtual?.nome ||
        ""
      }`,
      14,
      20
    );

    doc.setFontSize(11);

    doc.text(
      `Data: ${new Date().toLocaleDateString(
        "pt-PT"
      )}`,
      14,
      30
    );

    doc.text(
      `Total de utentes: ${utentes.length}`,
      14,
      38
    );

    autoTable(doc, {
      startY: 50,

      head: [
        [
          "Nome",
          "Quarto",
          "Valência",
          "Dieta",
          "Textura",
          "Alergias",
          "Estado",
        ],
      ],

      body: utentes.map(
        (item) => [
          item.nome || "-",

          item.quarto || "-",

          item.valencia || "-",

          item.dieta || "-",

          item.textura_alimentar ||
            "Normal",

          item.alergias ||
            "Nenhuma",

          item.ativo
            ? "Ativo"
            : "Inativo",
        ]
      ),
    });

    doc.save(
      "relatorio-utentes-ipss.pdf"
    );
  }

  const utentesAtivos =
    utentes.filter(
      (item) => item.ativo
    );

  const utentesComAlergias =
    utentes.filter(
      (item) =>
        item.alergias &&
        item.alergias.trim() !==
          ""
    );

  return (
    <div className="pagina">
      <div className="historico-topo">
        <div>
          <h2>
            Gestão de Utentes
          </h2>

          <p className="subtitulo">
            {
              instituicaoAtual?.nome
            }
          </p>
        </div>

        <button
          className="botao-principal"
          onClick={exportarPDF}
        >
          Exportar PDF
        </button>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>
            Total de utentes
          </h3>

          <p>
            {utentes.length}
          </p>
        </div>

        <div className="dashboard-card">
          <h3>Ativos</h3>

          <p>
            {
              utentesAtivos.length
            }
          </p>
        </div>

        <div className="dashboard-card">
          <h3>
            Com alergias
          </h3>

          <p>
            {
              utentesComAlergias.length
            }
          </p>
        </div>

        <div className="dashboard-card">
          <h3>
            Dietas registadas
          </h3>

          <p>
            {dietas.length}
          </p>
        </div>
      </div>
    </div>
  );
}