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
  Trash2,
  Leaf,
  CalendarDays,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

import { supabase } from "../supabaseClient";

function Dashboard({ onNavigate } = {}) {
  const [dadosIPSS, setDadosIPSS] = useState({});
  const [stocks, setStocks] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [ementas, setEmentas] = useState([]);
  const [dietas, setDietas] = useState([]);
  const [haccp, setHaccp] = useState([]);
  const [utentes, setUtentes] = useState([]);
  const [desperdicio, setDesperdicio] = useState([]);

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

    const { data: utentesData, error: utentesError } = await supabase
      .from("utentes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (utentesError) {
      console.warn("Não foi possível carregar utentes:", utentesError.message);
    }

    const { data: desperdicioData, error: desperdicioError } = await supabase
      .from("desperdicio_alimentar")
      .select("*")
      .eq("user_id", user.id)
      .order("data", { ascending: false });

    if (desperdicioError) {
      console.warn("Não foi possível carregar desperdício alimentar:", desperdicioError.message);
    }

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
    setUtentes(utentesData || []);
    setDesperdicio(desperdicioData || []);
    setMovimentos(movimentosData || []);

    await gerarNotificacoesAutomaticas(
      user.id,
      stocksData || [],
      haccpData || [],
      fichasFormatadas,
      ementasData || [],
      utentesData || []
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

  async function gerarNotificacoesAutomaticas(
    userId,
    stocksAtuais,
    haccpAtual,
    fichasAtuais,
    ementasAtuais,
    utentesAtuais
  ) {
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

    function obterNomeUtenteLocal(utente) {
      return (
        utente.nome ||
        utente.nome_completo ||
        utente.name ||
        utente.designacao ||
        "Utente"
      );
    }

    function obterDataNascimentoLocal(utente) {
      return (
        utente.data_nascimento ||
        utente.dataNascimento ||
        utente.nascimento ||
        utente.data_nasc ||
        utente.aniversario ||
        null
      );
    }

    function fazAnosAmanhaLocal(utente) {
      const dataNascimento = obterDataNascimentoLocal(utente);
      if (!dataNascimento) return false;

      const nascimento = new Date(dataNascimento);
      if (Number.isNaN(nascimento.getTime())) return false;

      const amanha = new Date(hojeLocal);
      amanha.setDate(amanha.getDate() + 1);

      return (
        nascimento.getDate() === amanha.getDate() &&
        nascimento.getMonth() === amanha.getMonth()
      );
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

    const aniversariosAmanha = (utentesAtuais || []).filter(fazAnosAmanhaLocal);
    const anoAtual = hojeLocal.getFullYear();

    for (const utente of aniversariosAmanha) {
      await criarNotificacaoSeNaoExiste({
        userId,
        titulo: "Aniversário de utente amanhã",
        mensagem: `${obterNomeUtenteLocal(utente)} faz anos amanhã. A cozinha pode preparar um bolo ou adaptar a ementa comemorativa.`,
        tipo: "aniversario",
        prioridade: "normal",
        origem: `aniversario_utente_${utente.id || obterNomeUtenteLocal(utente)}_${anoAtual}`,
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

      const ingredienteNormalizado = normalizarTexto(nomeIngrediente);

      return (
        nomeStock === ingredienteNormalizado ||
        nomeStock.includes(ingredienteNormalizado) ||
        ingredienteNormalizado.includes(nomeStock)
      );
    });
  }

  function diasAteValidade(data) {
    if (!data) return null;

    const validade = new Date(data);
    validade.setHours(0, 0, 0, 0);

    return Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
  }

  function obterNomeUtente(utente) {
    return (
      utente.nome ||
      utente.nome_completo ||
      utente.name ||
      utente.designacao ||
      "Utente"
    );
  }

  function obterDataNascimento(utente) {
    return (
      utente.data_nascimento ||
      utente.dataNascimento ||
      utente.nascimento ||
      utente.data_nasc ||
      utente.aniversario ||
      null
    );
  }

  function fazAnosAmanha(utente) {
    const dataNascimento = obterDataNascimento(utente);
    if (!dataNascimento) return false;

    const nascimento = new Date(dataNascimento);
    if (Number.isNaN(nascimento.getTime())) return false;

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    return (
      nascimento.getDate() === amanha.getDate() &&
      nascimento.getMonth() === amanha.getMonth()
    );
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

  const refeicoesGuardadas =
    JSON.parse(localStorage.getItem("ipssRefeicoes")) || {};

  const refeicoesPorValencia = {
    Lar: Number(refeicoesGuardadas.lar || 0),
    Creche: Number(refeicoesGuardadas.creche || 0),
    "Apoio Domiciliário": Number(refeicoesGuardadas.apoio || 0),
    Trabalhadores: Number(refeicoesGuardadas.trabalhadores || 0),
  };

  const totalRefeicoesValencias = Object.values(refeicoesPorValencia).reduce(
    (total, valor) => total + Number(valor || 0),
    0
  );

  const custoSemanalPlaneado = receitasPlaneadas.reduce(
    (total, ficha) => total + Number(ficha.custoTotal || 0),
    0
  );

  const custoMensalPlaneado = custoSemanalPlaneado * 4.33;

  const dadosFinanceirosValencias = Object.entries(refeicoesPorValencia).map(
    ([nome, refeicoes]) => {
      const percentagem =
        totalRefeicoesValencias > 0
          ? (Number(refeicoes || 0) / totalRefeicoesValencias) * 100
          : 0;

      const custoSemanal = custoSemanalPlaneado * (percentagem / 100);
      const custoMensal = custoMensalPlaneado * (percentagem / 100);
      const custoMedio =
        Number(refeicoes || 0) > 0 && receitasPlaneadas.length > 0
          ? custoSemanal / (Number(refeicoes || 0) * 7)
          : 0;

      return {
        nome,
        refeicoes: Number(refeicoes || 0),
        percentagem,
        custoSemanal,
        custoMensal,
        custoMedio,
      };
    }
  );

  const receitasMaisCaras = [...fichas]
    .sort((a, b) => Number(b.custoPorDose || 0) - Number(a.custoPorDose || 0))
    .slice(0, 5);

  const aniversariosAmanha = utentes.filter(fazAnosAmanha);

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

  const totalDesperdicio = desperdicio.reduce(
    (total, item) => total + Number(item.quantidade_desperdicada || 0),
    0
  );

  const custoDesperdicio = desperdicio.reduce(
    (total, item) => total + Number(item.custo_desperdicio || 0),
    0
  );

  const totalProduzidoDesperdicio = desperdicio.reduce(
    (total, item) => total + Number(item.quantidade_produzida || 0),
    0
  );

  const taxaDesperdicioExecutiva =
    totalProduzidoDesperdicio > 0
      ? (totalDesperdicio / totalProduzidoDesperdicio) * 100
      : 0;

  const desperdicioPorValencia = Object.values(
    desperdicio.reduce((acc, item) => {
      const chave = item.valencia || "Sem valência";

      if (!acc[chave]) {
        acc[chave] = {
          nome: chave,
          desperdicio: 0,
          custo: 0,
        };
      }

      acc[chave].desperdicio += Number(item.quantidade_desperdicada || 0);
      acc[chave].custo += Number(item.custo_desperdicio || 0);

      return acc;
    }, {})
  ).sort((a, b) => b.desperdicio - a.desperdicio);

  const evolucaoDesperdicio = Object.values(
    desperdicio.reduce((acc, item) => {
      const chave = item.data || "Sem data";

      if (!acc[chave]) {
        acc[chave] = {
          data: chave,
          desperdicio: 0,
          custo: 0,
        };
      }

      acc[chave].desperdicio += Number(item.quantidade_desperdicada || 0);
      acc[chave].custo += Number(item.custo_desperdicio || 0);

      return acc;
    }, {})
  )
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .slice(-8);

  const indiceRiscoExecutivo =
    produtosExpirados.length * 3 +
    produtosStockBaixo.length * 2 +
    produtosPrevisaoCritica.length * 2 +
    alertasHaccp * 3 +
    Math.round(taxaDesperdicioExecutiva);

  const estadoExecutivo =
    indiceRiscoExecutivo >= 20
      ? "Crítico"
      : indiceRiscoExecutivo >= 10
      ? "Atenção"
      : "Estável";

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

  if (taxaDesperdicioExecutiva >= 15) {
    recomendacoesIA.push({
      tipo: "sustentabilidade",
      titulo: "Desperdício alimentar elevado",
      texto: `A taxa global de desperdício é de ${taxaDesperdicioExecutiva.toFixed(1)}%. Recomenda-se rever capitações, aceitação das refeições e quantidades produzidas.`,
    });
  }

  if (aniversariosAmanha.length > 0) {
    recomendacoesIA.push({
      tipo: "aniversário",
      titulo: "Preparar bolo de aniversário",
      texto: `${aniversariosAmanha
        .map(obterNomeUtente)
        .join(", ")} faz(em) anos amanhã. Sugere-se articular com a cozinha a preparação de bolo ou alternativa adequada às dietas.`,
    });
  }

  if (recomendacoesIA.length === 0 && stocks.length > 0 && fichas.length > 0) {
    recomendacoesIA.push({
      tipo: "estável",
      titulo: "Operação equilibrada",
      texto: "Não foram identificados riscos críticos. A operação parece estável neste momento.",
    });
  }


  const diaAtual = diasSemana[(hoje.getDay() + 6) % 7];
  const ementaHoje = ementaAtual[diaAtual] || {};

  const refeicoesHoje = Object.entries(ementaHoje)
    .map(([refeicao, receitaId]) => {
      const ficha = fichas.find((item) => String(item.id) === String(receitaId));

      return {
        refeicao,
        ficha,
      };
    })
    .filter((item) => item.ficha);

  const utentesComNecessidades = utentes.filter((utente) => {
    const dieta = String(utente.dieta || "").trim();
    const alergias = String(utente.alergias || "").trim();
    const textura = String(utente.textura_alimentar || "").trim();

    return dieta || alergias || textura;
  });

  const alertasPrioritarios = [
    ...produtosExpirados.slice(0, 2).map((item) => ({
      tipo: "crítico",
      titulo: item.produto || item.nome || "Produto expirado",
      texto: "Validade ultrapassada. Verificar antes de qualquer utilização.",
      cor: "#dc2626",
    })),

    ...produtosAExpirar.slice(0, 2).map((item) => ({
      tipo: "validade",
      titulo: item.produto || item.nome || "Produto a expirar",
      texto: "Produto com validade próxima. Priorizar utilização ou validação.",
      cor: "#ea580c",
    })),

    ...produtosStockBaixo.slice(0, 2).map((item) => ({
      tipo: "stock",
      titulo: item.produto || item.nome || "Stock baixo",
      texto: "Produto abaixo ou no limite do stock mínimo.",
      cor: "#ca8a04",
    })),
  ].slice(0, 5);

  function abrirModulo(id, nome) {
    if (typeof onNavigate === "function") {
      onNavigate(id);
      return;
    }

    window.dispatchEvent(
      new CustomEvent("navegar-app", {
        detail: id,
      })
    );

    setMensagemOperacional(
      `Atalho selecionado: ${nome}. Se a página não abrir automaticamente, usa o menu lateral.`
    );
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
        <h2>
          <BrainCircuit size={22} /> Centro de Controlo Diário
        </h2>

        <p className="dashboard-subtitle">
          Visão rápida para orientar o trabalho da cozinha no dia de hoje.
        </p>

        <div className="dashboard-cards">
          <div className="dashboard-card destaque">
            <CalendarDays size={30} />
            <h3>Hoje</h3>
            <p>{refeicoesHoje.length}</p>
            <span>{diaAtual} · refeições planeadas</span>
          </div>

          <div className="dashboard-card">
            <Users size={30} />
            <h3>Necessidades especiais</h3>
            <p>{utentesComNecessidades.length}</p>
            <span>Dietas, alergias ou texturas</span>
          </div>

          <div className="dashboard-card">
            <AlertTriangle size={30} />
            <h3>Alertas críticos</h3>
            <p>{produtosExpirados.length + alertasHaccp}</p>
            <span>Validade e HACCP</span>
          </div>

          <div className="dashboard-card">
            <ShoppingCart size={30} />
            <h3>Compras urgentes</h3>
            <p>{comprasPendentes}</p>
            <span>Stock baixo ou expirado</span>
          </div>

          <div className="dashboard-card">
            <Trash2 size={30} />
            <h3>Desperdício</h3>
            <p>{taxaDesperdicioExecutiva.toFixed(1)}%</p>
            <span>Taxa acumulada</span>
          </div>
        </div>

        <div className="historico-grid">
          <div className="historico-card">
            <h3>Resumo operacional de hoje</h3>

            {refeicoesHoje.length === 0 ? (
              <p>Ainda não existem refeições planeadas para hoje.</p>
            ) : (
              refeicoesHoje.map((item) => (
                <p key={item.refeicao}>
                  <strong>{item.refeicao}:</strong> {item.ficha.nome}
                </p>
              ))
            )}
          </div>

          <div className="historico-card">
            <h3>Alertas prioritários</h3>

            {alertasPrioritarios.length === 0 ? (
              <p>Não existem alertas prioritários neste momento.</p>
            ) : (
              alertasPrioritarios.map((alerta, index) => (
                <div
                  key={index}
                  style={{
                    borderLeft: `5px solid ${alerta.cor}`,
                    paddingLeft: "12px",
                    marginBottom: "14px",
                  }}
                >
                  <strong>{alerta.titulo}</strong>
                  <p style={{ marginTop: "4px" }}>{alerta.texto}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "18px",
          }}
        >
          <button
            className="botao-principal"
            onClick={() => abrirModulo("mapa-producao", "Mapa Diário")}
          >
            Abrir mapa diário
          </button>

          <button
            className="botao-secundario"
            onClick={() => abrirModulo("producoes", "Produções")}
          >
            Registar produção
          </button>

          <button
            className="botao-secundario"
            onClick={() =>
              abrirModulo("compras-inteligentes", "Compras Inteligentes")
            }
          >
            Criar compras
          </button>

          <button
            className="botao-secundario"
            onClick={() => abrirModulo("desperdicio", "Desperdício")}
          >
            Registar desperdício
          </button>
        </div>
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

        <div className="historico-grid">
          <div className="historico-card">
            <h3>Estado executivo da operação</h3>
            <p>
              <strong>Estado global:</strong> {estadoExecutivo}
            </p>
            <p>
              <strong>Índice de risco:</strong> {indiceRiscoExecutivo}
            </p>
            <p>
              Este indicador combina stock baixo, produtos expirados, previsão
              de ruturas, alertas HACCP e taxa de desperdício alimentar.
            </p>
          </div>

          <div className="historico-card">
            <h3>Síntese para direção</h3>
            <p>
              Custo semanal planeado: <strong>{custoSemanalPlaneado.toFixed(2)} €</strong>
            </p>
            <p>
              Custo mensal previsto: <strong>{custoMensalPlaneado.toFixed(2)} €</strong>
            </p>
            <p>
              Desperdício acumulado: <strong>{totalDesperdicio.toFixed(1)} kg</strong>
            </p>
            <p>
              Custo do desperdício: <strong>{custoDesperdicio.toFixed(2)} €</strong>
            </p>
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
          <Euro size={22} /> Análise Financeira por Valência
        </h2>

        <p className="dashboard-subtitle">
          Distribuição estimada dos custos reais das ementas planeadas pelas
          respostas sociais da instituição.
        </p>

        <div className="dashboard-cards">
          <div className="dashboard-card destaque">
            <Euro size={30} />
            <h3>Custo semanal planeado</h3>
            <p>{custoSemanalPlaneado.toFixed(2)} €</p>
            <span>Com base na ementa atual</span>
          </div>

          <div className="dashboard-card">
            <TrendingUp size={30} />
            <h3>Custo mensal previsto</h3>
            <p>{custoMensalPlaneado.toFixed(2)} €</p>
            <span>Estimativa × 4,33 semanas</span>
          </div>

          <div className="dashboard-card">
            <Users size={30} />
            <h3>Refeições por dia</h3>
            <p>{totalRefeicoesValencias}</p>
            <span>Somatório das valências</span>
          </div>

          <div className="dashboard-card">
            <ClipboardList size={30} />
            <h3>Receitas planeadas</h3>
            <p>{receitasPlaneadas.length}</p>
            <span>Na ementa semanal</span>
          </div>
        </div>

        <div className="historico-grid">
          <div className="historico-card">
            <h3>Distribuição financeira</h3>

            {dadosFinanceirosValencias.every((item) => item.refeicoes === 0) ? (
              <p>
                Ainda não existem refeições por valência registadas. Atualiza a
                área das refeições/capitações para ativar esta análise.
              </p>
            ) : (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={dadosFinanceirosValencias}
                      dataKey="custoSemanal"
                      nameKey="nome"
                      outerRadius={95}
                      label={({ nome, percentagem }) =>
                        `${nome} ${percentagem.toFixed(0)}%`
                      }
                    >
                      {dadosFinanceirosValencias.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={["#2563eb", "#16a34a", "#f59e0b", "#9333ea"][index % 4]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `${Number(value || 0).toFixed(2)} €`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="historico-card">
            <h3>Receitas com maior custo por dose</h3>

            {receitasMaisCaras.length === 0 ? (
              <p>Ainda não existem fichas técnicas com custos calculados.</p>
            ) : (
              receitasMaisCaras.map((ficha) => (
                <p key={ficha.id}>
                  <strong>{ficha.nome}:</strong>{" "}
                  {Number(ficha.custoPorDose || 0).toFixed(2)} €/dose
                </p>
              ))
            )}
          </div>
        </div>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Valência</th>
              <th>Refeições/dia</th>
              <th>Custo semanal</th>
              <th>Custo mensal</th>
              <th>Custo médio/refeição</th>
              <th>Peso</th>
            </tr>
          </thead>

          <tbody>
            {dadosFinanceirosValencias.map((item) => (
              <tr key={item.nome}>
                <td>{item.nome}</td>
                <td>{item.refeicoes}</td>
                <td>{item.custoSemanal.toFixed(2)} €</td>
                <td>{item.custoMensal.toFixed(2)} €</td>
                <td>{item.custoMedio.toFixed(2)} €</td>
                <td>{item.percentagem.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dashboard-section">
        <h2>
          <Leaf size={22} /> Sustentabilidade e Desperdício
        </h2>

        <p className="dashboard-subtitle">
          Indicadores executivos de desperdício alimentar, custo perdido e
          impacto por valência.
        </p>

        <div className="dashboard-cards">
          <div className="dashboard-card destaque">
            <Trash2 size={30} />
            <h3>Desperdício total</h3>
            <p>{totalDesperdicio.toFixed(1)} kg</p>
            <span>Registos acumulados</span>
          </div>

          <div className="dashboard-card">
            <Euro size={30} />
            <h3>Custo perdido</h3>
            <p>{custoDesperdicio.toFixed(2)} €</p>
            <span>Estimativa financeira</span>
          </div>

          <div className="dashboard-card">
            <TrendingUp size={30} />
            <h3>Taxa desperdício</h3>
            <p>{taxaDesperdicioExecutiva.toFixed(1)}%</p>
            <span>Face ao produzido</span>
          </div>

          <div className="dashboard-card">
            <ClipboardList size={30} />
            <h3>Registos</h3>
            <p>{desperdicio.length}</p>
            <span>Desperdício alimentar</span>
          </div>
        </div>

        <div className="historico-grid">
          <div className="historico-card">
            <h3>Desperdício por valência</h3>

            {desperdicioPorValencia.length === 0 ? (
              <p>Ainda não existem registos de desperdício alimentar.</p>
            ) : (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={desperdicioPorValencia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="desperdicio" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="historico-card">
            <h3>Evolução do desperdício</h3>

            {evolucaoDesperdicio.length === 0 ? (
              <p>Ainda não existem dados suficientes para evolução temporal.</p>
            ) : (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={evolucaoDesperdicio}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="desperdicio"
                      stroke="#145c2a"
                      strokeWidth={4}
                    />
                    <Line
                      type="monotone"
                      dataKey="custo"
                      stroke="#dc2626"
                      strokeWidth={4}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>
          <Users size={22} /> Alertas de Aniversário
        </h2>

        <p className="dashboard-subtitle">
          Aviso antecipado para a cozinha preparar bolo ou alternativa adequada
          às dietas dos utentes.
        </p>

        {aniversariosAmanha.length === 0 ? (
          <p>Não existem aniversários de utentes previstos para amanhã.</p>
        ) : (
          <div className="historico-grid">
            {aniversariosAmanha.map((utente) => (
              <div className="historico-card" key={utente.id || obterNomeUtente(utente)}>
                <h3>🎂 {obterNomeUtente(utente)}</h3>
                <p>
                  <strong>Data de nascimento:</strong>{" "}
                  {new Date(obterDataNascimento(utente)).toLocaleDateString("pt-PT")}
                </p>
                <p>
                  Preparar bolo de aniversário ou alternativa compatível com a
                  dieta/alergénios registados.
                </p>
              </div>
            ))}
          </div>
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