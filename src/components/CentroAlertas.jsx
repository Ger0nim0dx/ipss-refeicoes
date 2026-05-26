import { useEffect, useState } from "react";
import {
  Bell,
  AlertTriangle,
  Package,
  CalendarClock,
  Cake,
  ShieldAlert,
  Euro,
  CheckCircle2,
  BrainCircuit,
  Filter,
} from "lucide-react";

import { supabase } from "../supabaseClient";

export default function CentroAlertas() {
  const [stocks, setStocks] = useState([]);
  const [haccp, setHaccp] = useState([]);
  const [utentes, setUtentes] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [ementa, setEmenta] = useState({});
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const user = userData.user;

    const { data: stocksData } = await supabase
      .from("stocks")
      .select("*")
      .eq("user_id", user.id);

    const { data: haccpData } = await supabase
      .from("haccp")
      .select("*")
      .eq("user_id", user.id);

    const { data: utentesData } = await supabase
      .from("utentes")
      .select("*")
      .eq("user_id", user.id);

    const { data: fichasData } = await supabase
      .from("fichas_tecnicas")
      .select("*")
      .eq("user_id", user.id);

    const { data: ementaData } = await supabase
      .from("ementas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const fichasFormatadas = (fichasData || []).map((ficha) => ({
      id: ficha.id,
      nome: ficha.nome,
      categoria: ficha.categoria,
      doses: ficha.doses,
      ...ficha.dados,
    }));

    setStocks(stocksData || []);
    setHaccp(haccpData || []);
    setUtentes(utentesData || []);
    setFichas(fichasFormatadas);
    setEmenta(ementaData?.dados || {});
  }

  function normalizar(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function diasAte(data) {
    if (!data) return null;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const alvo = new Date(data);
    alvo.setHours(0, 0, 0, 0);

    return Math.ceil((alvo - hoje) / (1000 * 60 * 60 * 24));
  }

  function obterFicha(id) {
    return fichas.find((ficha) => String(ficha.id) === String(id));
  }

  function receitasPlaneadas() {
    const receitas = [];

    Object.values(ementa || {}).forEach((refeicoesDia) => {
      Object.values(refeicoesDia || {}).forEach((receitaId) => {
        const ficha = obterFicha(receitaId);
        if (ficha) receitas.push(ficha);
      });
    });

    return receitas;
  }

  function ingredientesPrevistos() {
    const acumulador = {};

    receitasPlaneadas().forEach((ficha) => {
      ficha.ingredientes?.forEach((ingrediente) => {
        const chave = normalizar(ingrediente.nome);

        if (!acumulador[chave]) {
          acumulador[chave] = {
            nome: ingrediente.nome,
            quantidade: 0,
          };
        }

        acumulador[chave].quantidade += Number(ingrediente.quantidade || 0);
      });
    });

    return Object.values(acumulador);
  }

  function encontrarProdutoStock(nomeIngrediente) {
    return stocks.find((item) => {
      const nomeStock = normalizar(item.produto || item.nome);
      const nomeIng = normalizar(nomeIngrediente);

      return (
        nomeStock === nomeIng ||
        nomeStock.includes(nomeIng) ||
        nomeIng.includes(nomeStock)
      );
    });
  }

  function converterParaGramas(quantidade, unidade) {
    const valor = Number(quantidade) || 0;

    if (unidade === "kg") return valor * 1000;
    if (unidade === "g") return valor;
    if (unidade === "L") return valor * 1000;
    if (unidade === "ml") return valor;

    return valor;
  }

  function aniversariosAmanha() {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);

    return utentes.filter((utente) => {
      const nascimento =
        utente.data_nascimento ||
        utente.dataNascimento ||
        utente.nascimento;

      if (!nascimento) return false;

      const data = new Date(nascimento);

      return (
        data.getDate() === amanha.getDate() &&
        data.getMonth() === amanha.getMonth()
      );
    });
  }

  const alertas = [];

  stocks.forEach((item) => {
    const quantidade = Number(item.quantidade || 0);
    const minimo = Number(item.stock_minimo || item.stockMinimo || 0);
    const diasValidade = diasAte(item.validade);

    if (quantidade <= 0) {
      alertas.push({
        tipo: "stock",
        prioridade: "crítica",
        titulo: "Produto esgotado",
        mensagem: `${item.produto || item.nome} encontra-se esgotado.`,
        icon: Package,
      });
    } else if (quantidade <= minimo) {
      alertas.push({
        tipo: "stock",
        prioridade: "alta",
        titulo: "Stock baixo",
        mensagem: `${item.produto || item.nome} está abaixo ou no limite do stock mínimo.`,
        icon: Package,
      });
    }

    if (diasValidade !== null && diasValidade < 0) {
      alertas.push({
        tipo: "validade",
        prioridade: "crítica",
        titulo: "Produto expirado",
        mensagem: `${item.produto || item.nome} tem validade ultrapassada.`,
        icon: CalendarClock,
      });
    } else if (diasValidade !== null && diasValidade <= 7) {
      alertas.push({
        tipo: "validade",
        prioridade: "alta",
        titulo: "Produto a expirar",
        mensagem: `${item.produto || item.nome} expira dentro de ${diasValidade} dia(s).`,
        icon: CalendarClock,
      });
    }
  });

  haccp.forEach((item) => {
    if (
      item.tipo_registo === "nao_conformidade" ||
      item.estado === "Crítico" ||
      item.estado === "Não conforme"
    ) {
      alertas.push({
        tipo: "haccp",
        prioridade: "crítica",
        titulo: "Alerta HACCP",
        mensagem: item.descricao || "Existe um registo HACCP crítico ou não conforme.",
        icon: ShieldAlert,
      });
    }
  });

  aniversariosAmanha().forEach((utente) => {
    alertas.push({
      tipo: "utentes",
      prioridade: "normal",
      titulo: "Aniversário amanhã",
      mensagem: `${utente.nome || "Um utente"} faz anos amanhã. A cozinha pode preparar bolo ou lanche comemorativo.`,
      icon: Cake,
    });
  });

  ingredientesPrevistos().forEach((ingrediente) => {
    const produtoStock = encontrarProdutoStock(ingrediente.nome);

    if (!produtoStock) {
      alertas.push({
        tipo: "producao",
        prioridade: "alta",
        titulo: "Ingrediente sem stock",
        mensagem: `${ingrediente.nome} está previsto na ementa, mas não existe no stock.`,
        icon: AlertTriangle,
      });

      return;
    }

    const stockAtual = converterParaGramas(
      produtoStock.quantidade,
      produtoStock.unidade
    );

    const minimo = converterParaGramas(
      produtoStock.stock_minimo || produtoStock.stockMinimo || 0,
      produtoStock.unidade
    );

    const stockDepois = stockAtual - ingrediente.quantidade;

    if (stockDepois < 0) {
      alertas.push({
        tipo: "producao",
        prioridade: "crítica",
        titulo: "Rutura prevista",
        mensagem: `${ingrediente.nome} poderá não ser suficiente para a ementa planeada.`,
        icon: AlertTriangle,
      });
    } else if (stockDepois <= minimo) {
      alertas.push({
        tipo: "producao",
        prioridade: "alta",
        titulo: "Stock ficará crítico",
        mensagem: `${ingrediente.nome} ficará abaixo ou próximo do mínimo após a produção.`,
        icon: AlertTriangle,
      });
    }
  });

  fichas.forEach((ficha) => {
    const custoDose = Number(ficha.custoPorDose || 0);

    if (custoDose >= 4) {
      alertas.push({
        tipo: "custos",
        prioridade: "normal",
        titulo: "Receita com custo elevado",
        mensagem: `${ficha.nome} tem custo por dose de ${custoDose.toFixed(2)}€.`,
        icon: Euro,
      });
    }
  });

  const prioridadePeso = {
    crítica: 1,
    alta: 2,
    normal: 3,
  };

  const alertasOrdenados = [...alertas].sort(
    (a, b) => prioridadePeso[a.prioridade] - prioridadePeso[b.prioridade]
  );

  const alertasFiltrados =
    filtro === "todos"
      ? alertasOrdenados
      : alertasOrdenados.filter((alerta) => alerta.tipo === filtro);

  const criticos = alertas.filter((a) => a.prioridade === "crítica").length;
  const altos = alertas.filter((a) => a.prioridade === "alta").length;
  const normais = alertas.filter((a) => a.prioridade === "normal").length;

  function classePrioridade(prioridade) {
    if (prioridade === "crítica") return "badge badge-danger";
    if (prioridade === "alta") return "badge badge-warning";
    return "badge badge-info";
  }

  return (
    <div className="dashboard">
      <div className="topo-dashboard">
        <div>
          <h1>Centro de Alertas</h1>
          <p className="dashboard-subtitle">
            Monitorização inteligente de stocks, validade, produção, utentes,
            HACCP e custos.
          </p>
        </div>

        <div className="data-box">
          <Bell size={18} /> Alertas inteligentes
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card destaque">
          <Bell size={30} />
          <h3>Total de alertas</h3>
          <p>{alertas.length}</p>
          <span>Ativos neste momento</span>
        </div>

        <div className="dashboard-card">
          <AlertTriangle size={30} />
          <h3>Críticos</h3>
          <p>{criticos}</p>
          <span>Exigem ação imediata</span>
        </div>

        <div className="dashboard-card">
          <Package size={30} />
          <h3>Prioridade alta</h3>
          <p>{altos}</p>
          <span>Requerem acompanhamento</span>
        </div>

        <div className="dashboard-card">
          <CheckCircle2 size={30} />
          <h3>Informativos</h3>
          <p>{normais}</p>
          <span>Monitorização regular</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>
          <Filter size={22} /> Filtros
        </h2>

        <div className="botoes-formulario">
          {[
            ["todos", "Todos"],
            ["stock", "Stock"],
            ["validade", "Validade"],
            ["producao", "Produção"],
            ["utentes", "Utentes"],
            ["haccp", "HACCP"],
            ["custos", "Custos"],
          ].map(([valor, label]) => (
            <button
              key={valor}
              className={filtro === valor ? "botao-principal" : "botao-secundario"}
              onClick={() => setFiltro(valor)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Alertas ativos</h2>

        {alertasFiltrados.length === 0 ? (
          <p className="success-message">
            <CheckCircle2 size={18} /> Não existem alertas neste filtro.
          </p>
        ) : (
          <div className="historico-grid">
            {alertasFiltrados.map((alerta, index) => {
              const Icone = alerta.icon;

              return (
                <div className="historico-card" key={index}>
                  <h3>
                    <Icone size={20} /> {alerta.titulo}
                  </h3>

                  <p>
                    <span className={classePrioridade(alerta.prioridade)}>
                      {alerta.prioridade}
                    </span>
                  </p>

                  <p>{alerta.mensagem}</p>

                  <p className="dashboard-subtitle">
                    Categoria: {alerta.tipo}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>
          <BrainCircuit size={22} /> Síntese inteligente
        </h2>

        <div className="historico-card">
          {alertas.length === 0 ? (
            <p>
              A operação encontra-se estável. Não foram identificados alertas
              críticos neste momento.
            </p>
          ) : (
            <>
              <p>
                Foram identificados <strong>{alertas.length}</strong> alerta(s),
                dos quais <strong>{criticos}</strong> crítico(s) e{" "}
                <strong>{altos}</strong> de prioridade alta.
              </p>

              <p>
                Recomenda-se verificar primeiro os alertas críticos, validar
                stocks e produtos com validade próxima, e confirmar necessidades
                de produção antes da execução da ementa.
              </p>

              {aniversariosAmanha().length > 0 && (
                <p>
                  Existem aniversários amanhã. A cozinha poderá preparar um bolo
                  ou lanche comemorativo.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}