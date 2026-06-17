import { useEffect, useState } from "react";

import {
  ChefHat,
  Clock3,
  PackageCheck,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Euro,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import { useInstituicao } from "../context/InstituicaoContext";

export default function PlaneamentoProducao() {
  const { instituicaoAtual } = useInstituicao();

  const [fichas, setFichas] = useState([]);
  const [ementa, setEmenta] = useState({});
  const [stocks, setStocks] = useState([]);
  const [diaSelecionado, setDiaSelecionado] = useState("Segunda-feira");
  const [tarefas, setTarefas] = useState({});

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

  useEffect(() => {
    if (instituicaoAtual?.id) {
      carregarDados();
    }
  }, [instituicaoAtual]);

  async function carregarDados() {
    if (!instituicaoAtual?.id) return;

    const { data: fichasData, error: fichasError } = await supabase
      .from("fichas_tecnicas")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id);

    if (fichasError) {
      console.error(fichasError);
    }

    const { data: ementaData, error: ementaError } = await supabase
      .from("ementas")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ementaError) {
      console.error(ementaError);
    }

    const { data: stocksData, error: stocksError } = await supabase
      .from("stocks")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id);

    if (stocksError) {
      console.error(stocksError);
    }

    const fichasFormatadas = (fichasData || []).map((ficha) => ({
      id: ficha.id,
      nome: ficha.nome,
      categoria: ficha.categoria,
      doses: ficha.doses,
      ...ficha.dados,
    }));

    setFichas(fichasFormatadas);
    setEmenta(ementaData?.dados || {});
    setStocks(stocksData || []);
  }

  function normalizar(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function obterFicha(id) {
    return fichas.find((ficha) => String(ficha.id) === String(id));
  }

  function receitasDoDia() {
    return refeicoes
      .map((refeicao) => {
        const receitaId = ementa[diaSelecionado]?.[refeicao];
        const ficha = obterFicha(receitaId);

        return ficha
          ? {
              refeicao,
              ficha,
            }
          : null;
      })
      .filter(Boolean);
  }

  function ingredientesDoDia() {
    const acumulador = {};

    receitasDoDia().forEach((item) => {
      item.ficha.ingredientes?.forEach((ingrediente) => {
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

  function converterParaGramas(quantidade, unidade) {
    const valor = Number(quantidade) || 0;

    if (unidade === "kg") return valor * 1000;
    if (unidade === "g") return valor;
    if (unidade === "L") return valor * 1000;
    if (unidade === "ml") return valor;

    return valor;
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

  function verificarStock(ingrediente) {
    const produto = encontrarProdutoStock(ingrediente.nome);

    if (!produto) {
      return {
        estado: "em falta",
        mensagem: "Sem produto correspondente no stock",
      };
    }

    const disponivel = converterParaGramas(produto.quantidade, produto.unidade);

    if (disponivel < ingrediente.quantidade) {
      return {
        estado: "insuficiente",
        mensagem: "Stock insuficiente",
      };
    }

    return {
      estado: "suficiente",
      mensagem: "Stock suficiente",
    };
  }

  function formatarQuantidade(gramas) {
    if (gramas >= 1000) {
      return `${(gramas / 1000).toFixed(2)} kg`;
    }

    return `${Number(gramas || 0).toFixed(0)} g`;
  }

  function tempoEstimadoReceita(ficha) {
    const texto = normalizar(`${ficha.nome} ${ficha.categoria}`);

    if (texto.includes("sopa")) return 60;
    if (texto.includes("assado")) return 120;
    if (texto.includes("jardineira")) return 110;
    if (texto.includes("arroz")) return 90;
    if (texto.includes("massa")) return 70;
    if (texto.includes("sobremesa")) return 45;
    if (texto.includes("lanche")) return 25;

    return 75;
  }

  function planoAutomatico() {
    const receitas = receitasDoDia();
    let horaBase = 7 * 60 + 30;

    return receitas.map((item, index) => {
      const duracao = tempoEstimadoReceita(item.ficha);
      const inicio = horaBase;
      const fim = inicio + duracao;

      horaBase = fim + 10;

      return {
        id: `${diaSelecionado}-${item.refeicao}-${item.ficha.id}`,
        ordem: index + 1,
        refeicao: item.refeicao,
        receita: item.ficha.nome,
        categoria: item.ficha.categoria,
        doses: item.ficha.doses || "-",
        duracao,
        inicio,
        fim,
        custo: Number(item.ficha.custoTotal || 0),
        alergenios: item.ficha.alergenios || "Sem alergénios registados",
        haccp: item.ficha.haccp || "Sem observações HACCP registadas",
      };
    });
  }

  function formatarHora(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;

    return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}`;
  }

  function estadoTarefa(id) {
    return tarefas[id] || "pendente";
  }

  function atualizarEstado(id, estado) {
    setTarefas((atuais) => ({
      ...atuais,
      [id]: estado,
    }));
  }

  const receitas = receitasDoDia();
  const ingredientes = ingredientesDoDia();
  const plano = planoAutomatico();

  const ingredientesCriticos = ingredientes.filter((item) => {
    const verificacao = verificarStock(item);
    return verificacao.estado !== "suficiente";
  });

  const custoDia = receitas.reduce(
    (total, item) => total + Number(item.ficha.custoTotal || 0),
    0
  );

  const tempoTotal = plano.reduce((total, item) => total + item.duracao, 0);

  const concluidas = plano.filter(
    (item) => estadoTarefa(item.id) === "concluido"
  ).length;

  const progresso =
    plano.length > 0 ? Math.round((concluidas / plano.length) * 100) : 0;

  return (
    <div className="dashboard">
      <div className="topo-dashboard">
        <div>
          <h1>Planeamento de Produção</h1>

          <p className="dashboard-subtitle">
            {instituicaoAtual?.nome} — Organização diária da cozinha com
            receitas, tempos, ingredientes, stock, alergénios, HACCP e estado de
            execução.
          </p>
        </div>

        <div className="data-box">
          <ChefHat size={18} /> Cozinha
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Selecionar dia de produção</h2>

        <div className="botoes-formulario">
          {diasSemana.map((dia) => (
            <button
              key={dia}
              className={
                diaSelecionado === dia ? "botao-principal" : "botao-secundario"
              }
              onClick={() => setDiaSelecionado(dia)}
            >
              {dia}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card destaque">
          <ClipboardList size={30} />
          <h3>Produções do dia</h3>
          <p>{plano.length}</p>
          <span>Receitas planeadas</span>
        </div>

        <div className="dashboard-card">
          <Clock3 size={30} />
          <h3>Tempo estimado</h3>
          <p>{Math.round(tempoTotal / 60)}h</p>
          <span>Tempo total previsto</span>
        </div>

        <div className="dashboard-card">
          <PackageCheck size={30} />
          <h3>Ingredientes</h3>
          <p>{ingredientes.length}</p>
          <span>Necessários</span>
        </div>

        <div className="dashboard-card">
          <AlertTriangle size={30} />
          <h3>Críticos</h3>
          <p>{ingredientesCriticos.length}</p>
          <span>Em falta ou insuficientes</span>
        </div>

        <div className="dashboard-card">
          <Euro size={30} />
          <h3>Custo do dia</h3>
          <p>{custoDia.toFixed(2)} €</p>
          <span>Com base nas fichas técnicas</span>
        </div>

        <div className="dashboard-card">
          <CheckCircle2 size={30} />
          <h3>Progresso</h3>
          <p>{progresso}%</p>
          <span>Produção concluída</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Plano automático do dia</h2>

        {plano.length === 0 ? (
          <p>Não existem receitas planeadas para este dia.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Ordem</th>
                <th>Hora</th>
                <th>Refeição</th>
                <th>Receita</th>
                <th>Doses</th>
                <th>Duração</th>
                <th>Custo</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {plano.map((item) => (
                <tr key={item.id}>
                  <td>{item.ordem}</td>
                  <td>
                    {formatarHora(item.inicio)} - {formatarHora(item.fim)}
                  </td>
                  <td>{item.refeicao}</td>
                  <td>{item.receita}</td>
                  <td>{item.doses}</td>
                  <td>{item.duracao} min</td>
                  <td>{item.custo.toFixed(2)} €</td>
                  <td>
                    <select
                      value={estadoTarefa(item.id)}
                      onChange={(e) => atualizarEstado(item.id, e.target.value)}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_execucao">Em execução</option>
                      <option value="concluido">Concluído</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Ingredientes necessários</h2>

        {ingredientes.length === 0 ? (
          <p>Não existem ingredientes associados ao plano deste dia.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th>Quantidade</th>
                <th>Estado stock</th>
              </tr>
            </thead>

            <tbody>
              {ingredientes.map((item) => {
                const verificacao = verificarStock(item);

                return (
                  <tr key={item.nome}>
                    <td>{item.nome}</td>
                    <td>{formatarQuantidade(item.quantidade)}</td>
                    <td>
                      {verificacao.estado === "suficiente" ? (
                        <span style={{ color: "#16a34a", fontWeight: "bold" }}>
                          ✔ {verificacao.mensagem}
                        </span>
                      ) : (
                        <span style={{ color: "#dc2626", fontWeight: "bold" }}>
                          ⚠ {verificacao.mensagem}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Alergénios e HACCP</h2>

        {plano.length === 0 ? (
          <p>Não existem dados para apresentar.</p>
        ) : (
          <div className="historico-grid">
            {plano.map((item) => (
              <div className="historico-card" key={item.id}>
                <h3>{item.receita}</h3>
                <p>
                  <strong>Refeição:</strong> {item.refeicao}
                </p>
                <p>
                  <strong>Alergénios:</strong> {item.alergenios}
                </p>
                <p>
                  <strong>HACCP:</strong> {item.haccp}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
