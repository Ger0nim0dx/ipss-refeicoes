import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { alimentos } from "../data/alimentos";
import { supabase } from "../services/supabaseClient";

export default function FichasTecnicas() {
  const [listaFichas, setListaFichas] = useState([]);

  const categoriasAlimentos = [
    ...new Set(alimentos.map((alimento) => alimento.categoria)),
  ];

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("Sopa");
  const [doses, setDoses] = useState(10);
  const [preparacao, setPreparacao] = useState("");
  const [alergenios, setAlergenios] = useState("");
  const [haccp, setHaccp] = useState("");

  const [ingredientes, setIngredientes] = useState([
    {
      categoriaAlimentar: "",
      nome: "",
      quantidade: 0,
      precoKg: 0,
      kcal: 0,
      proteina: 0,
      hidratos: 0,
      gordura: 0,
      fibra: 0,
      sal: 0,
    },
  ]);

  useEffect(() => {
    carregarFichas();
  }, []);

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

    const fichasFormatadas = data.map((ficha) => ({
      id: ficha.id,
      nome: ficha.nome,
      categoria: ficha.categoria,
      doses: ficha.doses,
      ...ficha.dados,
    }));

    setListaFichas(fichasFormatadas);
  }

  const atualizarIngrediente = (index, campo, valor) => {
    const novaLista = [...ingredientes];
    novaLista[index][campo] = valor;

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
          quantidade: novaLista[index].quantidade,
          precoKg: novaLista[index].precoKg,
        };
      }
    }

    setIngredientes(novaLista);
  };

  const adicionarIngrediente = () => {
    setIngredientes([
      ...ingredientes,
      {
        categoriaAlimentar: "",
        nome: "",
        quantidade: 0,
        precoKg: 0,
        kcal: 0,
        proteina: 0,
        hidratos: 0,
        gordura: 0,
        fibra: 0,
        sal: 0,
      },
    ]);
  };

  const removerIngrediente = (index) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  const calcularCustoTotal = () =>
    ingredientes.reduce((total, item) => {
      const quantidadeKg = Number(item.quantidade) / 1000;
      return total + quantidadeKg * Number(item.precoKg);
    }, 0);

  const calcularTotalNutricional = (campo) =>
    ingredientes.reduce(
      (total, item) =>
        total + (Number(item.quantidade) / 100) * Number(item[campo]),
      0
    );

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

    const { error } = await supabase.from("fichas_tecnicas").insert([
      {
        nome,
        categoria,
        doses: Number(doses),
        dados,
      },
    ]);

    if (error) {
      alert("Erro ao guardar no Supabase.");
      console.error(error);
      return;
    }

    await carregarFichas();

    setNome("");
    setCategoria("Sopa");
    setDoses(10);
    setPreparacao("");
    setAlergenios("");
    setHaccp("");
    setIngredientes([
      {
        categoriaAlimentar: "",
        nome: "",
        quantidade: 0,
        precoKg: 0,
        kcal: 0,
        proteina: 0,
        hidratos: 0,
        gordura: 0,
        fibra: 0,
        sal: 0,
      },
    ]);

    alert("Ficha técnica guardada no Supabase.");
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
    doc.text(`Custo total: ${Number(ficha.custoTotal || 0).toFixed(2)} €`, 14, 56);
    doc.text(`Custo por dose: ${Number(ficha.custoPorDose || 0).toFixed(2)} €`, 14, 64);

    autoTable(doc, {
      startY: 74,
      head: [["Categoria", "Ingrediente", "Qtd. (g)", "Preço/kg", "Custo"]],
      body: ficha.ingredientes?.map((item) => {
        const custo = (Number(item.quantidade) / 1000) * Number(item.precoKg);

        return [
          item.categoriaAlimentar || item.categoria || "-",
          item.nome || "-",
          item.quantidade || "0",
          `${Number(item.precoKg || 0).toFixed(2)} €`,
          `${custo.toFixed(2)} €`,
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
            Registo estruturado de receitas, ingredientes por categoria alimentar,
            custos, HACCP e valor nutricional.
          </p>
        </div>

        <button className="botao-principal" onClick={exportarTodasPDF}>
          Exportar todas PDF
        </button>
      </div>

      <div className="painel">
        <h3>Nova ficha técnica</h3>

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

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Ingrediente</th>
              <th>Qtd. (g)</th>
              <th>Preço/kg (€)</th>
              <th>Custo</th>
              <th>Kcal</th>
              <th>Prot.</th>
              <th>Sal</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {ingredientes.map((item, index) => {
              const custoIngrediente =
                (Number(item.quantidade) / 1000) * Number(item.precoKg);

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
                      value={item.quantidade}
                      onChange={(e) =>
                        atualizarIngrediente(index, "quantidade", e.target.value)
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={item.precoKg}
                      onChange={(e) =>
                        atualizarIngrediente(index, "precoKg", e.target.value)
                      }
                    />
                  </td>

                  <td>{custoIngrediente.toFixed(2)} €</td>
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

        <button className="botao-principal" onClick={guardarFicha}>
          Guardar ficha técnica
        </button>
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
                ? `${item.nutrientesPorDose.kcal.toFixed(0)} kcal | ${item.nutrientesPorDose.proteina.toFixed(1)} g proteína | ${item.nutrientesPorDose.sal.toFixed(2)} g sal`
                : "-"}
            </p>

            <p>
              <strong>Alergénios:</strong> {item.alergenios || "Nenhum"}
            </p>

            <p>
              <strong>HACCP:</strong> {item.haccp || "-"}
            </p>

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
        ))}
      </div>
    </div>
  );
}