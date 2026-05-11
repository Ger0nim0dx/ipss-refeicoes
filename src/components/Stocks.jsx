import { useState } from "react";

export default function Stocks() {
  const stocksGuardados =
    JSON.parse(localStorage.getItem("ipssStocks")) || [];

  const movimentosGuardados =
    JSON.parse(localStorage.getItem("ipssMovimentosStock")) || [];

  const [produto, setProduto] = useState("");
  const [categoria, setCategoria] = useState("Mercearia");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("kg");
  const [validade, setValidade] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [stockMinimo, setStockMinimo] = useState("");

  const [listaStocks, setListaStocks] = useState(stocksGuardados);
  const [movimentos, setMovimentos] = useState(movimentosGuardados);

  function guardarDados(novosStocks, novosMovimentos) {
    setListaStocks(novosStocks);
    setMovimentos(novosMovimentos);

    localStorage.setItem("ipssStocks", JSON.stringify(novosStocks));
    localStorage.setItem(
      "ipssMovimentosStock",
      JSON.stringify(novosMovimentos)
    );
  }

  function adicionarProduto() {
    if (!produto || !quantidade) return;

    const novoProduto = {
      id: Date.now(),
      produto,
      categoria,
      quantidade: Number(quantidade),
      unidade,
      validade,
      fornecedor,
      stockMinimo: Number(stockMinimo) || 0,
    };

    const novoMovimento = {
      id: Date.now() + 1,
      data: new Date().toLocaleDateString("pt-PT"),
      produto,
      tipo: "Entrada inicial",
      quantidade: Number(quantidade),
      unidade,
    };

    guardarDados(
      [novoProduto, ...listaStocks],
      [novoMovimento, ...movimentos]
    );

    setProduto("");
    setQuantidade("");
    setValidade("");
    setFornecedor("");
    setStockMinimo("");
  }

  function entradaStock(id) {
    const valor = Number(prompt("Quantidade a adicionar:"));

    if (!valor || valor <= 0) return;

    const novosStocks = listaStocks.map((item) =>
      item.id === id
        ? {
            ...item,
            quantidade: Number(item.quantidade) + valor,
          }
        : item
    );

    const produtoSelecionado = listaStocks.find((item) => item.id === id);

    const novoMovimento = {
      id: Date.now(),
      data: new Date().toLocaleDateString("pt-PT"),
      produto: produtoSelecionado.produto,
      tipo: "Entrada",
      quantidade: valor,
      unidade: produtoSelecionado.unidade,
    };

    guardarDados(novosStocks, [novoMovimento, ...movimentos]);
  }

  function saidaStock(id) {
    const valor = Number(prompt("Quantidade a retirar:"));

    if (!valor || valor <= 0) return;

    const produtoSelecionado = listaStocks.find((item) => item.id === id);

    if (valor > Number(produtoSelecionado.quantidade)) {
      alert("Não existe stock suficiente.");
      return;
    }

    const novosStocks = listaStocks.map((item) =>
      item.id === id
        ? {
            ...item,
            quantidade: Number(item.quantidade) - valor,
          }
        : item
    );

    const novoMovimento = {
      id: Date.now(),
      data: new Date().toLocaleDateString("pt-PT"),
      produto: produtoSelecionado.produto,
      tipo: "Saída",
      quantidade: valor,
      unidade: produtoSelecionado.unidade,
    };

    guardarDados(novosStocks, [novoMovimento, ...movimentos]);
  }

  function apagarProduto(id) {
    const confirmar = confirm("Tens a certeza que queres apagar este produto?");

    if (!confirmar) return;

    const novosStocks = listaStocks.filter((item) => item.id !== id);

    guardarDados(novosStocks, movimentos);
  }

  return (
    <div>
      <h2>Gestão de Stocks</h2>

      <p className="subtitulo">
        Controlo de produtos, entradas, saídas, validade e stock mínimo.
      </p>

      <div className="painel">
        <h3>Novo produto</h3>

        <label>Produto</label>
        <input
          type="text"
          value={produto}
          onChange={(e) => setProduto(e.target.value)}
        />

        <label>Categoria</label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
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

      <div className="historico-grid">
        {listaStocks.map((item) => {
          const baixoStock =
            Number(item.quantidade) <= Number(item.stockMinimo);

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

              <p>
                <strong>Fornecedor:</strong> {item.fornecedor || "-"}
              </p>

              <p>
                <strong>Stock mínimo:</strong> {item.stockMinimo} {item.unidade}
              </p>

              {baixoStock && (
                <p
                  style={{
                    color: "#dc2626",
                    fontWeight: "bold",
                  }}
                >
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