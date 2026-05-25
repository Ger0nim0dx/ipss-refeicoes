import { useEffect, useState } from "react";
import {
  BrainCircuit,
  ShoppingCart,
  AlertTriangle,
  ShieldAlert,
  Trash2,
  Sparkles,
  ClipboardList,
} from "lucide-react";

import { supabase } from "../supabaseClient";

function AssistenteIA() {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");

  const [stocks, setStocks] = useState([]);
  const [haccp, setHaccp] = useState([]);
  const [dietas, setDietas] = useState([]);
  const [movimentos, setMovimentos] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data: userData } =
      await supabase.auth.getUser();

    const user = userData?.user;

    if (!user) return;

    const { data: stocksData } =
      await supabase
        .from("stocks")
        .select("*")
        .eq("user_id", user.id);

    const { data: haccpData } =
      await supabase
        .from("haccp")
        .select("*")
        .eq("user_id", user.id);

    const { data: dietasData } =
      await supabase
        .from("dietas")
        .select("*")
        .eq("user_id", user.id);

    const { data: movimentosData } =
      await supabase
        .from("movimentos_stock")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(10);

    setStocks(stocksData || []);
    setHaccp(haccpData || []);
    setDietas(dietasData || []);
    setMovimentos(
      movimentosData || []
    );
  }

  function obterProdutosCriticos() {
    return stocks.filter(
      (item) =>
        Number(item.quantidade || 0) <=
        Number(item.stock_minimo || 0)
    );
  }

  function obterAlertasHaccp() {
    return haccp.filter(
      (item) =>
        item.tipo_registo ===
          "nao_conformidade" ||
        item.estado === "Crítico"
    );
  }

  function obterProdutosAExpirar() {
    return stocks.filter((item) => {
      if (!item.validade)
        return false;

      const validade =
        new Date(item.validade);

      const hoje = new Date();

      const dias =
        Math.ceil(
          (validade - hoje) /
            (1000 *
              60 *
              60 *
              24)
        );

      return dias >= 0 && dias <= 7;
    });
  }

  function responderIA(
    perguntaTexto
  ) {
    const perguntaNormalizada =
      perguntaTexto.toLowerCase();

    const produtosCriticos =
      obterProdutosCriticos();

    const alertasHaccp =
      obterAlertasHaccp();

    const produtosAExpirar =
      obterProdutosAExpirar();

    if (
      perguntaNormalizada.includes(
        "comprar"
      )
    ) {
      if (
        produtosCriticos.length === 0
      ) {
        setResposta(
          "Neste momento não existem produtos críticos em stock."
        );

        return;
      }

      setResposta(
        `Sugestão de compras:\n\n${produtosCriticos
          .map(
            (item) =>
              `• ${
                item.produto ||
                item.nome
              }`
          )
          .join("\n")}`
      );

      return;
    }

    if (
      perguntaNormalizada.includes(
        "desperdício"
      )
    ) {
      if (
        produtosAExpirar.length === 0
      ) {
        setResposta(
          "Não foram identificados produtos em risco de desperdício."
        );

        return;
      }

      setResposta(
        `Produtos que devem ser utilizados rapidamente:\n\n${produtosAExpirar
          .map(
            (item) =>
              `• ${
                item.produto ||
                item.nome
              }`
          )
          .join("\n")}`
      );

      return;
    }

    if (
      perguntaNormalizada.includes(
        "haccp"
      )
    ) {
      if (alertasHaccp.length === 0) {
        setResposta(
          "Não existem alertas HACCP críticos."
        );

        return;
      }

      setResposta(
        `Existem ${alertasHaccp.length} alertas HACCP que devem ser verificados imediatamente.`
      );

      return;
    }

    if (
      perguntaNormalizada.includes(
        "prioridades"
      )
    ) {
      setResposta(
        `
Prioridades operacionais de hoje:

• Produtos críticos: ${produtosCriticos.length}
• Produtos a expirar: ${produtosAExpirar.length}
• Alertas HACCP: ${alertasHaccp.length}
• Dietas especiais: ${dietas.length}

Sugestão:
Verificar validade, reforçar compras críticas e validar HACCP.
`
      );

      return;
    }

    if (
      perguntaNormalizada.includes(
        "direção"
      )
    ) {
      setResposta(
        `
Resumo executivo:

• Produtos em stock: ${stocks.length}
• Produtos críticos: ${produtosCriticos.length}
• Alertas HACCP: ${alertasHaccp.length}
• Dietas especiais: ${dietas.length}
• Últimos movimentos: ${movimentos.length}

Estado operacional:
${
  alertasHaccp.length > 0
    ? "Necessita atenção."
    : "Operação estável."
}
`
      );

      return;
    }

    if (
      perguntaNormalizada.includes(
        "dieta"
      )
    ) {
      setResposta(
        `Existem ${dietas.length} dietas especiais registadas.`
      );

      return;
    }

    setResposta(
      "Ainda estou a aprender. Experimenta perguntar sobre compras, desperdício, HACCP, prioridades ou direção."
    );
  }

  return (
    <div className="pagina">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <BrainCircuit size={34} />

        <div>
          <h1>
            Assistente IA
            Operacional
          </h1>

          <p className="descricao">
            Inteligência operacional
            para apoio à gestão
            alimentar da IPSS.
          </p>
        </div>
      </div>

      <div className="dashboard-cards">
        <button
          className="dashboard-card"
          onClick={() =>
            responderIA(
              "o que devo comprar"
            )
          }
        >
          <ShoppingCart size={30} />

          <h3>Compras</h3>

          <span>
            Produtos críticos
          </span>
        </button>

        <button
          className="dashboard-card"
          onClick={() =>
            responderIA(
              "risco desperdício"
            )
          }
        >
          <Trash2 size={30} />

          <h3>Desperdício</h3>

          <span>
            Produtos a expirar
          </span>
        </button>

        <button
          className="dashboard-card"
          onClick={() =>
            responderIA(
              "estado haccp"
            )
          }
        >
          <ShieldAlert size={30} />

          <h3>HACCP</h3>

          <span>
            Segurança alimentar
          </span>
        </button>

        <button
          className="dashboard-card"
          onClick={() =>
            responderIA(
              "prioridades hoje"
            )
          }
        >
          <AlertTriangle size={30} />

          <h3>Prioridades</h3>

          <span>
            Ações recomendadas
          </span>
        </button>

        <button
          className="dashboard-card"
          onClick={() =>
            responderIA(
              "resumo direção"
            )
          }
        >
          <ClipboardList size={30} />

          <h3>Resumo</h3>

          <span>
            Informação executiva
          </span>
        </button>
      </div>

      <div className="painel">
        <label>
          Faz uma pergunta à IA
        </label>

        <textarea
          value={pergunta}
          onChange={(e) =>
            setPergunta(
              e.target.value
            )
          }
          placeholder="Ex: O que devo comprar esta semana?"
        />

        <button
          className="botao-principal"
          onClick={() =>
            responderIA(
              pergunta
            )
          }
        >
          <Sparkles size={18} />
          Perguntar à IA
        </button>
      </div>

      {resposta && (
        <div className="dashboard-section">
          <h2>
            Resposta da IA
          </h2>

          <pre
            style={{
              whiteSpace:
                "pre-wrap",
              lineHeight: 1.8,
              fontFamily:
                "inherit",
            }}
          >
            {resposta}
          </pre>
        </div>
      )}
    </div>
  );
}

export default AssistenteIA;