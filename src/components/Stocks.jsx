import { useEffect, useState } from "react";

export default function Stocks() {
  const fichasGuardadas =
    JSON.parse(localStorage.getItem("ipssFichasTecnicas")) || [];

  const movimentosGuardados =
    JSON.parse(localStorage.getItem("ipssMovimentosStock")) || [];

  const [produto, setProduto] = useState("");
  const [categoria, setCategoria] = useState("Mercearia");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("kg");
  const [validade, setValidade] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [stockMinimo, setStockMinimo] = useState("");

  const [listaStocks, setListaStocks] = useState([]);
  const [movimentos, setMovimentos] = useState(movimentosGuardados);

  const [fichaSelecionadaId, setFichaSelecionadaId] = useState("");
  const [dosesPlaneadas, setDosesPlaneadas] = useState(0);

  useEffect(() => {
    carregarStocks();
  }, []);

  async function carregarStocks() {
    const { data, error } = await supabase
      .from("stocks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar stocks.");
      console.error(error);
      return;
    }

    const stocksFormatados = data.map((item) => ({
      id: item.id,
      produto: item.produto,
      categoria: item.categoria,
      quantidade: Number(item.quantidade || 0),
      unidade: item.unidade,
      validade: item.validade,
      fornecedor: item.fornecedor,
      stockMinimo: Number(item.stock_minimo || 0),
    }));

    setListaStocks(stocksFormatados);
  }

  const fichaSelecionada = fichasGuardadas.find(
    (ficha) => String(ficha.id) === String(fichaSelecionadaId)
  );

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  function diasAteValidade(data) {
    if (!data) return null;

    const validadeData = new Date(data);
    validadeData.setHours(0, 0, 0, 0);

    const diferenca = validadeData - hoje;
    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
  }

  const produtosStockBaixo = listaStocks.filter(
    (item) => Number(item.quantidade) <= Number(item.stockMinimo)
  );

  const produtosExpirados = listaStocks.filter((item) => {
    const dias = diasAteValidade(item.validade);
    return dias !== null && dias < 0;
  });

  const produtosAExpirar = listaStocks.filter((item) => {
    const dias = diasAteValidade(item.validade);
    return dias !== null && dias >= 0 && dias <= 7;
  });

  function guardarMovimentos(novosMovimentos) {
    setMovimentos(novosMovimentos);
    localStorage.setItem("ipssMovimentosStock", JSON.stringify(novosMovimentos));
  }

  async function adicionarProduto() {
    if (!produto || !quantidade) {
      alert("Indica o produto e a quantidade.");
      return;
    }

    const { error } = await supabase.from("stocks").insert([
      {
        produto,
        categoria,
        quantidade: Number(quantidade),
        unidade,
        validade: validade || null,
        fornecedor,
        stock_minimo: Number(stockMinimo) || 0,
      },
    ]);

    if (error) {
      alert("Erro ao guardar stock no Supabase.");
      console.error(error);
      return;
    }

    const novoMovimento = {
      id: Date.now(),
      data: new Date().toLocaleDateString("pt-PT"),
      produto,
      tipo: "Entrada inicial",
      quantidade: Number(quantidade),
      unidade,
    };

    guardarMovimentos([novoMovimento, ...movimentos]);

    setProduto("");
    setQuantidade("");
    setValidade("");
    setFornecedor("");
    setStockMinimo("");

    await carregarStocks();
  }

  async function entradaStock(id) {
    const valor = Number(prompt("Quantidade a adicionar:"));
    if (!valor || valor <= 0) return;

    const produtoSelecionado = listaStocks.find((item) => item.id === id);
    if (!produtoSelecionado) return;

    const novaQuantidade = Number(produtoSelecionado.quantidade) + valor;

    const { error } = await supabase
      .from("stocks")
      .update({ quantidade: novaQuantidade })
      .eq("id", id);

    if (error) {
      alert("Erro ao atualizar entrada de stock.");
      console.error(error);
      return;
    }

    const novoMovimento = {
      id: Date.now(),
      data: new Date().toLocaleDateString("pt-PT"),
      produto: produtoSelecionado.produto,
      tipo: "Entrada",
      quantidade: valor,
      unidade: produtoSelecionado.unidade,
    };

    guardarMovimentos([novoMovimento, ...movimentos]);
    await carregarStocks();
  }

  async function saidaStock(id) {
    const valor = Number(prompt("Quantidade a retirar:"));
    if (!valor || valor <= 0) return;

    const produtoSelecionado = listaStocks.find((item) => item.id === id);
    if (!produtoSelecionado) return;

    if (valor > Number(produtoSelecionado.quantidade)) {
      alert("Não existe stock suficiente.");
      return;
    }

    const novaQuantidade = Number(produtoSelecionado.quantidade) - valor;

    const { error } = await supabase
      .from("stocks")
      .update({ quantidade: novaQuantidade })
      .eq("id", id);

    if (error) {
      alert("Erro ao atualizar saída de stock.");
      console.error(error);
      return;
    }

    const novoMovimento = {
      id: Date.now(),
      data: new Date().toLocaleDateString("pt-PT"),
      produto: produtoSelecionado.produto,
      tipo: "Saída",
      quantidade: valor,
      unidade: produtoSelecionado.unidade,
    };

    guardarMovimentos([novoMovimento, ...movimentos]);
    await carregarStocks();
  }

  async function apagarProduto(id) {
    const confirmar = confirm("Tens a certeza que queres apagar este produto?");
    if (!confirmar) return;

    const { error } = await supabase.from("stocks").delete().eq("id", id);

    if (error) {
      alert("Erro ao apagar produto.");
      console.error(error);
      return;
    }

    await carregarStocks();
  }

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

  function formatarQuantidade(gramas) {
    if (gramas >= 1000) {
      return `${(gramas / 1000).toFixed(2)} kg`;
    }

    return `${gramas.toFixed(0)} g`;
  }

  const dosesFicha = Number(fichaSelecionada?.doses) || 1;

  const fatorProducao =
    fichaSelecionada && Number(dosesPlaneadas) > 0
      ? Number(dosesPlaneadas) / dosesFicha
      : 0;

  const verificacaoStock =
    fichaSelecionada?.ingredientes?.map((ingrediente) => {
      const quantidadeNecessaria =
        Number(ingrediente.quantidade || 0) * fatorProducao;

      const produtoStock = listaStocks.find(
        (item) =>
          normalizarTexto(item.produto) === normalizarTexto(ingrediente.nome)
      );

      const stockDisponivel = produtoStock
        ? converterParaGramas(produtoStock.quantidade, produtoStock.unidade)
        : 0;

      const diferenca = stockDisponivel - quantidadeNecessaria;

      return {
        ingrediente: ingrediente.nome,
        quantidadeNecessaria,
        stockDisponivel,
        diferenca,
        suficiente: diferenca >= 0,
        produtoStock,
      };
    }) || [];

  async function descontarProducaoDoStock() {
    if (!fichaSelecionada || !dosesPlaneadas) {
      alert("Seleciona uma receita e indica o número de doses.");
      return;
    }

    const insuficientes = verificacaoStock.filter((item) => !item.suficiente);

    if (insuficientes.length > 0) {
      alert("Não é possível descontar: existem ingredientes insuficientes.");
      return;
    }

    const confirmar = confirm(
      "Confirmas a saída automática de stock para esta produção?"
    );

    if (!confirmar) return;

    const novosMovimentos = [];

    for (const verificacao of verificacaoStock) {
      const produtoStock = verificacao.produtoStock;

      if (!produtoStock) continue;

      const stockAtualGramas = converterParaGramas(
        produtoStock.quantidade,
        produtoStock.unidade
      );

      const novoStockGramas =
        stockAtualGramas - verificacao.quantidadeNecessaria;

      const novaQuantidade = converterDeGramas(
        novoStockGramas,
        produtoStock.unidade
      );

      const { error } = await supabase
        .from("stocks")
        .update({ quantidade: Number(novaQuantidade.toFixed(3)) })
        .eq("id", produtoStock.id);

      if (error) {
        alert(`Erro ao descontar ${produtoStock.produto}.`);
        console.error(error);
        return;
      }

      novosMovimentos.push({
        id: Date.now() + Math.random(),
        data: new Date().toLocaleDateString("pt-PT"),
        produto: produtoStock.produto,
        tipo: `Saída produção - ${fichaSelecionada.nome}`,
        quantidade: Number(verificacao.quantidadeNecessaria.toFixed(0)),
        unidade: "g",
      });
    }

    guardarMovimentos([...novosMovimentos, ...movimentos]);

    await carregarStocks();

    alert("Stock descontado com sucesso.");
  }

  return (
    <div>
      <h2>Gestão de Stocks</h2>

      <p className="subtitulo">
        Controlo de produtos, entradas, saídas, validade, stock mínimo, produção
        e lista automática de compras.
      </p>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Total de produtos</h3>
          <p>{listaStocks.length}</p>
          <span>Produtos registados</span>
        </div>

        <div className="dashboard-card">
          <h3>Stock baixo</h3>
          <p>{produtosStockBaixo.length}</p>
          <span>Produtos abaixo do mínimo</span>
        </div>

        <div className="dashboard-card">
          <h3>A expirar</h3>
          <p>{produtosAExpirar.length}</p>
          <span>Nos próximos 7 dias</span>
        </div>

        <div className="dashboard-card">
          <h3>Expirados</h3>
          <p>{produtosExpirados.length}</p>
          <span>Validade ultrapassada</span>
        </div>
      </div>

      {(produtosStockBaixo.length > 0 ||
        produtosAExpirar.length > 0 ||
        produtosExpirados.length > 0) && (
        <section className="dashboard-section">
          <h2>Alertas automáticos</h2>

          {produtosStockBaixo.length > 0 && (
            <p style={{ color: "#dc2626", fontWeight: "bold" }}>
              ⚠ Existem {produtosStockBaixo.length} produtos com stock baixo.
            </p>
          )}

          {produtosAExpirar.length > 0 && (
            <p style={{ color: "#ca8a04", fontWeight: "bold" }}>
              ⚠ Existem {produtosAExpirar.length} produtos a expirar nos
              próximos 7 dias.
            </p>
          )}

          {produtosExpirados.length > 0 && (
            <p style={{ color: "#991b1b", fontWeight: "bold" }}>
              ❌ Existem {produtosExpirados.length} produtos com validade
              expirada.
            </p>
          )}
        </section>
      )}

      <div className="painel">
        <h3>Novo produto</h3>

        <label>Produto</label>
        <input
          type="text"
          value={produto}
          onChange={(e) => setProduto(e.target.value)}
          placeholder="Ex.: Frango"
        />

        <label>Categoria</label>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option>Mercearia</option>
          <option>Congelados</option>
          <option>Frescos</option>
          <option>Laticínios</option>
          <option>Legumes</option>
          <option>Carne</option>
          <option>Peixe</option>
          <option>Padaria</option>
        </select>

        <label>Quantidade inicial</label>
        <input
          type="number"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
        />

        <label>Unidade</label>
        <select value={unidade} onChange={(e) => setUnidade(e.target.value)}>
          <option>kg</option>
          <option>g</option>
          <option>L</option>
          <option>ml</option>
          <option>unidades</option>
        </select>

        <label>Data de validade</label>
        <input
          type="date"
          value={validade}
          onChange={(e) => setValidade(e.target.value)}
        />

        <label>Fornecedor</label>
        <input
          type="text"
          value={fornecedor}
          onChange={(e) => setFornecedor(e.target.value)}
        />

        <label>Stock mínimo</label>
        <input
          type="number"
          value={stockMinimo}
          onChange={(e) => setStockMinimo(e.target.value)}
        />

        <button className="botao-principal" onClick={adicionarProduto}>
          Guardar produto
        </button>
      </div>

      <div className="painel">
        <h3>Verificação de produção</h3>

        <label>Selecionar receita</label>
        <select
          value={fichaSelecionadaId}
          onChange={(e) => setFichaSelecionadaId(e.target.value)}
        >
          <option value="">Selecionar ficha técnica</option>

          {fichasGuardadas.map((ficha) => (
            <option key={ficha.id} value={ficha.id}>
              {ficha.nome}
            </option>
          ))}
        </select>

        <label>Doses a produzir</label>
        <input
          type="number"
          value={dosesPlaneadas}
          onChange={(e) => setDosesPlaneadas(e.target.value)}
          placeholder="Ex.: 80"
        />

        {fichaSelecionada && Number(dosesPlaneadas) > 0 && (
          <>
            <div className="dashboard-cards">
              <div className="dashboard-card">
                <h3>Receita base</h3>
                <p>{fichaSelecionada.doses}</p>
                <span>Doses da ficha técnica</span>
              </div>

              <div className="dashboard-card">
                <h3>Doses a produzir</h3>
                <p>{dosesPlaneadas}</p>
                <span>Planeamento atual</span>
              </div>

              <div className="dashboard-card">
                <h3>Fator produção</h3>
                <p>{fatorProducao.toFixed(2)}x</p>
                <span>Multiplicador da receita</span>
              </div>
            </div>

            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Necessário</th>
                  <th>Disponível</th>
                  <th>Diferença</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {verificacaoStock.map((item, index) => (
                  <tr key={index}>
                    <td>{item.ingrediente}</td>
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

            {verificacaoStock.some((item) => !item.suficiente) && (
              <section className="dashboard-section">
                <h2>Lista automática de compras</h2>

                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Quantidade em falta</th>
                      <th>Observação</th>
                    </tr>
                  </thead>

                  <tbody>
                    {verificacaoStock
                      .filter((item) => !item.suficiente)
                      .map((item, index) => (
                        <tr key={index}>
                          <td>{item.ingrediente}</td>
                          <td>{formatarQuantidade(Math.abs(item.diferenca))}</td>
                          <td>Adicionar à próxima compra</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </section>
            )}

            <button
              className="botao-principal"
              onClick={descontarProducaoDoStock}
            >
              Descontar produção ao stock
            </button>
          </>
        )}
      </div>

      <div className="historico-grid">
        {listaStocks.map((item) => {
          const baixoStock =
            Number(item.quantidade) <= Number(item.stockMinimo);

          const diasValidade = diasAteValidade(item.validade);

          return (
            <div className="historico-card" key={item.id}>
              <h3>{item.produto}</h3>

              <p>
                <strong>Categoria:</strong> {item.categoria}
              </p>

              <p>
                <strong>Quantidade atual:</strong> {item.quantidade}{" "}
                {item.unidade}
              </p>

              <p>
                <strong>Validade:</strong> {item.validade || "-"}
              </p>

              {diasValidade !== null && diasValidade < 0 && (
                <p style={{ color: "#991b1b", fontWeight: "bold" }}>
                  ❌ Validade expirada
                </p>
              )}

              {diasValidade !== null &&
                diasValidade >= 0 &&
                diasValidade <= 7 && (
                  <p style={{ color: "#ca8a04", fontWeight: "bold" }}>
                    ⚠ Expira em {diasValidade} dias
                  </p>
                )}

              <p>
                <strong>Fornecedor:</strong> {item.fornecedor || "-"}
              </p>

              <p>
                <strong>Stock mínimo:</strong> {item.stockMinimo} {item.unidade}
              </p>

              {baixoStock && (
                <p style={{ color: "#dc2626", fontWeight: "bold" }}>
                  ⚠️ Stock baixo
                </p>
              )}

              <button
                className="botao-principal"
                onClick={() => entradaStock(item.id)}
              >
                Entrada
              </button>

              <button
                className="botao-secundario"
                onClick={() => saidaStock(item.id)}
              >
                Saída
              </button>

              <button
                className="botao-secundario"
                onClick={() => apagarProduto(item.id)}
              >
                Apagar
              </button>
            </div>
          );
        })}
      </div>

      <div className="painel">
        <h3>Histórico de movimentos</h3>

        {movimentos.length === 0 ? (
          <p>Sem movimentos registados.</p>
        ) : (
          movimentos.map((movimento) => (
            <p key={movimento.id}>
              <strong>{movimento.data}</strong> — {movimento.tipo} —{" "}
              {movimento.produto}: {movimento.quantidade} {movimento.unidade}
            </p>
          ))
        )}
      </div>
    </div>
  );
}