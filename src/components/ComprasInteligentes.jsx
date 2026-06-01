import { useEffect, useState } from "react";
import {
  ShoppingCart,
  AlertTriangle,
  Package,
  ClipboardList,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "../supabaseClient";

function ComprasInteligentes() {
  const [stocks, setStocks] = useState([]);
  const [ementas, setEmentas] = useState([]);
  const [fichas, setFichas] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { data: stocksData } = await supabase
      .from("stocks")
      .select("*")
      .eq("user_id", user.id);

    const { data: ementasData } = await supabase
      .from("ementas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: fichasData } = await supabase
      .from("fichas_tecnicas")
      .select("*")
      .eq("user_id", user.id);

    const fichasFormatadas = (fichasData || []).map((ficha) => ({
      id: ficha.id,
      nome: ficha.nome,
      categoria: ficha.categoria,
      doses: ficha.doses,
      ...ficha.dados,
    }));

    setStocks(stocksData || []);
    setEmentas(ementasData || []);
    setFichas(fichasFormatadas);
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function encontrarProdutoStock(nomeIngrediente) {
    return stocks.find((item) => {
      const nomeStock = normalizarTexto(item.produto || item.nome);
      const ingredienteNormalizado = normalizarTexto(nomeIngrediente);

      return (
        nomeStock === ingredienteNormalizado ||
        nomeStock.includes(ingredienteNormalizado) ||
        ingredienteNormalizado.includes(nomeStock)
      );
    });
  }

  const produtosStockBaixo = stocks.filter(
    (item) =>
      Number(item.quantidade || 0) <=
      Number(item.stock_minimo || item.stockMinimo || 0)
  );

  const ementaAtual = ementas[0]?.dados || {};
  const ingredientesPrevistos = {};

  Object.values(ementaAtual).forEach((refeicoesDia) => {
    Object.values(refeicoesDia || {}).forEach((receitaId) => {
      const ficha = fichas.find((item) => String(item.id) === String(receitaId));

      if (!ficha) return;

      ficha.ingredientes?.forEach((ingrediente) => {
        const chave = normalizarTexto(ingrediente.nome);

        if (!ingredientesPrevistos[chave]) {
          ingredientesPrevistos[chave] = {
            nome: ingrediente.nome,
            quantidadeNecessaria: 0,
          };
        }

        ingredientesPrevistos[chave].quantidadeNecessaria += Number(
          ingrediente.quantidade || 0
        );
      });
    });
  });

  const sugestoesCompras = Object.values(ingredientesPrevistos)
    .map((ingrediente) => {
      const produtoStock = encontrarProdutoStock(ingrediente.nome);

      const stockAtual = Number(produtoStock?.quantidade || 0);
      const stockMinimo = Number(
        produtoStock?.stock_minimo || produtoStock?.stockMinimo || 0
      );

      const quantidadeNecessariaKg = ingrediente.quantidadeNecessaria / 1000;

      const quantidadeComprar = produtoStock
        ? Math.max(0, quantidadeNecessariaKg + stockMinimo - stockAtual)
        : quantidadeNecessariaKg;

      let prioridade = "normal";

      if (!produtoStock) prioridade = "alta";
      else if (stockAtual <= stockMinimo) prioridade = "alta";
      else if (quantidadeComprar > 0) prioridade = "média";

      return {
        produto: ingrediente.nome,
        stockAtual,
        stockMinimo,
        quantidadeNecessariaKg,
        quantidadeComprar,
        prioridade,
        existeStock: !!produtoStock,
        unidade: produtoStock?.unidade || "kg",
      };
    })
    .filter((item) => item.quantidadeComprar > 0 || item.prioridade === "alta")
    .sort((a, b) => {
      const peso = { alta: 3, média: 2, normal: 1 };
      return peso[b.prioridade] - peso[a.prioridade];
    });

  const comprasDiretasStockBaixo = produtosStockBaixo
    .filter(
      (produto) =>
        !sugestoesCompras.some(
          (item) =>
            normalizarTexto(item.produto) ===
            normalizarTexto(produto.produto || produto.nome)
        )
    )
    .map((produto) => ({
      produto: produto.produto || produto.nome,
      stockAtual: Number(produto.quantidade || 0),
      stockMinimo: Number(produto.stock_minimo || produto.stockMinimo || 0),
      quantidadeNecessariaKg: 0,
      quantidadeComprar: Math.max(
        0,
        Number(produto.stock_minimo || produto.stockMinimo || 0) -
          Number(produto.quantidade || 0)
      ),
      prioridade: "alta",
      existeStock: true,
      unidade: produto.unidade || "",
    }));

  const listaComprasFinal = [
    ...sugestoesCompras,
    ...comprasDiretasStockBaixo,
  ];

  function exportarPDF() {
    const doc = new jsPDF();
    const dataAtual = new Date().toLocaleDateString("pt-PT");

    doc.setFontSize(20);
    doc.text("IPSS Gestão", 14, 20);

    doc.setFontSize(16);
    doc.text("Lista de Compras Inteligente", 14, 32);

    doc.setFontSize(10);
    doc.text(`Gerado em: ${dataAtual}`, 14, 40);

    autoTable(doc, {
      startY: 52,
      head: [["Produto", "Stock atual", "Stock mínimo", "Comprar", "Prioridade"]],
      body:
        listaComprasFinal.length > 0
          ? listaComprasFinal.map((item) => [
              item.produto,
              `${item.stockAtual} ${item.unidade}`,
              `${item.stockMinimo} ${item.unidade}`,
              `${item.quantidadeComprar.toFixed(2)} ${item.unidade}`,
              item.prioridade,
            ])
          : [["Sem compras sugeridas", "-", "-", "-", "-"]],
      headStyles: {
        fillColor: [20, 92, 42],
      },
    });

    doc.save("lista-compras-inteligente.pdf");
  }

  return (
    <div className="pagina">
      <h1>
        <ShoppingCart size={32} /> Compras Inteligentes
      </h1>

      <p className="descricao">
        Lista automática de compras com base no stock atual, stock mínimo e
        ementa planeada.
      </p>

      <div className="dashboard-cards">
        <div className="dashboard-card destaque">
          <ShoppingCart size={30} />
          <h3>Sugestões</h3>
          <p>{listaComprasFinal.length}</p>
          <span>Produtos a comprar</span>
        </div>

        <div className="dashboard-card">
          <AlertTriangle size={30} />
          <h3>Prioridade alta</h3>
          <p>
            {
              listaComprasFinal.filter((item) => item.prioridade === "alta")
                .length
            }
          </p>
          <span>Compra urgente</span>
        </div>

        <div className="dashboard-card">
          <Package size={30} />
          <h3>Stock baixo</h3>
          <p>{produtosStockBaixo.length}</p>
          <span>Produtos críticos</span>
        </div>

        <div className="dashboard-card">
          <ClipboardList size={30} />
          <h3>Ementas</h3>
          <p>{ementas.length}</p>
          <span>Planeamentos ativos</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Lista automática de compras</h2>

        {listaComprasFinal.length === 0 ? (
          <p className="success-message">
            Não existem compras críticas sugeridas neste momento.
          </p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Stock atual</th>
                <th>Stock mínimo</th>
                <th>Comprar</th>
                <th>Prioridade</th>
              </tr>
            </thead>

            <tbody>
              {listaComprasFinal.map((item, index) => (
                <tr key={index}>
                  <td>{item.produto}</td>
                  <td>
                    {item.stockAtual} {item.unidade}
                  </td>
                  <td>
                    {item.stockMinimo} {item.unidade}
                  </td>
                  <td>
                    <strong>
                      {item.quantidadeComprar.toFixed(2)} {item.unidade}
                    </strong>
                  </td>
                  <td>
                    <strong>{item.prioridade}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Análise inteligente</h2>

        {listaComprasFinal.length === 0 ? (
          <p>A operação não apresenta necessidades críticas de compra.</p>
        ) : (
          <>
            <p>
              Foram identificados <strong>{listaComprasFinal.length}</strong>{" "}
              produtos com necessidade de compra.
            </p>

            <p>
              A prioridade deve ser dada aos produtos assinalados como{" "}
              <strong>alta</strong>, especialmente quando não existem em stock ou
              estão abaixo do stock mínimo.
            </p>
          </>
        )}
      </div>

      <div className="botoes-formulario">
        <button className="botao-principal" onClick={exportarPDF}>
          <Download size={18} /> Exportar lista PDF
        </button>
      </div>
    </div>
  );
}

export default ComprasInteligentes;