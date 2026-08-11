export function SiteFooter() {
  return (
    <footer id="footer" className="site-footer mt-5">
      <div className="footer-top">
        <div className="container">
          <div className="row">
            <div className="col-lg-4 col-md-6">
              <div className="footer-info">
                <img src="/assets/img/logoescuro.png" alt="Equilibra Mente" className="footer-logo img-fluid mb-4" />
                <div className="social-links mt-3">
                  <a href="https://www.facebook.com/share/16PuqyqkeM/?mibextid=wwXIfr" target="_blank" className="facebook"><i className="bx bxl-facebook" /></a>
                  <a href="https://www.instagram.com/espaco_equilibramente?igsh=dG03Z3pid2hpYmFk" target="_blank" className="instagram"><i className="bx bxl-instagram" /></a>
                  <a href="https://www.linkedin.com/in/espa%C3%A7o-equilibra-mente-99a439368" target="_blank" className="linkedin"><i className="bx bxl-linkedin" /></a>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 footer-links">
              <h4>Nossos Servicos</h4>
              <ul>
                <li><i className="bx bx-chevron-right" /> Atendimento Personalizado</li>
                <li><i className="bx bx-chevron-right" /> Aluguel de Salas</li>
                <li><i className="bx bx-chevron-right" /> Espacos para Eventos</li>
                <li><i className="bx bx-chevron-right" /> Salas de Reuniao</li>
                <li><i className="bx bx-chevron-right" /> Ambientes Equipados</li>
                <li><i className="bx bx-chevron-right" /> <a href="/regulamento">Regulamento Interno</a></li>
              </ul>
            </div>
            <div className="col-lg-4 col-md-6 footer-newsletter">
              <h4>Inscreva-se na nossa Newsletter</h4>
              <p>Fique por dentro das nossas novidades, disponibilidade e atualizacoes das salas.</p>
              <form action="/api/newsletter" method="post">
                <input type="email" name="email" required />
                <input type="submit" value="Inscrever-se" />
              </form>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
