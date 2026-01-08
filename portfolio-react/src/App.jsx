import React from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { IoMail } from 'react-icons/io5';
import './index.css';

function App() {
  // Lista expandida de lenguajes y herramientas relevantes
  const skills = [
    'Python', 'JavaScript', 'React.js', 'Django', 
    'SQL (MySQL/PostgreSQL)', 'Docker', 'Git & GitHub', 
    'Linux (Ubuntu/Debian)', 'REST APIs', 'HTML5 & CSS3', 
    'Node.js', 'PyTorch', 'Bootstrap', 'AWS Basics', 'Cybersecurity '
  ];
 // Datos de idiomas con niveles y porcentajes
  const languages = [
  { name: 'Spanish', level: 'Native', percent: '100%' },
  { name: 'Japanese', level: 'N3 (Daily Conversation)', percent: '60%' },
  { name: 'English', level: 'B2 (Professional)', percent: '75%' }
];

  return (
    <div className="main-container">
      {/* HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <img src="https://avatars.githubusercontent.com/u/174173495?s=400&u=ecd4d17afd905270c660b5c139f913ecbfaeeadf&v=4" className="profile-img" alt="Andres" />
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#ffffff' }}>
          Andrés Landazábal
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}> AI | Cybersecurity | Cloud Engineer | Colombian</p>
      </header>

      {/* SECCIÓN: SOBRE MÍ */}
      <section>
        <h3>About Me</h3>
        <p style={{ lineHeight: '1.6', color: '#cbd5e1' }}>
          I am a Systems Engineer living in Japan with over five years of professional experience designing, building, and securing technology solutions. I specialize in cybersecurity, cloud engineering, and artificial intelligence, with strong expertise in secure architectures, cloud infrastructure, automation, and data protection. I have an analytical mindset and a strong problem-solving approach, allowing me to deliver scalable, reliable, and secure systems. I adapt quickly to complex technical environments and collaborate effectively with multidisciplinary teams to create innovative solutions aligned with business goals.
        </p>
      </section>

      {/* SECCIÓN: STACK TECNOLÓGICO INTERACTIVO */}
      <section>
        <h3>Programming Stack</h3>
        <div className="skills-container">
          {skills.map((skill, index) => (
            <span 
              key={skill} 
              className="skill-tag" 
              style={{ animationDelay: `${index * 0.1}s` }} // Efecto de cascada
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      {/* SECCIÓN: BARRAS DE HABILIDADES DE LENGUAJES (ACTUALIZADA) */}

      <section>
  <h3>Languages</h3>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    {languages.map((lang) => (
      <div key={lang.name}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: '600', color: '#ffffff' }}>{lang.name}</span>
          <span style={{ color: 'var(--accent-blue)', fontSize: '0.85rem' }}>{lang.level}</span>
        </div>
        <div className="progress-bg">
          <div 
            className="progress-fill" 
            style={{ width: lang.percent }}
          ></div>
        </div>
      </div>
    ))}
  </div>
</section>

 {/* SECCIÓN: LINKS / GITHUB (ACTUALIZADA) */}
      <section>
        <h3>Connect & Projects</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <a href="https://github.com/andresfls-buc" target="_blank" rel="noreferrer" className="btn-link">
            <FaGithub style={{ marginRight: '10px', fontSize: '1.2rem' }} /> 
            GitHub Repositories
          </a>

          <a href="https://www.linkedin.com/in/andres-felipe-landazabal-sanmiguel-79393131b/" target="_blank" rel="noreferrer" className="btn-link">
            <FaLinkedin style={{ marginRight: '10px', fontSize: '1.2rem', color: '#0077b5' }} /> 
            LinkedIn Profile
          </a>

          <a href="mailto:andresflsxx@gmail.com" className="btn-link">
            <IoMail style={{ marginRight: '10px', fontSize: '1.2rem' }} /> 
            Contact Email
          </a>

        </div>
      </section>

      <footer style={{ textAlign: 'center', color: '#475569', fontSize: '0.8rem', marginTop: '4rem' }}>
        © {new Date().getFullYear()} | Engineered by Andrés Landazábal
      </footer>
    </div>
  );
}

export default App;