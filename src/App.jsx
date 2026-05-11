import { useState } from "react";
import Dashboard from "./components/Dashboard";
import Relatorios from "./components/Relatorios";
import Historico from "./components/Historico";
import Definicoes from "./components/Definicoes";
import SobreProjeto from "./components/SobreProjeto";
import Dietas from "./components/Dietas";
import Capitacoes from "./components/Capitacoes";
import Ementa from "./components/Ementa";
import Custos from "./components/Custos";
import FichasTecnicas from "./components/FichasTecnicas";
import Stocks from "./components/Stocks";

import "./App.css";

export default function App() {
  const [pagina, setPagina] = useState("dashboard");
  const [autenticado, setAutenticado] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  if (!autenticado) {
    return (
      <div className={darkMode ? "login-page dark" : "login-page"}>
        <div className="login-card">
          <div className="login-logo">IPSS</div>

          <h1>Gestão de Refeições</h1>

          <p>
            Plataforma digital para apoio à gestão de refeições, custos,
            ementas, dietas, fichas técnicas, stocks e relatórios em contexto
            IPSS.
          </p>

          <button
            className="botao-principal"
            onClick={() => setAutenticado(true)}
          >
            Entrar na aplicação
          </button>

          <button
            className="botao-secundario"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "Modo claro" : "Modo escuro"}
          </button>

          <span className="login-footer">
            Projeto desenvolvido por Frederico Pinto
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? "app-container dark" : "app-container"}>
      <aside className="sidebar">
        <div className="logo-area">
          <h1>IPSS Gestão</h1>
          <p>Frederico Pinto</p>
        </div>

        <nav>
          <button onClick={() => setPagina("dashboard")}>
            Dashboard
          </button>

          <button onClick={() => setPagina("capitacoes")}>
            Capitações
          </button>

          <button onClick={() => setPagina("ementa")}>
            Ementa
          </button>

          <button onClick={() => setPagina("custos")}>
            Custos
          </button>

          <button onClick={() => setPagina("dietas")}>
            Dietas
          </button>

          <button onClick={() => setPagina("fichas")}>
            Fichas Técnicas
          </button>

          <button onClick={() => setPagina("stocks")}>
            Stocks
          </button>

          <button onClick={() => setPagina("relatorios")}>
            Relatórios
          </button>

          <button onClick={() => setPagina("historico")}>
            Histórico
          </button>

          <button onClick={() => setPagina("definicoes")}>
            Definições
          </button>

          <button onClick={() => setPagina("sobre")}>
            Sobre o Projeto
          </button>

          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "Modo claro" : "Modo escuro"}
          </button>

          <button onClick={() => setAutenticado(false)}>
            Sair
          </button>
        </nav>
      </aside>

      <main className="conteudo">
        {pagina === "dashboard" && <Dashboard />}

        {pagina === "capitacoes" && <Capitacoes />}

        {pagina === "ementa" && <Ementa />}

        {pagina === "custos" && <Custos />}

        {pagina === "dietas" && <Dietas />}

        {pagina === "fichas" && <FichasTecnicas />}

        {pagina === "stocks" && <Stocks />}

        {pagina === "relatorios" && <Relatorios />}

        {pagina === "historico" && <Historico />}

        {pagina === "definicoes" && <Definicoes />}

        {pagina === "sobre" && <SobreProjeto />}
      </main>
    </div>
  );
}