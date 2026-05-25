import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function Utilizadores() {
  const [utilizadores, setUtilizadores] = useState([]);

  useEffect(() => {
    carregarUtilizadores();
  }, []);

  async function carregarUtilizadores() {
    const { data, error } = await supabase
      .from("perfis")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setUtilizadores(data || []);
  }

  async function alterarPerfil(id, novoPerfil) {
    const { error } = await supabase
      .from("perfis")
      .update({
        perfil: novoPerfil,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    carregarUtilizadores();
  }

  return (
    <div className="pagina">
      <h1>Gestão de Utilizadores</h1>

      <p className="descricao">
        Gestão de perfis e permissões da plataforma.
      </p>

      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Perfil</th>
            <th>Alterar perfil</th>
          </tr>
        </thead>

        <tbody>
          {utilizadores.map((user) => (
            <tr key={user.id}>
              <td>{user.nome || "-"}</td>

              <td>{user.user_id}</td>

              <td>
                <strong>{user.perfil}</strong>
              </td>

              <td>
                <select
                  value={user.perfil}
                  onChange={(e) =>
                    alterarPerfil(user.id, e.target.value)
                  }
                >
                  <option value="admin">admin</option>
                  <option value="direcao">direcao</option>
                  <option value="cozinha">cozinha</option>
                  <option value="nutricionista">
                    nutricionista
                  </option>
                  <option value="haccp">haccp</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Utilizadores;