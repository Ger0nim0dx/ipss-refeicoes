import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
} from "recharts";

export default function HACCP() {
  const [temperaturas, setTemperaturas] = useState(
    JSON.parse(localStorage.getItem("ipssHaccpTemperaturas")) || []
  );

  const [checklists, setChecklists] = useState(
    JSON.parse(localStorage.getItem("ipssHaccpChecklists")) || []
  );

  const [naoConformidades, setNaoConformidades] = useState(
    JSON.parse(localStorage.getItem("ipssHaccpNaoConformidades")) || []
  );

  const [temperatura, setTemperatura] = useState({
    data: "",
    equipamento: "",
    tipo: "Frigorífico",
    valor: "",
    responsavel: "",
  });

  const [checklist, setChecklist] = useState({
    data: "",
    area: "",
    tarefa: "",
    estado: "Conforme",
    responsavel: "",
  });

  const [naoConformidade, setNaoConformidade] = useState({
    data: "",
    descricao: "",
    gravidade: "Baixa",
    medidaCorretiva: "",
    responsavel: "",
  });

  function estadoTemperatura(item) {
    const valor = Number(item.valor);

    if (item.tipo === "Frigorífico" && valor > 5) return "Crítico";
    if (item.tipo === "Congelador" && valor > -18) return "Crítico";
    if (item.tipo === "Quente" && valor < 65) return "Crítico";

    return "Conforme";
  }

  const temperaturasCriticas = temperaturas.filter(
    (item) => estadoTemperatura(item) === "Crítico"
  );

  const temperaturasConformes = temperaturas.filter(
    (item) => estadoTemperatura(item) === "Conforme"
  );

  const checklistsNaoConformes = checklists.filter(
    (item) => item.estado !== "Conforme"
  );

  const totalAlertas =
    temperaturasCriticas.length +
    checklistsNaoConformes.length +
    naoConformidades.length;

  const dadosGraficoTemperaturas = temperaturas.slice(-10).map((item, index) => ({
    nome: item.equipamento || `Registo ${index + 1}`,
    temperatura: Number(item.valor) || 0,
  }));

  const dadosConformidade = [
    {
      name: "Conforme",
      value: temperaturasConformes.length + checklists.filter((c) => c.estado === "Conforme").length,
    },
    {
      name: "Não conforme",
      value: temperaturasCriticas.length + checklistsNaoConformes.length + naoConformidades.length,
    },
  ];

  function guardarTemperatura() {
    const novaLista = [...temperaturas, temperatura];

    setTemperaturas(novaLista);
    localStorage.setItem("ipssHaccpTemperaturas", JSON.stringify(novaLista));

    setTemperatura({
      data: "",
      equipamento: "",
      tipo: "Frigorífico",
      valor: "",
      responsavel: "",
    });
  }

  function guardarChecklist() {
    const novaLista = [...checklists, checklist];

    setChecklists(novaLista);
    localStorage.setItem("ipssHaccpChecklists", JSON.stringify(novaLista));

    setChecklist({
      data: "",
      area: "",
      tarefa: "",
      estado: "Conforme",
      responsavel: "",
    });
  }

  function guardarNaoConformidade() {
    const novaLista = [...naoConformidades, naoConformidade];

    setNaoConformidades(novaLista);
    localStorage.setItem("ipssHaccpNaoConformidades", JSON.stringify(novaLista));

    setNaoConformidade({
      data: "",
      descricao: "",
      gravidade: "Baixa",
      medidaCorretiva: "",
      responsavel: "",
    });
  }

  function exportarRelatorioHACCP() {
    const doc = new jsPDF("landscape");

    doc.setFontSize(18);
    doc.text("Relatório HACCP Digital - IPSS", 14, 18);

    doc.setFontSize(10);
    doc.text(`Data de emissão: ${new Date().toLocaleDateString("pt-PT")}`, 14, 26);
    doc.text(`Registos de temperatura: ${temperaturas.length}`, 14, 32);
    doc.text(`Temperaturas críticas: ${temperaturasCriticas.length}`, 14, 38);
    doc.text(`Checklists realizadas: ${checklists.length}`, 14, 44);
    doc.text(`Não conformidades: ${naoConformidades.length}`, 14, 50);

    autoTable(doc, {
      startY: 58,
      head: [["Indicador", "Total", "Observação"]],
      body: [
        ["Temperaturas registadas", temperaturas.length, "Registos de controlo térmico"],
        ["Temperaturas críticas", temperaturasCriticas.length, "Situações que exigem verificação"],
        ["Checklists realizadas", checklists.length, "Controlos de higienização"],
        ["Checklists não conformes", checklistsNaoConformes.length, "Tarefas por corrigir/verificar"],
        ["Não conformidades", naoConformidades.length, "Registos formais de ocorrência"],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 92, 42] },
    });

    if (temperaturas.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Data", "Equipamento", "Tipo", "Temperatura", "Estado", "Responsável"]],
        body: temperaturas.map((item) => [
          item.data || "-",
          item.equipamento || "-",
          item.tipo || "-",
          `${item.valor || "-"} ºC`,
          estadoTemperatura(item),
          item.responsavel || "-",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [20, 92, 42] },
      });
    }

    if (checklists.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Data", "Área", "Tarefa", "Estado", "Responsável"]],
        body: checklists.map((item) => [
          item.data || "-",
          item.area || "-",
          item.tarefa || "-",
          item.estado || "-",
          item.responsavel || "-",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [20, 92, 42] },
      });
    }

    if (naoConformidades.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Data", "Gravidade", "Descrição", "Medida corretiva", "Responsável"]],
        body: naoConformidades.map((item) => [
          item.data || "-",
          item.gravidade || "-",
          item.descricao || "-",
          item.medidaCorretiva || "-",
          item.responsavel || "-",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [220, 38, 38] },
      });
    }

    doc.save("relatorio-haccp-ipss.pdf");
  }

  return (
    <div className="pagina">
      <h1>HACCP Digital</h1>

      <p className="descricao">
        Controlo de temperaturas, higienização, não conformidades, alertas e
        relatórios automáticos de segurança alimentar.
      </p>

      <div className="botoes-formulario">
        <button className="botao-principal" onClick={exportarRelatorioHACCP}>
          Exportar relatório HACCP PDF
        </button>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Temperaturas</h3>
          <p>{temperaturas.length}</p>
          <span>Registos efetuados</span>
        </div>

        <div className="dashboard-card">
          <h3>Temperaturas críticas</h3>
          <p>{temperaturasCriticas.length}</p>
          <span>Alertas térmicos</span>
        </div>

        <div className="dashboard-card">
          <h3>Checklists</h3>
          <p>{checklists.length}</p>
          <span>Controlos realizados</span>
        </div>

        <div className="dashboard-card destaque">
          <h3>Alertas totais</h3>
          <p>{totalAlertas}</p>
          <span>Situações a acompanhar</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Estado geral HACCP</h2>

        {totalAlertas === 0 ? (
          <p className="success-message">
            ✔ Não existem alertas HACCP críticos registados.
          </p>
        ) : (
          <p style={{ color: "#dc2626", fontWeight: "bold" }}>
            ⚠ Existem {totalAlertas} situações que requerem acompanhamento.
          </p>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Gráfico de temperaturas recentes</h2>

        {dadosGraficoTemperaturas.length === 0 ? (
          <p>Ainda não existem temperaturas registadas.</p>
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={dadosGraficoTemperaturas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="temperatura" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Conformidade global</h2>

        {dadosConformidade.every((item) => item.value === 0) ? (
          <p>Ainda não existem dados suficientes para apresentar o gráfico.</p>
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={dadosConformidade}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  <Cell />
                  <Cell />
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Registo de temperaturas</h2>

        <div className="formulario">
          <label>
            Data
            <input
              type="date"
              value={temperatura.data}
              onChange={(e) =>
                setTemperatura({ ...temperatura, data: e.target.value })
              }
            />
          </label>

          <label>
            Equipamento
            <input
              type="text"
              placeholder="Ex.: Frigorífico 1"
              value={temperatura.equipamento}
              onChange={(e) =>
                setTemperatura({
                  ...temperatura,
                  equipamento: e.target.value,
                })
              }
            />
          </label>

          <label>
            Tipo
            <select
              value={temperatura.tipo}
              onChange={(e) =>
                setTemperatura({ ...temperatura, tipo: e.target.value })
              }
            >
              <option>Frigorífico</option>
              <option>Congelador</option>
              <option>Quente</option>
            </select>
          </label>

          <label>
            Temperatura
            <input
              type="number"
              placeholder="Ex.: 4"
              value={temperatura.valor}
              onChange={(e) =>
                setTemperatura({ ...temperatura, valor: e.target.value })
              }
            />
          </label>

          <label>
            Responsável
            <input
              type="text"
              value={temperatura.responsavel}
              onChange={(e) =>
                setTemperatura({
                  ...temperatura,
                  responsavel: e.target.value,
                })
              }
            />
          </label>

          <div className="botoes-formulario">
            <button className="botao-principal" onClick={guardarTemperatura}>
              Guardar temperatura
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Checklist de higienização</h2>

        <div className="formulario">
          <label>
            Data
            <input
              type="date"
              value={checklist.data}
              onChange={(e) =>
                setChecklist({ ...checklist, data: e.target.value })
              }
            />
          </label>

          <label>
            Área
            <input
              type="text"
              placeholder="Ex.: Cozinha, copa, armazém"
              value={checklist.area}
              onChange={(e) =>
                setChecklist({ ...checklist, area: e.target.value })
              }
            />
          </label>

          <label>
            Tarefa
            <input
              type="text"
              placeholder="Ex.: Bancadas higienizadas"
              value={checklist.tarefa}
              onChange={(e) =>
                setChecklist({ ...checklist, tarefa: e.target.value })
              }
            />
          </label>

          <label>
            Estado
            <select
              value={checklist.estado}
              onChange={(e) =>
                setChecklist({ ...checklist, estado: e.target.value })
              }
            >
              <option>Conforme</option>
              <option>Não conforme</option>
              <option>Por verificar</option>
            </select>
          </label>

          <label>
            Responsável
            <input
              type="text"
              value={checklist.responsavel}
              onChange={(e) =>
                setChecklist({ ...checklist, responsavel: e.target.value })
              }
            />
          </label>

          <div className="botoes-formulario">
            <button className="botao-principal" onClick={guardarChecklist}>
              Guardar checklist
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Registo de não conformidades</h2>

        <div className="formulario">
          <label>
            Data
            <input
              type="date"
              value={naoConformidade.data}
              onChange={(e) =>
                setNaoConformidade({
                  ...naoConformidade,
                  data: e.target.value,
                })
              }
            />
          </label>

          <label>
            Gravidade
            <select
              value={naoConformidade.gravidade}
              onChange={(e) =>
                setNaoConformidade({
                  ...naoConformidade,
                  gravidade: e.target.value,
                })
              }
            >
              <option>Baixa</option>
              <option>Média</option>
              <option>Alta</option>
              <option>Crítica</option>
            </select>
          </label>

          <label>
            Descrição
            <textarea
              value={naoConformidade.descricao}
              onChange={(e) =>
                setNaoConformidade({
                  ...naoConformidade,
                  descricao: e.target.value,
                })
              }
            />
          </label>

          <label>
            Medida corretiva
            <textarea
              value={naoConformidade.medidaCorretiva}
              onChange={(e) =>
                setNaoConformidade({
                  ...naoConformidade,
                  medidaCorretiva: e.target.value,
                })
              }
            />
          </label>

          <label>
            Responsável
            <input
              type="text"
              value={naoConformidade.responsavel}
              onChange={(e) =>
                setNaoConformidade({
                  ...naoConformidade,
                  responsavel: e.target.value,
                })
              }
            />
          </label>

          <div className="botoes-formulario">
            <button
              className="botao-principal"
              onClick={guardarNaoConformidade}
            >
              Guardar não conformidade
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Histórico de temperaturas</h2>

        {temperaturas.length === 0 ? (
          <p>Ainda não existem temperaturas registadas.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Equipamento</th>
                <th>Tipo</th>
                <th>Temperatura</th>
                <th>Estado</th>
                <th>Responsável</th>
              </tr>
            </thead>

            <tbody>
              {temperaturas.map((item, index) => {
                const critico = estadoTemperatura(item) === "Crítico";

                return (
                  <tr key={index}>
                    <td>{item.data}</td>
                    <td>{item.equipamento}</td>
                    <td>{item.tipo}</td>
                    <td>{item.valor} ºC</td>
                    <td>
                      {critico ? (
                        <span style={{ color: "#dc2626", fontWeight: "bold" }}>
                          ⚠ Crítico
                        </span>
                      ) : (
                        <span style={{ color: "#16a34a", fontWeight: "bold" }}>
                          ✔ Conforme
                        </span>
                      )}
                    </td>
                    <td>{item.responsavel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Histórico de checklists</h2>

        {checklists.length === 0 ? (
          <p>Ainda não existem checklists registadas.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Área</th>
                <th>Tarefa</th>
                <th>Estado</th>
                <th>Responsável</th>
              </tr>
            </thead>

            <tbody>
              {checklists.map((item, index) => (
                <tr key={index}>
                  <td>{item.data}</td>
                  <td>{item.area}</td>
                  <td>{item.tarefa}</td>
                  <td>{item.estado}</td>
                  <td>{item.responsavel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Não conformidades registadas</h2>

        {naoConformidades.length === 0 ? (
          <p>Ainda não existem não conformidades registadas.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Gravidade</th>
                <th>Descrição</th>
                <th>Medida corretiva</th>
                <th>Responsável</th>
              </tr>
            </thead>

            <tbody>
              {naoConformidades.map((item, index) => (
                <tr key={index}>
                  <td>{item.data}</td>
                  <td>{item.gravidade}</td>
                  <td>{item.descricao}</td>
                  <td>{item.medidaCorretiva}</td>
                  <td>{item.responsavel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}