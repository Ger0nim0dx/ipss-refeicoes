import { useEffect, useState } from "react";

import {
  Factory,
  CalendarDays,
  ClipboardList,
  Search,
  Package,
  AlertTriangle,
  CheckCircle2,
  UtensilsCrossed,
  Users,
} from "lucide-react";

import { supabase } from "../supabaseClient";

function Producoes() {
  const [producoes, setProducoes] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [utentes, setUtentes] = useState([]);
  const [ementas, setEmentas] = useState([]);

  const [pesquisa, setPesquisa] = useState("");
  const [fichaSelecionadaId, setFichaSelecionadaId] = useState("");
  const [dosesProduzir, setDosesProduzir] = useState(10);
  const [mensagem, setMensagem] = useState("");

  const [diaSemana, setDiaSemana] =
    useState("Segunda-feira");

  const [
    refeicaoSelecionada,
    setRefeicaoSelecionada,
  ] = useState("Almoço");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data: userData } =
      await supabase.auth.getUser();

    const user = userData?.user;

    if (!user) return;

    const { data: producoesData } =
      await supabase
        .from("producoes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

    const { data: fichasData } =
      await supabase
        .from("fichas_tecnicas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

    const { data: stocksData } =
      await supabase
        .from("stocks")
        .select("*")
        .eq("user_id", user.id);

    const { data: utentesData } =
      await supabase
        .from("utentes")
        .select("*")
        .eq("user_id", user.id);

    const { data: ementasData } =
      await supabase
        .from("ementas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

    const fichasFormatadas = (
      fichasData || []
    ).map((ficha) => ({
      id: ficha.id,
      nome: ficha.nome,
      categoria: ficha.categoria,
      doses: ficha.doses,
      ...ficha.dados,
    }));

    setProducoes(producoesData || []);
    setFichas(fichasFormatadas);
    setStocks(stocksData || []);
    setUtentes(utentesData || []);
    setEmentas(ementasData || []);
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function converterParaBase(
    quantidade,
    unidade
  ) {
    const valor =
      Number(quantidade) || 0;

    if (unidade === "kg")
      return valor * 1000;

    if (unidade === "g")
      return valor;

    if (unidade === "L")
      return valor * 1000;

    if (unidade === "ml")
      return valor;

    return valor;
  }

  function converterDaBase(
    valorBase,
    unidade
  ) {
    if (unidade === "kg")
      return valorBase / 1000;

    if (unidade === "g")
      return valorBase;

    if (unidade === "L")
      return valorBase / 1000;

    if (unidade === "ml")
      return valorBase;

    return valorBase;
  }

  function formatarQuantidadeOperacional(
    valorBase,
    unidade = "g"
  ) {
    const valor =
      Number(valorBase) || 0;

    if (
      unidade === "L" ||
      unidade === "ml"
    ) {
      return `${(
        valor / 1000
      ).toFixed(2)} L`;
    }

    return `${(
      valor / 1000
    ).toFixed(2)} kg`;
  }

  function encontrarProdutoStock(
    nomeIngrediente
  ) {
    const ingredienteNormalizado =
      normalizarTexto(
        nomeIngrediente
      );

    return stocks.find((item) => {
      const nomeStock =
        normalizarTexto(
          item.produto || item.nome
        );

      return (
        nomeStock ===
          ingredienteNormalizado ||
        nomeStock.includes(
          ingredienteNormalizado
        ) ||
        ingredienteNormalizado.includes(
          nomeStock
        )
      );
    });
  }

  function obterValor(
    utente,
    campos,
    fallback = ""
  ) {
    for (const campo of campos) {
      if (utente?.[campo])
        return utente[campo];
    }

    return fallback;
  }

  function obterReceitaAtual() {
    const ementaAtual =
      ementas?.[0]?.dados || {};

    const refeicoesDia =
      ementaAtual?.[diaSemana] ||
      {};

    const receitaId =
      refeicoesDia?.[
        refeicaoSelecionada
      ] ||
      refeicoesDia?.[
        refeicaoSelecionada.toLowerCase()
      ];

    const ficha = fichas.find(
      (item) =>
        String(item.id) ===
        String(receitaId)
    );

    return ficha || null;
  }

  const receitaAutomatica =
    obterReceitaAtual();

  const totalUtentes =
    utentes.length;

  const totalDietas =
    utentes.filter((utente) => {
      const dieta =
        normalizarTexto(
          obterValor(
            utente,
            ["dieta", "tipo_dieta"],
            ""
          )
        );

      return (
        dieta &&
        dieta !== "normal"
      );
    }).length;

  const totalTexturas =
    utentes.filter((utente) => {
      const textura =
        normalizarTexto(
          obterValor(
            utente,
            [
              "textura",
              "textura_alimentar",
            ],
            ""
          )
        );

      return (
        textura.includes(
          "tritur"
        ) ||
        textura.includes(
          "pastosa"
        )
      );
    }).length;

  const totalAlergias =
    utentes.filter((utente) => {
      const alergias =
        normalizarTexto(
          obterValor(
            utente,
            [
              "alergias",
              "alergenios",
            ],
            ""
          )
        );

      return (
        alergias &&
        alergias !==
          "sem alergias"
      );
    }).length;

  const producaoPrincipal =
    totalUtentes -
    totalDietas -
    totalTexturas;

  const fichaSelecionada =
    receitaAutomatica ||
    fichas.find(
      (ficha) =>
        String(ficha.id) ===
        String(
          fichaSelecionadaId
        )
    );

  const ingredientesCalculados =
    fichaSelecionada?.ingredientes?.map(
      (ingrediente) => {
        const dosesBase =
          Number(
            fichaSelecionada.doses ||
              1
          );

        const fator =
          Number(
            dosesProduzir || 0
          ) / dosesBase;

        const quantidadeNecessariaBase =
          Number(
            ingrediente.quantidade ||
              0
          ) * fator;

        const produtoStock =
          encontrarProdutoStock(
            ingrediente.nome
          );

        const unidadeStock =
          produtoStock?.unidade ||
          "g";

        const stockAtualBase =
          produtoStock
            ? converterParaBase(
                produtoStock.quantidade,
                unidadeStock
              )
            : 0;

        const stockDepoisBase =
          stockAtualBase -
          quantidadeNecessariaBase;

        return {
          nome: ingrediente.nome,
          quantidadeNecessariaBase,
          produtoStock,
          stockAtualBase,
          stockDepoisBase,
          unidadeStock,
          suficiente:
            produtoStock &&
            stockDepoisBase >= 0,
        };
      }
    ) || [];

  const ingredientesEmFalta =
    ingredientesCalculados.filter(
      (item) => !item.suficiente
    );

  async function executarProducao() {
    setMensagem("");

    if (!fichaSelecionada) {
      alert(
        "Seleciona uma ficha técnica."
      );
      return;
    }

    if (
      !dosesProduzir ||
      Number(dosesProduzir) <= 0
    ) {
      alert(
        "Indica um número de doses válido."
      );
      return;
    }

    if (
      ingredientesEmFalta.length >
      0
    ) {
      alert(
        "Existem ingredientes sem stock suficiente."
      );
      return;
    }

    const confirmar = confirm(
      `Confirmas a produção de ${dosesProduzir} doses de "${fichaSelecionada.nome}"?`
    );

    if (!confirmar) return;

    const { data: userData } =
      await supabase.auth.getUser();

    const user = userData?.user;

    if (!user) return;

    const movimentos = [];

    for (const ingrediente of ingredientesCalculados) {
      const produtoStock =
        ingrediente.produtoStock;

      if (!produtoStock)
        continue;

      const novaQuantidade =
        converterDaBase(
          ingrediente.stockDepoisBase,
          produtoStock.unidade
        );

      await supabase
        .from("stocks")
        .update({
          quantidade: Number(
            novaQuantidade.toFixed(
              3
            )
          ),
        })
        .eq(
          "id",
          produtoStock.id
        );

      movimentos.push({
        user_id: user.id,
        produto:
          produtoStock.produto ||
          produtoStock.nome ||
          ingrediente.nome,
        tipo: `Produção: ${fichaSelecionada.nome}`,
        quantidade: Number(
          ingrediente.quantidadeNecessariaBase.toFixed(
            0
          )
        ),
        unidade: "g/ml",
        observacoes: `${dosesProduzir} doses produzidas`,
      });
    }

    if (movimentos.length > 0) {
      await supabase
        .from(
          "movimentos_stock"
        )
        .insert(movimentos);
    }

    await supabase
      .from("producoes")
      .insert({
        user_id: user.id,
        dias: [diaSemana],
        total_movimentos:
          movimentos.length,
        observacoes: `Produção automática: ${fichaSelecionada.nome} | ${refeicaoSelecionada}`,
      });

    setMensagem(
      `Produção executada com sucesso.`
    );

    setFichaSelecionadaId("");
    setDosesProduzir(10);

    await carregarDados();
  }

  const producoesFiltradas =
    producoes.filter((producao) =>
      JSON.stringify(producao)
        .toLowerCase()
        .includes(
          pesquisa.toLowerCase()
        )
    );

  return (
    <div className="pagina">
      <div className="topo-dashboard">
        <div>
          <h1>
            <Factory size={28} />
            Produções Inteligentes
          </h1>

          <p className="dashboard-subtitle">
            Produção automática
            baseada em utentes,
            dietas, alergias,
            texturas e ementas.
          </p>
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card destaque">
          <Users size={30} />
          <h3>Utentes</h3>
          <p>{totalUtentes}</p>
          <span>
            Total registado
          </span>
        </div>

        <div className="dashboard-card">
          <UtensilsCrossed size={30} />
          <h3>
            Produção principal
          </h3>
          <p>
            {producaoPrincipal}
          </p>
          <span>
            Doses normais
          </span>
        </div>

        <div className="dashboard-card">
          <AlertTriangle size={30} />
          <h3>Dietas</h3>
          <p>{totalDietas}</p>
          <span>
            Dietas especiais
          </span>
        </div>

        <div className="dashboard-card">
          <Package size={30} />
          <h3>Texturas</h3>
          <p>{totalTexturas}</p>
          <span>Adaptadas</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>
          <CalendarDays size={22} />
          Produção automática
          diária
        </h2>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          {[
            "Segunda-feira",
            "Terça-feira",
            "Quarta-feira",
            "Quinta-feira",
            "Sexta-feira",
            "Sábado",
            "Domingo",
          ].map((dia) => (
            <button
              key={dia}
              className={
                diaSemana === dia
                  ? "botao-principal"
                  : "botao-secundario"
              }
              onClick={() =>
                setDiaSemana(dia)
              }
            >
              {dia}
            </button>
          ))}
        </div>

        <div className="formulario">
          <label>Refeição</label>

          <select
            value={
              refeicaoSelecionada
            }
            onChange={(e) =>
              setRefeicaoSelecionada(
                e.target.value
              )
            }
          >
            <option>
              Pequeno-almoço
            </option>
            <option>
              Almoço
            </option>
            <option>
              Lanche
            </option>
            <option>
              Jantar
            </option>
          </select>
        </div>

        <div
          style={{
            marginTop: "20px",
            background: "#ecfdf5",
            border:
              "2px solid #166534",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <h3>
            Receita automática
          </h3>

          <p>
            <strong>Dia:</strong>{" "}
            {diaSemana}
          </p>

          <p>
            <strong>
              Refeição:
            </strong>{" "}
            {
              refeicaoSelecionada
            }
          </p>

          <p>
            <strong>
              Receita:
            </strong>{" "}
            {receitaAutomatica?.nome ||
              "Sem receita"}
          </p>

          <p>
            <strong>
              Produção principal:
            </strong>{" "}
            {producaoPrincipal}{" "}
            doses
          </p>

          <p>
            <strong>
              Dietas:
            </strong>{" "}
            {totalDietas}
          </p>

          <p>
            <strong>
              Texturas:
            </strong>{" "}
            {totalTexturas}
          </p>

          <p>
            <strong>
              Alergias:
            </strong>{" "}
            {totalAlergias}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Producoes;