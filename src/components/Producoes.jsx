import { useEffect, useState } from "react";

import {
  Factory,
  CalendarDays,
  ClipboardList,
  Search,
  Package,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { supabase } from "../supabaseClient";

function Producoes() {
  const [producoes, setProducoes] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [stocks, setStocks] = useState([]);

  const [pesquisa, setPesquisa] = useState("");
  const [fichaSelecionadaId, setFichaSelecionadaId] = useState("");
  const [dosesProduzir, setDosesProduzir] = useState(10);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return;

    const { data: producoesData } = await supabase
      .from("producoes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: fichasData } = await supabase
      .from("fichas_tecnicas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: stocksData } = await supabase
      .from("stocks")
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

    setProducoes(producoesData || []);
    setFichas(fichasFormatadas);
    setStocks(stocksData || []);
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function converterParaBase(quantidade, unidade) {
    const valor = Number(quantidade) || 0;

    if (unidade === "kg") return valor * 1000;
    if (unidade === "g") return valor;
    if (unidade === "L") return valor * 1000;
    if (unidade === "ml") return valor;

    return valor;
  }

  function converterDaBase(valorBase, unidade) {
    if (unidade === "kg") return valorBase / 1000;
    if (unidade === "g") return valorBase;
    if (unidade === "L") return valorBase / 1000;
    if (unidade === "ml") return valorBase;

    return valorBase;
  }

  function formatarQuantidadeOperacional(valorBase, unidade = "g") {
    const valor = Number(valorBase) || 0;

    if (unidade === "L" || unidade === "ml") {
      return `${(valor / 1000).toFixed(2)} L`;
    }

    return `${(valor / 1000).toFixed(2)} kg`;
  }

  function encontrarProdutoStock(nomeIngrediente) {
    const ingredienteNormalizado = normalizarTexto(nomeIngrediente);

    return stocks.find((item) => {
      const nomeStock = normalizarTexto(item.produto || item.nome);

      return (
        nomeStock === ingredienteNormalizado ||
        nomeStock.includes(ingredienteNormalizado) ||
        ingredienteNormalizado.includes(nomeStock)
      );
    });
  }

  const fichaSelecionada = fichas.find(
    (ficha) => String(ficha.id) === String(fichaSelecionadaId)
  );

  const ingredientesCalculados =
    fichaSelecionada?.ingredientes?.map((ingrediente) => {
      const dosesBase = Number(fichaSelecionada.doses || 1);
      const fator = Number(dosesProduzir || 0) / dosesBase;

      const quantidadeNecessariaBase =
        Number(ingrediente.quantidade || 0) * fator;

      const produtoStock = encontrarProdutoStock(ingrediente.nome);

      const unidadeStock = produtoStock?.unidade || "g";

      const stockAtualBase = produtoStock
        ? converterParaBase(produtoStock.quantidade, unidadeStock)
        : 0;

      const stockDepoisBase = stockAtualBase - quantidadeNecessariaBase;

      return {
        nome: ingrediente.nome,
        quantidadeNecessariaBase,
        produtoStock,
        stockAtualBase,
        stockDepoisBase,
        unidadeStock,
        suficiente: produtoStock && stockDepoisBase >= 0,
      };
    }) || [];

  const ingredientesEmFalta = ingredientesCalculados.filter(
    (item) => !item.suficiente
  );

  async function executarProducao() {
    setMensagem("");

    if (!fichaSelecionada) {
      alert("Seleciona uma ficha técnica.");
      return;
    }

    if (!dosesProduzir || Number(dosesProduzir) <= 0) {
      alert("Indica um número de doses válido.");
      return;
    }

    if (
      !fichaSelecionada.ingredientes ||
      fichaSelecionada.ingredientes.length === 0
    ) {
      alert("A ficha técnica selecionada não tem ingredientes definidos.");
      return;
    }

    if (ingredientesEmFalta.length > 0) {
      alert(
        `Não é possível executar a produção.\n\nIngredientes em falta ou sem stock suficiente:\n\n${ingredientesEmFalta
          .map((item) => `• ${item.nome}`)
          .join("\n")}`
      );
      return;
    }

    const confirmar = confirm(
      `Confirmas a produção de ${dosesProduzir} doses de "${fichaSelecionada.nome}"?`
    );

    if (!confirmar) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      alert("Sessão inválida.");
      return;
    }

    const movimentos = [];

    for (const ingrediente of ingredientesCalculados) {
      const produtoStock = ingrediente.produtoStock;

      if (!produtoStock) continue;

      const novaQuantidade = converterDaBase(
        ingrediente.stockDepoisBase,
        produtoStock.unidade
      );

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

      movimentos.push({
        user_id: user.id,
        produto: produtoStock.produto || produtoStock.nome || ingrediente.nome,
        tipo: `Produção: ${fichaSelecionada.nome}`,
        quantidade: Number(ingrediente.quantidadeNecessariaBase.toFixed(0)),
        unidade: "g/ml",
        observacoes: `${dosesProduzir} doses produzidas`,
      });
    }

    if (movimentos.length > 0) {
      const { error: movimentosError } = await supabase
        .from("movimentos_stock")
        .insert(movimentos);

      if (movimentosError) {
        alert(movimentosError.message);
        return;
      }
    }

    const { error: producaoError } = await supabase.from("producoes").insert({
      user_id: user.id,
      dias: [],
      total_movimentos: movimentos.length,
      observacoes: `Produção inteligente: ${fichaSelecionada.nome} — ${dosesProduzir} doses`,
    });

    if (producaoError) {
      alert(producaoError.message);
      return;
    }

    setMensagem(
      `Produção executada com sucesso: ${fichaSelecionada.nome}, ${dosesProduzir} doses. Foram gerados ${movimentos.length} movimentos de stock.`
    );

    setFichaSelecionadaId("");
    setDosesProduzir(10);

    await carregarDados();
  }

  const producoesFiltradas = producoes.filter((producao) =>
    JSON.stringify(producao).toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="pagina">
      <div className="topo-dashboard">
        <div>
          <h1>
            <Factory size={28} /> Produções Inteligentes
          </h1>

          <p className="dashboard-subtitle">
            Execução de produção com consumo automático de stock.
          </p>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>
          <Factory size={22} /> Nova produção
        </h2>

        <div className="formulario">
          <label>Ficha técnica</label>

          <select
            value={fichaSelecionadaId}
            onChange={(e) => setFichaSelecionadaId(e.target.value)}
          >
            <option value="">Selecionar receita</option>

            {fichas.map((ficha) => (
              <option key={ficha.id} value={ficha.id}>
                {ficha.nome} — {ficha.doses} doses base
              </option>
            ))}
          </select>

          <label>Número de doses a produzir</label>

          <input
            type="number"
            min="1"
            value={dosesProduzir}
            onChange={(e) => setDosesProduzir(e.target.value)}
          />
        </div>

        {fichaSelecionada && (
          <div style={{ marginTop: "22px" }}>
            <h3>Ingredientes necessários</h3>

            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Necessário</th>
                  <th>Stock atual</th>
                  <th>Stock depois</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {ingredientesCalculados.map((item, index) => (
                  <tr key={index}>
                    <td>{item.nome}</td>

                    <td>
                      {formatarQuantidadeOperacional(
                        item.quantidadeNecessariaBase,
                        item.unidadeStock
                      )}
                    </td>

                    <td>
                      {formatarQuantidadeOperacional(
                        item.stockAtualBase,
                        item.unidadeStock
                      )}
                    </td>

                    <td>
                      {formatarQuantidadeOperacional(
                        item.stockDepoisBase,
                        item.unidadeStock
                      )}
                    </td>

                    <td>
                      {item.suficiente ? (
                        <span style={{ color: "#16a34a", fontWeight: "bold" }}>
                          OK
                        </span>
                      ) : (
                        <span style={{ color: "#dc2626", fontWeight: "bold" }}>
                          Em falta
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {ingredientesEmFalta.length > 0 && (
              <p style={{ color: "#dc2626", fontWeight: "bold", marginTop: 12 }}>
                <AlertTriangle size={18} /> Existem ingredientes sem stock
                suficiente.
              </p>
            )}

            {ingredientesEmFalta.length === 0 && (
              <p className="success-message" style={{ marginTop: 12 }}>
                <CheckCircle2 size={18} /> Stock suficiente para executar esta
                produção.
              </p>
            )}
          </div>
        )}

        <div className="botoes-formulario">
          <button className="botao-principal" onClick={executarProducao}>
            Executar produção
          </button>
        </div>

        {mensagem && <p className="success-message">{mensagem}</p>}
      </div>

      <div className="dashboard-section">
        <div className="topbar-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Pesquisar produção..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <Factory size={30} />
          <h3>Total produções</h3>
          <p>{producoes.length}</p>
          <span>Registos operacionais</span>
        </div>

        <div className="dashboard-card">
          <ClipboardList size={30} />
          <h3>Total movimentos</h3>
          <p>
            {producoes.reduce(
              (total, item) => total + Number(item.total_movimentos || 0),
              0
            )}
          </p>
          <span>Movimentos gerados</span>
        </div>

        <div className="dashboard-card">
          <Package size={30} />
          <h3>Fichas técnicas</h3>
          <p>{fichas.length}</p>
          <span>Receitas disponíveis</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>
          <CalendarDays size={20} /> Histórico de Produções
        </h2>

        {producoesFiltradas.length === 0 ? (
          <p>Ainda não existem produções registadas.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Dias produzidos</th>
                <th>Movimentos</th>
                <th>Observações</th>
              </tr>
            </thead>

            <tbody>
              {producoesFiltradas.map((producao, index) => (
                <tr key={index}>
                  <td>
                    {new Date(producao.created_at).toLocaleDateString("pt-PT")}
                  </td>

                  <td>
                    {Array.isArray(producao.dias) && producao.dias.length > 0
                      ? producao.dias.join(", ")
                      : "-"}
                  </td>

                  <td>{producao.total_movimentos}</td>

                  <td>{producao.observacoes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Producoes;