import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const InstituicaoContext = createContext(null);

export function InstituicaoProvider({ children }) {
  const [instituicoes, setInstituicoes] = useState([]);
  const [instituicaoAtual, setInstituicaoAtual] = useState(null);
  const [perfilInstituicao, setPerfilInstituicao] = useState(null);
  const [loadingInstituicao, setLoadingInstituicao] = useState(true);

  useEffect(() => {
    carregarInstituicoes();
  }, []);

  async function carregarInstituicoes() {
    setLoadingInstituicao(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setLoadingInstituicao(false);
      return;
    }

    const { data, error } = await supabase
      .from("utilizadores_instituicoes")
      .select("perfil, instituicoes(*)")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      setLoadingInstituicao(false);
      return;
    }

    const lista = (data || [])
      .map((item) => ({
        ...item.instituicoes,
        perfil: item.perfil,
      }))
      .filter(Boolean);

    setInstituicoes(lista);

    if (lista.length > 0) {
      setInstituicaoAtual(lista[0]);
      setPerfilInstituicao(lista[0].perfil);
    }

    setLoadingInstituicao(false);
  }

  function selecionarInstituicao(instituicao) {
    setInstituicaoAtual(instituicao);
    setPerfilInstituicao(instituicao?.perfil || null);
  }

  return (
    <InstituicaoContext.Provider
      value={{
        instituicoes,
        instituicaoAtual,
        perfilInstituicao,
        loadingInstituicao,
        selecionarInstituicao,
        carregarInstituicoes,
      }}
    >
      {children}
    </InstituicaoContext.Provider>
  );
}

export function useInstituicao() {
  return useContext(InstituicaoContext);
}