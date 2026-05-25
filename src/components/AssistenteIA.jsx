import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function AssistenteIA() {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");

  const [stocks, setStocks] = useState([]);
  const [haccp, setHaccp] = useState([]);
  const [dietas, setDietas] = useState([]);

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

    setStocks(stocksData || []);
    setHaccp(haccpData || []);
    setDietas(dietasData || []);
  }

  function perguntarIA() {
    const perguntaNormalizada =
      pergunta.toLowerCase();

    const produtosCriticos =
      stocks.filter(
        (item) =>
          Number(item.quantidade || 0) <=
          Number(item.stock_minimo || 0)
      );

    const alertasHaccp =
      haccp.filter(
        (item) =>
          item.tipo_registo ===
            "nao_conformidade" ||
          item.estado === "Crítico"
      );

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
        `Existem ${alertasHaccp.length} alertas HACCP que devem ser verificados.`
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

    if (
      perguntaNormalizada.includes(
        "desperdício"
      )
    ) {
      const produtosAExpirar =
        stocks.filter((item) => {
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

          return (
            dias >= 0 &&
            dias <= 7
          );
        });

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

    setResposta(
      "Ainda estou a aprender. Experimenta perguntar sobre compras, HACCP, dietas ou desperdício."
    );
  }

  return (
    <div className="pagina">
      <h1>
        Assistente IA Operacional
      </h1>

      <p className="descricao">
        Assistente inteligente para apoio à gestão alimentar da IPSS.
      </p>

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
          onClick={perguntarIA}
        >
          Perguntar à IA
        </button>
      </div>

      {resposta && (
        <div className="dashboard-section">
          <h2>Resposta da IA</h2>

          <pre
            style={{
              whiteSpace:
                "pre-wrap",
              lineHeight: 1.7,
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