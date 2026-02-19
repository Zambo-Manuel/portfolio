// Edit this file to personalize the site
//
// ✅ Bilingual setup:
// - window.PORTFOLIO_CONTENT.it  -> contenuti in Italiano
// - window.PORTFOLIO_CONTENT.en  -> contenuti in Inglese
//
// L'app userà automaticamente la lingua selezionata (toggle nel menu).

(function () {
  const IT = {
    name: "Manuel Zambelli",
    headline: "Benvenuto nel mio portfolio!",
    subheadline:
      "Mi piace trasformare idee in qualcosa di concreto: siti web, contenuti digitali e progetti di team.",
    role: "Studente",
    location: "Verona, Veneto, Italia",
    availability: "Disponibile per progetti e PCTO",
    email: "info@manuelzambelli.it",
    phone: "+39 333 867 8617",
    birthday: "9 Lug, 2008",
    citizenship: "Italiana",
    website: "manuelzambelli.it",

    socials: {
      ITImarconi: "https://www.marconiverona.edu.it/",
      linkedin: "https://www.linkedin.com/in/manuelzambelli10/",
      instagram: "https://www.instagram.com/zambo10_/"
    },

    // === About me ===
    about: {
      description:
        "Sono Manuel Zambelli, uno studente curioso e determinato, sempre alla ricerca di nuove occasioni per imparare e migliorarmi. Credo molto nel valore della collaborazione e della responsabilità: è proprio nei progetti ben strutturati, che richiedono tempo, responsabilità e gioco di squadra, che riesco a dare il meglio di me.\nPartecipo con entusiasmo ad attività scolastiche ed extra, soprattutto quando coinvolgono le mie passioni o permettono di trasformare un’idea in qualcosa di concreto. Mi piace mettermi in gioco, ascoltare punti di vista diversi e lavorare con precisione e affidabilità",
      traits: ["Curioso", "Determinato", "Collaborativo", "Affidabile", "Problem solver"],
      status: [
        { ok: true, text: "Studente presso ITIS G. Marconi di Verona (Informatica)" },
        { ok: true, text: "Disponibile per progetti scolastici ed extrascolastici" },
        { ok: true, text: "Aperto a PCTO / stage e nuove opportunità" }
      ]
    },

    formsubmitEmail: "info@manuelzambelli.it",

    // === Studi / Formazione ===
    education: [
      {
        years: "set 2024 — giu 2029",
        degree: "Informatica",
        school: "ITIS G. Marconi — Verona",
        note: "",
        bullets: [
          "Progetti in gruppo e attività di collaborazione (peer-to-peer)",
          "Sviluppo web con CMS (WordPress) e attenzione al design",
          "Competenze digitali: creazione di contenuti social per l'istituto",
        ],
        tags: ["ITIS G. Marconi", "Informatica", "Verona"]
      }
    ],

    // === Progetti ===
    projects: [
      {
        id: "stampante-3d",
        title: "Corso di Stampa 3D",
        subtitle: "gen 2026 — feb 2026 • 8 ore",
        kicker: "Formazione",
        category: "Competenze digitali",
        year: "2026",
        tags: ["Stampa 3D", "Modellazione 3D", "File .stl", "Fusion", "Bambu Lab"],
        image: "",
        url: "https://www.linkedin.com/in/manuelzambelli10/details/projects/",
        description:
          "Associazione con Marconi Verona. Corso di stampa 3D focalizzato sulla modellazione, preparazione dei file e utilizzo pratico di stampanti. Utilizzo di Fusion e Bambu LAB. Durata del corso: 8 ore."
      },
      {
        id: "marconi-p2p",
        title: "Marconi Peer‑To‑Peer",
        subtitle: "Peer tutoring • nov 2025 — presente",
        kicker: "Progetto scolastico",
        category: "Educazione",
        year: "2025",
        stack: ["Teamwork", "Communication"],
        tags: ["Tutoring", "Comunicazione", "Ascolto attivo", "Lavoro di squadra"],
        image: "",
        url: "https://www.linkedin.com/in/manuelzambelli10/details/projects/",
        description:
          "Partecipazione a un progetto di peer tutoring svolto nel pomeriggio: supporto tra studenti nello studio e nella comprensione degli argomenti scolastici, favorendo collaborazione e metodo."
      },
      {
        id: "media-lab",
        title: "Team Marconi Media LAB",
        subtitle: "Contenuti digitali • ott 2025 — presente",
        kicker: "Progetto scolastico",
        category: "Digital",
        year: "2025",
        stack: ["Canva", "Graphic Design"],
        tags: [
          "Digital media",
          "Social media",
          "Collaborazione virtuale",
          "Problem solving",
          "Team working"
        ],
        image: "",
        url: "https://www.instagram.com/itimarconiverona/?hl=en",
        description:
          "Creazione di contenuti digitali per l’ITI G. Marconi (VR) collaborando con professori e studenti: grafica, comunicazione e pubblicazione su canali social."
      },
      {
        id: "banda-colognola",
        title: "Sito ufficiale Corpo Bandistico di Colognola ai Colli",
        subtitle: "Website • CMS WordPress",
        kicker: "Progetto web",
        category: "Web",
        year: "2025",
        stack: ["WordPress", "HTML", "CSS"],
        tags: ["Web Design", "CMS", "Sviluppo web", "Servizi web"],
        image: "",
        url: "https://www.bandacolognola.it/",
        description:
          "Realizzazione e gestione di un sito web per un’associazione locale, con attenzione a struttura dei contenuti, navigazione e aggiornamenti."
      },
      {
        id: "excel-avanzato",
        title: "Fogli di calcolo avanzato",
        subtitle: "Percorso Multilinguismo & STEM • 10 ore",
        kicker: "Formazione",
        category: "Competenze digitali",
        year: "2025",
        stack: ["Microsoft Excel"],
        tags: ["Spreadsheets", "Excel", "Produttività"],
        image: "",
        url: "https://www.linkedin.com/in/manuelzambelli10/details/projects/",
        description:
          "Approfondimento su fogli di calcolo: funzioni, organizzazione dati e creazione di tabelle utili allo studio e ai progetti."
      },
      {
        id: "wordpress-cms",
        title: "Siti web con CMS (WordPress)",
        subtitle: "Percorso Multilinguismo & STEM • 25 ore",
        kicker: "Formazione",
        category: "Web",
        year: "2025",
        stack: ["WordPress", "HTML", "CSS", "JavaScript"],
        tags: ["CMS", "Progettazione siti", "Web Design"],
        image: "",
        url: "https://www.linkedin.com/in/manuelzambelli10/details/projects/",
        description:
          "Realizzazione di siti web con CMS: struttura pagine, gestione contenuti e buone pratiche per un sito chiaro e fruibile."
      }
    ],

    // === Certificazioni ===
    certifications: [
      {
        title: "Corso Sicurezza Base Lavoratori/Studenti — Ed. 2025",
        issuer: "Gruppo Spaggiari Parma",
        date: "feb 2025",
        note: "Formazione base sulla sicurezza nei luoghi di lavoro."
      }
    ],

    // === Volontariato ===
    volunteering: [
      {
        role: "Musicista, Web Manager",
        org: "Corpo Bandistico di Colognola ai Colli",
        period: "ago 2023 — presente",
        note: "Faccio parte della banda e gestisco il sito web dell’associazione.",
        url: "https://www.bandacolognola.it/"
      },
      {
        role: "Socio Giovane",
        org: "Club Alpino Italiano",
        period: "gen 2025 — presente",
        note: "",
        url: ""
      }
    ],

    // === Riconoscimenti ===
    awards: [
      {
        title: "Borsa di studio per merito — a.s. 2023/2024",
        issuer: "Amministrazione Comunale di Colognola ai Colli",
        date: "mar 2025",
        note:
          "Assegnata a seguito del conseguimento del voto finale di 10 all’esame conclusivo del primo ciclo di istruzione."
      }
    ],

    // === Lingue ===
    languages: [
      { name: "Italiano", level: "Madrelingua" },
      { name: "Inglese", level: "Scolastico / operativo" }
    ]
  };

  // Create EN by cloning IT, then overriding the fields that should be in English.
  const EN = JSON.parse(JSON.stringify(IT));
  EN.headline = "Welcome to my portfolio!",
    EN.subheadline = "I like turning ideas into something real: websites, digital content, and team projects.";
  EN.role = "Student";
  EN.location = "Verona, Veneto, Italy";
  EN.availability = "Open to projects and PCTO",
    EN.about.description = "I am Manuel Zambelli, a curious and determined student, always looking for new opportunities to learn and improve myself. I strongly believe in the value of collaboration and responsibility: it is precisely in well-structured projects, which require time, commitment, and teamwork, that I am able to give my best. I enthusiastically take part in school and extracurricular activities, especially when they involve my passions or allow me to turn an idea into something concrete. I enjoy challenging myself, listening to different points of view, and working with precision and reliability.",
    EN.about.traits = ["Curious", "Determined", "Team player", "Reliable", "Problem solver"];
  EN.about.status = [
    { ok: true, text: "Student at ITIS G. Marconi (Computer Science)" },
    { ok: true, text: "Available for school & extracurricular projects" },
    { ok: true, text: "Open to internships and new opportunities" }
  ];

  EN.education[0].note = "";


  // Projects (id-based overrides to avoid mixing when order changes)
  const setProjectEN = (id, data) => {
    const p = EN.projects.find(x => x.id === id);
    if (!p) return;
    Object.assign(p, data);
  };

  setProjectEN("stampante-3d", {
    title: "3D Printing Course",
    subtitle: "Jan 2026 — Feb 2026 • 8 hours",
    kicker: "Training",
    category: "Digital skills",
    tags: ["3D Printing", "3D Modeling", "STL files", "Fusion", "Bambu Lab"],
    description: "3D printing course focused on modeling, file preparation and hands-on use of 3D printers, in collaboration with Marconi Verona. Tools used: Fusion and Bambu Lab. Course duration: 8 hours.",
  });

  setProjectEN("marconi-p2p", {
    title: "Marconi Peer‑To‑Peer",
    subtitle: "Peer tutoring • Nov 2025 — present",
    kicker: "Project",
    category: "School",
    description: "Peer tutoring project: supporting other students after school, improving collaboration and study methods.",
  });

  setProjectEN("media-lab", {
    title: "Team Marconi Media Lab",
    subtitle: "Digital content • Oct 2025 — present",
    kicker: "Project",
    category: "Digital skills",
    description: "Creating digital content for the school with teachers and students: graphics, communication, and social posts.",
  });

  setProjectEN("banda-colognola", {
    title: "Official website — Colognola ai Colli Marching Band",
    subtitle: "Website • WordPress CMS",
    kicker: "Website",
    category: "Web",
    description: "Built and managed a website for a local association, focusing on content structure, navigation and updates.",
  });

  setProjectEN("excel-avanzato", {
    title: "Advanced Spreadsheets",
    subtitle: "Multilingual & STEM program • 10 hours",
    kicker: "Training",
    category: "Digital skills",
    description: "Advanced spreadsheets: functions, data organization and useful tables for study and projects.",
  });

  setProjectEN("wordpress-cms", {
    title: "Websites with CMS (WordPress)",
    subtitle: "Course • 25 hours",
    kicker: "Training",
    category: "Web",
    description: "Websites built with a CMS: page structure, content management and best practices for a clear, usable site.",
  });


  EN.certifications[0].note = "Basic workplace safety training.";
  EN.volunteering[0].note = "Band member and website manager for the association.";
  EN.awards[0].note = "Merit scholarship awarded after achieving a final grade of 10 in middle school exam.";
  EN.languages[1].level = "School / working level";


  // --- Additional EN fixes (GB) ---
  EN.education[0].years = "Sep 2024 — Jun 2029";
  EN.education[0].degree = "Computer Science";
  EN.education[0].bullets = [
    "Group projects and collaboration activities (peer-to-peer)",
    "Websites built with a CMS (WordPress) with attention to design",
    "Digital skills: creating social media content for the school.",
  ];
  EN.education[0].tags = ["ITIS G. Marconi", "Computer Science", "Verona"];

  // Certifications / volunteering / awards
  EN.certifications[0].title = "Basic Safety Course for Workers/Students — 2025";
  EN.certifications[0].date = "Feb 2025";

  EN.volunteering[0].period = "Aug 2023 — present";
  EN.volunteering[1].role = "Junior member";
  EN.volunteering[1].org = "Italian Alpine Club (CAI)";
  EN.volunteering[1].period = "Jan 2025 — present";

  EN.awards[0].title = "Merit scholarship — school year 2023/2024";
  EN.awards[0].issuer = "Municipality of Colognola ai Colli";
  EN.awards[0].date = "Mar 2025";

  EN.languages = [
    { name: "Italian", level: "Native" },
    { name: "English", level: "School / working level" }
  ];

  window.PORTFOLIO_CONTENT = { it: IT, en: EN };
})();