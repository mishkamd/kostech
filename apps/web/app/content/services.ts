export type Service = {
  slug: string
  title: string
  short: string
  summary: string
  icon: string
  priceFrom: number
  currency: string
  features: string[]
  faqs: { q: string; a: string }[]
}

export const services: Service[] = [
  {
    slug: 'mentenanta-pc',
    title: 'Mentenanță PC & Laptop',
    short: 'Curățare, reparații, optimizare',
    summary:
      'Servicii complete de mentenanță hardware și software pentru calculatoare și laptopuri. Diagnoză gratuită, intervenție rapidă, garanție pentru lucrările efectuate.',
    icon: 'fa6-solid:desktop',
    priceFrom: 350,
    currency: 'MDL',
    features: [
      'Curățare profesională de praf și pastă termică',
      'Diagnoză hardware și software',
      'Reinstalare Windows / macOS / Linux',
      'Recuperare date din HDD/SSD defecte',
      'Înlocuire baterii, taste, ecrane laptop',
    ],
    faqs: [
      {
        q: 'Cât durează o mentenanță completă?',
        a: 'În medie 2-4 ore pentru curățare + optimizare software. Reparațiile mai complexe pot dura 1-3 zile.',
      },
      {
        q: 'Oferiți garanție?',
        a: 'Da, 30 de zile pentru manoperă și până la 12 luni pentru piesele înlocuite.',
      },
    ],
  },
  {
    slug: 'administrare-servere',
    title: 'Administrare servere',
    short: 'Windows / Linux, backup, monitorizare',
    summary:
      'Administrare proactivă a serverelor companiei tale: actualizări, backup automat, monitorizare 24/7 și răspuns la incidente.',
    icon: 'fa6-solid:server',
    priceFrom: 1200,
    currency: 'MDL',
    features: [
      'Configurare și hardening Windows Server / Linux',
      'Backup automat zilnic, off-site',
      'Monitorizare uptime + alerte',
      'Migrare în cloud (Hetzner, AWS, Cloudflare)',
      'SLA garantat de răspuns',
    ],
    faqs: [
      {
        q: 'Ce SLA oferiți?',
        a: 'Răspuns în maxim 1h pentru incidente critice, 4h pentru standard, 24/7.',
      },
    ],
  },
  {
    slug: 'proiectare-retele',
    title: 'Proiectare rețele',
    short: 'LAN, Wi-Fi mesh, fibră',
    summary:
      'Proiectare, instalare și configurare rețele structurate pentru birouri, magazine și depozite. Wi-Fi mesh cu acoperire garantată.',
    icon: 'fa6-solid:network-wired',
    priceFrom: 800,
    currency: 'MDL',
    features: [
      'Audit + plan de cablare structurată',
      'Echipamente UniFi, MikroTik, Cisco',
      'Wi-Fi mesh cu roaming seamless',
      'VLAN-uri, segregare invitați',
      'Documentație și schemă rețea',
    ],
    faqs: [
      {
        q: 'Lucrați cu sedii mari?',
        a: 'Da — de la birouri de 50 m² până la sedii de 2000+ m² și depozite cu mai multe etaje.',
      },
    ],
  },
  {
    slug: 'securitate-it',
    title: 'Securitate IT',
    short: 'Antivirus, VPN, audit',
    summary:
      'Protecție end-to-end pentru afacerea ta: EDR, firewall, VPN pentru angajați la distanță, training anti-phishing și audit de securitate.',
    icon: 'fa6-solid:shield-halved',
    priceFrom: 1500,
    currency: 'MDL',
    features: [
      'EDR / antivirus next-gen pentru toate stațiile',
      'VPN WireGuard pentru telemuncă',
      'Audit ISO 27001 / GDPR',
      'Training anti-phishing angajați',
      'Plan de răspuns la incidente',
    ],
    faqs: [
      {
        q: 'Sunteți conformi GDPR?',
        a: 'Da, oferim consultanță și implementare pentru conformitatea GDPR și politici interne.',
      },
    ],
  },
  {
    slug: 'recuperare-date',
    title: 'Recuperare date',
    short: 'HDD, SSD, RAID, Flash',
    summary:
      'Evaluare detaliată și recuperare profesională de date pierdute, șterse accidental sau de pe echipamente de memorie defecte.',
    icon: 'fa6-solid:hard-drive',
    priceFrom: 500,
    currency: 'MDL',
    features: [
      'Recuperare de pe HDD-uri și SSD-uri defecte',
      'Salvarea datelor din sisteme RAID compromise',
      'Reconstrucție partiții și fișiere corupte',
      'Evaluare inițială în laborator',
      'Garanția confidențialității depline',
    ],
    faqs: [
      {
        q: 'Datele mele sunt confidențiale?',
        a: 'Bineînțeles. Lucrăm sub strictă confidențialitate (NDA).',
      },
    ],
  },
  {
    slug: 'consultanta-it',
    title: 'Consultanță IT',
    short: 'Audit, scalare IT, hardware',
    summary:
      'Te ajutăm să iei deciziile corecte pentru infrastructura ta IT, să-ți optimizezi costurile și să obții o eficiență mai mare prin digitalizare.',
    icon: 'fa6-solid:headset',
    priceFrom: 400,
    currency: 'MDL',
    features: [
      'Audit detaliat infrastructură IT existentă',
      'Sfaturi pentru achiziții hardware și licențe',
      'Optimizare fluxuri de lucru IT',
      'Analiză de reducere a costurilor operaționale',
      'Suport dedicat personalizat',
    ],
    faqs: [
      {
        q: 'Când am nevoie de consultanță IT?',
        a: 'Atunci când structura dvs. crește rapid sau când vă loviți repetat de aceleași probleme tehnologice.',
      },
    ],
  },
]

export const getService = (slug: string) => services.find((s) => s.slug === slug)
