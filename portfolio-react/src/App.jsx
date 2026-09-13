import myCv from './assets/応募書類_Andres_Felipe_Landazabal.pdf';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { FiMessageSquare, FiFolder } from 'react-icons/fi';
import PortraitHero from './components/PortraitHero';
import repos from './data/pinned-projects.json';
import './index.css';

const projects = [...repos].sort((a, b) => Number(b.name === 'ml-repository') - Number(a.name === 'ml-repository'));

export default function App() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage;
  const [activeService, setActiveService] = useState(0);
  const services = t('sales.services', { returnObjects: true });
  const selectedService = services[activeService];
  useEffect(() => { document.documentElement.lang = currentLang; }, [currentLang]);

  return <div className="portfolio">
    <a className="skip-link" href="#portfolio">{t('design.skip')}</a>
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="Andrés Landazábal"><span aria-hidden="true">▧</span> ANDRÉS<span className="wordmark-extension">.WORK</span></a>
      <nav aria-label={t('design.navigation')}>
        <a href="#services">{t('sales.servicesLabel')}</a>
        <a href="#projects">{t('design.work')}</a>
        <a href="#about">{t('about_me_h3')}</a>
        <a href="#contact">{t('design.contact')}</a>
      </nav>
      <div className="language-controls" aria-label={t('languages_h3')}>
        {[['en', 'EN'], ['es', 'ES'], ['ja', '日本語']].map(([lang, label]) => <button key={lang} lang={lang} className={`lang-btn retro-button ${currentLang === lang ? 'active' : ''}`} aria-pressed={currentLang === lang} onClick={() => i18n.changeLanguage(lang)}>{label}</button>)}
      </div>
    </header>
    <PortraitHero cv={myCv} />
    <div className="web-ribbon"><span>{t('sales.ribbon')}</span><span>{t('stack.lifecycle')}</span><span>{t('sales.ribbonEnd')}</span></div>
    <main className="main-container" id="portfolio">
      <section id="services" className="services-section">
        <div className="section-heading"><h2>{t('sales.servicesLabel')}</h2><span className="section-note">{t('sales.servicesNote')}</span></div>
        <div className="services-body">
          <div className="sales-section-intro"><h3>{t('sales.servicesHeadline')}</h3><p>{t('sales.servicesIntro')}</p></div>
          <div className="service-picker" role="group" aria-label={t('sales.servicesLabel')}>
            {services.map((service, index) => <button key={service.title} type="button" aria-pressed={activeService === index} aria-controls="service-detail" className={`service-choice retro-button ${activeService === index ? 'selected' : ''}`} onClick={() => setActiveService(index)}><strong>{service.title}</strong></button>)}
          </div>
          <div id="service-detail" className="service-detail" aria-live="polite">
            <div><p className="small-label">{t('sales.needLabel')}</p><h4>{selectedService.need}</h4><p>{selectedService.description}</p></div>
            <div className="service-deliverables"><p className="small-label">{t('sales.deliverables')}</p><ul>{selectedService.deliverables.map(item => <li key={item}>{item}</li>)}</ul><a className="sales-button retro-button" href="https://x.com/andresflsxx" target="_blank" rel="noopener noreferrer"><FiMessageSquare aria-hidden="true" /> {t('sales.discuss')}</a></div>
          </div>
        </div>
      </section>
      <section id="projects" className="work-section">
        <div className="section-heading"><h2>{t('design.work')}</h2><span className="section-note">{t('design.selected')}</span></div>
        <div className="flagship">
          <div className="flagship-copy"><p className="small-label">{t('design.featured')}</p><h3>{t('design.modelTitle')}</h3><p>{t('design.modelDescription')}</p><dl className="case-facts"><div><dt>{t('sales.challenge')}</dt><dd>{t('sales.challengeText')}</dd></div><div><dt>{t('sales.build')}</dt><dd>{t('sales.buildText')}</dd></div></dl><a className="sales-button retro-button" href={projects[0].html_url} target="_blank" rel="noreferrer"><FiFolder aria-hidden="true" /> {t('sales.inspect')}</a></div>
          <div className="model-diagram" aria-label={t('sales.pipelineLabel')}><div className="diagram-title">MODEL_PIPELINE</div><div className="model-core"><span>0.6B</span><p>{t('sales.modelLabel')}</p></div><ol><li>LoRA + SFT</li><li>DPO</li><li>{t('sales.evaluation')}</li><li>FastAPI</li></ol><p className="diagram-caption">{t('sales.pipelineCaption')}</p></div>
        </div>
        <div className="project-directory-label">{t('sales.moreProjects')} ↓</div>
        <div className="projects-list">
          {projects.slice(1).map((repo) => <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" className="project-card">
            <div className="project-info">
              <h3>{repo.name}</h3>
              {repo.description && <p>{repo.description}</p>}
            </div>
            <span className="project-lang">{repo.language}</span>
          </a>)}
        </div>
      </section>
      <section id="about" className="about-section">
        <div className="section-heading"><h2>{t('about_me_h3')}</h2></div>
        <div className="about-layout">
          <div className="about-copy"><h3 className="about-headline">{t('sales.aboutHeadline')}</h3>{t('sales.aboutCopy').split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          <aside className="details-column">
            <section className="detail-box" aria-labelledby="scope-heading">
              <h3 id="scope-heading">{t('stack.scopeTitle')}</h3>
              <p className="engineering-scope">{t('stack.scope')}</p>
            </section>
            <section className="detail-box" aria-labelledby="languages-heading">
              <h3 id="languages-heading">{t('languages_h3')}</h3>
            <dl className="language-list">{[['Spanish', 'native'], ['Japanese', 'n2'], ['English', 'b2']].map(([name, level]) => <div key={name}><dt>{t(`lang_names.${name}`)}</dt><dd>{t(`levels.${level}`)}</dd></div>)}</dl>
            </section>
          </aside>
        </div>
        <div className="technical-stack" aria-labelledby="stack-heading">
          <div className="stack-intro"><h3 id="stack-heading">{t('stack_h3')}</h3><p>{t('stack.intro')}</p></div>
          <div className="stack-grid">{t('stack.groups', { returnObjects: true }).map((group) => <section className="stack-card" key={group.title}><h4>{group.title}</h4><p>{group.description}</p><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></section>)}</div>
        </div>
      </section>
      <section id="contact" className="contact-section">
        <div className="window-title"><span>✉ {t('design.contact')}</span><span aria-hidden="true">■</span></div>
        <h2>{t('sales.contactTitle')}</h2>
        <p className="contact-prompt">{t('sales.contactPrompt')}</p>
        <a className="contact-profile retro-button" href="https://x.com/andresflsxx" target="_blank" rel="noopener noreferrer"><FiMessageSquare aria-hidden="true" /> X / @andresflsxx</a>
        <div className="social-links">
          <a className="retro-button" href="https://github.com/andresfls-buc" target="_blank" rel="noreferrer"><FaGithub aria-hidden="true" /> GitHub</a>
          <a className="retro-button" href="https://www.linkedin.com/in/andres-felipe-landazabal-sanmiguel" target="_blank" rel="noreferrer"><FaLinkedin aria-hidden="true" /> LinkedIn</a>
          <a className="retro-button" href="https://x.com/andresflsxx" target="_blank" rel="noopener noreferrer"><FiMessageSquare aria-hidden="true" /> X</a>
        </div>
      </section>
    </main>
    <footer><div className="web-badges" aria-label={t('retro.badges')}><span>HAND<br /><b>CODED</b></span><span>POWERED BY<br /><b>CURIOSITY</b></span><span>COLOMBIA<br /><b>↔ JAPAN</b></span></div><span>© {new Date().getFullYear()} Andrés Landazábal</span><a href="#top">{t('design.backTop')}</a></footer>
  </div>;
}
