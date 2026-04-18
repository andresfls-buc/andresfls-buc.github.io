import myCv from './アンドレス履歴書.pdf'; // Importing the CV file
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect } from 'react';
import { FaGithub, FaLinkedin, FaStar, FaCodeBranch } from 'react-icons/fa';
import { IoMail } from 'react-icons/io5';
import { FiDownload } from 'react-icons/fi'; // Added the Download icon
import './index.css';

function App() {
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language;

  const skills = [
    'Python', 'JavaScript', 'React.js', 'Django', 
    'SQL (MySQL/PostgreSQL)', 'Docker', 'Git & GitHub', 
    'Linux (Ubuntu/Debian)', 'REST APIs', 'HTML5 & CSS3', 
    'Node.js', 'PyTorch', 'Bootstrap', 'AWS Basics', 'Cybersecurity '
  ];

  const languages = useMemo(() => [
    { name: t('lang_names.Spanish'), level: t('levels.native'), percent: '100%' },
    { name: t('lang_names.Japanese'), level: t('levels.n3'), percent: '60%' },
    { name: t('lang_names.English'), level: t('levels.b2'), percent: '75%' }
  ], [t, currentLang]); 

  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [reposError, setReposError] = useState(false);

  useEffect(() => {
    fetch('https://api.github.com/users/andresfls-buc/repos?sort=updated&per_page=6&type=public')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setRepos(data.filter(r => !r.fork));
        setReposLoading(false);
      })
      .catch(() => {
        setReposError(true);
        setReposLoading(false);
      });
  }, []);

  const changeLanguage = async (lng) => {
    await i18n.changeLanguage(lng);
  };

  return (
    <div className="main-container">
      {/* LANGUAGE SWITCHER */}
      <div className="language-controls">
        <button 
          className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`} 
          onClick={() => changeLanguage('en')}
        >
          EN
        </button>
        <button 
          className={`lang-btn ${currentLang === 'es' ? 'active' : ''}`} 
          onClick={() => changeLanguage('es')}
        >
          ES
        </button>
        <button 
          className={`lang-btn ${currentLang === 'ja' ? 'active' : ''}`} 
          onClick={() => changeLanguage('ja')}
        >
          日本語
        </button>
      </div>

      {/* HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <img src="https://avatars.githubusercontent.com/u/174173495?s=400" className="profile-img" alt="Andres" />
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#ffffff' }}>
          Andrés Landazábal
        </h1>
        <p key={`title-${currentLang}`} style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
          {t('title')}
        </p>

        {/* NEW: DOWNLOAD CV BUTTON */}
        <div style={{ marginTop: '1.5rem' }}>
          <a 
            key={`cv-${currentLang}`}
            href={myCv} // Using the imported CV file
            download="アンドレス履歴書.pdf"
            className="cv-download-btn"
          >
            <FiDownload style={{ marginRight: '8px' }} />
            {t('download_cv')}
          </a>
        </div>
      </header>

      {/* SECTION: ABOUT ME */}
      <section>
        <h3 key={`about-h3-${currentLang}`}>{t('about_me_h3')}</h3>
        <p key={`about-p-${currentLang}`} style={{ lineHeight: '1.6', color: '#cbd5e1' }}>
          {t('about_me_p')}
        </p>
      </section>

      {/* SECTION: STACK */}
      <section>
        <h3 key={`stack-h3-${currentLang}`}>{t('stack_h3')}</h3>
        <div className="skills-container">
          {skills.map((skill, index) => (
            <span 
              key={`${skill}-${currentLang}`} 
              className="skill-tag" 
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      {/* SECTION: LANGUAGES */}
      <section>
        <h3 key={`langs-h3-${currentLang}`}>{t('languages_h3')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {languages.map((lang) => (
            <div key={`${lang.name}-${currentLang}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', color: '#ffffff' }}>{lang.name}</span>
                <span style={{ color: 'var(--accent-blue)', fontSize: '0.85rem' }}>{lang.level}</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill" style={{ width: lang.percent }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: PROJECTS */}
      <section>
        <h3 key={`projects-h3-${currentLang}`}>{t('projects_h3')}</h3>
        {reposLoading && (
          <p style={{ color: 'var(--text-dim)', textAlign: 'center' }}>{t('projects_loading')}</p>
        )}
        {reposError && (
          <p style={{ color: 'var(--text-dim)', textAlign: 'center' }}>{t('projects_error')}</p>
        )}
        {!reposLoading && !reposError && (
          <div className="projects-grid">
            {repos.map(repo => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="project-card"
              >
                <div className="project-info">
                  <span className="project-name">{repo.name}</span>
                  {repo.description && (
                    <p className="project-desc">{repo.description}</p>
                  )}
                  <div className="project-meta">
                    {repo.language && (
                      <span className="project-lang">{repo.language}</span>
                    )}
                    <span className="project-stat">
                      <FaStar style={{ marginRight: '4px', fontSize: '0.75rem' }} />
                      {repo.stargazers_count}
                    </span>
                    <span className="project-stat">
                      <FaCodeBranch style={{ marginRight: '4px', fontSize: '0.75rem' }} />
                      {repo.forks_count}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* SECTION: CONNECT */}
      <section>
        <h3 key={`connect-h3-${currentLang}`}>{t('connect_h3')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <a 
            key={`github-link-${currentLang}`}
            href="https://github.com/andresfls-buc" 
            target="_blank" 
            rel="noreferrer" 
            className="btn-link"
          >
            <FaGithub style={{ marginRight: '10px', fontSize: '1.2rem' }} /> {t('github_btn')}
          </a>
          <a 
            key={`linkedin-link-${currentLang}`}
            href="https://www.linkedin.com/in/andres-felipe-landazabal-sanmiguel" 
            target="_blank" 
            rel="noreferrer" 
            className="btn-link"
          >
            <FaLinkedin style={{ marginRight: '10px', fontSize: '1.2rem', color: '#0077b5' }} /> {t('linkedin_btn')}
          </a>
          <a 
            key={`mail-link-${currentLang}`}
            href="mailto:andresflsxx@gmail.com" 
            className="btn-link"
          >
            <IoMail style={{ marginRight: '10px', fontSize: '1.2rem' }} /> {t('contact_btn')}
          </a>
        </div>
      </section>

      <footer style={{ textAlign: 'center', color: '#475569', fontSize: '0.8rem', marginTop: '4rem' }}>
        © {new Date().getFullYear()} | {t('footer')}
      </footer>
    </div>
  );
}

export default App;