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
  Factory,
  BrainCircuit,
} from "lucide-react";

import { supabase } from "./supabaseClient";

import Dashboard from "./components/Dashboard";
import Relatorios from "./components/Relatorios";
import Historico from "./components/Historico";
import Producoes from "./components/Producoes";
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
import Utentes from "./components/Utentes";
import Utilizadores from "./components/Utilizadores";
import AssistenteIA from "./components/AssistenteIA";
import Analytics from "./components/Analytics";

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
  const [notificacoes, setNotificacoes] = useState([]);
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);

  const [perfil, setPerfil] = useState("admin");
  const [nomePerfil, setNomePerfil] = useState("");

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
      carregarNotificacoes();
      carregarPerfil();
    }
  }, [session]);

  async function carregarPerfil() {
    const userId = session?.user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from("perfis")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }

    if (!data) {
      const novoPerfil = {
        user_id: userId,
        nome: session.user.email,
        perfil: "admin",
      };

      const { data: perfilCriado, error: erroCriacao } = await supabase
        .from("perfis")
        .insert([novoPerfil])
        .select()
        .single();

      if (erroCriacao) {
        console.error(erroCriacao);
        return;
      }

      setPerfil(perfilCriado.perfil || "admin");
      setNomePerfil(perfilCriado.nome || session.user.email);
      return;
    }

    setPerfil(data.perfil || "admin");
    setNomePerfil(data.nome || session.user.email);
  }

  async function carregarNotificacoes() {
    const userId = session?.user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error(error);
      return;
    }

    setNotificacoes(data || []);
  }

  async function carregarAlertas() {
    const userId = session?.user?.id;
    if (!userId) return;

    const { data: stocksData } = await supabase
      .from("stocks")
      .select("*")
      .eq("user_id", userId);

    const { data: haccpData } = await supabase
      .from("haccp")
      .select("*")
      .eq("user_id", userId);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const stocks = stocksData || [];
    const haccp = haccpData || [];

    const stockBaixo = stocks.filter(
      (item) => Number(item.quantidade || 0) <= Number(item.stock_minimo || 0)
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
      const dias = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
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

  async function marcarComoLida(id) {
    const { error } = await supabase
      .from("notificacoes")
      .update({ lida: true })
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    carregarNotificacoes();
  }

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
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
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      perfis: ["admin", "direcao", "cozinha", "nutricionista", "haccp"],
    },
    {
      id: "assistente-ia",
      label: "Assistente IA",
      icon: BrainCircuit,
      perfis: ["admin", "direcao", "cozinha", "nutricionista"],
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      perfis: ["admin", "direcao", "nutricionista"],
    },
    {
      id: "dados-ipss",
      label: "Dados da IPSS",
      icon: Building2,
      perfis: ["admin", "direcao"],
    },
    {
      id: "capitacoes",
      label: "Capitações",
      icon: ClipboardList,
      perfis: ["admin", "nutricionista"],
    },
    {
      id: "ementa",
      label: "Ementa",
      icon: UtensilsCrossed,
      perfis: ["admin", "nutricionista", "cozinha"],
    },
    {
      id: "custos",
      label: "Custos",
      icon: Euro,
      perfis: ["admin", "direcao"],
    },
    {
      id: "utentes",
      label: "Utentes",
      icon: UserCircle,
      perfis: ["admin", "direcao"],
    },
    {
      id: "dietas",
      label: "Dietas",
      icon: Apple,
      perfis: ["admin", "nutricionista"],
    },
    {
      id: "fichas",
      label: "Fichas Técnicas",
      icon: FileText,
      perfis: ["admin", "cozinha", "nutricionista"],
    },
    {
      id: "valor-nutricional",
      label: "Valor Nutricional",
      icon: HeartPulse,
      perfis: ["admin", "nutricionista"],
    },
    {
      id: "stocks",
      label: "Stocks",
      icon: Package,
      perfis: ["admin", "cozinha"],
    },
    {
      id: "haccp",
      label: "HACCP",
      icon: ShieldCheck,
      perfis: ["admin", "haccp"],
    },
    {
      id: "relatorios",
      label: "Relatórios",
      icon: BarChart3,
      perfis: ["admin", "direcao"],
    },
    {
      id: "historico",
      label: "Histórico",
      icon: History,
      perfis: ["admin", "direcao"],
    },
    {
      id: "producoes",
      label: "Produções",
      icon: Factory,
      perfis: ["admin", "cozinha"],
    },
    {
      id: "utilizadores",
      label: "Utilizadores",
      icon: UserCircle,
      perfis: ["admin"],
    },
    {
      id: "sobre",
      label: "Sobre o Projeto",
      icon: Info,
      perfis: ["admin", "direcao", "cozinha", "nutricionista", "haccp"],
    },
  ];

  const menuPermitido = menuItems.filter((item) => item.perfis.includes(perfil));
  const notificacoesNaoLidas = notificacoes.filter((n) => !n.lida).length;

  useEffect(() => {
    if (!menuPermitido.some((item) => item.id === pagina)) {
      setPagina("dashboard");
    }
  }, [perfil]);

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
              ementas, dietas, fichas técnicas, stocks, valor nutricional, HACCP
              e relatórios.
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
            {menuPermitido.map((item) => {
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
              <input type="text" placeholder="Pesquisar na aplicação..." />
            </div>

            <div className="topbar-actions">
              <div style={{ position: "relative" }}>
                <button
                  className="topbar-icon"
                  onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)}
                  title={
                    notificacoesNaoLidas > 0
                      ? `${notificacoesNaoLidas} notificação(ões) não lida(s)`
                      : "Sem notificações não lidas"
                  }
                >
                  <Bell size={20} />

                  {notificacoesNaoLidas > 0 ? (
                    <span className="notification-badge">
                      {notificacoesNaoLidas}
                    </span>
                  ) : totalAlertas > 0 ? (
                    <span className="notification-dot"></span>
                  ) : (
                    <span className="notification-dot"></span>
                  )}
                </button>

                {mostrarNotificacoes && (
                  <div className="painel-notificacoes">
                    <h3>Notificações</h3>

                    {notificacoes.length === 0 ? (
                      <p>Sem notificações.</p>
                    ) : (
                      notificacoes.map((item) => (
                        <div
                          key={item.id}
                          className={`notificacao-item ${
                            item.lida ? "lida" : ""
                          }`}
                        >
                          <strong>{item.titulo}</strong>
                          <p>{item.mensagem}</p>

                          <small>
                            Prioridade: {item.prioridade || "normal"}
                          </small>

                          {!item.lida && (
                            <button
                              className="botao-secundario"
                              onClick={() => marcarComoLida(item.id)}
                            >
                              Marcar como lida
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="user-box">
                <UserCircle size={26} />

                <div>
                  <strong>{nomePerfil || session.user?.email}</strong>
                  <span>{perfil}</span>
                </div>
              </div>
            </div>
          </header>

          {pagina === "dashboard" && <Dashboard />}
          {pagina === "assistente-ia" && <AssistenteIA />}
          {pagina === "analytics" && <Analytics />}
          {pagina === "dados-ipss" && <Definicoes />}
          {pagina === "capitacoes" && <Capitacoes />}
          {pagina === "ementa" && <Ementa />}
          {pagina === "custos" && <Custos />}
          {pagina === "utentes" && <Utentes />}
          {pagina === "dietas" && <Dietas />}
          {pagina === "fichas" && <FichasTecnicas />}
          {pagina === "valor-nutricional" && <ValorNutricional />}
          {pagina === "stocks" && <Stocks />}
          {pagina === "haccp" && <HACCP />}
          {pagina === "relatorios" && <Relatorios />}
          {pagina === "historico" && <Historico />}
          {pagina === "producoes" && <Producoes />}
          {pagina === "utilizadores" && <Utilizadores />}
          {pagina === "sobre" && <SobreProjeto />}
        </main>
      </div>

      <AccessibilityPanel />
    </>
  );
}