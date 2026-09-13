import { useTranslation } from 'react-i18next';
import { FiMessageSquare, FiFolder, FiDownload } from 'react-icons/fi';
import portrait from '../assets/andres-studio.jpg';

export default function PortraitHero({ cv }) {
  const { t } = useTranslation();
  return <section id="top" className="portfolio-hero">
    <div className="window-title"><span>▣ {t('sales.heroWindow')}</span><span aria-hidden="true">■</span></div>
    <div className="hero-toolbar"><span>{t('hero.eyebrow')}</span><span className="retro-version">HTML · HUMAN · AI</span></div>
    <div className="portrait-hero">
      <div className="portrait-copy">
        <p className="welcome-label">{t('sales.heroEyebrow')}</p>
        <p className="hero-person">Andrés Landazábal / <strong>{t('sales.role')}</strong></p>
        <h1>{t('sales.headline')}<br /><span>{t('sales.headlineAccent')}</span></h1>
        <p className="hero-role-label">{t('retro.role')}</p>
        <p className="hero-role">{t('sales.heroIntro')}</p>
        <div className="portrait-actions">
          <a className="portrait-explore retro-button" href="https://x.com/andresflsxx" target="_blank" rel="noopener noreferrer"><FiMessageSquare aria-hidden="true" />{t('sales.discuss')}</a>
          <a className="hero-work-link retro-button" href="#projects"><FiFolder aria-hidden="true" />{t('sales.seeWork')}</a>
          <a href={cv} download="応募書類_Andres_Felipe_Landazabal.pdf" className="cv-download-btn retro-button"><FiDownload aria-hidden="true" />{t('download_cv')}</a>
        </div>
        <p className="hero-footnote">{t('sales.heroNote')}</p>
      </div>
      <figure className="portrait-panel">
        <div className="photo-title"><span>▧ ANDRÉS / AI ENGINEER</span><span aria-hidden="true">■</span></div>
        <div className="photo-mat"><img src={portrait} width="880" height="1100" alt={t('retro.photoAlt')} fetchPriority="high" /></div>
        <figcaption><span aria-hidden="true">●</span> {t('design.portraitCaption')}</figcaption>
      </figure>
    </div>
    <div className="hero-status"><span>✓ {t('sales.status')}</span><span>Python / PyTorch / TensorFlow</span></div>
  </section>;
}
