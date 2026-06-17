import { useEffect, useState } from "react";
import {
  CalendarDays,
  UtensilsCrossed,
  Cake,
  AlertTriangle,
  ShoppingCart,
  ShieldCheck,
  Euro,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import { useInstituicao } from "../context/InstituicaoContext";

export default function Calendario() {
  const { instituicaoAtual } = useInstituicao();

  const [fichas, setFichas] = useState([]);
  const [ementa, setEmenta] = useState({});
  const [stocks, setStocks] = useState([]);
  const [haccp, setHaccp] = useState([]);
  const [utentes, setUtentes] = useState([]);
  const [diaSelecionado, setDiaSelecionado] = useState(null);

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
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user || !instituicaoAtual?.id) return;

    const { data: fichasData } = await supabase
      .from("fichas_tecnicas")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id);

    const { data: ementaData } = await supabase
      .from("ementas")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: stocksData } = await supabase
      .from("stocks")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id);

    const { data: haccpData } = await supabase
      .from("haccp")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id);

    const { data: utentesData } = await supabase
      .from("utentes")
      .select("*")
      .eq("instituicao_id", instituicaoAtual.id);

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
    setHaccp(haccpData || []);
    setUtentes(utentesData || []);
  }

  function obterFicha(id) {
    return fichas.find((ficha) => String(ficha.id) === String(id));
  }

  function normalizar(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function dataDoDiaSemana(index) {
    const hoje = new Date();
    const diaAtual = hoje.getDay();
    const segunda = new Date(hoje);

    const diferencaParaSegunda = diaAtual === 0 ? -6 : 1 - diaAtual;
    segunda.setDate(hoje.getDate() + diferencaParaSegunda + index);
    segunda.setHours(0, 0, 0, 0);

    return segunda;
  }

  function formatarData(data) {
    return data.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function aniversariosNoDia(data) {
    return utentes.filter((utente) => {
      const nascimento =
        utente.data_nascimento ||
        utente.dataNascimento ||
        utente.nascimento;

      if (!nascimento) return false;

      const d = new Date(nascimento);

      return d.getDate() === data.getDate() && d.getMonth() === data.getMonth();
    });
  }

  function produtosAExpirarNoDia(data) {
    return stocks.filter((item) => {
      if (!item.validade) return false;

      const validade = new Date(item.validade);
      validade.setHours(0, 0, 0, 0);

      return validade.getTime() === data.getTime();
    });
  }

  function alertasHaccpDia() {
    return haccp.filter(
      (item) =>
        item.tipo_registo === "nao_conformidade" ||
        item.estado === "Crítico" ||
        item.estado === "Não conforme"
    );
  }

  function receitasDoDia(dia) {
    return refeicoes
      .map((refeicao) => {
        const receitaId = ementa[dia]?.[refeicao];
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

  function custoDia(dia) {
    return receitasDoDia(dia).reduce(
      (total, item) => total + Number(item.ficha.custoTotal || 0),
      0
    );
  }

  function ingredientesDoDia(dia) {
    const acumulador = {};

    receitasDoDia(dia).forEach((item) => {
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

  function formatarQuantidade(gramas) {
    if (gramas >= 1000) return `${(gramas / 1000).toFixed(2)} kg`;
    return `${Number(gramas || 0).toFixed(0)} g`;
  }

  return (
    <div className="dashboard">
      <div className="topo-dashboard">
        <div>
          <h1>Calendário Operacional</h1>
          <p className="dashboard-subtitle">
            Visão semanal integrada da ementa, produção, custos, aniversários,
            HACCP e validade de produtos.
          </p>
        </div>

        <div className="data-box">
          <CalendarDays size={18} /> Semana atual
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Semana operacional</h2>

        <div className="historico-grid">
          {diasSemana.map((dia, index) => {
            const data = dataDoDiaSemana(index);
            const receitas = receitasDoDia(dia);
            const aniversarios = aniversariosNoDia(data);
            const expiracoes = produtosAExpirarNoDia(data);
            const alertas = alertasHaccpDia();
            const custo = custoDia(dia);

            return (
              <div
                className="historico-card"
                key={dia}
                onClick={() => setDiaSelecionado(dia)}
                style={{ cursor: "pointer" }}
              >
                <h3>{dia}</h3>
                <p>
                  <strong>{formatarData(data)}</strong>
                </p>

                <p>
                  <UtensilsCrossed size={16} /> {receitas.length} refeições
                  planeadas
                </p>

                <p>
                  <Euro size={16} /> {custo.toFixed(2)} € estimados
                </p>

                {aniversarios.length > 0 && (
                  <p>
                    <Cake size={16} /> {aniversarios.length} aniversário(s)
                  </p>
                )}

                {expiracoes.length > 0 && (
                  <p>
                    <AlertTriangle size={16} /> {expiracoes.length} produto(s) a
                    expirar
                  </p>
                )}

                {alertas.length > 0 && (
                  <p>
                    <ShieldCheck size={16} /> {alertas.length} alerta(s) HACCP
                  </p>
                )}

                {receitas.length === 0 && (
                  <p className="dashboard-subtitle">Sem refeições planeadas.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {diaSelecionado && (
        <div className="dashboard-section">
          <h2>Detalhe do dia — {diaSelecionado}</h2>

          <div className="dashboard-cards">
            <div className="dashboard-card destaque">
              <Euro size={30} />
              <h3>Custo do dia</h3>
              <p>{custoDia(diaSelecionado).toFixed(2)} €</p>
              <span>Com base nas fichas técnicas</span>
            </div>

            <div className="dashboard-card">
              <UtensilsCrossed size={30} />
              <h3>Refeições</h3>
              <p>{receitasDoDia(diaSelecionado).length}</p>
              <span>Planeadas</span>
            </div>

            <div className="dashboard-card">
              <ShoppingCart size={30} />
              <h3>Ingredientes</h3>
              <p>{ingredientesDoDia(diaSelecionado).length}</p>
              <span>Previstos para produção</span>
            </div>
          </div>

          <h3>Refeições do dia</h3>

          {receitasDoDia(diaSelecionado).length === 0 ? (
            <p>Não existem refeições planeadas para este dia.</p>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Refeição</th>
                  <th>Receita</th>
                  <th>Categoria</th>
                  <th>Doses</th>
                  <th>Custo</th>
                </tr>
              </thead>

              <tbody>
                {receitasDoDia(diaSelecionado).map((item) => (
                  <tr key={item.refeicao}>
                    <td>{item.refeicao}</td>
                    <td>{item.ficha.nome}</td>
                    <td>{item.ficha.categoria}</td>
                    <td>{item.ficha.doses || "-"}</td>
                    <td>{Number(item.ficha.custoTotal || 0).toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3 style={{ marginTop: "25px" }}>Ingredientes previstos</h3>

          {ingredientesDoDia(diaSelecionado).length === 0 ? (
            <p>Sem ingredientes previstos.</p>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Quantidade</th>
                </tr>
              </thead>

              <tbody>
                {ingredientesDoDia(diaSelecionado).map((item, index) => (
                  <tr key={index}>
                    <td>{item.nome}</td>
                    <td>{formatarQuantidade(item.quantidade)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}