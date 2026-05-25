import { useEffect, useState } from "react";

import {
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Euro,
  ClipboardList,
  Clock3,
  ShieldAlert,
  CheckCircle2,
  Factory,
  BrainCircuit,
  Lightbulb,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { supabase } from "../supabaseClient";

function Dashboard() {
  const [dadosIPSS, setDadosIPSS] = useState({});
  const [stocks, setStocks] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [ementas, setEmentas] = useState([]);
  const [dietas, setDietas] = useState([]);
  const [haccp, setHaccp] = useState([]);

  const [diasSelecionados, setDiasSelecionados] = useState([]);
  const [mensagemOperacional, setMensagemOperacional] = useState("");

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function carregarDashboard() {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error(userError);
      return;
    }

    const user = userData.user;

    setDadosIPSS(JSON.parse(localStorage.getItem("dadosIPSS")) || {});

    const { data: stocksData, error: stocksError } = await supabase
      .from("stocks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (stocksError) console.error(stocksError);

    const { data: fichasData, error: fichasError } = await supabase
      .from("fichas_tecnicas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (fichasError) console.error(fichasError);

    const { data: ementasData, error: ementasError } = await supabase
      .from("ementas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ementasError) console.error(ementasError);

    const { data: dietasData, error: dietasError } = await supabase
      .from("dietas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (dietasError) console.error(dietasError);

    const { data: haccpData, error: haccpError } = await supabase
      .from("haccp")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (haccpError) console.error(haccpError);

    const { data: movimentosData, error: movimentosError } = await supabase
      .from("movimentos_stock")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (movimentosError) console.error(movimentosError);

    const fichasFormatadas = (fichasData || []).map((ficha) => ({
      id: ficha.id,
      nome: ficha.nome,
      categoria: ficha.categoria,
      doses: ficha.doses,
      ...ficha.dados,
    }));

    setStocks(stocksData || []);
    setFichas(fichasFormatadas);
    setEmentas(ementasData || []);
    setDietas(dietasData || []);
    setHaccp(haccpData || []);
    setMovimentos(movimentosData || []);
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diasSemana = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo",
  ];

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

  function converterDeGramas(gramas, unidade) {
    if (unidade === "kg") return gramas / 1000;
    if (unidade === "g") return gramas;
    if (unidade === "L") return gramas / 1000;
    if (unidade === "ml") return gramas;

    return gramas;
  }

  function encontrarProdutoStock(nomeIngrediente) {
    return stocks.find((item) => {
      const nomeStock = normalizarTexto(item.produto || item.nome);
      const nomeIng = normalizarTexto(nomeIngrediente);

      return (
        nomeStock === nomeIng ||
        nomeStock.includes(nomeIng) ||
        nomeIng.includes(nomeStock)
      );
    });
  }

  function toggleDia(dia) {
    if (diasSelecionados.includes(dia)) {
      setDiasSelecionados(diasSelecionados.filter((item) => item !== dia));
    } else {
      setDiasSelecionados([...diasSelecionados, dia]);
    }
  }

  async function executarProducaoSelecionada() {
    if (diasSelecionados.length === 0) {
      alert("Seleciona pelo menos um dia para produzir.");
      return;
    }

    if (ementas.length === 0) {
      alert("Ainda não existe nenhuma ementa guardada.");
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      alert("Precisas de iniciar sessão para executar produção.");
      console.error(userError);
      return;
    }

    const user = userData.user;
    const ementaAtual = ementas[0]?.dados || {};
    const ingredientesTotais = {};

    diasSelecionados.forEach((dia) => {
      const refeicoesDia = ementaAtual[dia];

      if (!refeicoesDia) return;

      Object.values(refeicoesDia).forEach((receitaId) => {
        const ficha = fichas.find(
          (item) => String(item.id) === String(receitaId)
        );

        if (!ficha) return;

        ficha.ingredientes?.forEach((ingrediente) => {
          const chave = normalizarTexto(ingrediente.nome);

          if (!ingredientesTotais[chave]) {
            ingredientesTotais[chave] = {
              nome: ingrediente.nome,
              quantidade: 0,
            };
          }

          ingredientesTotais[chave].quantidade += Number(
            ingrediente.quantidade || 0
          );
        });
      });
    });

    const ingredientes = Object.values(ingredientesTotais);

    if (ingredientes.length === 0) {
      alert("Não existem ingredientes associados aos dias selecionados.");
      return;
    }

    const faltas = [];

    ingredientes.forEach((ingrediente) => {
      const produtoStock = encontrarProdutoStock(ingrediente.nome);

      if (!produtoStock) {
        faltas.push(`${ingrediente.nome} — sem produto no stock`);
        return;
      }

      const stockAtual = converterParaGramas(
        produtoStock.quantidade,
        produtoStock.unidade
      );

      if (stockAtual < ingrediente.quantidade) {
        faltas.push(`${ingrediente.nome} — stock insuficiente`);
      }
    });

    if (faltas.length > 0) {
      alert(`Não é possível executar a produção:\n\n${faltas.join("\n")}`);
      return;
    }

    const confirmar = confirm(
      `Confirmas a produção dos seguintes dias?\n\n${diasSelecionados.join(", ")}`
    );

    if (!confirmar) return;

    const novosMovimentos = [];

    for (const ingrediente of ingredientes) {
      const produtoStock = encontrarProdutoStock(ingrediente.nome);

      if (!produtoStock) continue;

      const stockAtual = converterParaGramas(
        produtoStock.quantidade,
        produtoStock.unidade
      );

      const novoStock = stockAtual - ingrediente.quantidade;
      const novaQuantidade = converterDeGramas(novoStock, produtoStock.unidade);

      const { error: updateError } = await supabase
        .from("stocks")
        .update({
          quantidade: Number(novaQuantidade.toFixed(3)),
        })
        .eq("id", produtoStock.id);

      if (updateError) {
        alert(updateError.message);
        console.error(updateError);
        return;
      }

      novosMovimentos.push({
        user_id: user.id,
        produto: produtoStock.produto || ingrediente.nome,
        tipo: `Produção: ${diasSelecionados.join(", ")}`,
        quantidade: Number(ingrediente.quantidade.toFixed(0)),
        unidade: "g",
        observacoes: "Produção automática a partir da ementa semanal",
      });
    }

    if (novosMovimentos.length > 0) {
      const { error: movimentosError } = await supabase
        .from("movimentos_stock")
        .insert(novosMovimentos);

      if (movimentosError) {
        alert(movimentosError.message);
        console.error(movimentosError);
        return;
      }
    }

    const { error: producaoError } = await supabase.from("producoes").insert({
      user_id: user.id,
      dias: diasSelecionados,
      total_movimentos: novosMovimentos.length,
      observacoes: "Produção executada automaticamente no dashboard",
    });

    if (producaoError) {
      alert(producaoError.message);
      console.error(producaoError);
      return;
    }

    setMensagemOperacional(
      `Produção executada para ${diasSelecionados.join(
        ", "
      )}. Foram gerados ${novosMovimentos.length} movimentos automáticos de stock.`
    );

    setDiasSelecionados([]);

    await carregarDashboard();

    alert("Produção executada com sucesso.");
  }

  function diasAteValidade(data) {
    if (!data) return null;

    const validade = new Date(data);
    validade.setHours(0, 0, 0, 0);

    const diferenca = validade - hoje;

    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
  }

  const produtosStockBaixo = stocks.filter(
    (item) =>
      Number(item.quantidade) <= Number(item.stock_minimo ?? item.stockMinimo ?? 0)
  );

  const produtosExpirados = stocks.filter((item) => {
    const dias = diasAteValidade(item.validade);
    return dias !== null && dias < 0;
  });

  const produtosAExpirar = stocks.filter((item) => {
    const dias = diasAteValidade(item.validade);
    return dias !== null && dias >= 0 && dias <= 7;
  });

  const totalEntradas = movimentos.filter((m) =>
    String(m.tipo || "").toLowerCase().includes("entrada")
  ).length;

  const totalSaidas = movimentos.filter((m) =>
    String(m.tipo || "").toLowerCase().includes("saída")
  ).length;

  const custoTotalReceitas = fichas.reduce(
    (total, ficha) => total + Number(ficha.custoTotal || 0),
    0
  );

  const custoMedioReceita =
    fichas.length > 0 ? custoTotalReceitas / fichas.length : 0;

  const comprasPendentes = produtosStockBaixo.length + produtosExpirados.length;

  const naoConformidadesHaccp = haccp.filter(
    (item) => item.tipo_registo === "nao_conformidade"
  );

  const temperaturasCriticasHaccp = haccp.filter(
    (item) => item.tipo_registo === "temperatura" && item.estado === "Crítico"
  );

  const alertasHaccp =
    naoConformidadesHaccp.length + temperaturasCriticasHaccp.length;

  const totalEmentas = ementas.length;
  const totalDietas = dietas.length;

  const dadosGrafico = stocks.slice(0, 8).map((item) => ({
    nome: item.produto || item.nome,
    quantidade: Number(item.quantidade) || 0,
  }));

  const ementaAtual = ementas[0]?.dados || {};
  const receitasPlaneadas = [];

  Object.values(ementaAtual).forEach((refeicoesDia) => {
    Object.values(refeicoesDia || {}).forEach((receitaId) => {
      const ficha = fichas.find((item) => String(item.id) === String(receitaId));
      if (ficha) receitasPlaneadas.push(ficha);
    });
  });

  const ingredientesPrevistos = {};

  receitasPlaneadas.forEach((ficha) => {
    ficha.ingredientes?.forEach((ingrediente) => {
      const chave = normalizarTexto(ingrediente.nome);

      if (!ingredientesPrevistos[chave]) {
        ingredientesPrevistos[chave] = {
          nome: ingrediente.nome,
          quantidade: 0,
        };
      }

      ingredientesPrevistos[chave].quantidade += Number(
        ingrediente.quantidade || 0
      );
    });
  });

  const previsaoStock = Object.values(ingredientesPrevistos).map(
    (ingrediente) => {
      const produtoStock = encontrarProdutoStock(ingrediente.nome);

      const stockAtual = produtoStock
        ? converterParaGramas(produtoStock.quantidade, produtoStock.unidade)
        : 0;

      const stockMinimo = produtoStock
        ? converterParaGramas(
            produtoStock.stock_minimo || produtoStock.stockMinimo || 0,
            produtoStock.unidade
          )
        : 0;

      const stockDepois = stockAtual - ingrediente.quantidade;

      return {
        nome: ingrediente.nome,
        necessario: ingrediente.quantidade,
        stockAtual,
        stockDepois,
        stockMinimo,
        produtoStock,
        ficaraCritico: produtoStock && stockDepois <= stockMinimo,
        emFalta: !produtoStock || stockDepois < 0,
      };
    }
  );

  const produtosPrevisaoCritica = previsaoStock.filter(
    (item) => item.ficaraCritico || item.emFalta
  );

  const produtosAExpirarNaEmenta = produtosAExpirar.filter((produto) =>
    Object.values(ingredientesPrevistos).some((ingrediente) => {
      const nomeProduto = normalizarTexto(produto.produto || produto.nome);
      const nomeIngrediente = normalizarTexto(ingrediente.nome);

      return (
        nomeProduto === nomeIngrediente ||
        nomeProduto.includes(nomeIngrediente) ||
        nomeIngrediente.includes(nomeProduto)
      );
    })
  );

  const produtosAExpirarForaEmenta = produtosAExpirar.filter(
    (produto) =>
      !produtosAExpirarNaEmenta.some((item) => item.id === produto.id)
  );

  const recomendacoesIA = [];

  if (produtosExpirados.length > 0) {
    recomendacoesIA.push({
      tipo: "crítico",
      titulo: "Validar produtos expirados",
      texto: `Existem ${produtosExpirados.length} produto(s) com validade ultrapassada. Devem ser verificados antes de qualquer utilização.`,
    });
  }

  if (produtosStockBaixo.length > 0) {
    recomendacoesIA.push({
      tipo: "stock",
      titulo: "Reforçar compras",
      texto: `Existem ${produtosStockBaixo.length} produto(s) com stock baixo. Sugere-se atualização da lista de compras.`,
    });
  }

  if (produtosAExpirarForaEmenta.length > 0) {
    recomendacoesIA.push({
      tipo: "desperdício",
      titulo: "Reduzir desperdício alimentar",
      texto: `Há ${produtosAExpirarForaEmenta.length} produto(s) a expirar que não parecem estar previstos na ementa. Sugere-se ajustar receitas para os aproveitar.`,
    });
  }

  if (produtosAExpirarNaEmenta.length > 0) {
    recomendacoesIA.push({
      tipo: "boa prática",
      titulo: "Boa gestão de validade",
      texto: `${produtosAExpirarNaEmenta.length} produto(s) a expirar já estão contemplados na ementa. Isto ajuda a reduzir desperdício.`,
    });
  }

  if (produtosPrevisaoCritica.length > 0) {
    recomendacoesIA.push({
      tipo: "previsão",
      titulo: "Stock poderá ficar crítico",
      texto: `Após a ementa planeada, ${produtosPrevisaoCritica.length} ingrediente(s) poderão ficar abaixo do mínimo ou em falta.`,
    });
  }

  if (alertasHaccp > 0) {
    recomendacoesIA.push({
      tipo: "haccp",
      titulo: "Atenção aos registos HACCP",
      texto: `Existem ${alertasHaccp} alerta(s) HACCP. Recomenda-se validar não conformidades antes de novas produções.`,
    });
  }

  if (
    recomendacoesIA.length === 0 &&
    stocks.length > 0 &&
    fichas.length > 0
  ) {
    recomendacoesIA.push({
      tipo: "estável",
      titulo: "Operação equilibrada",
      texto: "Não foram identificados riscos críticos. A operação parece estável neste momento.",
    });
  }

  return (
    <div className="dashboard">
      <div className="topo-dashboard">
        <div>
          <h1>Dashboard Geral</h1>

          <p className="dashboard-subtitle">
            Gestão alimentar inteligente da IPSS.
          </p>
        </div>

        <div className="data-box">{new Date().toLocaleDateString("pt-PT")}</div>
      </div>

      <div className="dashboard-section">
        <h2>Identificação da Instituição</h2>

        <div className="summary-grid">
          <div className="summary-box">
            <strong>Instituição</strong>
            <p>{dadosIPSS.nomeInstituicao || "Não preenchido"}</p>
          </div>

          <div className="summary-box">
            <strong>Localidade</strong>
            <p>{dadosIPSS.localidade || "Não preenchido"}</p>
          </div>

          <div className="summary-box">
            <strong>Responsável</strong>
            <p>{dadosIPSS.responsavelCozinha || "Não preenchido"}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>
          <BrainCircuit size={22} /> IA Operacional Inteligente
        </h2>

        <p className="dashboard-subtitle">
          Recomendações automáticas com base em stock, validade, ementa, HACCP e
          produção.
        </p>

        {recomendacoesIA.length === 0 ? (
          <p>Ainda não existem dados suficientes para gerar recomendações.</p>
        ) : (
          <div className="historico-grid">
            {recomendacoesIA.map((rec, index) => (
              <div className="historico-card" key={index}>
                <h3>
                  <Lightbulb size={20} /> {rec.titulo}
                </h3>

                <p>
                  <strong>Tipo:</strong> {rec.tipo}
                </p>

                <p>{rec.texto}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>
          <Factory size={22} /> Centro Operacional
        </h2>

        <p className="dashboard-subtitle">
          Executa a produção real a partir da ementa semanal, descontando
          automaticamente os ingredientes do stock.
        </p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "18px",
          }}
        >
          {diasSemana.map((dia) => (
            <button
              key={dia}
              className={
                diasSelecionados.includes(dia)
                  ? "botao-principal"
                  : "botao-secundario"
              }
              onClick={() => toggleDia(dia)}
            >
              {dia}
            </button>
          ))}
        </div>

        <button className="botao-principal" onClick={executarProducaoSelecionada}>
          Executar produção dos dias selecionados
        </button>

        {mensagemOperacional && (
          <p className="success-message">
            <BrainCircuit size={18} /> {mensagemOperacional}
          </p>
        )}
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <ClipboardList size={32} />
          <h3>Receitas</h3>
          <p>{fichas.length}</p>
          <span>Fichas técnicas</span>
        </div>

        <div className="dashboard-card">
          <Package size={32} />
          <h3>Produtos</h3>
          <p>{stocks.length}</p>
          <span>Produtos em stock</span>
        </div>

        <div className="dashboard-card">
          <ClipboardList size={32} />
          <h3>Ementas</h3>
          <p>{totalEmentas}</p>
          <span>Planeamentos guardados</span>
        </div>

        <div className="dashboard-card">
          <CheckCircle2 size={32} />
          <h3>Dietas</h3>
          <p>{totalDietas}</p>
          <span>Dietas especiais</span>
        </div>

        <div className="dashboard-card">
          <ShieldAlert size={32} />
          <h3>HACCP</h3>
          <p>{alertasHaccp}</p>
          <span>Alertas registados</span>
        </div>

        <div className="dashboard-card">
          <AlertTriangle size={32} />
          <h3>Stock baixo</h3>
          <p>{produtosStockBaixo.length}</p>
          <span>Produtos críticos</span>
        </div>

        <div className="dashboard-card">
          <ShieldAlert size={32} />
          <h3>Expirados</h3>
          <p>{produtosExpirados.length}</p>
          <span>Produtos vencidos</span>
        </div>

        <div className="dashboard-card">
          <Clock3 size={32} />
          <h3>A expirar</h3>
          <p>{produtosAExpirar.length}</p>
          <span>Próximos 7 dias</span>
        </div>

        <div className="dashboard-card">
          <TrendingUp size={32} />
          <h3>Entradas</h3>
          <p>{totalEntradas}</p>
          <span>Movimentos entrada</span>
        </div>

        <div className="dashboard-card">
          <TrendingDown size={32} />
          <h3>Saídas</h3>
          <p>{totalSaidas}</p>
          <span>Movimentos saída</span>
        </div>

        <div className="dashboard-card">
          <Euro size={32} />
          <h3>Custo médio</h3>
          <p>{custoMedioReceita.toFixed(2)} €</p>
          <span>Por receita</span>
        </div>

        <div className="dashboard-card destaque">
          <ShoppingCart size={32} />
          <h3>Compras</h3>
          <p>{comprasPendentes}</p>
          <span>Pendentes</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Indicadores Operacionais</h2>

        <div className="grafico-movimentos">
          <div className="movimento-card">
            <strong>Receitas registadas</strong>
            <span>{fichas.length}</span>
          </div>

          <div className="movimento-card">
            <strong>Produtos em stock</strong>
            <span>{stocks.length}</span>
          </div>

          <div className="movimento-card">
            <strong>Movimentos</strong>
            <span>{movimentos.length}</span>
          </div>

          <div className="movimento-card">
            <strong>Compras pendentes</strong>
            <span>{comprasPendentes}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Resumo Cloud / Supabase</h2>

        <div className="grafico-movimentos">
          <div className="movimento-card">
            <strong>Stocks online</strong>
            <span>{stocks.length}</span>
          </div>

          <div className="movimento-card">
            <strong>Fichas técnicas online</strong>
            <span>{fichas.length}</span>
          </div>

          <div className="movimento-card">
            <strong>Ementas online</strong>
            <span>{ementas.length}</span>
          </div>

          <div className="movimento-card">
            <strong>Dietas online</strong>
            <span>{dietas.length}</span>
          </div>

          <div className="movimento-card">
            <strong>Registos HACCP online</strong>
            <span>{haccp.length}</span>
          </div>

          <div className="movimento-card">
            <strong>Movimentos stock online</strong>
            <span>{movimentos.length}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Previsão de Stock Após Ementa</h2>

        {produtosPrevisaoCritica.length === 0 ? (
          <p className="success-message">
            <CheckCircle2 size={18} /> Não foram previstos ingredientes críticos
            após a ementa atual.
          </p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th>Necessário</th>
                <th>Stock depois</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {produtosPrevisaoCritica.map((item, index) => (
                <tr key={index}>
                  <td>{item.nome}</td>
                  <td>{(item.necessario / 1000).toFixed(2)} kg</td>
                  <td>{(item.stockDepois / 1000).toFixed(2)} kg</td>
                  <td>
                    {item.emFalta ? (
                      <span style={{ color: "#dc2626", fontWeight: "bold" }}>
                        Em falta
                      </span>
                    ) : (
                      <span style={{ color: "#ca8a04", fontWeight: "bold" }}>
                        Ficará crítico
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Gráfico de Quantidades em Stock</h2>

        {stocks.length === 0 ? (
          <p>Ainda não existem produtos registados.</p>
        ) : (
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Resumo Financeiro</h2>

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <Euro size={32} />
            <h3>Custo total receitas</h3>
            <p>{custoTotalReceitas.toFixed(2)} €</p>
            <span>Soma das fichas técnicas</span>
          </div>

          <div className="dashboard-card">
            <TrendingUp size={32} />
            <h3>Custo médio</h3>
            <p>{custoMedioReceita.toFixed(2)} €</p>
            <span>Por receita</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Alertas críticos</h2>

        {produtosStockBaixo.length === 0 &&
        produtosAExpirar.length === 0 &&
        produtosExpirados.length === 0 &&
        alertasHaccp === 0 ? (
          <p className="success-message">
            <CheckCircle2 size={18} /> Não existem alertas críticos.
          </p>
        ) : (
          <>
            {produtosStockBaixo.length > 0 && (
              <p
                style={{
                  color: "#dc2626",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                ⚠ Existem {produtosStockBaixo.length} produtos com stock baixo.
              </p>
            )}

            {produtosAExpirar.length > 0 && (
              <p
                style={{
                  color: "#ca8a04",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                ⚠ Existem {produtosAExpirar.length} produtos a expirar nos
                próximos 7 dias.
              </p>
            )}

            {produtosExpirados.length > 0 && (
              <p
                style={{
                  color: "#991b1b",
                  fontWeight: "bold",
                }}
              >
                ❌ Existem {produtosExpirados.length} produtos expirados.
              </p>
            )}

            {alertasHaccp > 0 && (
              <p
                style={{
                  color: "#dc2626",
                  fontWeight: "bold",
                }}
              >
                ⚠ Existem {alertasHaccp} alertas HACCP registados.
              </p>
            )}
          </>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Receitas mais recentes</h2>

        {fichas.length === 0 ? (
          <p>Ainda não existem fichas técnicas registadas.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Receita</th>
                <th>Categoria</th>
                <th>Doses</th>
                <th>Custo total</th>
              </tr>
            </thead>

            <tbody>
              {fichas
                .slice(-5)
                .reverse()
                .map((ficha, index) => (
                  <tr key={index}>
                    <td>{ficha.nome}</td>
                    <td>{ficha.categoria}</td>
                    <td>{ficha.doses}</td>
                    <td>{Number(ficha.custoTotal || 0).toFixed(2)} €</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Últimos movimentos de stock</h2>

        {movimentos.length === 0 ? (
          <p>Ainda não existem movimentos registados.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Produto</th>
                <th>Quantidade</th>
              </tr>
            </thead>

            <tbody>
              {movimentos.slice(0, 5).map((movimento, index) => (
                <tr key={movimento.id || index}>
                  <td>
                    {movimento.created_at
                      ? new Date(movimento.created_at).toLocaleDateString("pt-PT")
                      : movimento.data || "Sem data"}
                  </td>
                  <td>{movimento.tipo || "Movimento"}</td>
                  <td>{movimento.produto}</td>
                  <td>
                    {movimento.quantidade} {movimento.unidade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;