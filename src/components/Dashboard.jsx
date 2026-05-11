import { useEffect, useState } from "react";
import Graficos from "./Graficos";

export default function Dashboard() {
  const dadosGuardados =
    JSON.parse(localStorage.getItem("ipssRefeicoes")) || {};

  const historicoGuardado =
    JSON.parse(localStorage.getItem("ipssHistorico")) || [];

  const [instituicao, setInstituicao] = useState(
    dadosGuardados.instituicao || "Centro Social / IPSS"
  );

  const [creche, setCreche] = useState(dadosGuardados.creche || 80);
  const [lar, setLar] = useState(dadosGuardados.lar || 60);
  const [apoio, setApoio] = useState(dadosGuardados.apoio || 60);
  const [trabalhadores, setTrabalhadores] = useState(
    dadosGuardados.trabalhadores || 40
  );

  const [custoRefeicao, setCustoRefeicao] = useState(
    dadosGuardados.custoRefeicao || 3.5
  );

  const [historico, setHistorico] = useState(historicoGuardado);

  useEffect(() => {
    localStorage.setItem(
      "ipssRefeicoes",
      JSON.stringify({
        instituicao,
        creche,
        lar,
        apoio,
        trabalhadores,
        custoRefeicao,
      })
    );
  }, [instituicao, creche, lar, apoio, trabalhadores, custoRefeicao]);

  const totalRefeicoes = creche + lar + apoio + trabalhadores;
  const custoDiario = totalRefeicoes * custoRefeicao;
  const custoMensal = custoDiario * 30;
  const litrosSopa = totalRefeicoes * 0.25;

  function guardarDia() {
    const novoRegisto = {
      id: Date.now(),
      data: new Date().toLocaleDateString("pt-PT"),
      instituicao,
      creche,
      lar,
      apoio,
      trabalhadores,
      totalRefeicoes,
      custoRefeicao,
      custoDiario,
      custoMensal,
      litrosSopa,
    };

    const novoHistorico = [novoRegisto, ...historico];

    setHistorico(novoHistorico);
    localStorage.setItem("ipssHistorico", JSON.stringify(novoHistorico));
  }

  return (
    <div>
      <div className="topo-dashboard">
        <div>
          <h2>Dashboard</h2>
          <p className="subtitulo">{instituicao}</p>
        </div>

        <div className="data-box">
          <span>{new Date().toLocaleDateString("pt-PT")}</span>
        </div>
      </div>

      <div className="cards-grid">
        <div className="card destaque">
          <span>Total refeições</span>
          <strong>{totalRefeicoes}</strong>
        </div>

        <div className="card">
          <span>Creche</span>
          <strong>{creche}</strong>
        </div>

        <div className="card">
          <span>Lar</span>
          <strong>{lar}</strong>
        </div>

        <div className="card">
          <span>Apoio domiciliário</span>
          <strong>{apoio}</strong>
        </div>

        <div className="card">
          <span>Trabalhadores</span>
          <strong>{trabalhadores}</strong>
        </div>

        <div className="card">
          <span>Custo diário</span>
          <strong>{custoDiario.toFixed(2)}€</strong>
        </div>

        <div className="card">
          <span>Custo mensal</span>
          <strong>{custoMensal.toFixed(2)}€</strong>
        </div>

        <div className="card">
          <span>Litros de sopa</span>
          <strong>{litrosSopa.toFixed(1)}L</strong>
        </div>
      </div>

      <div className="painel">
        <h3>Dados da instituição</h3>

        <label>Nome da instituição</label>
        <input
          type="text"
          value={instituicao}
          onChange={(e) => setInstituicao(e.target.value)}
        />

        <label>Refeições da creche</label>
        <input
          type="number"
          value={creche}
          onChange={(e) => setCreche(Number(e.target.value))}
        />

        <label>Refeições do lar</label>
        <input
          type="number"
          value={lar}
          onChange={(e) => setLar(Number(e.target.value))}
        />

        <label>Apoio domiciliário</label>
        <input
          type="number"
          value={apoio}
          onChange={(e) => setApoio(Number(e.target.value))}
        />

        <label>Trabalhadores</label>
        <input
          type="number"
          value={trabalhadores}
          onChange={(e) => setTrabalhadores(Number(e.target.value))}
        />

        <label>Custo médio por refeição (€)</label>
        <input
          type="number"
          step="0.1"
          value={custoRefeicao}
          onChange={(e) => setCustoRefeicao(Number(e.target.value))}
        />

        <button className="botao-principal" onClick={guardarDia}>
          Guardar registo diário
        </button>
      </div>

      <div className="grafico-container">
        <Graficos
          creche={creche}
          lar={lar}
          apoio={apoio}
          trabalhadores={trabalhadores}
        />
      </div>
    </div>
  );
}