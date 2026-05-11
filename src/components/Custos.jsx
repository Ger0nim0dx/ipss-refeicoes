import { useState } from "react";

export default function Custos() {
  const dadosGuardados =
    JSON.parse(localStorage.getItem("ipssCustos")) || {};

  const refeicoesGuardadas =
    JSON.parse(localStorage.getItem("ipssRefeicoes")) || {};

  const capitacoesGuardadas =
    JSON.parse(localStorage.getItem("ipssCapitacoes")) || {};

  const totalRefeicoes =
    (refeicoesGuardadas.creche || 0) +
    (refeicoesGuardadas.lar || 0) +
    (refeicoesGuardadas.apoio || 0) +
    (refeicoesGuardadas.trabalhadores || 0);

  const carnePeixeKg =
    (totalRefeicoes * (capitacoesGuardadas.carnePeixeG || 120)) / 1000;

  const acompanhamentoKg =
    (totalRefeicoes * (capitacoesGuardadas.acompanhamentoG || 180)) / 1000;

  const legumesKg =
    (totalRefeicoes * (capitacoesGuardadas.legumesG || 100)) / 1000;

  const paoKg =
    (totalRefeicoes * (capitacoesGuardadas.paoG || 50)) / 1000;

  const sobremesaKg =
    (totalRefeicoes * (capitacoesGuardadas.sobremesaG || 120)) / 1000;

  const [precoCarnePeixe, setPrecoCarnePeixe] = useState(
    dadosGuardados.precoCarnePeixe || 7
  );
  const [precoAcompanhamento, setPrecoAcompanhamento] = useState(
    dadosGuardados.precoAcompanhamento || 1.5
  );
  const [precoLegumes, setPrecoLegumes] = useState(
    dadosGuardados.precoLegumes || 2
  );
  const [precoPao, setPrecoPao] = useState(dadosGuardados.precoPao || 2.2);
  const [precoSobremesa, setPrecoSobremesa] = useState(
    dadosGuardados.precoSobremesa || 2.5
  );

  const custoCarnePeixe = carnePeixeKg * precoCarnePeixe;
  const custoAcompanhamento = acompanhamentoKg * precoAcompanhamento;
  const custoLegumes = legumesKg * precoLegumes;
  const custoPao = paoKg * precoPao;
  const custoSobremesa = sobremesaKg * precoSobremesa;

  const custoTotal =
    custoCarnePeixe +
    custoAcompanhamento +
    custoLegumes +
    custoPao +
    custoSobremesa;

  const custoPorRefeicao =
    totalRefeicoes > 0 ? custoTotal / totalRefeicoes : 0;

  const custoMensal = custoTotal * 30;

  function guardarCustos() {
    const dados = {
      precoCarnePeixe,
      precoAcompanhamento,
      precoLegumes,
      precoPao,
      precoSobremesa,
    };

    localStorage.setItem("ipssCustos", JSON.stringify(dados));
    alert("Custos guardados com sucesso!");
  }

  return (
    <div>
      <h2>Controlo de Custos</h2>

      <p className="subtitulo">
        Cálculo automático dos custos com base nas capitações e no número de
        refeições.
      </p>

      <div className="cards-grid">
        <div className="card destaque">
          <span>Custo total diário</span>
          <strong>{custoTotal.toFixed(2)}€</strong>
        </div>

        <div className="card">
          <span>Custo por refeição</span>
          <strong>{custoPorRefeicao.toFixed(2)}€</strong>
        </div>

        <div className="card">
          <span>Custo mensal estimado</span>
          <strong>{custoMensal.toFixed(2)}€</strong>
        </div>

        <div className="card">
          <span>Total refeições</span>
          <strong>{totalRefeicoes}</strong>
        </div>
      </div>

      <div className="painel">
        <h3>Preços por ingrediente</h3>

        <label>Preço carne/peixe por kg (€)</label>
        <input
          type="number"
          step="0.01"
          value={precoCarnePeixe}
          onChange={(e) => setPrecoCarnePeixe(Number(e.target.value))}
        />

        <label>Preço acompanhamento por kg (€)</label>
        <input
          type="number"
          step="0.01"
          value={precoAcompanhamento}
          onChange={(e) => setPrecoAcompanhamento(Number(e.target.value))}
        />

        <label>Preço legumes por kg (€)</label>
        <input
          type="number"
          step="0.01"
          value={precoLegumes}
          onChange={(e) => setPrecoLegumes(Number(e.target.value))}
        />

        <label>Preço pão por kg (€)</label>
        <input
          type="number"
          step="0.01"
          value={precoPao}
          onChange={(e) => setPrecoPao(Number(e.target.value))}
        />

        <label>Preço sobremesa por kg (€)</label>
        <input
          type="number"
          step="0.01"
          value={precoSobremesa}
          onChange={(e) => setPrecoSobremesa(Number(e.target.value))}
        />

        <button className="botao-principal" onClick={guardarCustos}>
          Guardar custos
        </button>
      </div>

      <div className="historico-grid">
        <div className="historico-card">
          <h3>Resumo por ingrediente</h3>

          <p>
            <strong>Carne/peixe:</strong> {carnePeixeKg.toFixed(1)} kg —{" "}
            {custoCarnePeixe.toFixed(2)}€
          </p>

          <p>
            <strong>Acompanhamento:</strong> {acompanhamentoKg.toFixed(1)} kg —{" "}
            {custoAcompanhamento.toFixed(2)}€
          </p>

          <p>
            <strong>Legumes:</strong> {legumesKg.toFixed(1)} kg —{" "}
            {custoLegumes.toFixed(2)}€
          </p>

          <p>
            <strong>Pão:</strong> {paoKg.toFixed(1)} kg — {custoPao.toFixed(2)}€
          </p>

          <p>
            <strong>Sobremesa:</strong> {sobremesaKg.toFixed(1)} kg —{" "}
            {custoSobremesa.toFixed(2)}€
          </p>
        </div>
      </div>
    </div>
  );
}