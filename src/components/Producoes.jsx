import { useEffect, useState } from "react";

import {
  Factory,
  CalendarDays,
  ClipboardList,
  Search,
} from "lucide-react";

import { supabase } from "../supabaseClient";

function Producoes() {
  const [producoes, setProducoes] = useState([]);
  const [pesquisa, setPesquisa] = useState("");

  useEffect(() => {
    carregarProducoes();
  }, []);

  async function carregarProducoes() {
    const { data: userData } =
      await supabase.auth.getUser();

    const user = userData.user;

    const { data, error } = await supabase
      .from("producoes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    setProducoes(data || []);
  }

  const producoesFiltradas =
    producoes.filter((producao) =>
      JSON.stringify(producao)
        .toLowerCase()
        .includes(pesquisa.toLowerCase())
    );

  return (
    <div className="pagina">
      <div className="topo-dashboard">
        <div>
          <h1>
            <Factory size={28} /> Produções
          </h1>

          <p className="dashboard-subtitle">
            Histórico operacional de
            produções executadas.
          </p>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="topbar-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Pesquisar produção..."
            value={pesquisa}
            onChange={(e) =>
              setPesquisa(e.target.value)
            }
          />
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <Factory size={30} />

          <h3>Total produções</h3>

          <p>{producoes.length}</p>

          <span>Registos operacionais</span>
        </div>

        <div className="dashboard-card">
          <ClipboardList size={30} />

          <h3>Total movimentos</h3>

          <p>
            {producoes.reduce(
              (total, item) =>
                total +
                Number(
                  item.total_movimentos || 0
                ),
              0
            )}
          </p>

          <span>Movimentos gerados</span>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>
          <CalendarDays size={20} />{" "}
          Histórico de Produções
        </h2>

        {producoesFiltradas.length === 0 ? (
          <p>
            Ainda não existem produções
            registadas.
          </p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Dias produzidos</th>
                <th>Movimentos</th>
                <th>Observações</th>
              </tr>
            </thead>

            <tbody>
              {producoesFiltradas.map(
                (producao, index) => (
                  <tr key={index}>
                    <td>
                      {new Date(
                        producao.created_at
                      ).toLocaleDateString(
                        "pt-PT"
                      )}
                    </td>

                    <td>
                      {Array.isArray(
                        producao.dias
                      )
                        ? producao.dias.join(
                            ", "
                          )
                        : "-"}
                    </td>

                    <td>
                      {
                        producao.total_movimentos
                      }
                    </td>

                    <td>
                      {producao.observacoes}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Producoes;