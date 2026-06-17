import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useInstituicao } from "../context/InstituicaoContext";

function Definicoes() {
  const { instituicaoAtual } = useInstituicao();
  const [dados, setDados] = useState({
    nomeInstituicao: "",
    nif: "",
    morada: "",
    localidade: "",
    telefone: "",
    email: "",
    diretorTecnico: "",
    responsavelCozinha: "",
    respostasSociais: "",
    numeroUtentes: "",
    numeroRefeicoesDia: "",
    observacoes: "",
  });

  const [registoId, setRegistoId] = useState(null);

  useEffect(() => {
    if (instituicaoAtual?.id) {
      carregarDados();
    }
  }, [instituicaoAtual]);

  async function carregarDados() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId || !instituicaoAtual?.id) return;

    const { data, error } = await supabase
      .from("dados_ipss")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error(error);
      return;
    }

    if (data) {
      setRegistoId(data.id);

      setDados({
        nomeInstituicao: data.nomeinstituicao || "",
        nif: data.nif || "",
        morada: data.morada || "",
        localidade: data.localidade || "",
        telefone: data.telefone || "",
        email: data.email || "",
        diretorTecnico: data.diretortecnico || "",
        responsavelCozinha: data.responsavelcozinha || "",
        respostasSociais: data.respostassociais || "",
        numeroUtentes: data.numeroutentes || "",
        numeroRefeicoesDia: data.numerorefeicoesdia || "",
        observacoes: data.observacoes || "",
      });
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setDados({
      ...dados,
      [name]: value,
    });
  }

  async function guardarDados(e) {
    e.preventDefault();

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId || !instituicaoAtual?.id) {
      alert("Sessão inválida ou instituição não selecionada.");
      return;
    }

    const payload = {
      user_id: userId,
      instituicao_id: instituicaoAtual.id,
      nomeinstituicao: dados.nomeInstituicao,
      nif: dados.nif,
      morada: dados.morada,
      localidade: dados.localidade,
      telefone: dados.telefone,
      email: dados.email,
      diretortecnico: dados.diretorTecnico,
      responsavelcozinha: dados.responsavelCozinha,
      respostassociais: dados.respostasSociais,
      numeroutentes: dados.numeroUtentes,
      numerorefeicoesdia: dados.numeroRefeicoesDia,
      observacoes: dados.observacoes,
    };

    let error;

    if (registoId) {
      const resultado = await supabase
        .from("dados_ipss")
        .update(payload)
        .eq("id", registoId)
        .eq("instituicao_id", instituicaoAtual.id);

      error = resultado.error;
    } else {
      const resultado = await supabase
        .from("dados_ipss")
        .insert([payload])
        .select()
        .single();

      error = resultado.error;

      if (resultado.data) {
        setRegistoId(resultado.data.id);
      }
    }

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert("Dados da IPSS guardados com sucesso!");
  }

  async function limparDados() {
    const confirmar = window.confirm(
      "Tem a certeza que pretende limpar os dados da IPSS?"
    );

    if (!confirmar) return;

    if (registoId) {
      const { error } = await supabase
        .from("dados_ipss")
        .delete()
        .eq("id", registoId)
        .eq("instituicao_id", instituicaoAtual.id);

      if (error) {
        alert(error.message);
        return;
      }
    }

    setDados({
      nomeInstituicao: "",
      nif: "",
      morada: "",
      localidade: "",
      telefone: "",
      email: "",
      diretorTecnico: "",
      responsavelCozinha: "",
      respostasSociais: "",
      numeroUtentes: "",
      numeroRefeicoesDia: "",
      observacoes: "",
    });

    setRegistoId(null);
  }

  return (
    <div className="pagina">
      <h1>Dados da IPSS</h1>

      <p className="descricao">
        Registo da informação geral da instituição para utilização em
        relatórios, mapas de refeições e documentos internos.
      </p>

      <form className="formulario" onSubmit={guardarDados}>
        <h2>Identificação da instituição</h2>

        <label>Nome da instituição</label>
        <input
          type="text"
          name="nomeInstituicao"
          value={dados.nomeInstituicao}
          onChange={handleChange}
        />

        <label>NIF</label>
        <input
          type="text"
          name="nif"
          value={dados.nif}
          onChange={handleChange}
        />

        <label>Morada</label>
        <input
          type="text"
          name="morada"
          value={dados.morada}
          onChange={handleChange}
        />

        <label>Localidade</label>
        <input
          type="text"
          name="localidade"
          value={dados.localidade}
          onChange={handleChange}
        />

        <label>Telefone</label>
        <input
          type="text"
          name="telefone"
          value={dados.telefone}
          onChange={handleChange}
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={dados.email}
          onChange={handleChange}
        />

        <h2>Responsáveis</h2>

        <label>Diretor/a Técnico/a</label>
        <input
          type="text"
          name="diretorTecnico"
          value={dados.diretorTecnico}
          onChange={handleChange}
        />

        <label>Responsável pela cozinha</label>
        <input
          type="text"
          name="responsavelCozinha"
          value={dados.responsavelCozinha}
          onChange={handleChange}
        />

        <h2>Dados operacionais</h2>

        <label>Respostas sociais abrangidas</label>
        <textarea
          name="respostasSociais"
          value={dados.respostasSociais}
          onChange={handleChange}
        />

        <label>Número total de utentes/refeições</label>
        <input
          type="number"
          name="numeroUtentes"
          value={dados.numeroUtentes}
          onChange={handleChange}
        />

        <label>Número médio de refeições por dia</label>
        <input
          type="number"
          name="numeroRefeicoesDia"
          value={dados.numeroRefeicoesDia}
          onChange={handleChange}
        />

        <label>Observações</label>
        <textarea
          name="observacoes"
          value={dados.observacoes}
          onChange={handleChange}
        />

        <div className="botoes-formulario">
          <button type="submit" className="botao-principal">
            Guardar dados
          </button>

          <button
            type="button"
            className="botao-secundario"
            onClick={limparDados}
          >
            Limpar dados
          </button>
        </div>
      </form>

      <div className="cartao-resumo">
        <h2>Resumo da IPSS</h2>

        <p>
          <strong>Instituição:</strong>{" "}
          {dados.nomeInstituicao || "Não preenchido"}
        </p>

        <p>
          <strong>Localidade:</strong> {dados.localidade || "Não preenchido"}
        </p>

        <p>
          <strong>Diretor/a Técnico/a:</strong>{" "}
          {dados.diretorTecnico || "Não preenchido"}
        </p>

        <p>
          <strong>Responsável pela cozinha:</strong>{" "}
          {dados.responsavelCozinha || "Não preenchido"}
        </p>

        <p>
          <strong>N.º de utentes/refeições:</strong>{" "}
          {dados.numeroUtentes || "Não preenchido"}
        </p>

        <p>
          <strong>Refeições por dia:</strong>{" "}
          {dados.numeroRefeicoesDia || "Não preenchido"}
        </p>
      </div>
    </div>
  );
}

export default Definicoes;