export default function SobreProjeto() {
  return (
    <div className="sobre-container">
      <h2>Sobre o Projeto</h2>

      <div className="sobre-card">
        <h3>IPSS Gestão de Refeições</h3>

        <p>
          Aplicação web desenvolvida para apoiar a organização, planeamento e
          controlo da produção alimentar em contexto de IPSS.
        </p>

        <p>
          A plataforma permite centralizar informação essencial sobre a
          instituição, utentes, dietas, ementas, fichas técnicas, stocks, custos,
          HACCP, valor nutricional e relatórios.
        </p>

        <h3>Principais funcionalidades</h3>

        <ul>
          <li>Gestão dos dados da instituição</li>
          <li>Registo e edição de utentes</li>
          <li>Ligação entre utentes, dietas, alergias e intolerâncias</li>
          <li>Criação de ementas</li>
          <li>Fichas técnicas com ingredientes, capitações e custos</li>
          <li>Geração assistida de fichas técnicas</li>
          <li>Cálculo de custo total e custo por dose</li>
          <li>Gestão de stocks, preços, validade e stock mínimo</li>
          <li>Verificação automática de stock por receita</li>
          <li>Lista automática de compras</li>
          <li>Registos HACCP e alertas de segurança alimentar</li>
          <li>Análise de valor nutricional por dose</li>
          <li>Exportação de relatórios em PDF</li>
          <li>Dashboard administrativo</li>
          <li>Modo escuro e painel de acessibilidade</li>
          <li>Funcionamento online com autenticação</li>
        </ul>

        <h3>Objetivo</h3>

        <p>
          O projeto pretende facilitar o trabalho técnico e operacional das
          instituições sociais, reduzindo duplicação de registos, melhorando a
          rastreabilidade da informação e apoiando decisões relacionadas com
          alimentação, custos, dietas especiais e segurança alimentar.
        </p>

        <h3>Tecnologias utilizadas</h3>

        <ul>
          <li>React</li>
          <li>JavaScript</li>
          <li>CSS3</li>
          <li>Supabase</li>
          <li>Vercel</li>
          <li>jsPDF</li>
          <li>Recharts</li>
          <li>Lucide React</li>
          <li>PWA / aplicação instalável</li>
        </ul>

        <h3>Nota importante</h3>

        <p>
          A informação gerada automaticamente pela aplicação, nomeadamente em
          fichas técnicas, ementas, dietas, alergénios, custos e HACCP, deve ser
          sempre validada por responsável técnico antes da sua utilização formal.
        </p>

        <h3>Autor</h3>

        <p>
          Frederico Marinheira Dias Sampaio Pinto
        </p>

        <p>
          Projeto desenvolvido no âmbito da aprendizagem e desenvolvimento de
          competências em programação, frontend, UX/UI, bases de dados e
          soluções digitais aplicadas à gestão alimentar em contexto social.
        </p>
      </div>
    </div>
  );
}