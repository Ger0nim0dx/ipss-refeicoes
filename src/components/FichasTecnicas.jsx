import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { alimentos } from "../data/alimentos";
import { supabase } from "../supabaseClient";

export default function FichasTecnicas() {
  const [listaFichas, setListaFichas] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [pedidoIA, setPedidoIA] = useState("");
  const [fichaEmEdicaoId, setFichaEmEdicaoId] = useState(null);

  const categoriasAlimentos = [
    ...new Set(alimentos.map((alimento) => alimento.categoria)),
  ];

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("Sopa");
  const [doses, setDoses] = useState(10);
  const [preparacao, setPreparacao] = useState("");
  const [alergenios, setAlergenios] = useState("");
  const [haccp, setHaccp] = useState("");

  const [ingredientes, setIngredientes] = useState([criarIngredienteVazio()]);

  function criarIngredienteVazio() {
    return {
      categoriaAlimentar: "",
      nome: "",
      quantidade: 0,
      unidade: "kg",
      qb: false,
      precoKg: 0,
      kcal: 0,
      proteina: 0,
      hidratos: 0,
      gordura: 0,
      fibra: 0,
      sal: 0,
    };
  }

  useEffect(() => {
    carregarFichas();
    carregarStocks();
  }, []);

  async function carregarStocks() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) return;

    const { data, error } = await supabase
      .from("stocks")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Erro ao carregar stocks:", error);
      return;
    }

    setStocks(data || []);
  }

  async function carregarFichas() {
    const { data, error } = await supabase
      .from("fichas_tecnicas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar fichas técnicas.");
      console.error(error);
      return;
    }

    const fichasFormatadas = (data || []).map((ficha) => ({
      id: ficha.id,
      nome: ficha.nome,
      categoria: ficha.categoria,
      doses: ficha.doses,
      ...ficha.dados,
    }));

    setListaFichas(fichasFormatadas);
  }

  function procurarPrecoStock(nomeAlimento) {
    const nomePesquisa = nomeAlimento.toLowerCase();

    const itemStock = stocks.find((item) => {
      const nomeStock =
        item.produto ||
        item.nome ||
        item.designacao ||
        item.alimento ||
        item.ingrediente ||
        "";

      return nomeStock.toLowerCase().includes(nomePesquisa);
    });

    if (!itemStock) return 0;

    return Number(
      itemStock.preco_kg ||
        itemStock.precoKg ||
        itemStock.preco_unitario ||
        itemStock.preco ||
        itemStock.valor_unitario ||
        0
    );
  }

  function procurarAlimento(nomeAlimento) {
    const encontrado = alimentos.find((alimento) =>
      alimento.nome.toLowerCase().includes(nomeAlimento.toLowerCase())
    );

    const precoStock = procurarPrecoStock(nomeAlimento);

    if (!encontrado) {
      return {
        ...criarIngredienteVazio(),
        nome: nomeAlimento,
        precoKg: precoStock,
      };
    }

    return {
      ...criarIngredienteVazio(),
      ...encontrado,
      categoriaAlimentar: encontrado.categoria,
      precoKg: precoStock,
    };
  }

  function converterQuantidadeParaUnidadePreco(quantidade, unidade) {
    const valor = Number(quantidade || 0);

    if (unidade === "g") return valor / 1000;
    if (unidade === "kg") return valor;
    if (unidade === "ml") return valor / 1000;
    if (unidade === "L") return valor;
    if (unidade === "un") return valor;

    return valor;
  }

  function converterQuantidadeParaGramas(quantidade, unidade) {
    const valor = Number(quantidade || 0);

    if (unidade === "kg") return valor * 1000;
    if (unidade === "g") return valor;
    if (unidade === "L") return valor * 1000;
    if (unidade === "ml") return valor;
    if (unidade === "un") return valor * 100;

    return valor;
  }

  function obterUnidadeIngrediente(item) {
    if (item.qb) return "";
    return item.unidade || "g";
  }

  function formatarQuantidadeIngrediente(item) {
    if (item.qb) return "q.b.";
    return `${item.quantidade || 0} ${obterUnidadeIngrediente(item)}`;
  }

  function gerarComIA() {
    if (!pedidoIA.trim()) {
      alert("Escreve primeiro o que pretendes gerar.");
      return;
    }

    const texto = pedidoIA.toLowerCase();

    let dosesEstimadas = 10;
    const numeroEncontrado = texto.match(/\d+/);

    if (numeroEncontrado) {
      dosesEstimadas = Number(numeroEncontrado[0]);
    }

    let fichaGerada = {
      nome: "Ficha técnica gerada",
      categoria: "Prato principal",
      preparacao:
        "Preparar os ingredientes, confecionar de acordo com as boas práticas de higiene e segurança alimentar, controlar temperaturas e empratar/servir de forma adequada.",
      alergenios:
        "Validar alergénios de acordo com os ingredientes utilizados.",
      haccp:
        "Garantir higienização das mãos, superfícies e utensílios. Controlar temperaturas de confeção, conservação e distribuição. Validar alergénios antes do serviço.",
      ingredientes: [
        { nome: "ingrediente principal", quantidade: 150 * dosesEstimadas },
        { nome: "acompanhamento", quantidade: 120 * dosesEstimadas },
        { nome: "legumes", quantidade: 80 * dosesEstimadas },
      ],
    };

    if (texto.includes("sopa")) {
      fichaGerada = {
        nome: "Sopa de legumes",
        categoria: "Sopa",
        preparacao:
          "Lavar, descascar e cortar os legumes. Colocar os ingredientes em água a ferver, cozinhar até ficarem macios e triturar até obter textura homogénea. Retificar a consistência e servir à temperatura adequada.",
        alergenios:
          "Sem alergénios principais identificados, salvo contaminação cruzada.",
        haccp:
          "Higienizar legumes. Controlar tempo e temperatura de confeção. Manter a sopa em temperatura segura até ao serviço.",
        ingredientes: [
          { nome: "batata", quantidade: 80 * dosesEstimadas },
          { nome: "cenoura", quantidade: 50 * dosesEstimadas },
          { nome: "cebola", quantidade: 20 * dosesEstimadas },
          { nome: "courgette", quantidade: 50 * dosesEstimadas },
          { nome: "azeite", quantidade: 5 * dosesEstimadas },
        ],
      };
    }

    if (texto.includes("arroz") && texto.includes("frango")) {
      fichaGerada = {
        nome: "Arroz de frango",
        categoria: "Prato principal",
        preparacao:
          "Preparar o refogado com cebola e azeite. Adicionar o frango e deixar cozinhar. Juntar arroz e água/caldo em quantidade adequada. Cozinhar até o arroz ficar no ponto e o frango completamente confecionado.",
        alergenios:
          "Pode conter vestígios de glúten dependendo do caldo utilizado. Validar ingredientes industriais.",
        haccp:
          "Garantir confeção completa do frango. Controlar temperatura no centro térmico. Evitar contaminação cruzada entre carne crua e alimentos confecionados.",
        ingredientes: [
          { nome: "arroz", quantidade: 70 * dosesEstimadas },
          { nome: "frango", quantidade: 120 * dosesEstimadas },
          { nome: "cebola", quantidade: 20 * dosesEstimadas },
          { nome: "cenoura", quantidade: 30 * dosesEstimadas },
          { nome: "azeite", quantidade: 5 * dosesEstimadas },
        ],
      };
    }

    if (texto.includes("massa") && texto.includes("atum")) {
      fichaGerada = {
        nome: "Massa com atum",
        categoria: "Prato principal",
        preparacao:
          "Cozer a massa em água. Preparar molho simples com cebola, tomate e azeite. Adicionar o atum escorrido e envolver com a massa.",
        alergenios: "Glúten e peixe.",
        haccp:
          "Controlar tempo de exposição do atum após abertura. Garantir conservação adequada e serviço em temperatura segura.",
        ingredientes: [
          { nome: "massa", quantidade: 80 * dosesEstimadas },
          { nome: "atum", quantidade: 70 * dosesEstimadas },
          { nome: "tomate", quantidade: 40 * dosesEstimadas },
          { nome: "cebola", quantidade: 20 * dosesEstimadas },
          { nome: "azeite", quantidade: 5 * dosesEstimadas },
        ],
      };
    }

    if (texto.includes("jardineira")) {
      fichaGerada = {
        nome: "Jardineira",
        categoria: "Prato principal",
        preparacao:
          "Preparar os legumes e a carne. Refogar a cebola, adicionar a carne e deixar cozinhar. Juntar legumes e batata, cobrindo com água/caldo. Cozinhar até todos os ingredientes ficarem macios.",
        alergenios:
          "Validar ingredientes adicionados, especialmente caldos industriais.",
        haccp:
          "Controlar confeção da carne e temperatura de manutenção. Garantir correta higienização dos legumes.",
        ingredientes: [
          { nome: "carne", quantidade: 120 * dosesEstimadas },
          { nome: "batata", quantidade: 100 * dosesEstimadas },
          { nome: "cenoura", quantidade: 40 * dosesEstimadas },
          { nome: "ervilhas", quantidade: 40 * dosesEstimadas },
          { nome: "cebola", quantidade: 20 * dosesEstimadas },
        ],
      };
    }

    setNome(fichaGerada.nome);
    setCategoria(fichaGerada.categoria);
    setDoses(dosesEstimadas);
    setPreparacao(
      fichaGerada.preparacao +
        "\n\nNota: proposta gerada automaticamente. Deve ser validada pelo responsável técnico antes da utilização."
    );
    setAlergenios(fichaGerada.alergenios);
    setHaccp(fichaGerada.haccp);

    const novosIngredientes = fichaGerada.ingredientes.map((item) => ({
      ...procurarAlimento(item.nome),
      quantidade: item.qb ? "" : item.quantidade,
      unidade: item.qb ? "" : item.unidade || "g",
      qb: Boolean(item.qb),
    }));

    setIngredientes(novosIngredientes);
  }

  function atualizarIngrediente(index, campo, valor) {
    const novaLista = [...ingredientes];
    novaLista[index][campo] = valor;

    if (campo === "qb") {
      novaLista[index].qb = Boolean(valor);

      if (valor) {
        novaLista[index].quantidade = "";
        novaLista[index].unidade = "";
      } else {
        novaLista[index].quantidade = 0;
        novaLista[index].unidade = "kg";
      }
    }

    if (campo === "categoriaAlimentar") {
      novaLista[index].nome = "";
      novaLista[index].kcal = 0;
      novaLista[index].proteina = 0;
      novaLista[index].hidratos = 0;
      novaLista[index].gordura = 0;
      novaLista[index].fibra = 0;
      novaLista[index].sal = 0;
    }

    if (campo === "nome") {
      const alimentoEncontrado = alimentos.find(
        (alimento) => alimento.nome === valor
      );

      if (alimentoEncontrado) {
        novaLista[index] = {
          ...novaLista[index],
          ...alimentoEncontrado,
          categoriaAlimentar: alimentoEncontrado.categoria,
          quantidade: novaLista[index].qb ? "" : novaLista[index].quantidade,
          unidade: novaLista[index].qb ? "" : novaLista[index].unidade || "kg",
          qb: novaLista[index].qb || false,
          precoKg:
            novaLista[index].precoKg ||
            procurarPrecoStock(alimentoEncontrado.nome),
        };
      }
    }

    setIngredientes(novaLista);
  }

  function adicionarIngrediente() {
    setIngredientes([...ingredientes, criarIngredienteVazio()]);
  }

  function removerIngrediente(index) {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  }

  function calcularCustoTotal() {
    return ingredientes.reduce((total, item) => {
      if (item.qb) return total;

      const quantidadeConvertida = converterQuantidadeParaUnidadePreco(
        item.quantidade,
        obterUnidadeIngrediente(item)
      );

      return total + quantidadeConvertida * Number(item.precoKg || 0);
    }, 0);
  }

  function calcularTotalNutricional(campo) {
    return ingredientes.reduce((total, item) => {
      if (item.qb) return total;

      const quantidadeGramas = converterQuantidadeParaGramas(
        item.quantidade,
        obterUnidadeIngrediente(item)
      );

      return total + (quantidadeGramas / 100) * Number(item[campo] || 0);
    }, 0);
  }

  const numeroDoses = Number(doses) > 0 ? Number(doses) : 1;
  const custoTotal = calcularCustoTotal();
  const custoPorDose = custoTotal / numeroDoses;

  const nutrientesTotais = {
    kcal: calcularTotalNutricional("kcal"),
    proteina: calcularTotalNutricional("proteina"),
    hidratos: calcularTotalNutricional("hidratos"),
    gordura: calcularTotalNutricional("gordura"),
    fibra: calcularTotalNutricional("fibra"),
    sal: calcularTotalNutricional("sal"),
  };

  const nutrientesPorDose = {
    kcal: nutrientesTotais.kcal / numeroDoses,
    proteina: nutrientesTotais.proteina / numeroDoses,
    hidratos: nutrientesTotais.hidratos / numeroDoses,
    gordura: nutrientesTotais.gordura / numeroDoses,
    fibra: nutrientesTotais.fibra / numeroDoses,
    sal: nutrientesTotais.sal / numeroDoses,
  };


  function limparFormulario() {
    setPedidoIA("");
    setNome("");
    setCategoria("Sopa");
    setDoses(10);
    setPreparacao("");
    setAlergenios("");
    setHaccp("");
    setIngredientes([criarIngredienteVazio()]);
    setFichaEmEdicaoId(null);
  }

  function iniciarEdicao(ficha) {
    setFichaEmEdicaoId(ficha.id);
    setNome(ficha.nome || "");
    setCategoria(ficha.categoria || "Sopa");
    setDoses(ficha.doses || 10);
    setPreparacao(ficha.preparacao || "");
    setAlergenios(ficha.alergenios || "");
    setHaccp(ficha.haccp || "");

    const ingredientesEditaveis =
      ficha.ingredientes && ficha.ingredientes.length > 0
        ? ficha.ingredientes.map((item) => ({
            ...criarIngredienteVazio(),
            ...item,
            categoriaAlimentar:
              item.categoriaAlimentar || item.categoria || "",
            qb: Boolean(item.qb),
            quantidade: item.qb ? "" : item.quantidade || 0,
            unidade: item.qb ? "" : item.unidade || "kg",
          }))
        : [criarIngredienteVazio()];

    setIngredientes(ingredientesEditaveis);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    limparFormulario();
  }

  async function guardarFicha() {
    if (!nome) {
      alert("Indica o nome da receita.");
      return;
    }

    const dados = {
      ingredientes,
      preparacao,
      alergenios,
      haccp,
      custoTotal,
      custoPorDose,
      nutrientesTotais,
      nutrientesPorDose,
    };

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      alert("Precisas de iniciar sessão para guardar fichas técnicas.");
      console.error(userError);
      return;
    }

    let error;

    if (fichaEmEdicaoId) {
      const resultado = await supabase
        .from("fichas_tecnicas")
        .update({
          nome,
          categoria,
          doses: Number(doses),
          dados,
        })
        .eq("id", fichaEmEdicaoId)
        .eq("user_id", userData.user.id);

      error = resultado.error;
    } else {
      const resultado = await supabase.from("fichas_tecnicas").insert([
        {
          user_id: userData.user.id,
          nome,
          categoria,
          doses: Number(doses),
          dados,
        },
      ]);

      error = resultado.error;
    }

    if (error) {
      alert(fichaEmEdicaoId ? "Erro ao atualizar ficha técnica." : "Erro ao guardar no Supabase.");
      console.error(error);
      return;
    }

    await carregarFichas();
    limparFormulario();

    alert(fichaEmEdicaoId ? "Ficha técnica atualizada com sucesso." : "Ficha técnica guardada no Supabase.");
  }

  async function eliminarFicha(id) {
    const confirmar = confirm("Tens a certeza que queres eliminar esta ficha?");
    if (!confirmar) return;

    const { error } = await supabase
      .from("fichas_tecnicas")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erro ao eliminar ficha.");
      console.error(error);
      return;
    }

    await carregarFichas();
  }

  function exportarFichaPDF(ficha) {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Ficha Técnica de Receita", 14, 20);

    doc.setFontSize(11);
    doc.text(`Receita: ${ficha.nome}`, 14, 32);
    doc.text(`Categoria: ${ficha.categoria}`, 14, 40);
    doc.text(`Doses: ${ficha.doses || "-"}`, 14, 48);
    doc.text(
      `Custo total: ${Number(ficha.custoTotal || 0).toFixed(2)} €`,
      14,
      56
    );
    doc.text(
      `Custo por dose: ${Number(ficha.custoPorDose || 0).toFixed(2)} €`,
      14,
      64
    );

    autoTable(doc, {
      startY: 74,
      head: [["Categoria", "Ingrediente", "Quantidade", "Unidade", "Preço/Un.", "Custo"]],
      body:
        ficha.ingredientes?.map((item) => {
          const unidade = obterUnidadeIngrediente(item);
          const quantidadeConvertida = item.qb
            ? 0
            : converterQuantidadeParaUnidadePreco(item.quantidade, unidade);
          const custo = item.qb
            ? 0
            : quantidadeConvertida * Number(item.precoKg || 0);

          return [
            item.categoriaAlimentar || item.categoria || "-",
            item.nome || "-",
            item.qb ? "q.b." : item.quantidade || "0",
            item.qb ? "" : unidade,
            item.qb ? "-" : `${Number(item.precoKg || 0).toFixed(2)} €`,
            item.qb ? "-" : `${custo.toFixed(2)} €`,
          ];
        }) || [],
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Informação", "Descrição"]],
      body: [
        ["Modo de preparação", ficha.preparacao || "-"],
        ["Alergénios", ficha.alergenios || "Nenhum"],
        ["Observações HACCP", ficha.haccp || "-"],
        [
          "Valor nutricional por dose",
          `${ficha.nutrientesPorDose?.kcal?.toFixed(0) || 0} kcal | Proteína: ${
            ficha.nutrientesPorDose?.proteina?.toFixed(1) || 0
          } g | Hidratos: ${
            ficha.nutrientesPorDose?.hidratos?.toFixed(1) || 0
          } g | Gordura: ${
            ficha.nutrientesPorDose?.gordura?.toFixed(1) || 0
          } g | Fibra: ${
            ficha.nutrientesPorDose?.fibra?.toFixed(1) || 0
          } g | Sal: ${ficha.nutrientesPorDose?.sal?.toFixed(2) || 0} g`,
        ],
      ],
      styles: { cellWidth: "wrap", valign: "top" },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 120 },
      },
    });

    doc.text("Assinatura do responsável: __________________________", 14, 280);
    doc.save(`ficha-tecnica-${ficha.nome}.pdf`);
  }

  function exportarTodasPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Fichas Técnicas de Receitas", 14, 20);

    const tabela = listaFichas.map((ficha) => [
      ficha.nome,
      ficha.categoria,
      ficha.doses || "-",
      `${Number(ficha.custoTotal || 0).toFixed(2)} €`,
      `${Number(ficha.custoPorDose || 0).toFixed(2)} €`,
    ]);

    autoTable(doc, {
      startY: 32,
      head: [["Receita", "Categoria", "Doses", "Custo total", "Custo/dose"]],
      body: tabela,
    });

    doc.save("fichas-tecnicas-ipss.pdf");
  }

  return (
    <div>
      <div className="historico-topo">
        <div>
          <h2>Fichas Técnicas</h2>
          <p className="subtitulo">
            Registo estruturado de receitas, ingredientes por categoria
            alimentar, custos, HACCP e valor nutricional.
          </p>
        </div>

        <button className="botao-principal" onClick={exportarTodasPDF}>
          Exportar todas PDF
        </button>
      </div>

      <div className="painel">
        <h3>Gerar com auxílio da IA</h3>

        <p className="subtitulo">
          Escreve uma indicação simples. Ex.: “Arroz de frango para 80 utentes”.
          A app sugere ingredientes, quantidades e tenta ir buscar preços ao
          stock.
        </p>

        <textarea
          value={pedidoIA}
          onChange={(e) => setPedidoIA(e.target.value)}
          placeholder="Ex.: Arroz de frango para 80 utentes"
        />

        <button className="botao-principal" onClick={gerarComIA}>
          Gerar proposta de ficha técnica
        </button>
      </div>

      <div className="painel">
        <h3>{fichaEmEdicaoId ? "Editar ficha técnica" : "Nova ficha técnica"}</h3>

        <label>Nome da receita</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Arroz de frango"
        />

        <label>Categoria da receita</label>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option>Sopa</option>
          <option>Prato principal</option>
          <option>Sobremesa</option>
          <option>Dieta especial</option>
          <option>Acompanhamento</option>
        </select>

        <label>Número de doses</label>
        <input
          type="number"
          value={doses}
          onChange={(e) => setDoses(e.target.value)}
        />

        <h3>Ingredientes</h3>

        <table className="dashboard-table fichas-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Ingrediente</th>
              <th>Quantidade</th>
              <th>Unidade</th>
              <th>q.b.</th>
              <th>Preço/Un. (€)</th>
              <th>Custo</th>
              <th>Kcal</th>
              <th>Prot.</th>
              <th>Sal</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {ingredientes.map((item, index) => {
              const unidade = obterUnidadeIngrediente(item);
              const quantidadeConvertida = item.qb
                ? 0
                : converterQuantidadeParaUnidadePreco(item.quantidade, unidade);
              const custoIngrediente = item.qb
                ? 0
                : quantidadeConvertida * Number(item.precoKg || 0);

              const alimentosFiltrados = alimentos.filter(
                (alimento) => alimento.categoria === item.categoriaAlimentar
              );

              return (
                <tr key={index}>
                  <td>
                    <select
                      value={item.categoriaAlimentar}
                      onChange={(e) =>
                        atualizarIngrediente(
                          index,
                          "categoriaAlimentar",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Tipo</option>

                      {categoriasAlimentos.map((categoria) => (
                        <option key={categoria} value={categoria}>
                          {categoria}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <select
                      value={item.nome}
                      onChange={(e) =>
                        atualizarIngrediente(index, "nome", e.target.value)
                      }
                      disabled={!item.categoriaAlimentar}
                    >
                      <option value="">Alimento</option>

                      {alimentosFiltrados.map((alimento) => (
                        <option key={alimento.nome} value={alimento.nome}>
                          {alimento.nome}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={item.qb ? "" : item.quantidade || ""}
                      disabled={item.qb}
                      placeholder={item.qb ? "q.b." : ""}
                      onChange={(e) =>
                        atualizarIngrediente(index, "quantidade", e.target.value)
                      }
                    />
                  </td>

                  <td>
                    <select
                      value={item.qb ? "" : obterUnidadeIngrediente(item)}
                      disabled={item.qb}
                      onChange={(e) =>
                        atualizarIngrediente(index, "unidade", e.target.value)
                      }
                    >
                      <option value="">q.b.</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                      <option value="un">un</option>
                    </select>
                  </td>

                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(item.qb)}
                      onChange={(e) =>
                        atualizarIngrediente(index, "qb", e.target.checked)
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.qb ? "" : item.precoKg || ""}
                      disabled={item.qb}
                      placeholder={item.qb ? "-" : ""}
                      onChange={(e) =>
                        atualizarIngrediente(index, "precoKg", e.target.value)
                      }
                    />
                  </td>

                  <td>{item.qb ? "-" : `${custoIngrediente.toFixed(2)} €`}</td>
                  <td>{Number(item.kcal || 0).toFixed(0)}</td>
                  <td>{Number(item.proteina || 0).toFixed(1)} g</td>
                  <td>{Number(item.sal || 0).toFixed(2)} g</td>

                  <td>
                    <button
                      className="botao-secundario"
                      onClick={() => removerIngrediente(index)}
                    >
                      X
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <button className="botao-principal" onClick={adicionarIngrediente}>
          Adicionar ingrediente
        </button>

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>Custo total</h3>
            <p>{custoTotal.toFixed(2)} €</p>
            <span>Receita completa</span>
          </div>

          <div className="dashboard-card">
            <h3>Custo por dose</h3>
            <p>{custoPorDose.toFixed(2)} €</p>
            <span>Por refeição</span>
          </div>

          <div className="dashboard-card">
            <h3>Energia</h3>
            <p>{nutrientesPorDose.kcal.toFixed(0)} kcal</p>
            <span>Por dose</span>
          </div>

          <div className="dashboard-card">
            <h3>Proteína</h3>
            <p>{nutrientesPorDose.proteina.toFixed(1)} g</p>
            <span>Por dose</span>
          </div>

          <div className="dashboard-card">
            <h3>Sal</h3>
            <p>{nutrientesPorDose.sal.toFixed(2)} g</p>
            <span>Por dose</span>
          </div>
        </div>

        <label>Modo de preparação</label>
        <textarea
          value={preparacao}
          onChange={(e) => setPreparacao(e.target.value)}
          placeholder="Descreve o modo de preparação da receita..."
        />

        <label>Alergénios</label>
        <input
          type="text"
          value={alergenios}
          onChange={(e) => setAlergenios(e.target.value)}
          placeholder="Ex.: glúten, leite, ovos..."
        />

        <label>Observações HACCP</label>
        <textarea
          value={haccp}
          onChange={(e) => setHaccp(e.target.value)}
          placeholder="Ex.: temperatura, conservação, cuidados de manipulação..."
        />

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button className="botao-principal" onClick={guardarFicha}>
            {fichaEmEdicaoId ? "Guardar alterações" : "Guardar ficha técnica"}
          </button>

          {fichaEmEdicaoId && (
            <button className="botao-secundario" onClick={cancelarEdicao}>
              Cancelar edição
            </button>
          )}
        </div>
      </div>

      <div className="historico-grid">
        {listaFichas.map((item) => (
          <div className="historico-card" key={item.id}>
            <h3>{item.nome}</h3>

            <p>
              <strong>Categoria:</strong> {item.categoria}
            </p>

            <p>
              <strong>Doses:</strong> {item.doses || "-"}
            </p>

            <p>
              <strong>Custo total:</strong>{" "}
              {Number(item.custoTotal || 0).toFixed(2)} €
            </p>

            <p>
              <strong>Custo por dose:</strong>{" "}
              {Number(item.custoPorDose || 0).toFixed(2)} €
            </p>

            <p>
              <strong>Valor nutricional por dose:</strong>{" "}
              {item.nutrientesPorDose
                ? `${item.nutrientesPorDose.kcal.toFixed(
                    0
                  )} kcal | ${item.nutrientesPorDose.proteina.toFixed(
                    1
                  )} g proteína | ${item.nutrientesPorDose.sal.toFixed(
                    2
                  )} g sal`
                : "-"}
            </p>

            <p>
              <strong>Alergénios:</strong> {item.alergenios || "Nenhum"}
            </p>

            <p>
              <strong>HACCP:</strong> {item.haccp || "-"}
            </p>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                className="botao-principal"
                onClick={() => iniciarEdicao(item)}
              >
                Editar
              </button>

              <button
                className="botao-principal"
                onClick={() => exportarFichaPDF(item)}
              >
                Exportar ficha PDF
              </button>

              <button
                className="botao-secundario"
                onClick={() => eliminarFicha(item.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}