import { useState } from "react";

export default function Capitacoes() {
  const dadosGuardados =
    JSON.parse(localStorage.getItem("ipssCapitacoes")) || {};

  const [sopaMl, setSopaMl] = useState(dadosGuardados.sopaMl || 250);
  const [carnePeixeG, setCarnePeixeG] = useState(dadosGuardados.carnePeixeG || 120);
  const [acompanhamentoG, setAcompanhamentoG] = useState(
    dadosGuardados.acompanhamentoG || 180
  );
  const [legumesG, setLegumesG] = useState(dadosGuardados.legumesG || 100);
  const [paoG, setPaoG] = useState(dadosGuardados.paoG || 50);
  const [sobremesaG, setSobremesaG] = useState(dadosGuardados.sobremesaG || 120);

  function guardarCapitacoes() {
    const dados = {
      sopaMl,
      carnePeixeG,
      acompanhamentoG,
      legumesG,
      paoG,
      sobremesaG,
    };

    localStorage.setItem("ipssCapitacoes", JSON.stringify(dados));
    alert("Capitações guardadas com sucesso!");
  }

  return (
    <div>
      <h2>Capitações</h2>
      <p className="subtitulo">
        Definição das quantidades médias por pessoa/refeição.
      </p>

      <div className="painel">
        <h3>Quantidades por refeição</h3>

        <label>Sopa por pessoa (ml)</label>
        <input
          type="number"
          value={sopaMl}
          onChange={(e) => setSopaMl(Number(e.target.value))}
        />

        <label>Carne/peixe por pessoa (g)</label>
        <input
          type="number"
          value={carnePeixeG}
          onChange={(e) => setCarnePeixeG(Number(e.target.value))}
        />

        <label>Acompanhamento por pessoa (g)</label>
        <input
          type="number"
          value={acompanhamentoG}
          onChange={(e) => setAcompanhamentoG(Number(e.target.value))}
        />

        <label>Legumes por pessoa (g)</label>
        <input
          type="number"
          value={legumesG}
          onChange={(e) => setLegumesG(Number(e.target.value))}
        />

        <label>Pão por pessoa (g)</label>
        <input
          type="number"
          value={paoG}
          onChange={(e) => setPaoG(Number(e.target.value))}
        />

        <label>Sobremesa por pessoa (g)</label>
        <input
          type="number"
          value={sobremesaG}
          onChange={(e) => setSobremesaG(Number(e.target.value))}
        />

        <button className="botao-principal" onClick={guardarCapitacoes}>
          Guardar capitações
        </button>
      </div>
    </div>
  );
}