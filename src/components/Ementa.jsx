import { useState } from "react";

export default function Ementa() {
  const ementasGuardadas =
    JSON.parse(localStorage.getItem("ipssEmentas")) || [];

  const refeicoesGuardadas =
    JSON.parse(localStorage.getItem("ipssRefeicoes")) || {};

  const capitacoesGuardadas =
    JSON.parse(localStorage.getItem("ipssCapitacoes")) || {};

  const totalRefeicoes =
    (refeicoesGuardadas.creche || 0) +
    (refeicoesGuardadas.lar || 0) +
    (refeicoesGuardadas.apoio || 0) +
    (refeicoesGuardadas.trabalhadores || 0);

  const sopaMl = capitacoesGuardadas.sopaMl || 250;
  const carnePeixeG = capitacoesGuardadas.carnePeixeG || 120;
  const acompanhamentoG = capitacoesGuardadas.acompanhamentoG || 180;
  const legumesG = capitacoesGuardadas.legumesG || 100;
  const paoG = capitacoesGuardadas.paoG || 50;
  const sobremesaG = capitacoesGuardadas.sobremesaG || 120;

  const litrosSopa = (totalRefeicoes * sopaMl) / 1000;
  const kgCarnePeixe = (totalRefeicoes * carnePeixeG) / 1000;
  const kgAcompanhamento = (totalRefeicoes * acompanhamentoG) / 1000;
  const kgLegumes = (totalRefeicoes * legumesG) / 1000;
  const kgPao = (totalRefeicoes * paoG) / 1000;
  const kgSobremesa = (totalRefeicoes * sobremesaG) / 1000;

  const [data, setData] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [sopa, setSopa] = useState("");
  const [prato, setPrato] = useState("");
  const [dietaAlternativa, setDietaAlternativa] = useState("");
  const [sobremesa, setSobremesa] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [listaEmentas, setListaEmentas] = useState(ementasGuardadas);

  function guardarEmenta() {
    if (!sopa && !prato && !sobremesa) return;

    const novaEmenta = {
      id: Date.now(),
      data,
      sopa,
      prato,
      dietaAlternativa,
      sobremesa,
      observacoes,
      totalRefeicoes,
      litrosSopa,
      kgCarnePeixe,
      kgAcompanhamento,
      kgLegumes,
      kgPao,
      kgSobremesa,
    };

    const novaLista = [novaEmenta, ...listaEmentas];

    setListaEmentas(novaLista);

    localStorage.setItem(
      "ipssEmentas",
      JSON.stringify(novaLista)
    );

    setSopa("");
    setPrato("");
    setDietaAlternativa("");
    setSobremesa("");
    setObservacoes("");
  }

  return (
    <div>
      <h2>Ementa</h2>

      <p className="subtitulo">
        Planeamento diário das refeições com cálculo automático de quantidades.
      </p>

      <div className="cards-grid">
        <div className="card destaque">
          <span>Total de refeições</span>
          <strong>{totalRefeicoes}</strong>
        </div>

        <div className="card">
          <span>Sopa estimada</span>
          <strong>{litrosSopa.toFixed(1)}L</strong>
        </div>

        <div className="card">
          <span>Carne/peixe</span>
          <strong>{kgCarnePeixe.toFixed(1)}kg</strong>
        </div>

        <div className="card">
          <span>Acompanhamento</span>
          <strong>{kgAcompanhamento.toFixed(1)}kg</strong>
        </div>

        <div className="card">
          <span>Legumes</span>
          <strong>{kgLegumes.toFixed(1)}kg</strong>
        </div>

        <div className="card">
          <span>Pão</span>
          <strong>{kgPao.toFixed(1)}kg</strong>
        </div>

        <div className="card">
          <span>Sobremesa</span>
          <strong>{kgSobremesa.toFixed(1)}kg</strong>
        </div>
      </div>

      <div className="painel">
        <h3>Nova ementa</h3>

        <label>Data</label>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />

        <label>Sopa do dia</label>
        <input
          type="text"
          value={sopa}
          onChange={(e) => setSopa(e.target.value)}
        />

        <label>Prato principal</label>
        <input
          type="text"
          value={prato}
          onChange={(e) => setPrato(e.target.value)}
        />

        <label>Dieta alternativa</label>
        <input
          type="text"
          value={dietaAlternativa}
          onChange={(e) => setDietaAlternativa(e.target.value)}
        />

        <label>Sobremesa</label>
        <input
          type="text"
          value={sobremesa}
          onChange={(e) => setSobremesa(e.target.value)}
        />

        <label>Observações para a cozinha</label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        <button className="botao-principal" onClick={guardarEmenta}>
          Guardar ementa
        </button>
      </div>

      <div className="historico-grid">
        {listaEmentas.map((item) => (
          <div className="historico-card" key={item.id}>
            <h3>{item.data}</h3>

            <p>
              <strong>Sopa:</strong> {item.sopa || "-"}
            </p>

            <p>
              <strong>Prato:</strong> {item.prato || "-"}
            </p>

            <p>
              <strong>Dieta alternativa:</strong>{" "}
              {item.dietaAlternativa || "-"}
            </p>

            <p>
              <strong>Sobremesa:</strong> {item.sobremesa || "-"}
            </p>

            <p>
              <strong>Total refeições:</strong> {item.totalRefeicoes}
            </p>

            <p>
              <strong>Sopa estimada:</strong>{" "}
              {item.litrosSopa.toFixed(1)}L
            </p>

            <p>
              <strong>Carne/peixe:</strong>{" "}
              {item.kgCarnePeixe.toFixed(1)}kg
            </p>

            <p>
              <strong>Acompanhamento:</strong>{" "}
              {item.kgAcompanhamento.toFixed(1)}kg
            </p>

            <p>
              <strong>Observações:</strong> {item.observacoes || "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}