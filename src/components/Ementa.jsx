import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "../supabaseClient";

export default function Ementa() {
  const [fichas, setFichas] = useState([]);
  const [stocks, setStocks] = useState([]);

  const [ementa, setEmenta] = useState({});
  const [modoIA, setModoIA] = useState("equilibrada");
  const [relatorioIA, setRelatorioIA] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    await carregarFichas();
    await carregarStocks();
    await carregarEmenta();
  }

  async function carregarFichas() {
    const { data, error } = await supabase
      .from("fichas_tecnicas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      console.error(error);
      return;
    }

    const fichasFormatadas = (data || []).map((ficha) => ({
      id: ficha.id,
      nome: ficha.nome,
      categoria: ficha.categoria,
      doses: ficha.doses,
      ...ficha.dados,
    }));

    setFichas(fichasFormatadas);
  }

  async function carregarStocks() {
    const { data, error } = await supabase
      .from("stocks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      console.error(error);
      return;
    }

    const stocksFormatados = (data || []).map((item) => ({
      id: item.id,
      produto: item.produto,
      categoria: item.categoria,
      quantidade: Number(item.quantidade || 0),
      unidade: item.unidade,
      validade: item.validade,
      fornecedor: item.fornecedor,
      stockMinimo: Number(item.stock_minimo || 0),
    }));

    setStocks(stocksFormatados);
  }

  async function carregarEmenta() {
    const { data, error } = await supabase
      .from("ementas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      alert(error.message);
      console.error(error);
      return;
    }

    if (data?.dados) {
      setEmenta(data.dados);
    }
  }

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

  async function guardarEmentaSupabase(novaEmenta) {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      alert("Precisas de iniciar sessão para guardar a ementa.");
      console.error(userError);
      return;
    }

    const { data: existente, error: procurarError } = await supabase
      .from("ementas")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (procurarError) {
      alert(procurarError.message);
      console.error(procurarError);
      return;
    }

    if (existente?.id) {
      const { error } = await supabase
        .from("ementas")
        .update({ dados: novaEmenta })
        .eq("id", existente.id);

      if (error) {
        alert(error.message);
        console.error(error);
      }
    } else {
      const { error } = await supabase.from("ementas").insert([
        {
          user_id: userData.user.id,
          dados: novaEmenta,
        },
      ]);

      if (error) {
        alert(error.message);
        console.error(error);
      }
    }
  }

  async function atualizarEmenta(dia, refeicao, receitaId) {
    const novaEmenta = {
      ...ementa,
      [dia]: {
        ...ementa[dia],
        [refeicao]: receitaId,
      },
    };

    setEmenta(novaEmenta);
    await guardarEmentaSupabase(novaEmenta);
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


  function obterGrupoReceita(ficha) {
    const texto = textoNormalizado(
      `${ficha.nome} ${ficha.categoria} ${ficha.tipo} ${ficha.alergenios}`
    );

    if (texto.includes("sopa")) return "Sopa";
    if (texto.includes("peixe")) return "Peixe";
    if (texto.includes("carne") || texto.includes("frango") || texto.includes("vaca")) return "Carne";
    if (texto.includes("vegetar") || texto.includes("leguminosa") || texto.includes("feijao") || texto.includes("feijão") || texto.includes("grão")) return "Vegetariana/Leguminosas";
    if (texto.includes("sobremesa") || texto.includes("doce")) return "Sobremesa";
    if (texto.includes("fruta")) return "Fruta";
    if (texto.includes("leite") || texto.includes("iogurte")) return "Laticínios";
    if (texto.includes("pao") || texto.includes("pão")) return "Padaria";

    return ficha.categoria || "Outro";
  }

  function calcularDisponibilidadeStock(ficha) {
    const ingredientes = ficha.ingredientes || [];

    if (ingredientes.length === 0) {
      return {
        percentagem: 0,
        emFalta: [],
        aExpirar: [],
      };
    }

    let ingredientesDisponiveis = 0;
    const emFalta = [];
    const aExpirar = [];

    ingredientes.forEach((ingrediente) => {
      const produtoStock = stocks.find(
        (item) =>
          normalizarTexto(item.produto) === normalizarTexto(ingrediente.nome)
      );

      if (!produtoStock) {
        emFalta.push(ingrediente.nome);
        return;
      }

      const stockDisponivel = converterParaGramas(
        produtoStock.quantidade,
        produtoStock.unidade
      );

      const necessario = Number(ingrediente.quantidade || 0);

      if (stockDisponivel >= necessario) {
        ingredientesDisponiveis += 1;
      } else {
        emFalta.push(ingrediente.nome);
      }

      if (produtoStock.validade) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const validade = new Date(produtoStock.validade);
        validade.setHours(0, 0, 0, 0);

        const dias = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

        if (dias >= 0 && dias <= 7) {
          aExpirar.push(produtoStock.produto);
        }
      }
    });

    return {
      percentagem: ingredientesDisponiveis / ingredientes.length,
      emFalta,
      aExpirar,
    };
  }

  function pontuarReceitaIA(
    ficha,
    refeicao,
    usadasSemana,
    usadasDia,
    gruposDia,
    gruposSemana
  ) {
    let pontos = 100;

    const kcal = obterKcal(ficha);
    const custo = obterCusto(ficha);
    const grupo = obterGrupoReceita(ficha);
    const disponibilidade = calcularDisponibilidadeStock(ficha);

    if (receitaAdequada(ficha, refeicao)) pontos += 35;
    if (usadasDia.includes(ficha.id)) pontos -= 100;

    const vezesUsada = usadasSemana.filter((id) => id === ficha.id).length;
    pontos -= vezesUsada * 35;

    const vezesGrupoSemana = gruposSemana.filter((item) => item === grupo).length;
    pontos -= vezesGrupoSemana * 8;

    if (gruposDia.includes(grupo)) pontos -= 20;

    if (refeicao === "Almoço" || refeicao === "Jantar") {
      if (kcal >= 350 && kcal <= 850) pontos += 25;
      if (grupo === "Sopa") pontos += 10;
      if (grupo === "Peixe" && vezesGrupoSemana < 3) pontos += 18;
      if (grupo === "Vegetariana/Leguminosas" && vezesGrupoSemana < 2) pontos += 15;
    } else {
      if (kcal > 0 && kcal <= 350) pontos += 25;
      if (grupo === "Fruta") pontos += 15;
      if (grupo === "Laticínios") pontos += 12;
      if (grupo === "Padaria") pontos += 8;
    }

    if (modoIA === "economica") {
      if (custo > 0 && custo <= 2.0) pontos += 35;
      if (custo > 4.5) pontos -= 30;
    }

    if (modoIA === "nutricional") {
      if (kcal >= 250 && kcal <= 750) pontos += 25;
      if (
        grupo === "Peixe" ||
        grupo === "Vegetariana/Leguminosas" ||
        grupo === "Fruta"
      ) {
        pontos += 20;
      }
    }

    if (modoIA === "anti-desperdicio") {
      pontos += disponibilidade.percentagem * 35;

      if (disponibilidade.aExpirar.length > 0) {
        pontos += 45;
      }

      if (disponibilidade.emFalta.length > 0) {
        pontos -= disponibilidade.emFalta.length * 25;
      }
    } else {
      pontos += disponibilidade.percentagem * 20;

      if (disponibilidade.emFalta.length > 0) {
        pontos -= disponibilidade.emFalta.length * 15;
      }
    }

    if (custo > 0 && custo <= 4.5) pontos += 10;

    pontos += Math.random() * 8;

    return pontos;
  }

  async function gerarEmentaIA() {
    if (fichas.length === 0) {
      alert("Ainda não existem fichas técnicas registadas.");
      return;
    }

    const novaEmenta = {};
    const usadasSemana = [];
    const gruposSemana = [];
    const explicacoes = [];

    diasSemana.forEach((dia) => {
      novaEmenta[dia] = {};
      const usadasDia = [];
      const gruposDia = [];

      refeicoes.forEach((refeicao) => {
        const receitasOrdenadas = [...fichas].sort(
          (a, b) =>
            pontuarReceitaIA(
              b,
              refeicao,
              usadasSemana,
              usadasDia,
              gruposDia,
              gruposSemana
            ) -
            pontuarReceitaIA(
              a,
              refeicao,
              usadasSemana,
              usadasDia,
              gruposDia,
              gruposSemana
            )
        );

        const escolhida = receitasOrdenadas[0];
        const grupo = obterGrupoReceita(escolhida);
        const disponibilidade = calcularDisponibilidadeStock(escolhida);

        novaEmenta[dia][refeicao] = escolhida.id;
        usadasDia.push(escolhida.id);
        usadasSemana.push(escolhida.id);
        gruposDia.push(grupo);
        gruposSemana.push(grupo);

        explicacoes.push({
          dia,
          refeicao,
          receita: escolhida.nome,
          grupo,
          custo: Number(escolhida.custoTotal || 0),
          kcal: Number(escolhida.nutrientesTotais?.kcal || 0),
          stock: Math.round(disponibilidade.percentagem * 100),
          emFalta: disponibilidade.emFalta,
          aExpirar: disponibilidade.aExpirar,
        });
      });
    });

    setEmenta(novaEmenta);

    const custoPrevisto = explicacoes.reduce(
      (total, item) => total + Number(item.custo || 0),
      0
    );

    const mediaStock =
      explicacoes.length > 0
        ? explicacoes.reduce((total, item) => total + item.stock, 0) /
          explicacoes.length
        : 0;

    const receitasComFalta = explicacoes.filter(
      (item) => item.emFalta.length > 0
    ).length;

    const produtosAproveitados = [
      ...new Set(explicacoes.flatMap((item) => item.aExpirar)),
    ];

    setRelatorioIA(
      `Ementa gerada em modo "${modoIA}". Custo semanal estimado: ${custoPrevisto.toFixed(
        2
      )} €. Disponibilidade média de stock: ${mediaStock.toFixed(
        0
      )}%. Receitas com algum ingrediente em falta: ${receitasComFalta}. Produtos com validade próxima aproveitados: ${
        produtosAproveitados.length > 0
          ? produtosAproveitados.join(", ")
          : "nenhum"
      }.`
    );

    await guardarEmentaSupabase(novaEmenta);
  }

  async function gerarEmentaAutomatica() {
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
    await guardarEmentaSupabase(novaEmenta);
  }

  async function limparEmenta() {
    if (!window.confirm("Tem a certeza que pretende limpar toda a ementa?")) {
      return;
    }

    setEmenta({});
    await guardarEmentaSupabase({});
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

      <div className="dashboard-section">
        <h2>IA de geração de ementas</h2>

        <p>
          A IA analisa fichas técnicas, custos, valor energético, repetição
          semanal, adequação à refeição, stock disponível e produtos com validade
          próxima.
        </p>

        <label>Modo de geração</label>
        <select value={modoIA} onChange={(e) => setModoIA(e.target.value)}>
          <option value="equilibrada">Equilibrada</option>
          <option value="economica">Económica</option>
          <option value="nutricional">Nutricional</option>
          <option value="anti-desperdicio">Anti-desperdício</option>
        </select>

        <div className="botoes-formulario">
          <button className="botao-principal" onClick={gerarEmentaIA}>
            Gerar melhor ementa possível com IA
          </button>

          <button className="botao-secundario" onClick={gerarEmentaAutomatica}>
            Gerar ementa simples
          </button>

          <button className="botao-secundario" onClick={exportarEmentaPDF}>
            Exportar ementa PDF
          </button>

          <button className="botao-secundario" onClick={limparEmenta}>
            Limpar ementa
          </button>
        </div>

        {relatorioIA && (
          <div className="success-message">
            <strong>Relatório da IA:</strong> {relatorioIA}
          </div>
        )}
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

        <div className="dashboard-card">
          <h3>Modo IA</h3>
          <p>{modoIA}</p>
          <span>Critério de geração</span>
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