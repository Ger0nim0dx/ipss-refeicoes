import { useState, useEffect } from "react";

function Definicoes() {
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
    observacoes: "",
  });

  useEffect(() => {
    const dadosGuardados = localStorage.getItem("dadosIPSS");
    if (dadosGuardados) {
      setDados(JSON.parse(dadosGuardados));
    }
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setDados({
      ...dados,
      [name]: value,
    });
  }

  function guardarDados(e) {
    e.preventDefault();
    localStorage.setItem("dadosIPSS", JSON.stringify(dados));
    alert("Dados da IPSS guardados com sucesso!");
  }

  function limparDados() {
    const confirmar = window.confirm(
      "Tem a certeza que pretende limpar os dados da IPSS?"
    );

    if (confirmar) {
      localStorage.removeItem("dadosIPSS");
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
        observacoes: "",
      });
    }
  }

  return (
    <div className="pagina">
      <h1>Dados da IPSS</h1>
      <p className="descricao">
        Registo da informação geral da instituição para utilização em relatórios,
        mapas de refeições e documentos internos.
      </p>

      <form className="formulario" onSubmit={guardarDados}>
        <h2>Identificação da instituição</h2>

        <label>Nome da instituição</label>
        <input
          type="text"
          name="nomeInstituicao"
          value={dados.nomeInstituicao}
          onChange={handleChange}
          placeholder="Ex.: Centro Social e Paroquial..."
        />

        <label>NIF</label>
        <input
          type="text"
          name="nif"
          value={dados.nif}
          onChange={handleChange}
          placeholder="Número de identificação fiscal"
        />

        <label>Morada</label>
        <input
          type="text"
          name="morada"
          value={dados.morada}
          onChange={handleChange}
          placeholder="Morada da instituição"
        />

        <label>Localidade</label>
        <input
          type="text"
          name="localidade"
          value={dados.localidade}
          onChange={handleChange}
          placeholder="Localidade"
        />

        <label>Telefone</label>
        <input
          type="text"
          name="telefone"
          value={dados.telefone}
          onChange={handleChange}
          placeholder="Contacto telefónico"
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={dados.email}
          onChange={handleChange}
          placeholder="Email institucional"
        />

        <h2>Responsáveis</h2>

        <label>Diretor/a Técnico/a</label>
        <input
          type="text"
          name="diretorTecnico"
          value={dados.diretorTecnico}
          onChange={handleChange}
          placeholder="Nome do/a diretor/a técnico/a"
        />

        <label>Responsável pela cozinha</label>
        <input
          type="text"
          name="responsavelCozinha"
          value={dados.responsavelCozinha}
          onChange={handleChange}
          placeholder="Nome do/a responsável pela cozinha"
        />

        <h2>Dados operacionais</h2>

        <label>Respostas sociais abrangidas</label>
        <textarea
          name="respostasSociais"
          value={dados.respostasSociais}
          onChange={handleChange}
          placeholder="Ex.: Creche, Lar, Centro de Dia, SAD, Funcionários..."
        />

        <label>Número total de utentes/refeições</label>
        <input
          type="number"
          name="numeroUtentes"
          value={dados.numeroUtentes}
          onChange={handleChange}
          placeholder="Ex.: 240"
        />

        <label>Observações</label>
        <textarea
          name="observacoes"
          value={dados.observacoes}
          onChange={handleChange}
          placeholder="Notas importantes sobre a organização alimentar da instituição"
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
        <p><strong>Instituição:</strong> {dados.nomeInstituicao || "Não preenchido"}</p>
        <p><strong>Localidade:</strong> {dados.localidade || "Não preenchido"}</p>
        <p><strong>Diretor/a Técnico/a:</strong> {dados.diretorTecnico || "Não preenchido"}</p>
        <p><strong>Responsável pela cozinha:</strong> {dados.responsavelCozinha || "Não preenchido"}</p>
        <p><strong>N.º de utentes/refeições:</strong> {dados.numeroUtentes || "Não preenchido"}</p>
      </div>
    </div>
  );
}

export default Definicoes;