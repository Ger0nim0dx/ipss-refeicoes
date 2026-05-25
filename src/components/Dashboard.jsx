import { useEffect, useState } from "react";

import {
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Euro,
  ClipboardList,
  Clock3,
  ShieldAlert,
  CheckCircle2,
  Factory,
  BrainCircuit,
  Lightbulb,
  Users,
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

    const { data: dadosData } = await supabase
      .from("dados_ipss")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: stocksData } = await supabase
      .from("stocks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: fichasData } = await supabase
      .from("fichas_tecnicas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: ementasData } = await supabase
      .from("ementas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: dietasData } = await supabase
      .from("dietas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: haccpData } = await supabase
      .from("haccp")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: movimentosData } = await supabase
      .from("movimentos_stock")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const fichasFormatadas = (fichasData || []).map((ficha) => ({
      id: ficha.id,
      nome: ficha.nome,
      categoria: ficha.categoria,
      doses: ficha.doses,
      ...ficha.dados,
    }));

    setDadosIPSS(dadosData || {});
    setStocks(stocksData || []);
    setFichas(fichasFormatadas);
    setEmentas(ementasData || []);
    setDietas(dietasData || []);
    setHaccp(haccpData || []);
    setMovimentos(movimentosData || []);

    await gerarNotificacoesAutomaticas(
      user.id,
      stocksData || [],
      haccpData || [],
      fichasFormatadas,
      ementasData || []
    );
  }

  async function criarNotificacaoSeNaoExiste({
    userId,
    titulo,
    mensagem,
    tipo = "info",
    prioridade = "normal",
    origem,
  }) {
    const { data: existente, error: erroConsulta } = await supabase
      .from("notificacoes")
      .select("id")
      .eq("user_id", userId)
      .eq("origem", origem)
      .eq("lida", false)
      .maybeSingle();

    if (erroConsulta) {
      console.error(erroConsulta);
      return;
    }

    if (existente) return;

    const { error } = await supabase.from("notificacoes").insert([
      {
        user_id: userId,
        titulo,
        mensagem,
        tipo,
        prioridade,
        origem,
        lida: false,
      },
    ]);

    if (error) console.error(error);
  }

  async function gerarNotificacoesAutomaticas(userId, stocksAtuais, haccpAtual, fichasAtuais, ementasAtuais) {
    const hojeLocal = new Date();
    hojeLocal.setHours(0, 0, 0, 0);

    function diasAteValidadeLocal(data) {
      if (!data) return null;

      const validade = new Date(data);
      validade.setHours(0, 0, 0, 0);

      return Math.ceil((validade - hojeLocal) / (1000 * 60 * 60 * 24));
    }

    function normalizarLocal(texto) {
      return String(texto || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }

    function converterParaGramasLocal(quantidade, unidade) {
      const valor = Number(quantidade) || 0;

      if (unidade === "kg") return valor * 1000;
      if (unidade === "g") return valor;
      if (unidade === "L") return valor * 1000;
      if (unidade === "ml") return valor;

      return valor;
    }

    function encontrarProdutoStockLocal(nomeIngrediente) {
      return stocksAtuais.find((item) => {
        const nomeStock = normalizarLocal(item.produto || item.nome);
        const nomeIngredienteNormalizado = normalizarLocal(nomeIngrediente);

        return (
          nomeStock === nomeIngredienteNormalizado ||
          nomeStock.includes(nomeIngredienteNormalizado) ||
          nomeIngredienteNormalizado.includes(nomeStock)
        );
      });
    }

    const stockBaixo = stocksAtuais.filter(
      (item) =>
        Number(item.quantidade || 0) <=
        Number(item.stock_minimo ?? item.stockMinimo ?? 0)
    );

    const expirados = stocksAtuais.filter((item) => {
      const dias = diasAteValidadeLocal(item.validade);
      return dias !== null && dias < 0;
    });

    const aExpirar = stocksAtuais.filter((item) => {
      const dias = diasAteValidadeLocal(item.validade);
      return dias !== null && dias >= 0 && dias <= 7;
    });

    const alertasHaccpAtivos = haccpAtual.filter(
      (item) =>
        item.tipo_registo === "nao_conformidade" ||
        item.estado === "Crítico" ||
        item.estado === "Não conforme"
    );

    const ementaAtualLocal = ementasAtuais[0]?.dados || {};
    const receitasPlaneadasLocal = [];

    Object.values(ementaAtualLocal).forEach((refeicoesDia) => {
      Object.values(refeicoesDia || {}).forEach((receitaId) => {
        const ficha = fichasAtuais.find(
          (item) => String(item.id) === String(receitaId)
        );

        if (ficha) receitasPlaneadasLocal.push(ficha);
      });
    });

    const ingredientesPrevistosLocal = {};

    receitasPlaneadasLocal.forEach((ficha) => {
      ficha.ingredientes?.forEach((ingrediente) => {
        const chave = normalizarLocal(ingrediente.nome);

        if (!ingredientesPrevistosLocal[chave]) {
          ingredientesPrevistosLocal[chave] = {
            nome: ingrediente.nome,
            quantidade: 0,
          };
        }

        ingredientesPrevistosLocal[chave].quantidade += Number(
          ingrediente.quantidade || 0
        );
      });
    });

    const previsaoCritica = Object.values(ingredientesPrevistosLocal).filter(
      (ingrediente) => {
        const produtoStock = encontrarProdutoStockLocal(ingrediente.nome);

        if (!produtoStock) return true;

        const stockAtual = converterParaGramasLocal(
          produtoStock.quantidade,
          produtoStock.unidade
        );

        const stockMinimo = converterParaGramasLocal(
          produtoStock.stock_minimo || produtoStock.stockMinimo || 0,
          produtoStock.unidade
        );

        const stockDepois = stockAtual - ingrediente.quantidade;

        return stockDepois < 0 || stockDepois <= stockMinimo;
      }
    );

    if (stockBaixo.length > 0) {
      await criarNotificacaoSeNaoExiste({
        userId,
        titulo: "Stock baixo",
        mensagem: `Existem ${stockBaixo.length} produto(s) abaixo ou no limite do stock mínimo.`,
        tipo: "stock",
        prioridade: "alta",
        origem: "stock_baixo",
      });
    }

    if (expirados.length > 0) {
      await criarNotificacaoSeNaoExiste({
        userId,
        titulo: "Produtos expirados",
        mensagem: `Existem ${expirados.length} produto(s) com validade ultrapassada. Devem ser verificados antes de utilização.`,
        tipo: "validade",
        prioridade: "crítica",
        origem: "produtos_expirados",
      });
    }

    if (aExpirar.length > 0) {
      await criarNotificacaoSeNaoExiste({
        userId,
        titulo: "Produtos a expirar",
        mensagem: `Existem ${aExpirar.length} produto(s) a expirar nos próximos 7 dias.`,
        tipo: "validade",
        prioridade: "alta",
        origem: "produtos_a_expirar",
      });
    }

    if (alertasHaccpAtivos.length > 0) {
      await criarNotificacaoSeNaoExiste({
        userId,
        titulo: "Alerta HACCP",
        mensagem: `Existem ${alertasHaccpAtivos.length} registo(s) HACCP críticos ou não conformes.`,
        tipo: "haccp",
        prioridade: "crítica",
        origem: "alertas_haccp",
      });
    }

    if (previsaoCritica.length > 0) {
      await criarNotificacaoSeNaoExiste({
        userId,
        titulo: "Previsão de stock crítico",
        mensagem: `Após a ementa planeada, ${previsaoCritica.length} ingrediente(s) poderão ficar abaixo do mínimo ou em falta.`,
        tipo: "previsao",
        prioridade: "alta",
        origem: "previsao_stock_critico",
      });
    }
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
      const nomeIngrediente = normalizarTexto(nomeIngrediente);

      return (
        nomeStock === nomeIngrediente ||
        nomeStock.includes(nomeIngrediente) ||
        nomeIngrediente.includes(nomeStock)
      );
    });
  }

  function diasAteValidade(data) {
    if (!data) return null;

    const validade = new Date(data);
    validade.setHours(0, 0, 0, 0);

    return Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
  }

  function toggleDia(dia) {
    setDiasSelecionados((atuais) =>
      atuais.includes(dia)
        ? atuais.filter((item) => item !== dia)
        : [...atuais, dia]
    );
  }

  const produtosStockBaixo = stocks.filter(
    (item) =>
      Number(item.quantidade || 0) <=
      Number(item.stock_minimo ?? item.stockMinimo ?? 0)
  );

  const produtosExpirados = stocks.filter((item) => {
    const dias = diasAteValidade(item.validade);
    return dias !== null && dias < 0;
  });

  const produtosAExpirar = stocks.filter((item) => {
    const dias = diasAteValidade(item.validade);
    return dias !== null && dias >= 0 && dias <= 7;
  });

  const alertasHaccp = haccp.filter(
    (item) =>
      item.tipo_registo === "nao_conformidade" ||
      item.estado === "Crítico" ||
      item.estado === "Não conforme"
  ).length;

  const totalEntradas = movimentos.filter((m) =>
    String(m.tipo || "").toLowerCase().includes("entrada")
  ).length;

  const totalSaidas = movimentos.filter((m) =>
    String(m.tipo || "").toLowerCase().includes("produção") ||
    String(m.tipo || "").toLowerCase().includes("saída")
  ).length;

  const custoTotalReceitas = fichas.reduce(
    (total, ficha) => total + Number(ficha.custoTotal || 0),
    0
  );

  const custoMedioReceita =
    fichas.length > 0 ? custoTotalReceitas / fichas.length : 0;

  const numeroUtentes = Number(dadosIPSS.numeroutentes || 0);
  const numeroRefeicoesDia = Number(dadosIPSS.numerorefeicoesdia || 0);

  const custoPorUtente =
    numeroUtentes > 0 ? custoTotalReceitas / numeroUtentes : 0;

  const custoPorRefeicao =
    numeroRefeicoesDia > 0 ? custoTotalReceitas / numeroRefeicoesDia : 0;

  const comprasPendentes = produtosStockBaixo.length + produtosExpirados.length;

  const eficienciaOperacional =
    stocks.length > 0
      ? Math.round(((stocks.length - produtosStockBaixo.length) / stocks.length) * 100)
      : 100;

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
        stockDepois,
        stockMinimo,
        produtoStock,
        emFalta: !produtoStock || stockDepois < 0,
        ficaraCritico: produtoStock && stockDepois <= stockMinimo,
      };
    }
  );

  const produtosPrevisaoCritica = previsaoStock.filter(
    (item) => item.emFalta || item.ficaraCritico
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
    (produto) => !produtosAExpirarNaEmenta.some((item) => item.id === produto.id)
  );

  const topProdutosCriticos = [...produtosStockBaixo]
    .sort((a, b) => Number(a.quantidade || 0) - Number(b.quantidade || 0))
    .slice(0, 5);

  const dadosGrafico = stocks.slice(0, 8).map((item) => ({
    nome: item.produto || item.nome,
    quantidade: Number(item.quantidade || 0),
  }));

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

  if (recomendacoesIA.length === 0 && stocks.length > 0 && fichas.length > 0) {
    recomendacoesIA.push({
      tipo: "estável",
      titulo: "Operação equilibrada",
      texto: "Não foram identificados riscos críticos. A operação parece estável neste momento.",
    });
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
      return;
    }

    const user = userData.user;
    const ingredientesTotais = {};

    diasSelecionados.forEach((dia) => {
      const refeicoesDia = ementaAtual[dia];

      if (!refeicoesDia) return;

      Object.values(refeicoesDia).forEach((receitaId) => {
        const ficha = fichas.find((item) => String(item.id) === String(receitaId));

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
            <p>{dadosIPSS.nomeinstituicao || "Não preenchido"}</p>
          </div>

          <div className="summary-box">
            <strong>Localidade</strong>
            <p>{dadosIPSS.localidade || "Não preenchido"}</p>
          </div>

          <div className="summary-box">
            <strong>Responsável</strong>
            <p>{dadosIPSS.responsavelcozinha || "Não preenchido"}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>
          <Euro size={22} /> Dashboard Executivo
        </h2>

        <p className="dashboard-subtitle">
          Indicadores estratégicos e financeiros da operação alimentar.
        </p>

        <div className="dashboard-cards">
          <div className="dashboard-card destaque">
            <Euro size={30} />
            <h3>Custo por utente</h3>
            <p>{custoPorUtente.toFixed(2)} €</p>
            <span>Com base nos dados atuais</span>
          </div>

          <div className="dashboard-card">
            <ClipboardList size={30} />
            <h3>Custo por refeição</h3>
            <p>{custoPorRefeicao.toFixed(2)} €</p>
            <span>Média operacional</span>
          </div>

          <div className="dashboard-card">
            <Users size={30} />
            <h3>Utentes</h3>
            <p>{numeroUtentes}</p>
            <span>Registados na IPSS</span>
          </div>

          <div className="dashboard-card">
            <Factory size={30} />
            <h3>Refeições/dia</h3>
            <p>{numeroRefeicoesDia}</p>
            <span>Capacidade operacional</span>
          </div>

          <div className="dashboard-card">
            <CheckCircle2 size={30} />
            <h3>Eficiência</h3>
            <p>{eficienciaOperacional}%</p>
            <span>Produtos acima do mínimo</span>
          </div>

          <div className="dashboard-card">
            <ShoppingCart size={30} />
            <h3>Compras</h3>
            <p>{comprasPendentes}</p>
            <span>Pendentes/críticas</span>
          </div>
        </div>

        <h3 style={{ marginTop: "25px" }}>Produtos mais críticos</h3>

        {topProdutosCriticos.length === 0 ? (
          <p>Não existem produtos críticos neste momento.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Stock mínimo</th>
              </tr>
            </thead>

            <tbody>
              {topProdutosCriticos.map((produto, index) => (
                <tr key={index}>
                  <td>{produto.produto || produto.nome}</td>
                  <td>
                    {produto.quantidade} {produto.unidade}
                  </td>
                  <td>
                    {produto.stock_minimo || produto.stockMinimo || 0}{" "}
                    {produto.unidade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboard-section">
        <h2>
          <BrainCircuit size={22} /> IA Operacional Inteligente
        </h2>

        <p className="dashboard-subtitle">
          Recomendações automáticas com base em stock, validade, ementa e HACCP.
        </p>

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
      </div>

      <div className="dashboard-section">
        <h2>
          <Factory size={22} /> Centro Operacional
        </h2>

        <p className="dashboard-subtitle">
          Executa a produção real a partir da ementa semanal.
        </p>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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

        <button
          className="botao-principal"
          onClick={executarProducaoSelecionada}
          style={{ marginTop: "15px" }}
        >
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
          <span>Em stock</span>
        </div>

        <div className="dashboard-card">
          <ClipboardList size={32} />
          <h3>Ementas</h3>
          <p>{ementas.length}</p>
          <span>Planeamentos</span>
        </div>

        <div className="dashboard-card">
          <CheckCircle2 size={32} />
          <h3>Dietas</h3>
          <p>{dietas.length}</p>
          <span>Dietas especiais</span>
        </div>

        <div className="dashboard-card">
          <ShieldAlert size={32} />
          <h3>HACCP</h3>
          <p>{alertasHaccp}</p>
          <span>Alertas</span>
        </div>

        <div className="dashboard-card">
          <AlertTriangle size={32} />
          <h3>Stock baixo</h3>
          <p>{produtosStockBaixo.length}</p>
          <span>Produtos críticos</span>
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
          <span>Movimentos</span>
        </div>

        <div className="dashboard-card">
          <Package size={32} />
          <h3>Saídas</h3>
          <p>{totalSaidas}</p>
          <span>Movimentos</span>
        </div>

        <div className="dashboard-card">
          <Euro size={32} />
          <h3>Custo médio</h3>
          <p>{custoMedioReceita.toFixed(2)} €</p>
          <span>Por receita</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Previsão de Stock Após Ementa</h2>

        {produtosPrevisaoCritica.length === 0 ? (
          <p className="success-message">
            <CheckCircle2 size={18} /> Não foram previstos ingredientes críticos.
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
                      ? new Date(movimento.created_at).toLocaleDateString(
                          "pt-PT"
                        )
                      : "Sem data"}
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