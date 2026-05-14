import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Ementa() {
  const [fichas, setFichas] = useState([]);
  const [stocks, setStocks] = useState([]);

  const [ementa, setEmenta] = useState(
    JSON.parse(localStorage.getItem("ipssEmenta")) || {}
  );

  useEffect(() => {
    const fichasGuardadas =
      JSON.parse(localStorage.getItem("ipssFichasTecnicas")) || [];

    const stocksGuardados =
      JSON.parse(localStorage.getItem("ipssStocks")) || [];

    setFichas(fichasGuardadas);
    setStocks(stocksGuardados);
  }, []);

  const diasSemana = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo",
  ];

  const refeicoes = [
    "Pequeno-almoço",
    "Reforço da manhã",
    "Almoço",
    "Lanche",
    "Jantar",
    "Reforço da noite",
  ];

  function atualizarEmenta(dia, refeicao, receitaId) {
    const novaEmenta = {
      ...ementa,
      [dia]: {
        ...ementa[dia],
        [refeicao]: receitaId,
      },
    };

    setEmenta(novaEmenta);
    localStorage.setItem("ipssEmenta", JSON.stringify(novaEmenta));
  }

  function obterFicha(id) {
    return fichas.find((ficha) => String(ficha.id) === String(id));
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function converterParaGramas(quantidade, unidade) {
    const valor = Number(quantidade) || 0;

    if (unidade === "kg") return valor * 1000;
    if (unidade === "g") return valor;
    if (unidade === "L") return valor * 1000;
    if (unidade === "ml") return valor;

    return valor;
  }

  function formatarQuantidade(gramas) {
    if (gramas >= 1000) {
      return `${(gramas / 1000).toFixed(2)} kg`;
    }

    return `${gramas.toFixed(0)} g`;
  }

  const receitasPlaneadas = [];

  diasSemana.forEach((dia) => {
    refeicoes.forEach((refeicao) => {
      const receitaId = ementa[dia]?.[refeicao];
      const ficha = obterFicha(receitaId);

      if (ficha) {
        receitasPlaneadas.push({
          dia,
          refeicao,
          ficha,
        });
      }
    });
  });

  const custoSemanal = receitasPlaneadas.reduce(
    (total, item) => total + Number(item.ficha.custoTotal || 0),
    0
  );

  const kcalSemanais = receitasPlaneadas.reduce(
    (total, item) => total + Number(item.ficha.nutrientesTotais?.kcal || 0),
    0
  );

  const ingredientesSemana = receitasPlaneadas.reduce((acumulador, item) => {
    item.ficha.ingredientes?.forEach((ingrediente) => {
      const nomeNormalizado = normalizarTexto(ingrediente.nome);

      if (!acumulador[nomeNormalizado]) {
        acumulador[nomeNormalizado] = {
          nome: ingrediente.nome,
          quantidadeNecessaria: 0,
        };
      }

      acumulador[nomeNormalizado].quantidadeNecessaria += Number(
        ingrediente.quantidade || 0
      );
    });

    return acumulador;
  }, {});

  const listaIngredientesSemana = Object.values(ingredientesSemana);

  const verificacaoStockSemanal = listaIngredientesSemana.map((ingrediente) => {
    const produtoStock = stocks.find(
      (item) =>
        normalizarTexto(item.produto) === normalizarTexto(ingrediente.nome)
    );

    const stockDisponivel = produtoStock
      ? converterParaGramas(produtoStock.quantidade, produtoStock.unidade)
      : 0;

    const diferenca = stockDisponivel - ingrediente.quantidadeNecessaria;

    return {
      nome: ingrediente.nome,
      quantidadeNecessaria: ingrediente.quantidadeNecessaria,
      stockDisponivel,
      diferenca,
      suficiente: diferenca >= 0,
    };
  });

  const listaComprasSemanal = verificacaoStockSemanal.filter(
    (item) => !item.suficiente
  );

  function exportarEmentaPDF() {
    const doc = new jsPDF("landscape");

    doc.setFontSize(18);
    doc.text("Ementa Semanal - IPSS", 14, 18);

    doc.setFontSize(10);
    doc.text(`Custo semanal estimado: ${custoSemanal.toFixed(2)} €`, 14, 26);
    doc.text(`Energia semanal estimada: ${kcalSemanais.toFixed(0)} kcal`, 14, 32);
    doc.text(`Refeições planeadas: ${receitasPlaneadas.length}`, 14, 38);

    autoTable(doc, {
      startY: 46,
      head: [["Dia", ...refeicoes]],
      body: diasSemana.map((dia) => [
        dia,
        ...refeicoes.map((refeicao) => {
          const receitaId = ementa[dia]?.[refeicao];
          const ficha = obterFicha(receitaId);
          return ficha ? ficha.nome : "-";
        }),
      ]),
      styles: {
        fontSize: 8,
        cellWidth: "wrap",
        valign: "top",
      },
      headStyles: {
        fillColor: [20, 92, 42],
      },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Dia", "Refeições planeadas", "Custo diário", "Energia diária"]],
      body: diasSemana.map((dia) => {
        const receitasDia = receitasPlaneadas.filter((item) => item.dia === dia);

        const custoDia = receitasDia.reduce(
          (total, item) => total + Number(item.ficha.custoTotal || 0),
          0
        );

        const kcalDia = receitasDia.reduce(
          (total, item) => total + Number(item.ficha.nutrientesTotais?.kcal || 0),
          0
        );

        return [
          dia,
          receitasDia.length,
          `${custoDia.toFixed(2)} €`,
          `${kcalDia.toFixed(0)} kcal`,
        ];
      }),
      styles: {
        fontSize: 9,
      },
      headStyles: {
        fillColor: [20, 92, 42],
      },
    });

    if (listaComprasSemanal.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Produto", "Quantidade em falta", "Observação"]],
        body: listaComprasSemanal.map((item) => [
          item.nome,
          formatarQuantidade(Math.abs(item.diferenca)),
          "Comprar para cumprir a ementa semanal",
        ]),
        styles: {
          fontSize: 9,
        },
        headStyles: {
          fillColor: [220, 38, 38],
        },
      });
    }

    doc.save("ementa-semanal-ipss.pdf");
  }

  return (
    <div className="pagina">
      <h1>Planeamento de Ementas</h1>

      <p className="descricao">
        Organização semanal das refeições, com cálculo automático de custos,
        valor nutricional, ingredientes necessários e lista semanal de compras.
      </p>

      <button className="botao-principal" onClick={exportarEmentaPDF}>
        Exportar ementa PDF
      </button>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Receitas disponíveis</h3>
          <p>{fichas.length}</p>
          <span>Fichas técnicas</span>
        </div>

        <div className="dashboard-card">
          <h3>Refeições planeadas</h3>
          <p>{receitasPlaneadas.length}</p>
          <span>Semana atual</span>
        </div>

        <div className="dashboard-card">
          <h3>Custo semanal</h3>
          <p>{custoSemanal.toFixed(2)} €</p>
          <span>Total estimado</span>
        </div>

        <div className="dashboard-card">
          <h3>Energia semanal</h3>
          <p>{kcalSemanais.toFixed(0)} kcal</p>
          <span>Total planeado</span>
        </div>

        <div className="dashboard-card">
          <h3>Compras</h3>
          <p>{listaComprasSemanal.length}</p>
          <span>Produtos em falta</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Ementa semanal</h2>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Dia</th>
              {refeicoes.map((refeicao) => (
                <th key={refeicao}>{refeicao}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {diasSemana.map((dia) => (
              <tr key={dia}>
                <td>
                  <strong>{dia}</strong>
                </td>

                {refeicoes.map((refeicao) => {
                  const receitaId = ementa[dia]?.[refeicao];
                  const ficha = obterFicha(receitaId);

                  return (
                    <td key={refeicao}>
                      <select
                        value={receitaId || ""}
                        onChange={(e) =>
                          atualizarEmenta(dia, refeicao, e.target.value)
                        }
                      >
                        <option value="">Selecionar receita</option>

                        {fichas.map((ficha) => (
                          <option key={ficha.id} value={ficha.id}>
                            {ficha.nome}
                          </option>
                        ))}
                      </select>

                      {ficha && (
                        <div style={{ marginTop: "8px", fontSize: "0.85rem" }}>
                          <p>💰 {Number(ficha.custoTotal || 0).toFixed(2)} €</p>
                          <p>
                            🔥{" "}
                            {Number(ficha.nutrientesTotais?.kcal || 0).toFixed(
                              0
                            )}{" "}
                            kcal
                          </p>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dashboard-section">
        <h2>Resumo semanal</h2>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Dia</th>
              <th>Refeições planeadas</th>
              <th>Custo diário</th>
              <th>Energia diária</th>
            </tr>
          </thead>

          <tbody>
            {diasSemana.map((dia) => {
              const receitasDia = receitasPlaneadas.filter(
                (item) => item.dia === dia
              );

              const custoDia = receitasDia.reduce(
                (total, item) => total + Number(item.ficha.custoTotal || 0),
                0
              );

              const kcalDia = receitasDia.reduce(
                (total, item) =>
                  total + Number(item.ficha.nutrientesTotais?.kcal || 0),
                0
              );

              return (
                <tr key={dia}>
                  <td>{dia}</td>
                  <td>{receitasDia.length}</td>
                  <td>{custoDia.toFixed(2)} €</td>
                  <td>{kcalDia.toFixed(0)} kcal</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="dashboard-section">
        <h2>Ingredientes necessários na semana</h2>

        {listaIngredientesSemana.length === 0 ? (
          <p>Ainda não existem refeições planeadas.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th>Quantidade semanal</th>
              </tr>
            </thead>

            <tbody>
              {listaIngredientesSemana.map((item, index) => (
                <tr key={index}>
                  <td>{item.nome}</td>
                  <td>{formatarQuantidade(item.quantidadeNecessaria)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Verificação semanal de stock</h2>

        {verificacaoStockSemanal.length === 0 ? (
          <p>Ainda não existem dados para verificar stock.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Necessário</th>
                <th>Disponível</th>
                <th>Diferença</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {verificacaoStockSemanal.map((item, index) => (
                <tr key={index}>
                  <td>{item.nome}</td>
                  <td>{formatarQuantidade(item.quantidadeNecessaria)}</td>
                  <td>{formatarQuantidade(item.stockDisponivel)}</td>
                  <td>{formatarQuantidade(Math.abs(item.diferenca))}</td>
                  <td>
                    {item.suficiente ? (
                      <span style={{ color: "#16a34a", fontWeight: "bold" }}>
                        ✔ Suficiente
                      </span>
                    ) : (
                      <span style={{ color: "#dc2626", fontWeight: "bold" }}>
                        ⚠ Em falta
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {listaComprasSemanal.length > 0 && (
        <div className="dashboard-section">
          <h2>Lista semanal de compras</h2>

          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade em falta</th>
                <th>Observação</th>
              </tr>
            </thead>

            <tbody>
              {listaComprasSemanal.map((item, index) => (
                <tr key={index}>
                  <td>{item.nome}</td>
                  <td>{formatarQuantidade(Math.abs(item.diferenca))}</td>
                  <td>Comprar para cumprir a ementa semanal</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}