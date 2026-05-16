import { useState } from "react";

import {
  LayoutDashboard,
  Building2,
  UtensilsCrossed,
  ClipboardList,
  Euro,
  Apple,
  FileText,
  HeartPulse,
  Package,
  BarChart3,
  History,
  Info,
  Moon,
  Sun,
  LogOut,
  Menu,
  Bell,
  Search,
  UserCircle,
  ShieldCheck,
} from "lucide-react";

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
import ValorNutricional from "./components/ValorNutricional";
import HACCP from "./components/HACCP";

import "./App.css";

export default function App() {
  const [pagina, setPagina] = useState("dashboard");
  const [autenticado, setAutenticado] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarFechada, setSidebarFechada] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "dados-ipss", label: "Dados da IPSS", icon: Building2 },
    { id: "capitacoes", label: "Capitações", icon: ClipboardList },
    { id: "ementa", label: "Ementa", icon: UtensilsCrossed },
    { id: "custos", label: "Custos", icon: Euro },
    { id: "dietas", label: "Dietas", icon: Apple },
    { id: "fichas", label: "Fichas Técnicas", icon: FileText },
    {
      id: "valor-nutricional",
      label: "Valor Nutricional",
      icon: HeartPulse,
    },
    { id: "stocks", label: "Stocks", icon: Package },
    { id: "haccp", label: "HACCP", icon: ShieldCheck },
    { id: "relatorios", label: "Relatórios", icon: BarChart3 },
    { id: "historico", label: "Histórico", icon: History },
    { id: "sobre", label: "Sobre o Projeto", icon: Info },
  ];

  if (!autenticado) {
    return (
      <div className={darkMode ? "login-page dark" : "login-page"}>
        <div className="login-card">
          <div className="login-logo">
            <UtensilsCrossed size={42} />
          </div>

          <h1>Gestão de Refeições</h1>

          <p>
            Plataforma digital para apoio à gestão de refeições, custos,
            ementas, dietas, fichas técnicas, stocks, valor nutricional,
            HACCP e relatórios em contexto IPSS.
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
            {darkMode ? (
              <>
                <Sun size={18} /> Modo claro
              </>
            ) : (
              <>
                <Moon size={18} /> Modo escuro
              </>
            )}
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
      <aside className={sidebarFechada ? "sidebar fechada" : "sidebar"}>
        <div className="logo-area">
          <div className="logo-mini">IP</div>

          {!sidebarFechada && (
            <div>
              <h1>IPSS Gestão</h1>
              <p>Frederico Pinto</p>
            </div>
          )}
        </div>

        <nav>
          {menuItems.map((item) => {
            const Icone = item.icon;

            return (
              <button
                key={item.id}
                className={pagina === item.id ? "ativo" : ""}
                onClick={() => setPagina(item.id)}
                title={sidebarFechada ? item.label : ""}
              >
                <Icone size={19} />

                {!sidebarFechada && <span>{item.label}</span>}
              </button>
            );
          })}

          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun size={19} /> : <Moon size={19} />}

            {!sidebarFechada && (
              <span>{darkMode ? "Modo claro" : "Modo escuro"}</span>
            )}
          </button>

          <button onClick={() => setAutenticado(false)}>
            <LogOut size={19} />

            {!sidebarFechada && <span>Sair</span>}
          </button>
        </nav>
      </aside>

      <main className="conteudo">
        <header className="topbar">
          <button
            className="botao-menu"
            onClick={() => setSidebarFechada(!sidebarFechada)}
          >
            <Menu size={22} />
          </button>

          <div className="topbar-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Pesquisar na aplicação..."
            />
          </div>

          <div className="topbar-actions">
            <button className="topbar-icon">
              <Bell size={20} />

              <span className="notification-dot"></span>
            </button>

            <div className="user-box">
              <UserCircle size={26} />

              <div>
                <strong>Frederico Pinto</strong>

                <span>Técnico responsável</span>
              </div>
            </div>
          </div>
        </header>

        {pagina === "dashboard" && <Dashboard />}

        {pagina === "dados-ipss" && <Definicoes />}

        {pagina === "capitacoes" && <Capitacoes />}

        {pagina === "ementa" && <Ementa />}

        {pagina === "custos" && <Custos />}

        {pagina === "dietas" && <Dietas />}

        {pagina === "fichas" && <FichasTecnicas />}

        {pagina === "valor-nutricional" && (
          <ValorNutricional />
        )}

        {pagina === "stocks" && <Stocks />}

        {pagina === "haccp" && <HACCP />}

        {pagina === "relatorios" && <Relatorios />}

        {pagina === "historico" && <Historico />}

        {pagina === "sobre" && <SobreProjeto />}
      </main>
    </div>
  );
}