import { useEffect, useState } from "react";

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

import { supabase } from "./supabaseClient";

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

import AccessibilityPanel from "./AccessibilityPanel";

import "./App.css";

export default function App() {
  const [pagina, setPagina] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarFechada, setSidebarFechada] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [session, setSession] = useState(null);
  const [totalAlertas, setTotalAlertas] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      carregarAlertas();
    }
  }, [session]);

  async function carregarAlertas() {
    const userId = session?.user?.id;

    if (!userId) return;

    const { data: stocksData, error: stocksError } = await supabase
      .from("stocks")
      .select("*")
      .eq("user_id", userId);

    if (stocksError) {
      console.error(stocksError);
    }

    const { data: haccpData, error: haccpError } = await supabase
      .from("haccp")
      .select("*")
      .eq("user_id", userId);

    if (haccpError) {
      console.error(haccpError);
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const stocks = stocksData || [];
    const haccp = haccpData || [];

    const stockBaixo = stocks.filter(
      (item) =>
        Number(item.quantidade || 0) <=
        Number(item.stock_minimo || 0)
    ).length;

    const produtosExpirados = stocks.filter((item) => {
      if (!item.validade) return false;

      const validade = new Date(item.validade);
      validade.setHours(0, 0, 0, 0);

      return validade < hoje;
    }).length;

    const produtosAExpirar = stocks.filter((item) => {
      if (!item.validade) return false;

      const validade = new Date(item.validade);
      validade.setHours(0, 0, 0, 0);

      const diferenca = validade - hoje;
      const dias = Math.ceil(diferenca / (1000 * 60 * 60 * 24));

      return dias >= 0 && dias <= 7;
    }).length;

    const alertasHaccp = haccp.filter(
      (item) =>
        item.tipo_registo === "nao_conformidade" ||
        item.estado === "Crítico" ||
        item.estado === "Não conforme"
    ).length;

    setTotalAlertas(
      stockBaixo + produtosExpirados + produtosAExpirar + alertasHaccp
    );
  }

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }
  }

  async function registar() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Conta criada com sucesso.");
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

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

  if (!session) {
    return (
      <>
        <div className={darkMode ? "login-page dark" : "login-page"}>
          <div className="login-card">
            <div className="login-logo">
              <UtensilsCrossed size={42} />
            </div>

            <h1>Gestão de Refeições</h1>

            <p>
              Plataforma digital para apoio à gestão de refeições, custos,
              ementas, dietas, fichas técnicas, stocks, valor nutricional,
              HACCP e relatórios.
            </p>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-login"
            />

            <input
              type="password"
              placeholder="Palavra-passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-login"
            />

            <button className="botao-principal" onClick={login}>
              Entrar
            </button>

            <button className="botao-secundario" onClick={registar}>
              Criar conta
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

        <AccessibilityPanel />
      </>
    );
  }

  return (
    <>
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

            <button onClick={logout}>
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
              <button
                className="topbar-icon"
                onClick={carregarAlertas}
                title={
                  totalAlertas > 0
                    ? `${totalAlertas} alerta(s) ativo(s)`
                    : "Sem alertas ativos"
                }
                aria-label="Alertas da aplicação"
              >
                <Bell size={20} />

                {totalAlertas > 0 ? (
                  <span className="notification-badge">{totalAlertas}</span>
                ) : (
                  <span className="notification-dot"></span>
                )}
              </button>

              <div className="user-box">
                <UserCircle size={26} />

                <div>
                  <strong>{session.user?.email}</strong>

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
          {pagina === "valor-nutricional" && <ValorNutricional />}
          {pagina === "stocks" && <Stocks />}
          {pagina === "haccp" && <HACCP />}
          {pagina === "relatorios" && <Relatorios />}
          {pagina === "historico" && <Historico />}
          {pagina === "sobre" && <SobreProjeto />}
        </main>
      </div>

      <AccessibilityPanel />
    </>
  );
}