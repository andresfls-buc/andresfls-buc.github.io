import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiArrowDown, FiDownload, FiPause, FiPlay } from 'react-icons/fi';

function BlinkingPortrait() {
  const { t } = useTranslation();
  const canvas = useRef(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const element = canvas.current, ctx = element.getContext('2d');
    const sheet = new Image(), media = matchMedia('(prefers-reduced-motion: reduce)');
    const durations = [3000, 55, 45, 90, 45, 55, 1600, 50, 80, 50];
    let timer, frame = 0, visible = true, loaded = false, disposed = false;
    function paint() {
      if (!loaded || disposed) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 64, 64);
      ctx.drawImage(sheet, frame * 64, 0, 64, 64, 0, 0, 64, 64);
    }
    function tick() {
      paint();
      if (!paused && visible && !document.hidden && !media.matches) timer = setTimeout(() => { frame = (frame + 1) % durations.length; tick(); }, durations[frame]);
    }
    function restart() { clearTimeout(timer); frame = 0; if (loaded) tick(); }
    sheet.onload = () => { loaded = true; restart(); };
    sheet.src = `${import.meta.env.BASE_URL}portrait/portrait-blink.png?v=2`;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; restart(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', restart);
    media.addEventListener('change', restart);
    return () => { disposed = true; clearTimeout(timer); observer.disconnect(); document.removeEventListener('visibilitychange', restart); media.removeEventListener('change', restart); };
  }, [paused]);
  return <figure className="portrait-frame">
    <img src={`${import.meta.env.BASE_URL}portrait/portrait.png?v=2`} width="64" height="64" alt={t('hero.portrait_alt')} fetchPriority="high" />
    <canvas ref={canvas} width="64" height="64" aria-hidden="true" />
    <button className="portrait-toggle" onClick={() => setPaused(value => !value)} aria-label={t(paused ? 'hero.resume' : 'hero.pause')} aria-pressed={paused}>{paused ? <FiPlay /> : <FiPause />}</button>
  </figure>;
}

export default function PortraitHero({ cv }) {
  const { t } = useTranslation();
  return <header className="portfolio-hero portrait-hero">
    <div className="portrait-copy">
      <p className="hero-eyebrow">{t('hero.eyebrow')}</p>
      <h1>Andrés<br />Landazábal<span aria-hidden="true">.</span></h1>
      <p className="hero-role">{t('title')}</p>
      <div className="portrait-actions">
        <a className="portrait-explore" href="#projects">{t('hero.explore')} <FiArrowDown aria-hidden="true" /></a>
        <a href={cv} download="アンドレス履歴書.pdf" className="cv-download-btn"><FiDownload aria-hidden="true" />{t('download_cv')}</a>
      </div>
    </div>
    <BlinkingPortrait />
  </header>;
}
