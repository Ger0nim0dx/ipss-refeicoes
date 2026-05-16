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
    setFichas(JSON.parse(localStorage.getItem("ipssFichasTecnicas")) || []);
    setStocks(JSON.parse(localStorage.getItem("ipssStocks")) || []);
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

  function textoNormalizado(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function obterKcal(ficha) {
    return Number(ficha.nutrientesTotais?.kcal || 0);
  }

  function obterCusto(ficha) {
    return Number(ficha.custoTotal || 0);
  }

  function receitaAdequada(ficha, refeicao) {
    const texto = textoNormalizado(
      `${ficha.nome} ${ficha.categoria} ${ficha.tipo}`
    );

    if (refeicao === "Almoço" || refeicao === "Jantar") {
      return (
        texto.includes("principal") ||
        texto.includes("carne") ||
        texto.includes("peixe") ||
        texto.includes("prato") ||
        texto.includes("sopa")
      );
    }

    if (
      refeicao === "Pequeno-almoço" ||
      refeicao === "Lanche" ||
      refeicao.includes("Reforço")
    ) {
      return (
        texto.includes("lanche") ||
        texto.includes("pequeno") ||
        texto.includes("reforco") ||
        texto.includes("iogurte") ||
        texto.includes("fruta") ||
        texto.includes("pao") ||
        texto.includes("leite")
      );
    }

    return true;
  }

  function pontuarReceita(ficha, refeicao, usadasSemana, usadasDia) {
    let pontos = 100;

    const kcal = obterKcal(ficha);
    const custo = obterCusto(ficha);

    if (usadasDia.includes(ficha.id)) pontos -= 80;

    const vezesUsada = usadasSemana.filter((id) => id === ficha.id).length;
    pontos -= vezesUsada * 25;

    if (receitaAdequada(ficha, refeicao)) pontos += 35;

    if (refeicao === "Almoço" || refeicao === "Jantar") {
      if (kcal >= 350 && kcal <= 850) pontos += 20;
      if (custo > 0 && custo <= 4.5) pontos += 15;
    } else {
      if (kcal > 0 && kcal <= 350) pontos += 20;
      if (custo > 0 && custo <= 2.0) pontos += 15;
    }

    pontos += Math.random() * 10;

    return pontos;
  }

  function gerarEmentaAutomatica() {
    if (fichas.length === 0) {
      alert("Ainda não existem fichas técnicas registadas.");
      return;
    }

    const novaEmenta = {};
    const usadasSemana = [];

    diasSemana.forEach((dia) => {
      novaEmenta[dia] = {};
      const usadasDia = [];

      refeicoes.forEach((refeicao) => {
        const receitasOrdenadas = [...fichas].sort(
          (a, b) =>
            pontuarReceita(b, refeicao, usadasSemana, usadasDia) -
            pontuarReceita(a, refeicao, usadasSemana, usadasDia)
        );

        const escolhida = receitasOrdenadas[0];

        novaEmenta[dia][refeicao] = escolhida.id;
        usadasDia.push(escolhida.id);
        usadasSemana.push(escolhida.id);
      });
    });

    setEmenta(novaEmenta);
    localStorage.setItem("ipssEmenta", JSON.stringify(novaEmenta));
  }

  function limparEmenta() {
    if (!window.confirm("Tem a certeza que pretende limpar toda a ementa?")) {
      return;
    }

    setEmenta({});
    localStorage.removeItem("ipssEmenta");
  }

  function normalizarTexto(texto) {
    return textoNormalizado(texto);
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
        receitasPlaneadas.push({ dia, refeicao, ficha });
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
      },
      headStyles: {
        fillColor: [20, 92, 42],
      },
    });

    doc.save("ementa-semanal-ipss.pdf");
  }

  return (
    <div className="pagina">
      <h1>Planeamento de Ementas</h1>

      <p className="descricao">
        Organização semanal das refeições, com geração automática inteligente,
        controlo de custos, valor nutricional, ingredientes necessários e lista
        semanal de compras.
      </p>

      <div className="botoes-formulario">
        <button className="botao-principal" onClick={gerarEmentaAutomatica}>
          Gerar ementa inteligente
        </button>

        <button className="botao-secundario" onClick={exportarEmentaPDF}>
          Exportar ementa PDF
        </button>

        <button className="botao-secundario" onClick={limparEmenta}>
          Limpar ementa
        </button>
      </div>

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

        <div className="dashboard-card destaque">
          <h3>Compras</h3>
          <p>{listaComprasSemanal.length}</p>
          <span>Produtos em falta</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Calendário semanal de refeições</h2>

        <div className="ementa-calendar">
          {diasSemana.map((dia) => (
            <div className="ementa-dia-card" key={dia}>
              <div className="ementa-dia-header">
                <h3>{dia}</h3>
              </div>

              <div className="ementa-refeicoes">
                {refeicoes.map((refeicao) => {
                  const receitaId = ementa[dia]?.[refeicao];
                  const ficha = obterFicha(receitaId);

                  return (
                    <div className="ementa-refeicao-card" key={refeicao}>
                      <strong>{refeicao}</strong>

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
                        <div className="ementa-info">
                          <span>
                            💰 {Number(ficha.custoTotal || 0).toFixed(2)} €
                          </span>

                          <span>
                            🔥{" "}
                            {Number(ficha.nutrientesTotais?.kcal || 0).toFixed(
                              0
                            )}{" "}
                            kcal
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
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