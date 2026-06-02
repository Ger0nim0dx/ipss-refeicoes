import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "../supabaseClient";

export default function Ementa() {
  const [fichas, setFichas] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [utentes, setUtentes] = useState([]);

  const [ementa, setEmenta] = useState({});
  const [modoIA, setModoIA] = useState("equilibrada");
  const [relatorioIA, setRelatorioIA] = useState("");

  const refeicoesGuardadas =
    JSON.parse(localStorage.getItem("ipssRefeicoes")) || {};

  const valencias = [
    {
      id: "lar",
      nome: "Lar",
      refeicoesDia: Number(refeicoesGuardadas.lar || 0),
    },
    {
      id: "creche",
      nome: "Creche",
      refeicoesDia: Number(refeicoesGuardadas.creche || 0),
    },
    {
      id: "apoio",
      nome: "Apoio Domiciliário",
      refeicoesDia: Number(refeicoesGuardadas.apoio || 0),
    },
    {
      id: "trabalhadores",
      nome: "Trabalhadores",
      refeicoesDia: Number(refeicoesGuardadas.trabalhadores || 0),
    },
  ];

  const totalRefeicoesDia = valencias.reduce(
    (total, item) => total + item.refeicoesDia,
    0
  );

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    await carregarFichas();
    await carregarStocks();
    await carregarUtentes();
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

  async function carregarUtentes() {
    const { data, error } = await supabase
      .from("utentes")
      .select("*")
      .eq("ativo", true);

    if (error) {
      console.error(error);
      return;
    }

    setUtentes(data || []);
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

  function receitaTemAlergenio(ficha, alergia) {
    const texto = normalizarTexto(
      `
      ${ficha?.alergenios || ""}
      ${ficha?.nome || ""}
      ${ficha?.categoria || ""}
      ${(ficha?.ingredientes || []).map((item) => item.nome).join(" ")}
      `
    );

    return texto.includes(normalizarTexto(alergia));
  }

  function obterAlertasReceita(ficha) {
    if (!ficha) return [];

    const alertas = [];

    utentes.forEach((utente) => {
      const nomeUtente = utente.nome || "Utente";
      const alergias = normalizarTexto(utente.alergias || "");
      const dieta = normalizarTexto(utente.dieta || "");
      const textura = normalizarTexto(utente.textura_alimentar || "");

      if (alergias.includes("leite") && receitaTemAlergenio(ficha, "leite")) {
        alertas.push(`⚠ ${nomeUtente} tem alergia/intolerância ao leite`);
      }

      if (alergias.includes("lactose") && receitaTemAlergenio(ficha, "leite")) {
        alertas.push(`⚠ ${nomeUtente} necessita alimentação sem lactose`);
      }

      if (alergias.includes("ovo") && receitaTemAlergenio(ficha, "ovo")) {
        alertas.push(`⚠ ${nomeUtente} tem alergia ao ovo`);
      }

      if (
        (alergias.includes("gluten") || dieta.includes("gluten")) &&
        receitaTemAlergenio(ficha, "glúten")
      ) {
        alertas.push(`⚠ ${nomeUtente} necessita alimentação sem glúten`);
      }

      if (alergias.includes("peixe") && receitaTemAlergenio(ficha, "peixe")) {
        alertas.push(`⚠ ${nomeUtente} tem alergia ao peixe`);
      }

      if (
        (alergias.includes("marisco") || alergias.includes("crustaceos")) &&
        (receitaTemAlergenio(ficha, "marisco") ||
          receitaTemAlergenio(ficha, "crustáceos") ||
          receitaTemAlergenio(ficha, "moluscos"))
      ) {
        alertas.push(`⚠ ${nomeUtente} tem alergia/intolerância a marisco`);
      }

      if (alergias.includes("soja") && receitaTemAlergenio(ficha, "soja")) {
        alertas.push(`⚠ ${nomeUtente} tem alergia/intolerância à soja`);
      }

      if (
        (alergias.includes("frutos secos") ||
          alergias.includes("frutos de casca")) &&
        receitaTemAlergenio(ficha, "frutos")
      ) {
        alertas.push(`⚠ ${nomeUtente} tem alergia a frutos de casca rija`);
      }

      if (dieta.includes("diabet")) {
        alertas.push(`ℹ ${nomeUtente} tem dieta diabética`);
      }

      if (dieta.includes("hipossod") || dieta.includes("sem sal")) {
        alertas.push(`ℹ ${nomeUtente} necessita dieta com restrição de sal`);
      }

      if (dieta.includes("hiperprote")) {
        alertas.push(`ℹ ${nomeUtente} necessita reforço hiperproteico`);
      }

      if (dieta.includes("hipercal")) {
        alertas.push(`ℹ ${nomeUtente} necessita reforço hipercalórico`);
      }

      if (textura.includes("triturada")) {
        alertas.push(`⚠ ${nomeUtente} necessita textura triturada`);
      }

      if (textura.includes("pastosa")) {
        alertas.push(`⚠ ${nomeUtente} necessita textura pastosa`);
      }

      if (textura.includes("espessada")) {
        alertas.push(`⚠ ${nomeUtente} necessita líquidos espessados`);
      }

      if (textura.includes("liquida")) {
        alertas.push(`⚠ ${nomeUtente} necessita dieta líquida`);
      }
    });

    return [...new Set(alertas)];
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

  function obterCustoPorDose(ficha) {
    if (!ficha) return 0;

    const custoPorDose = Number(ficha.custoPorDose || 0);

    if (custoPorDose > 0) return custoPorDose;

    const custoTotal = Number(ficha.custoTotal || 0);
    const doses = Number(ficha.doses || 0);

    return doses > 0 ? custoTotal / doses : 0;
  }

  function receitaAdequada(ficha, refeicao) {
    if (!ficha) return false;

    const momentoFicha = normalizarTexto(
      ficha.momentoRefeicao || ficha.momento || ""
    );

    const momentoAtual = normalizarTexto(refeicao);

    return momentoFicha === momentoAtual;
  }

  function obterFichasPorRefeicao(refeicao) {
    return fichas.filter((ficha) => receitaAdequada(ficha, refeicao));
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


  function obterAlternativaReceita(fichaAtual, refeicaoAtual) {
    if (!fichaAtual) return null;

    const alertasTexto = normalizarTexto(obterAlertasReceita(fichaAtual).join(" "));

    const precisaSemLactose =
      alertasTexto.includes("lactose") ||
      alertasTexto.includes("leite");

    const precisaSemGluten =
      alertasTexto.includes("gluten") ||
      alertasTexto.includes("gluten");

    const precisaSemOvo = alertasTexto.includes("ovo");
    const precisaSemPeixe = alertasTexto.includes("peixe");
    const precisaSemMarisco = alertasTexto.includes("marisco");
    const precisaSemSoja = alertasTexto.includes("soja");
    const precisaSemFrutosSecos = alertasTexto.includes("frutos");
    const precisaDiabetica = alertasTexto.includes("diabet");
    const precisaHipossodica =
      alertasTexto.includes("hipossod") || alertasTexto.includes("sem sal");
    const precisaTriturada = alertasTexto.includes("triturada");
    const precisaPastosa = alertasTexto.includes("pastosa");
    const precisaLiquidosEspessados = alertasTexto.includes("espessados");
    const precisaLiquida = alertasTexto.includes("liquida");

    function textoFicha(ficha) {
      return normalizarTexto(`
        ${ficha?.nome || ""}
        ${ficha?.categoria || ""}
        ${ficha?.tipo || ""}
        ${ficha?.alergenios || ""}
        ${ficha?.modoPreparacao || ""}
        ${ficha?.observacoes || ""}
        ${(ficha?.ingredientes || []).map((item) => item.nome).join(" ")}
      `);
    }

    function contemAlgum(texto, termos) {
      return termos.some((termo) => texto.includes(normalizarTexto(termo)));
    }

    function eCompativel(ficha) {
      const texto = textoFicha(ficha);

      if (String(ficha.id) === String(fichaAtual.id)) return false;

      if (precisaSemLactose && contemAlgum(texto, ["leite", "lactose", "iogurte", "queijo", "manteiga", "natas", "bechamel"])) {
        return false;
      }

      if (precisaSemGluten && contemAlgum(texto, ["gluten", "glúten", "pao", "pão", "massa", "farinha", "bolacha", "cereais", "torrada"])) {
        return false;
      }

      if (precisaSemOvo && contemAlgum(texto, ["ovo", "ovos", "gema", "gemas", "omelete"])) {
        return false;
      }

      if (precisaSemPeixe && contemAlgum(texto, ["peixe", "pescada", "bacalhau", "atum", "douradinhos"])) {
        return false;
      }

      if (precisaSemMarisco && contemAlgum(texto, ["marisco", "crustaceos", "crustáceos", "moluscos", "camarao", "camarão"])) {
        return false;
      }

      if (precisaSemSoja && contemAlgum(texto, ["soja"])) {
        return false;
      }

      if (precisaSemFrutosSecos && contemAlgum(texto, ["amendoa", "amêndoa", "noz", "avelã", "frutos secos", "frutos de casca"])) {
        return false;
      }

      if (precisaDiabetica && contemAlgum(texto, ["acucar", "açúcar", "mel", "compota", "doce", "bolo", "leite creme", "arroz doce", "gelatina"])) {
        return false;
      }

      if (precisaHipossodica && contemAlgum(texto, ["chourico", "chouriço", "alheira", "fiambre", "enchido", "salsicha", "bacalhau salgado"])) {
        return false;
      }

      if (precisaTriturada && !contemAlgum(texto, ["triturada", "triturado", "creme", "sopa", "pure", "puré", "papa"])) {
        return false;
      }

      if (precisaPastosa && !contemAlgum(texto, ["pastosa", "creme", "pure", "puré", "papa", "sopa"])) {
        return false;
      }

      if (precisaLiquida && !contemAlgum(texto, ["liquida", "líquida", "creme", "sopa", "caldo", "batido", "leite"])) {
        return false;
      }

      if (precisaLiquidosEspessados && !contemAlgum(texto, ["espessado", "creme", "papa"])) {
        return false;
      }

      return true;
    }

    const candidatas = obterFichasPorRefeicao(refeicaoAtual)
      .filter(eCompativel)
      .map((ficha) => ({
        ficha,
        alertas: obterAlertasReceita(ficha).length,
        custo: obterCustoPorDose(ficha),
        stock: calcularDisponibilidadeStock(ficha).percentagem,
      }))
      .sort((a, b) => {
        if (a.alertas !== b.alertas) return a.alertas - b.alertas;
        if (b.stock !== a.stock) return b.stock - a.stock;
        return a.custo - b.custo;
      });

    return candidatas[0]?.ficha || null;
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
        const receitasOrdenadas = obterFichasPorRefeicao(refeicao).sort(
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

        if (!escolhida) {
          novaEmenta[dia][refeicao] = "";
          explicacoes.push({
            dia,
            refeicao,
            receita: "Sem ficha técnica disponível",
            grupo: "-",
            custo: 0,
            kcal: 0,
            stock: 0,
            emFalta: [],
            aExpirar: [],
          });
          return;
        }

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
        const receitasOrdenadas = obterFichasPorRefeicao(refeicao).sort(
          (a, b) =>
            pontuarReceita(b, refeicao, usadasSemana, usadasDia) -
            pontuarReceita(a, refeicao, usadasSemana, usadasDia)
        );

        const escolhida = receitasOrdenadas[0];

        if (!escolhida) {
          novaEmenta[dia][refeicao] = "";
          return;
        }

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

  const numeroDiasComEmenta = [
    ...new Set(receitasPlaneadas.map((item) => item.dia)),
  ].length;

  const custoRealSemanalPorValencia = valencias.map((valencia) => {
    const custoSemanalValencia = receitasPlaneadas.reduce((total, item) => {
      const custoDose = obterCustoPorDose(item.ficha);
      return total + custoDose * valencia.refeicoesDia;
    }, 0);

    const refeicoesSemanaValencia =
      valencia.refeicoesDia * receitasPlaneadas.length;

    const custoMensalEstimado = custoSemanalValencia * 4;
    const peso =
      custoSemanal > 0 ? (custoSemanalValencia / custoSemanal) * 100 : 0;

    return {
      ...valencia,
      refeicoesSemana: refeicoesSemanaValencia,
      custoSemanal: custoSemanalValencia,
      custoMensal: custoMensalEstimado,
      peso,
    };
  });

  const custoRealSemanalInstituicao = custoRealSemanalPorValencia.reduce(
    (total, item) => total + item.custoSemanal,
    0
  );

  const custoMedioRealPorRefeicao =
    totalRefeicoesDia > 0 && receitasPlaneadas.length > 0
      ? custoRealSemanalInstituicao /
        (totalRefeicoesDia * receitasPlaneadas.length)
      : 0;

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
          <h3>Utentes ativos</h3>
          <p>{utentes.length}</p>
          <span>Dietas, alergias e texturas</span>
        </div>

        <div className="dashboard-card">
          <h3>Refeições planeadas</h3>
          <p>{receitasPlaneadas.length}</p>
          <span>Semana atual</span>
        </div>

        <div className="dashboard-card">
          <h3>Custo semanal</h3>
          <p>{custoSemanal.toFixed(2)} €</p>
          <span>Total das receitas base</span>
        </div>

        <div className="dashboard-card destaque">
          <h3>Custo real semanal</h3>
          <p>{custoRealSemanalInstituicao.toFixed(2)} €</p>
          <span>Com distribuição por valência</span>
        </div>

        <div className="dashboard-card">
          <h3>Custo médio/refeição</h3>
          <p>{custoMedioRealPorRefeicao.toFixed(2)} €</p>
          <span>Estimativa real</span>
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

                        {obterFichasPorRefeicao(refeicao).map((ficha) => (
                          <option key={ficha.id} value={ficha.id}>
                            {ficha.nome}
                          </option>
                        ))}
                      </select>

                      {ficha && (
                        <>
                          <div className="ementa-info">
                            <span>
                              💰 {Number(ficha.custoTotal || 0).toFixed(2)} €
                            </span>

                            <span>
                              🔥{" "}
                              {Number(
                                ficha.nutrientesTotais?.kcal || 0
                              ).toFixed(0)}{" "}
                              kcal
                            </span>
                          </div>

                          {obterAlertasReceita(ficha).length > 0 && (
                            <div style={{ marginTop: "12px" }}>
                              <details
                                style={{
                                  background: "#fff7ed",
                                  border: "1px solid #fdba74",
                                  borderRadius: "14px",
                                  overflow: "hidden",
                                  transition: "0.2s",
                                }}
                              >
                                <summary
                                  style={{
                                    cursor: "pointer",
                                    padding: "12px 14px",
                                    fontWeight: "600",
                                    color: "#c2410c",
                                    listStyle: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    userSelect: "none",
                                    fontSize: "14px",
                                  }}
                                >
                                  <span>
                                    ⚠ Ver avisos ({obterAlertasReceita(ficha).length})
                                  </span>

                                  <span
                                    style={{
                                      fontSize: "18px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    ⌄
                                  </span>
                                </summary>

                                <div
                                  style={{
                                    padding: "14px",
                                    borderTop: "1px solid #fdba74",
                                    fontSize: "13px",
                                    lineHeight: "1.6",
                                    background: "#fffaf5",
                                  }}
                                >
                                  {obterAlertasReceita(ficha).map(
                                    (alerta, index) => (
                                      <div
                                        key={index}
                                        style={{
                                          marginBottom: "10px",
                                          display: "flex",
                                          alignItems: "flex-start",
                                          gap: "8px",
                                        }}
                                      >
                                        <span>•</span>
                                        <span>{alerta}</span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </details>

                              <button
                                type="button"
                                style={{
                                  marginTop: "10px",
                                  width: "100%",
                                  background: "#14532d",
                                  color: "white",
                                  border: "none",
                                  padding: "11px 12px",
                                  borderRadius: "12px",
                                  cursor: "pointer",
                                  fontWeight: "700",
                                  fontSize: "13px",
                                  boxShadow: "0 8px 18px rgba(20, 83, 45, 0.18)",
                                }}
                                onClick={() => {
                                  const alternativa = obterAlternativaReceita(
                                    ficha,
                                    refeicao
                                  );

                                  if (!alternativa) {
                                    alert(
                                      "Não foi encontrada alternativa adequada para esta refeição. Cria primeiro uma ficha técnica compatível com a dieta/alergia identificada."
                                    );
                                    return;
                                  }

                                  const confirmar = window.confirm(
                                    `Substituir "${ficha.nome}" por "${alternativa.nome}"?`
                                  );

                                  if (!confirmar) return;

                                  atualizarEmenta(dia, refeicao, alternativa.id);
                                }}
                              >
                                🍽 Criar alternativa automática
                              </button>
                            </div>
                          )}
                        </>
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
        <h2>Custos reais por valência</h2>

        <p className="descricao">
          Estimativa calculada com base no custo por dose das fichas técnicas
          selecionadas na ementa e no número diário de refeições registado por
          valência.
        </p>

        {receitasPlaneadas.length === 0 ? (
          <p>Ainda não existem refeições planeadas para calcular custos.</p>
        ) : totalRefeicoesDia === 0 ? (
          <p>
            Ainda não existem refeições registadas por valência. Atualiza os
            dados de refeições para Lar, Creche, Apoio Domiciliário e
            Trabalhadores.
          </p>
        ) : (
          <>
            <div className="dashboard-cards">
              {custoRealSemanalPorValencia.map((item) => (
                <div className="dashboard-card" key={item.id}>
                  <h3>{item.nome}</h3>
                  <p>{item.custoSemanal.toFixed(2)} €</p>
                  <span>
                    {item.refeicoesDia} refeições/dia ·{" "}
                    {item.custoMensal.toFixed(2)} €/mês
                  </span>
                </div>
              ))}
            </div>

            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Valência</th>
                  <th>Refeições/dia</th>
                  <th>Refeições calculadas</th>
                  <th>Custo semanal</th>
                  <th>Custo mensal estimado</th>
                  <th>Peso no custo real</th>
                </tr>
              </thead>

              <tbody>
                {custoRealSemanalPorValencia.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
                    <td>{item.refeicoesDia}</td>
                    <td>{item.refeicoesSemana}</td>
                    <td>{item.custoSemanal.toFixed(2)} €</td>
                    <td>{item.custoMensal.toFixed(2)} €</td>
                    <td>
                      {custoRealSemanalInstituicao > 0
                        ? (
                            (item.custoSemanal /
                              custoRealSemanalInstituicao) *
                            100
                          ).toFixed(1)
                        : "0.0"}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="success-message">
              <strong>Nota técnica:</strong> estes valores usam o custo por dose
              de cada ficha técnica. O cálculo assume que cada refeição
              selecionada é servida diariamente ao número de utentes registado em
              cada valência.
            </div>
          </>
        )}
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