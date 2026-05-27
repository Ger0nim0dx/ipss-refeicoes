import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  Trash2,
  Euro,
  Scale,
  Leaf,
  BrainCircuit,
  Save,
  AlertTriangle,
  BarChart3,
  Download,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

import { supabase } from "../supabaseClient";

export default function DesperdicioAlimentar() {
  const [registos, setRegistos] = useState([]);

  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [valencia, setValencia] = useState("Lar");
  const [refeicao, setRefeicao] = useState("Almoço");
  const [receita, setReceita] = useState("");
  const [quantidadeProduzida, setQuantidadeProduzida] = useState(0);
  const [quantidadeSobrante, setQuantidadeSobrante] = useState(0);
  const [quantidadeDesperdicada, setQuantidadeDesperdicada] = useState(0);
  const [custoDesperdicio, setCustoDesperdicio] = useState(0);
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    carregarRegistos();
  }, []);

  async function carregarRegistos() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const { data, error } = await supabase
      .from("desperdicio_alimentar")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("data", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar registos de desperdício.");
      return;
    }

    setRegistos(data || []);
  }

  async function guardarRegisto() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      alert("Precisas de iniciar sessão.");
      return;
    }

    const novoRegisto = {
      user_id: userData.user.id,
      data,
      valencia,
      refeicao,
      receita,
      quantidade_produzida: Number(quantidadeProduzida || 0),
      quantidade_sobrante: Number(quantidadeSobrante || 0),
      quantidade_desperdicada: Number(quantidadeDesperdicada || 0),
      custo_desperdicio: Number(custoDesperdicio || 0),
      observacoes,
    };

    const { error } = await supabase
      .from("desperdicio_alimentar")
      .insert([novoRegisto]);

    if (error) {
      console.error(error);
      alert("Erro ao guardar registo.");
      return;
    }

    setReceita("");
    setQuantidadeProduzida(0);
    setQuantidadeSobrante(0);
    setQuantidadeDesperdicada(0);
    setCustoDesperdicio(0);
    setObservacoes("");

    await carregarRegistos();

    alert("Registo de desperdício guardado com sucesso.");
  }

  async function eliminarRegisto(id) {
    if (!confirm("Pretendes eliminar este registo?")) return;

    const { error } = await supabase
      .from("desperdicio_alimentar")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao eliminar registo.");
      return;
    }

    await carregarRegistos();
  }

  const totalDesperdicio = registos.reduce(
    (total, item) => total + Number(item.quantidade_desperdicada || 0),
    0
  );

  const totalSobrante = registos.reduce(
    (total, item) => total + Number(item.quantidade_sobrante || 0),
    0
  );

  const totalProduzido = registos.reduce(
    (total, item) => total + Number(item.quantidade_produzida || 0),
    0
  );

  const custoTotalDesperdicio = registos.reduce(
    (total, item) => total + Number(item.custo_desperdicio || 0),
    0
  );

  const taxaDesperdicio =
    totalProduzido > 0 ? (totalDesperdicio / totalProduzido) * 100 : 0;

  const registosCriticos = registos.filter((item) => {
    const produzido = Number(item.quantidade_produzida || 0);
    const desperdicado = Number(item.quantidade_desperdicada || 0);

    if (produzido <= 0) return false;

    return (desperdicado / produzido) * 100 >= 15;
  });

  const desperdicioPorValencia = [
    "Lar",
    "Creche",
    "Apoio Domiciliário",
    "Trabalhadores",
  ]
    .map((nome) => {
      const total = registos
        .filter((item) => item.valencia === nome)
        .reduce(
          (soma, item) => soma + Number(item.quantidade_desperdicada || 0),
          0
        );

      return { nome, total };
    })
    .filter((item) => item.total > 0);

  const desperdicioPorRefeicao = [
    "Pequeno-almoço",
    "Reforço da manhã",
    "Almoço",
    "Lanche",
    "Jantar",
    "Reforço da noite",
  ]
    .map((nome) => {
      const total = registos
        .filter((item) => item.refeicao === nome)
        .reduce(
          (soma, item) => soma + Number(item.quantidade_desperdicada || 0),
          0
        );

      return { nome, total };
    })
    .filter((item) => item.total > 0);

  const evolucaoTemporal = Object.values(
    registos.reduce((acc, item) => {
      const chave = item.data || "Sem data";

      if (!acc[chave]) {
        acc[chave] = {
          data: chave,
          desperdicio: 0,
          custo: 0,
        };
      }

      acc[chave].desperdicio += Number(item.quantidade_desperdicada || 0);
      acc[chave].custo += Number(item.custo_desperdicio || 0);

      return acc;
    }, {})
  ).sort((a, b) => new Date(a.data) - new Date(b.data));

  const rankingReceitas = Object.values(
    registos.reduce((acc, item) => {
      const chave = item.receita || "Sem receita";

      if (!acc[chave]) {
        acc[chave] = {
          nome: chave,
          desperdicio: 0,
          custo: 0,
        };
      }

      acc[chave].desperdicio += Number(item.quantidade_desperdicada || 0);
      acc[chave].custo += Number(item.custo_desperdicio || 0);

      return acc;
    }, {})
  )
    .sort((a, b) => b.desperdicio - a.desperdicio)
    .slice(0, 5);

  function exportarPDFAmbiental() {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Relatório Ambiental de Desperdício", 14, 20);

    doc.setFontSize(11);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-PT")}`, 14, 30);
    doc.text(`Total desperdiçado: ${totalDesperdicio.toFixed(1)} kg`, 14, 40);
    doc.text(`Custo estimado: ${custoTotalDesperdicio.toFixed(2)} €`, 14, 48);
    doc.text(`Taxa de desperdício: ${taxaDesperdicio.toFixed(1)}%`, 14, 56);

    autoTable(doc, {
      startY: 70,
      head: [
        [
          "Data",
          "Valência",
          "Refeição",
          "Receita",
          "Produzido",
          "Sobrante",
          "Desperdício",
          "Custo",
        ],
      ],
      body: registos.map((item) => [
        item.data ? new Date(item.data).toLocaleDateString("pt-PT") : "-",
        item.valencia || "-",
        item.refeicao || "-",
        item.receita || "-",
        `${Number(item.quantidade_produzida || 0).toFixed(1)} kg`,
        `${Number(item.quantidade_sobrante || 0).toFixed(1)} kg`,
        `${Number(item.quantidade_desperdicada || 0).toFixed(1)} kg`,
        `${Number(item.custo_desperdicio || 0).toFixed(2)} €`,
      ]),
    });

    const y = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(12);
    doc.text("Síntese Inteligente", 14, y);

    doc.setFontSize(10);
    doc.text(
      `Foram registados ${totalDesperdicio.toFixed(
        1
      )} kg de desperdício alimentar.`,
      14,
      y + 10
    );

    doc.text(
      `O custo estimado associado é de ${custoTotalDesperdicio.toFixed(2)} €.`,
      14,
      y + 18
    );

    doc.text(
      `A taxa global de desperdício é de ${taxaDesperdicio.toFixed(1)}%.`,
      14,
      y + 26
    );

    if (registosCriticos.length > 0) {
      doc.text(
        `Existem ${registosCriticos.length} registo(s) crítico(s) acima do limiar definido.`,
        14,
        y + 34
      );
    } else {
      doc.text("Não foram detetados registos críticos.", 14, y + 34);
    }

    doc.text(
      "Assinatura do responsável: ______________________________",
      14,
      280
    );

    doc.save("relatorio-ambiental-desperdicio.pdf");
  }

  const cores = ["#145c2a", "#2563eb", "#dc2626", "#7c3aed", "#ea580c"];

  return (
    <div className="dashboard">
      <div className="topo-dashboard">
        <div>
          <h1>Desperdício Alimentar</h1>
          <p className="dashboard-subtitle">
            Monitorização do desperdício por refeição, valência, custo e impacto
            operacional.
          </p>
        </div>

        <div className="data-box">
          <Leaf size={18} /> Sustentabilidade
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card destaque">
          <Trash2 size={30} />
          <h3>Total desperdiçado</h3>
          <p>{totalDesperdicio.toFixed(1)} kg</p>
          <span>Registos acumulados</span>
        </div>

        <div className="dashboard-card">
          <Scale size={30} />
          <h3>Total sobrante</h3>
          <p>{totalSobrante.toFixed(1)} kg</p>
          <span>Sobras registadas</span>
        </div>

        <div className="dashboard-card">
          <Euro size={30} />
          <h3>Custo perdido</h3>
          <p>{custoTotalDesperdicio.toFixed(2)} €</p>
          <span>Estimativa financeira</span>
        </div>

        <div className="dashboard-card">
          <BarChart3 size={30} />
          <h3>Taxa desperdício</h3>
          <p>{taxaDesperdicio.toFixed(1)}%</p>
          <span>Face ao produzido</span>
        </div>

        <div className="dashboard-card">
          <AlertTriangle size={30} />
          <h3>Registos críticos</h3>
          <p>{registosCriticos.length}</p>
          <span>Acima de 15%</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Novo registo</h2>

        <div className="formulario">
          <label>Data</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />

          <label>Valência</label>
          <select value={valencia} onChange={(e) => setValencia(e.target.value)}>
            <option>Lar</option>
            <option>Creche</option>
            <option>Apoio Domiciliário</option>
            <option>Trabalhadores</option>
          </select>

          <label>Refeição</label>
          <select value={refeicao} onChange={(e) => setRefeicao(e.target.value)}>
            <option>Pequeno-almoço</option>
            <option>Reforço da manhã</option>
            <option>Almoço</option>
            <option>Lanche</option>
            <option>Jantar</option>
            <option>Reforço da noite</option>
          </select>

          <label>Receita / prato</label>
          <input
            type="text"
            value={receita}
            onChange={(e) => setReceita(e.target.value)}
            placeholder="Ex.: Arroz de frango"
          />

          <label>Quantidade produzida (kg)</label>
          <input
            type="number"
            step="0.01"
            value={quantidadeProduzida}
            onChange={(e) => setQuantidadeProduzida(e.target.value)}
          />

          <label>Quantidade sobrante (kg)</label>
          <input
            type="number"
            step="0.01"
            value={quantidadeSobrante}
            onChange={(e) => setQuantidadeSobrante(e.target.value)}
          />

          <label>Quantidade desperdiçada (kg)</label>
          <input
            type="number"
            step="0.01"
            value={quantidadeDesperdicada}
            onChange={(e) => setQuantidadeDesperdicada(e.target.value)}
          />

          <label>Custo estimado do desperdício (€)</label>
          <input
            type="number"
            step="0.01"
            value={custoDesperdicio}
            onChange={(e) => setCustoDesperdicio(e.target.value)}
          />

          <label>Observações</label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex.: excesso de produção, baixa aceitação da refeição, ausência de utentes..."
          />

          <div className="botoes-formulario">
            <button className="botao-principal" onClick={guardarRegisto}>
              <Save size={18} /> Guardar registo
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <h2>Gráficos de desperdício</h2>

          <button className="botao-principal" onClick={exportarPDFAmbiental}>
            <Download size={18} /> Exportar Relatório PDF
          </button>
        </div>

        <div className="historico-grid">
          <div className="historico-card">
            <h3>Desperdício por valência</h3>

            {desperdicioPorValencia.length === 0 ? (
              <p>Sem dados suficientes.</p>
            ) : (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={desperdicioPorValencia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="historico-card">
            <h3>Distribuição por refeição</h3>

            {desperdicioPorRefeicao.length === 0 ? (
              <p>Sem dados suficientes.</p>
            ) : (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={desperdicioPorRefeicao}
                      dataKey="total"
                      nameKey="nome"
                      outerRadius={100}
                      label
                    >
                      {desperdicioPorRefeicao.map((entry, index) => (
                        <Cell key={index} fill={cores[index % cores.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Evolução temporal</h2>

        {evolucaoTemporal.length === 0 ? (
          <p>Sem dados suficientes.</p>
        ) : (
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer>
              <LineChart data={evolucaoTemporal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="desperdicio"
                  stroke="#145c2a"
                  strokeWidth={4}
                />
                <Line
                  type="monotone"
                  dataKey="custo"
                  stroke="#dc2626"
                  strokeWidth={4}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Ranking de refeições com maior desperdício</h2>

        {rankingReceitas.length === 0 ? (
          <p>Sem dados suficientes.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Receita</th>
                <th>Desperdício</th>
                <th>Custo perdido</th>
              </tr>
            </thead>

            <tbody>
              {rankingReceitas.map((item) => (
                <tr key={item.nome}>
                  <td>{item.nome}</td>
                  <td>{item.desperdicio.toFixed(1)} kg</td>
                  <td>{item.custo.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboard-section">
        <h2>
          <BrainCircuit size={22} /> Análise inteligente
        </h2>

        <div className="historico-card">
          {registos.length === 0 ? (
            <p>Ainda não existem registos de desperdício alimentar.</p>
          ) : (
            <>
              <p>
                Foram registados{" "}
                <strong>{totalDesperdicio.toFixed(1)} kg</strong> de desperdício
                alimentar, com um custo estimado de{" "}
                <strong>{custoTotalDesperdicio.toFixed(2)} €</strong>.
              </p>

              <p>
                A taxa global de desperdício é de{" "}
                <strong>{taxaDesperdicio.toFixed(1)}%</strong>.
              </p>

              {registosCriticos.length > 0 ? (
                <p>
                  Existem <strong>{registosCriticos.length}</strong> registo(s)
                  críticos acima de 15%. Recomenda-se analisar a aceitação das
                  refeições e ajustar capitações.
                </p>
              ) : (
                <p>
                  Não foram detetados registos críticos de desperdício acima do
                  limiar definido.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Registos recentes</h2>

        {registos.length === 0 ? (
          <p>Ainda não existem registos.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Valência</th>
                <th>Refeição</th>
                <th>Receita</th>
                <th>Produzido</th>
                <th>Sobrante</th>
                <th>Desperdício</th>
                <th>Custo</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {registos.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.data
                      ? new Date(item.data).toLocaleDateString("pt-PT")
                      : "-"}
                  </td>
                  <td>{item.valencia}</td>
                  <td>{item.refeicao}</td>
                  <td>{item.receita || "-"}</td>
                  <td>{Number(item.quantidade_produzida || 0).toFixed(1)} kg</td>
                  <td>{Number(item.quantidade_sobrante || 0).toFixed(1)} kg</td>
                  <td>
                    {Number(item.quantidade_desperdicada || 0).toFixed(1)} kg
                  </td>
                  <td>{Number(item.custo_desperdicio || 0).toFixed(2)} €</td>
                  <td>
                    <button
                      className="botao-secundario"
                      onClick={() => eliminarRegisto(item.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}