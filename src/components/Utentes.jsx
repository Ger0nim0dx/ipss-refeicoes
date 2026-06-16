import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "../supabaseClient";
import { useInstituicao } from "../context/InstituicaoContext";

export default function Utentes() {
  const { instituicaoAtual } = useInstituicao();

  const [utentes, setUtentes] = useState([]);
  const [dietas, setDietas] = useState([]);

  const [modoEdicao, setModoEdicao] = useState(false);
  const [utenteEditarId, setUtenteEditarId] = useState(null);

  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [quarto, setQuarto] = useState("");
  const [valencia, setValencia] = useState("Lar");
  const [dieta, setDieta] = useState("Normal");
  const [texturaAlimentar, setTexturaAlimentar] = useState("Normal");
  const [alergias, setAlergias] = useState("");
  const [observacoesClinicas, setObservacoesClinicas] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (instituicaoAtual?.id) {
      carregarDados();
    }
  }, [instituicaoAtual]);

  async function carregarDados() {
    const { data: utentesData, error: utentesError } = await supabase
      .from("utentes")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id)
      .order("created_at", { ascending: false });

    if (utentesError) {
      alert(utentesError.message);
      console.error(utentesError);
      return;
    }

    const { data: dietasData, error: dietasError } = await supabase
      .from("dietas")
      .select("*");

    if (dietasError) {
      console.error(dietasError);
    }

    setUtentes(utentesData || []);
    setDietas(dietasData || []);
  }

  function limparFormulario() {
    setNome("");
    setDataNascimento("");
    setQuarto("");
    setValencia("Lar");
    setDieta("Normal");
    setTexturaAlimentar("Normal");
    setAlergias("");
    setObservacoesClinicas("");
    setObservacoes("");
    setModoEdicao(false);
    setUtenteEditarId(null);
  }

  async function guardarUtente() {
    if (!nome) {
      alert("Indica o nome do utente.");
      return;
    }

    if (modoEdicao) {
      await atualizarUtente();
      return;
    }

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData?.user) {
      alert("Precisas de iniciar sessão.");
      console.error(userError);
      return;
    }

    const { error } = await supabase.from("utentes").insert([
      {
        user_id: userData.user.id,
        instituicao_id: instituicaoAtual.id,
        nome,
        data_nascimento: dataNascimento || null,
        quarto,
        valencia,
        dieta,
        textura_alimentar: texturaAlimentar,
        alergias,
        observacoes_clinicas: observacoesClinicas,
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
    const { error } = await supabase
      .from("utentes")
      .update({
        nome,
        data_nascimento: dataNascimento || null,
        quarto,
        valencia,
        dieta,
        textura_alimentar: texturaAlimentar,
        alergias,
        observacoes_clinicas: observacoesClinicas,
        observacoes,
      })
      .eq("id", utenteEditarId)
      .eq("instituicao_id", instituicaoAtual.id);

    if (error) {
      alert(error.message);
      console.error(error);
      return;
    }

    limparFormulario();
    await carregarDados();
  }

  function editarUtente(utente) {
    setModoEdicao(true);
    setUtenteEditarId(utente.id);

    setNome(utente.nome || "");
    setDataNascimento(utente.data_nascimento || "");
    setQuarto(utente.quarto || "");
    setValencia(utente.valencia || "Lar");
    setDieta(utente.dieta || "Normal");
    setTexturaAlimentar(utente.textura_alimentar || "Normal");
    setAlergias(utente.alergias || "");
    setObservacoesClinicas(utente.observacoes_clinicas || "");
    setObservacoes(utente.observacoes || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function eliminarUtente(id) {
    const confirmar = window.confirm(
      "Tem a certeza que pretende eliminar este utente?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("utentes")
      .delete()
      .eq("id", id)
      .eq("instituicao_id", instituicaoAtual.id);

    if (error) {
      alert(error.message);
      console.error(error);
      return;
    }

    await carregarDados();
  }

  async function alternarAtivo(utente) {
    const { error } = await supabase
      .from("utentes")
      .update({ ativo: !utente.ativo })
      .eq("id", utente.id)
      .eq("instituicao_id", instituicaoAtual.id);

    if (error) {
      alert(error.message);
      console.error(error);
      return;
    }

    await carregarDados();
  }

  function formatarData(data) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-PT");
  }

  function calcularIdade(dataNascimento) {
    if (!dataNascimento) return "-";

    const hoje = new Date();
    const nascimento = new Date(dataNascimento);

    let idade = hoje.getFullYear() - nascimento.getFullYear();

    const mes = hoje.getMonth() - nascimento.getMonth();

    if (
      mes < 0 ||
      (mes === 0 && hoje.getDate() < nascimento.getDate())
    ) {
      idade--;
    }

    return idade;
  }

  const utentesAtivos = utentes.filter((item) => item.ativo);

  const utentesComAlergias = utentes.filter(
    (item) => item.alergias && item.alergias.trim() !== ""
  );

  const aniversariosHoje = utentes.filter((utente) => {
    if (!utente.data_nascimento) return false;

    const hoje = new Date();
    const nascimento = new Date(utente.data_nascimento);

    return (
      nascimento.getDate() === hoje.getDate() &&
      nascimento.getMonth() === hoje.getMonth()
    );
  });

  function exportarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Relatório de Utentes - ${instituicaoAtual?.nome || ""}`, 14, 20);

    doc.setFontSize(11);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-PT")}`, 14, 30);
    doc.text(`Total de utentes: ${utentes.length}`, 14, 38);

    autoTable(doc, {
      startY: 50,
      head: [
        [
          "Nome",
          "Nascimento",
          "Idade",
          "Quarto",
          "Valência",
          "Dieta",
          "Textura",
          "Alergias",
          "Estado",
        ],
      ],
      body: utentes.map((item) => [
        item.nome || "-",
        formatarData(item.data_nascimento),
        calcularIdade(item.data_nascimento),
        item.quarto || "-",
        item.valencia || "-",
        item.dieta || "-",
        item.textura_alimentar || "Normal",
        item.alergias || "Nenhuma",
        item.ativo ? "Ativo" : "Inativo",
      ]),
    });

    doc.save("relatorio-utentes-ipss.pdf");
  }

  return (
    <div className="pagina">
      <div className="historico-topo">
        <div>
          <h2>Gestão de Utentes</h2>

          <p className="subtitulo">
            {instituicaoAtual?.nome} — Registo de utentes, dietas, alergias e
            observações alimentares.
          </p>
        </div>

        <button className="botao-principal" onClick={exportarPDF}>
          Exportar PDF
        </button>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Total de utentes</h3>
          <p>{utentes.length}</p>
        </div>

        <div className="dashboard-card">
          <h3>Ativos</h3>
          <p>{utentesAtivos.length}</p>
        </div>

        <div className="dashboard-card">
          <h3>Com alergias</h3>
          <p>{utentesComAlergias.length}</p>
        </div>

        <div className="dashboard-card">
          <h3>Dietas registadas</h3>
          <p>{dietas.length}</p>
        </div>

        <div className="dashboard-card destaque">
          <h3>🎂 Aniversários Hoje</h3>
          <p>{aniversariosHoje.length}</p>
        </div>
      </div>

      {aniversariosHoje.length > 0 && (
        <div
          className="dashboard-section"
          style={{
            background: "#fff7ed",
            border: "2px solid #fb923c",
          }}
        >
          <h2>🎂 Aviso para a cozinha</h2>

          <p>
            Existem utentes que fazem anos hoje. Poderá ser preparada sobremesa,
            bolo ou atenção especial, de acordo com a dieta de cada utente.
          </p>

          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Utente</th>
                <th>Idade</th>
                <th>Quarto/Sala</th>
                <th>Dieta</th>
                <th>Alergias</th>
              </tr>
            </thead>

            <tbody>
              {aniversariosHoje.map((utente) => (
                <tr key={utente.id}>
                  <td>{utente.nome}</td>
                  <td>{calcularIdade(utente.data_nascimento)} anos</td>
                  <td>{utente.quarto || "-"}</td>
                  <td>{utente.dieta || "Normal"}</td>
                  <td>{utente.alergias || "Nenhuma"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="painel">
        <h3>{modoEdicao ? "Editar utente" : "Novo utente"}</h3>

        <label>Nome do utente</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <label>Data de nascimento</label>
        <input
          type="date"
          value={dataNascimento}
          onChange={(e) => setDataNascimento(e.target.value)}
        />

        <label>Quarto / Sala</label>
        <input
          type="text"
          value={quarto}
          onChange={(e) => setQuarto(e.target.value)}
        />

        <label>Valência</label>
        <select
          value={valencia}
          onChange={(e) => setValencia(e.target.value)}
        >
          <option>Lar</option>
          <option>Creche</option>
          <option>Apoio Domiciliário</option>
          <option>Centro de Dia</option>
          <option>Trabalhador</option>
        </select>

        <label>Dieta</label>
        <select value={dieta} onChange={(e) => setDieta(e.target.value)}>
          <option>Normal</option>
          <option>Sem sal</option>
          <option>Hipossódica</option>
          <option>Diabética</option>
          <option>Sem glúten</option>
          <option>Sem lactose</option>
          <option>Vegetariana</option>
          <option>Hipocalórica</option>
          <option>Hiperproteica</option>
          <option>Hipercalórica</option>
          <option>Renal</option>
          <option>Outra</option>
        </select>

        <label>Textura alimentar</label>
        <select
          value={texturaAlimentar}
          onChange={(e) => setTexturaAlimentar(e.target.value)}
        >
          <option>Normal</option>
          <option>Macia</option>
          <option>Pastosa</option>
          <option>Triturada</option>
          <option>Líquida</option>
          <option>Espessada</option>
        </select>

        <label>Alergias / intolerâncias</label>
        <input
          type="text"
          value={alergias}
          onChange={(e) => setAlergias(e.target.value)}
        />

        <label>Observações clínicas alimentares</label>
        <textarea
          value={observacoesClinicas}
          onChange={(e) => setObservacoesClinicas(e.target.value)}
          placeholder="Ex.: disfagia, risco de aspiração, necessita espessante, baixo apetite, suplementação oral..."
        />

        <label>Observações</label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "15px",
          }}
        >
          <button className="botao-principal" onClick={guardarUtente}>
            {modoEdicao ? "Guardar alterações" : "Guardar utente"}
          </button>

          {modoEdicao && (
            <button className="botao-secundario" onClick={limparFormulario}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="historico-grid">
        {utentes.length === 0 ? (
          <p>Ainda não existem utentes registados.</p>
        ) : (
          utentes.map((item) => (
            <div className="historico-card" key={item.id}>
              <h3>{item.nome}</h3>

              <p>
                <strong>Nascimento:</strong>{" "}
                {formatarData(item.data_nascimento)}
              </p>

              <p>
                <strong>Idade:</strong>{" "}
                {calcularIdade(item.data_nascimento)} anos
              </p>

              <p>
                <strong>Quarto/Sala:</strong> {item.quarto || "-"}
              </p>

              <p>
                <strong>Valência:</strong> {item.valencia || "-"}
              </p>

              <p>
                <strong>Dieta:</strong> {item.dieta || "-"}
              </p>

              <p>
                <strong>Textura alimentar:</strong>{" "}
                {item.textura_alimentar || "Normal"}
              </p>

              <p>
                <strong>Alergias:</strong> {item.alergias || "Nenhuma"}
              </p>

              <p>
                <strong>Observações clínicas:</strong>{" "}
                {item.observacoes_clinicas || "-"}
              </p>

              <p>
                <strong>Observações:</strong> {item.observacoes || "-"}
              </p>

              <p>
                <strong>Estado:</strong>{" "}
                {item.ativo ? (
                  <span
                    style={{
                      color: "#16a34a",
                      fontWeight: "bold",
                    }}
                  >
                    Ativo
                  </span>
                ) : (
                  <span
                    style={{
                      color: "#dc2626",
                      fontWeight: "bold",
                    }}
                  >
                    Inativo
                  </span>
                )}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "10px",
                }}
              >
                <button
                  className="botao-principal"
                  onClick={() => editarUtente(item)}
                >
                  Editar
                </button>

                <button
                  className="botao-principal"
                  onClick={() => alternarAtivo(item)}
                >
                  {item.ativo ? "Marcar inativo" : "Reativar"}
                </button>

                <button
                  className="botao-secundario"
                  onClick={() => eliminarUtente(item.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}