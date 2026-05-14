import { useEffect, useState } from "react";

export default function Capitacoes() {
  const [fichas, setFichas] = useState([]);
  const [fichaSelecionadaId, setFichaSelecionadaId] = useState("");

  const [grupos, setGrupos] = useState([
    { nome: "Creche", pessoas: 0, fator: 0.6 },
    { nome: "Pré-escolar", pessoas: 0, fator: 0.75 },
    { nome: "Lar", pessoas: 0, fator: 1 },
    { nome: "SAD", pessoas: 0, fator: 1 },
    { nome: "Funcionários", pessoas: 0, fator: 1 },
  ]);

  useEffect(() => {
    const fichasGuardadas =
      JSON.parse(localStorage.getItem("ipssFichasTecnicas")) || [];

    setFichas(fichasGuardadas);
  }, []);

  const fichaSelecionada = fichas.find(
    (ficha) => String(ficha.id) === String(fichaSelecionadaId)
  );

  const atualizarGrupo = (index, campo, valor) => {
    const novaLista = [...grupos];
    novaLista[index][campo] = Number(valor);
    setGrupos(novaLista);
  };

  const totalDosesEquivalentes = grupos.reduce(
    (total, grupo) => total + Number(grupo.pessoas) * Number(grupo.fator),
    0
  );

  const custoTotalPrevisto =
    fichaSelecionada && fichaSelecionada.custoPorDose
      ? totalDosesEquivalentes * Number(fichaSelecionada.custoPorDose)
      : 0;

  return (
    <div className="pagina">
      <h1>Capitações e Produção</h1>

      <p className="descricao">
        Planeamento automático de quantidades, doses e custos por resposta
        social, com base nas fichas técnicas guardadas.
      </p>

      <section className="dashboard-section">
        <label>Selecionar ficha técnica / receita</label>

        <select
          value={fichaSelecionadaId}
          onChange={(e) => setFichaSelecionadaId(e.target.value)}
        >
          <option value="">Selecionar receita</option>

          {fichas.map((ficha) => (
            <option key={ficha.id} value={ficha.id}>
              {ficha.nome}
            </option>
          ))}
        </select>
      </section>

      <section className="dashboard-section">
        <h2>Respostas sociais</h2>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Resposta social</th>
              <th>N.º pessoas</th>
              <th>Fator de dose</th>
              <th>Doses equivalentes</th>
            </tr>
          </thead>

          <tbody>
            {grupos.map((grupo, index) => (
              <tr key={grupo.nome}>
                <td>{grupo.nome}</td>

                <td>
                  <input
                    type="number"
                    value={grupo.pessoas}
                    onChange={(e) =>
                      atualizarGrupo(index, "pessoas", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    type="number"
                    step="0.05"
                    value={grupo.fator}
                    onChange={(e) =>
                      atualizarGrupo(index, "fator", e.target.value)
                    }
                  />
                </td>

                <td>
                  {(Number(grupo.pessoas) * Number(grupo.fator)).toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Doses equivalentes</h3>
          <p>{totalDosesEquivalentes.toFixed(1)}</p>
          <span>Total previsto</span>
        </div>

        <div className="dashboard-card">
          <h3>Custo previsto</h3>
          <p>{custoTotalPrevisto.toFixed(2)} €</p>
          <span>Total da produção</span>
        </div>

        <div className="dashboard-card">
          <h3>Receita base</h3>
          <p>{fichaSelecionada?.doses || 0}</p>
          <span>Doses da ficha técnica</span>
        </div>
      </div>

      {fichaSelecionada && (
        <section className="dashboard-section">
          <h2>Quantidades necessárias</h2>

          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th>Qtd. na ficha</th>
                <th>Qtd. necessária</th>
                <th>Preço/kg</th>
                <th>Custo previsto</th>
              </tr>
            </thead>

            <tbody>
              {fichaSelecionada.ingredientes?.map((item, index) => {
                const dosesFicha = Number(fichaSelecionada.doses) || 1;
                const fatorProducao = totalDosesEquivalentes / dosesFicha;

                const quantidadeNecessaria =
                  Number(item.quantidade || 0) * fatorProducao;

                const custoIngrediente =
                  (quantidadeNecessaria / 1000) * Number(item.precoKg || 0);

                return (
                  <tr key={index}>
                    <td>{item.nome || "-"}</td>
                    <td>{Number(item.quantidade || 0).toFixed(0)} g</td>
                    <td>{quantidadeNecessaria.toFixed(0)} g</td>
                    <td>{Number(item.precoKg || 0).toFixed(2)} €</td>
                    <td>{custoIngrediente.toFixed(2)} €</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}