import { useState } from "react";

export default function Custos() {
  const dadosGuardados = JSON.parse(localStorage.getItem("ipssCustos")) || {};
  const refeicoesGuardadas = JSON.parse(localStorage.getItem("ipssRefeicoes")) || {};
  const capitacoesGuardadas = JSON.parse(localStorage.getItem("ipssCapitacoes")) || {};

  const creche = Number(refeicoesGuardadas.creche || 0);
  const lar = Number(refeicoesGuardadas.lar || 0);
  const apoio = Number(refeicoesGuardadas.apoio || 0);
  const trabalhadores = Number(refeicoesGuardadas.trabalhadores || 0);

  const totalRefeicoes = creche + lar + apoio + trabalhadores;

  const [precoCarnePeixe, setPrecoCarnePeixe] = useState(dadosGuardados.precoCarnePeixe || 7);
  const [precoAcompanhamento, setPrecoAcompanhamento] = useState(dadosGuardados.precoAcompanhamento || 1.5);
  const [precoLegumes, setPrecoLegumes] = useState(dadosGuardados.precoLegumes || 2);
  const [precoPao, setPrecoPao] = useState(dadosGuardados.precoPao || 2.2);
  const [precoSobremesa, setPrecoSobremesa] = useState(dadosGuardados.precoSobremesa || 2.5);

  const carnePeixeKg = (totalRefeicoes * (capitacoesGuardadas.carnePeixeG || 120)) / 1000;
  const acompanhamentoKg = (totalRefeicoes * (capitacoesGuardadas.acompanhamentoG || 180)) / 1000;
  const legumesKg = (totalRefeicoes * (capitacoesGuardadas.legumesG || 100)) / 1000;
  const paoKg = (totalRefeicoes * (capitacoesGuardadas.paoG || 50)) / 1000;
  const sobremesaKg = (totalRefeicoes * (capitacoesGuardadas.sobremesaG || 120)) / 1000;

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

  const custoPorRefeicao = totalRefeicoes > 0 ? custoTotal / totalRefeicoes : 0;
  const custoMensal = custoTotal * 30;

  const valencias = [
    { nome: "Lar", refeicoes: lar },
    { nome: "Creche", refeicoes: creche },
    { nome: "Apoio Domiciliário", refeicoes: apoio },
    { nome: "Trabalhadores", refeicoes: trabalhadores },
  ].map((item) => {
    const custoDiario = item.refeicoes * custoPorRefeicao;
    const custoMensal = custoDiario * 30;
    const percentagem = custoTotal > 0 ? (custoDiario / custoTotal) * 100 : 0;

    return {
      ...item,
      custoDiario,
      custoMensal,
      percentagem,
    };
  });

  const ingredientes = [
    {
      nome: "Carne/peixe",
      quantidade: carnePeixeKg,
      preco: precoCarnePeixe,
      custo: custoCarnePeixe,
    },
    {
      nome: "Acompanhamento",
      quantidade: acompanhamentoKg,
      preco: precoAcompanhamento,
      custo: custoAcompanhamento,
    },
    {
      nome: "Legumes",
      quantidade: legumesKg,
      preco: precoLegumes,
      custo: custoLegumes,
    },
    {
      nome: "Pão",
      quantidade: paoKg,
      preco: precoPao,
      custo: custoPao,
    },
    {
      nome: "Sobremesa",
      quantidade: sobremesaKg,
      preco: precoSobremesa,
      custo: custoSobremesa,
    },
  ];

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
        Análise estimada dos custos alimentares com base nas capitações,
        preços médios e distribuição diária de refeições por valência.
      </p>

      <div className="cards-grid">
        <div className="card destaque">
          <span>Custo total diário</span>
          <strong>{custoTotal.toFixed(2)}€</strong>
        </div>

        <div className="card">
          <span>Custo médio por refeição</span>
          <strong>{custoPorRefeicao.toFixed(2)}€</strong>
        </div>

        <div className="card">
          <span>Custo mensal estimado</span>
          <strong>{custoMensal.toFixed(2)}€</strong>
        </div>

        <div className="card">
          <span>Total diário de refeições</span>
          <strong>{totalRefeicoes}</strong>
        </div>
      </div>

      <div className="historico-grid">
        {valencias.map((item) => (
          <div className="historico-card" key={item.nome}>
            <h3>{item.nome}</h3>

            <p>
              <strong>Refeições/dia:</strong> {item.refeicoes}
            </p>

            <p>
              <strong>Custo diário:</strong> {item.custoDiario.toFixed(2)}€
            </p>

            <p>
              <strong>Custo mensal:</strong> {item.custoMensal.toFixed(2)}€
            </p>

            <p>
              <strong>Peso no custo total:</strong> {item.percentagem.toFixed(1)}%
            </p>

            <div
              style={{
                width: "100%",
                height: "8px",
                background: "#e5e7eb",
                borderRadius: "999px",
                marginTop: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${item.percentagem}%`,
                  height: "100%",
                  background: "#2563eb",
                  borderRadius: "999px",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="painel">
        <h3>Preços médios por ingrediente</h3>

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
          Guardar preços
        </button>
      </div>

      <div className="historico-grid">
        <div className="historico-card">
          <h3>Resumo técnico por ingrediente</h3>

          {ingredientes.map((item) => (
            <p key={item.nome}>
              <strong>{item.nome}:</strong> {item.quantidade.toFixed(1)} kg ×{" "}
              {item.preco.toFixed(2)}€/kg = {item.custo.toFixed(2)}€
            </p>
          ))}
        </div>

        <div className="historico-card">
          <h3>Tabela comparativa por valência</h3>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px" }}>Valência</th>
                  <th style={{ textAlign: "right", padding: "8px" }}>Refeições</th>
                  <th style={{ textAlign: "right", padding: "8px" }}>Dia</th>
                  <th style={{ textAlign: "right", padding: "8px" }}>Mês</th>
                  <th style={{ textAlign: "right", padding: "8px" }}>%</th>
                </tr>
              </thead>

              <tbody>
                {valencias.map((item) => (
                  <tr key={item.nome}>
                    <td style={{ padding: "8px" }}>{item.nome}</td>
                    <td style={{ textAlign: "right", padding: "8px" }}>
                      {item.refeicoes}
                    </td>
                    <td style={{ textAlign: "right", padding: "8px" }}>
                      {item.custoDiario.toFixed(2)}€
                    </td>
                    <td style={{ textAlign: "right", padding: "8px" }}>
                      {item.custoMensal.toFixed(2)}€
                    </td>
                    <td style={{ textAlign: "right", padding: "8px" }}>
                      {item.percentagem.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="painel">
        <h3>Nota técnica</h3>
        <p>
          Os valores apresentados são estimativas calculadas com base no número
          de refeições registadas, nas capitações definidas e nos preços médios
          introduzidos. Para maior rigor financeiro, estes dados deverão ser
          cruzados futuramente com faturas, compras reais, desperdício alimentar
          e ementas efetivamente servidas.
        </p>
      </div>
    </div>
  );
}