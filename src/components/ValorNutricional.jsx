import { useEffect, useState } from "react";

export default function ValorNutricional() {
  const [fichas, setFichas] = useState([]);
  const [fichaSelecionadaId, setFichaSelecionadaId] = useState("");

  useEffect(() => {
    const fichasGuardadas =
      JSON.parse(localStorage.getItem("ipssFichasTecnicas")) || [];

    setFichas(fichasGuardadas);
  }, []);

  const fichaSelecionada = fichas.find(
    (ficha) => String(ficha.id) === String(fichaSelecionadaId)
  );

  return (
    <div className="pagina">
      <h1>Valor Nutricional</h1>

      <p className="descricao">
        Análise nutricional automática com base nas fichas técnicas guardadas.
      </p>

      <section className="dashboard-section">
        <label>Selecionar ficha técnica</label>

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

      {!fichaSelecionada ? (
        <section className="dashboard-section">
          <p>
            Seleciona uma ficha técnica para consultar o valor nutricional da
            receita.
          </p>
        </section>
      ) : (
        <>
          <section className="dashboard-section">
            <h2>{fichaSelecionada.nome}</h2>

            <p>
              <strong>Categoria:</strong> {fichaSelecionada.categoria}
            </p>

            <p>
              <strong>Número de doses:</strong> {fichaSelecionada.doses}
            </p>

            <p>
              <strong>Custo por dose:</strong>{" "}
              {fichaSelecionada.custoPorDose
                ? `${Number(fichaSelecionada.custoPorDose).toFixed(2)} €`
                : "-"}
            </p>
          </section>

          <div className="dashboard-cards">
            <div className="dashboard-card">
              <h3>Energia</h3>
              <p>
                {fichaSelecionada.nutrientesPorDose?.kcal?.toFixed(0) || 0} kcal
              </p>
              <span>Por dose</span>
            </div>

            <div className="dashboard-card">
              <h3>Proteína</h3>
              <p>
                {fichaSelecionada.nutrientesPorDose?.proteina?.toFixed(1) || 0} g
              </p>
              <span>Por dose</span>
            </div>

            <div className="dashboard-card">
              <h3>Hidratos</h3>
              <p>
                {fichaSelecionada.nutrientesPorDose?.hidratos?.toFixed(1) || 0} g
              </p>
              <span>Por dose</span>
            </div>

            <div className="dashboard-card">
              <h3>Gordura</h3>
              <p>
                {fichaSelecionada.nutrientesPorDose?.gordura?.toFixed(1) || 0} g
              </p>
              <span>Por dose</span>
            </div>

            <div className="dashboard-card">
              <h3>Fibra</h3>
              <p>
                {fichaSelecionada.nutrientesPorDose?.fibra?.toFixed(1) || 0} g
              </p>
              <span>Por dose</span>
            </div>

            <div className="dashboard-card">
              <h3>Sal</h3>
              <p>
                {fichaSelecionada.nutrientesPorDose?.sal?.toFixed(2) || 0} g
              </p>
              <span>Por dose</span>
            </div>
          </div>

          <section className="dashboard-section">
            <h2>Ingredientes considerados</h2>

            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Quantidade</th>
                  <th>Kcal/100g</th>
                  <th>Proteína</th>
                  <th>Hidratos</th>
                  <th>Gordura</th>
                  <th>Fibra</th>
                  <th>Sal</th>
                </tr>
              </thead>

              <tbody>
                {fichaSelecionada.ingredientes?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.nome || "-"}</td>
                    <td>{item.quantidade || 0} g</td>
                    <td>{Number(item.kcal || 0).toFixed(0)}</td>
                    <td>{Number(item.proteina || 0).toFixed(1)} g</td>
                    <td>{Number(item.hidratos || 0).toFixed(1)} g</td>
                    <td>{Number(item.gordura || 0).toFixed(1)} g</td>
                    <td>{Number(item.fibra || 0).toFixed(1)} g</td>
                    <td>{Number(item.sal || 0).toFixed(2)} g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}