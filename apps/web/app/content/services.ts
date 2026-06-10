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

export const defaultServices: Record<'ro' | 'ru' | 'en', Service[]> = {
  ro: [
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
  ],
  ru: [
    {
      slug: 'mentenanta-pc',
      title: 'Обслуживание ПК и ноутбуков',
      short: 'Чистка, ремонт, оптимизация',
      summary:
        'Полный спектр услуг по аппаратному и программному обслуживанию компьютеров и ноутбуков. Бесплатная диагностика, быстрое реагирование, гарантия на выполненные работы.',
      icon: 'fa6-solid:desktop',
      priceFrom: 350,
      currency: 'MDL',
      features: [
        'Профессиональная чистка от пыли и замена термопасты',
        'Аппаратная и программная диагностика',
        'Переустановка Windows / macOS / Linux',
        'Восстановление данных с неисправных HDD/SSD',
        'Замена батарей, клавиш, экранов ноутбуков',
      ],
      faqs: [
        {
          q: 'Сколько длится полное обслуживание?',
          a: 'В среднем 2–4 часа на чистку и программную оптимизацию. Более сложный ремонт может занять 1–3 дня.',
        },
        {
          q: 'Есть ли гарантия?',
          a: 'Да, 30 дней на работу и до 12 месяцев на заменённые детали.',
        },
      ],
    },
    {
      slug: 'administrare-servere',
      title: 'Администрирование серверов',
      short: 'Windows / Linux, бэкап, мониторинг',
      summary:
        'Проактивное администрирование серверов вашей компании: обновления, автоматический бэкап, мониторинг 24/7 и реагирование на инциденты.',
      icon: 'fa6-solid:server',
      priceFrom: 1200,
      currency: 'MDL',
      features: [
        'Настройка и hardening Windows Server / Linux',
        'Ежедневный автоматический off-site бэкап',
        'Мониторинг uptime и оповещения',
        'Миграция в облако (Hetzner, AWS, Cloudflare)',
        'Гарантированный SLA отклика',
      ],
      faqs: [
        {
          q: 'Какой SLA вы предоставляете?',
          a: 'Ответ в течение 1 часа для критических инцидентов, 4 часа для стандартных, 24/7.',
        },
      ],
    },
    {
      slug: 'proiectare-retele',
      title: 'Проектирование сетей',
      short: 'LAN, Wi-Fi mesh, оптика',
      summary:
        'Проектирование, монтаж и настройка структурированных сетей для офисов, магазинов и складов. Wi-Fi mesh с гарантированным покрытием.',
      icon: 'fa6-solid:network-wired',
      priceFrom: 800,
      currency: 'MDL',
      features: [
        'Аудит и план структурированной кабельной системы',
        'Оборудование UniFi, MikroTik, Cisco',
        'Wi-Fi mesh с бесшовным роумингом',
        'VLAN, изоляция гостевой сети',
        'Документация и схема сети',
      ],
      faqs: [
        {
          q: 'Работаете ли с большими объектами?',
          a: 'Да — от офисов 50 м² до зданий 2000+ м² и многоэтажных складов.',
        },
      ],
    },
    {
      slug: 'securitate-it',
      title: 'ИТ-безопасность',
      short: 'Антивирус, VPN, аудит',
      summary:
        'Комплексная защита вашего бизнеса: EDR, межсетевой экран, VPN для удалённых сотрудников, обучение по фишингу и аудит безопасности.',
      icon: 'fa6-solid:shield-halved',
      priceFrom: 1500,
      currency: 'MDL',
      features: [
        'EDR / антивирус нового поколения для всех рабочих станций',
        'WireGuard VPN для удалённой работы',
        'Аудит ISO 27001 / GDPR',
        'Обучение сотрудников по фишингу',
        'План реагирования на инциденты',
      ],
      faqs: [
        {
          q: 'Соответствуете ли вы GDPR?',
          a: 'Да, мы предлагаем консалтинг и внедрение для соответствия GDPR и внутренним политикам.',
        },
      ],
    },
    {
      slug: 'recuperare-date',
      title: 'Восстановление данных',
      short: 'HDD, SSD, RAID, Flash',
      summary:
        'Детальная оценка и профессиональное восстановление утерянных или случайно удалённых данных, а также с неисправных носителей.',
      icon: 'fa6-solid:hard-drive',
      priceFrom: 500,
      currency: 'MDL',
      features: [
        'Восстановление с неисправных HDD и SSD',
        'Спасение данных из повреждённых RAID',
        'Восстановление разделов и повреждённых файлов',
        'Первичная оценка в лаборатории',
        'Полная гарантия конфиденциальности',
      ],
      faqs: [
        {
          q: 'Мои данные конфиденциальны?',
          a: 'Разумеется. Мы работаем под строгой конфиденциальностью (NDA).',
        },
      ],
    },
    {
      slug: 'consultanta-it',
      title: 'ИТ-консалтинг',
      short: 'Аудит, масштабирование, оборудование',
      summary:
        'Помогаем принимать правильные решения по ИТ-инфраструктуре, оптимизировать затраты и повысить эффективность за счёт цифровизации.',
      icon: 'fa6-solid:headset',
      priceFrom: 400,
      currency: 'MDL',
      features: [
        'Детальный аудит существующей ИТ-инфраструктуры',
        'Советы по закупке оборудования и лицензий',
        'Оптимизация ИТ-процессов',
        'Анализ снижения операционных затрат',
        'Персональная выделенная поддержка',
      ],
      faqs: [
        {
          q: 'Когда нужен ИТ-консалтинг?',
          a: 'Когда ваша структура быстро растёт или вы снова и снова сталкиваетесь с одними и теми же техническими проблемами.',
        },
      ],
    },
  ],
  en: [
    {
      slug: 'mentenanta-pc',
      title: 'PC & Laptop Maintenance',
      short: 'Cleaning, repairs, optimization',
      summary:
        'Complete hardware and software maintenance for desktops and laptops. Free diagnosis, fast turnaround, warranty on all work performed.',
      icon: 'fa6-solid:desktop',
      priceFrom: 350,
      currency: 'MDL',
      features: [
        'Professional dust cleaning and thermal paste replacement',
        'Hardware and software diagnostics',
        'Windows / macOS / Linux reinstall',
        'Data recovery from faulty HDD/SSD',
        'Battery, keyboard, screen replacement',
      ],
      faqs: [
        {
          q: 'How long does a full maintenance take?',
          a: 'On average 2–4 hours for cleaning + software optimization. More complex repairs may take 1–3 days.',
        },
        {
          q: 'Do you offer warranty?',
          a: 'Yes, 30 days for labor and up to 12 months for replaced parts.',
        },
      ],
    },
    {
      slug: 'administrare-servere',
      title: 'Server Administration',
      short: 'Windows / Linux, backup, monitoring',
      summary:
        'Proactive administration of your company servers: updates, automated backups, 24/7 monitoring and incident response.',
      icon: 'fa6-solid:server',
      priceFrom: 1200,
      currency: 'MDL',
      features: [
        'Windows Server / Linux setup and hardening',
        'Daily automated off-site backup',
        'Uptime monitoring + alerts',
        'Cloud migration (Hetzner, AWS, Cloudflare)',
        'Guaranteed response SLA',
      ],
      faqs: [
        {
          q: 'What SLA do you offer?',
          a: 'Response within 1h for critical incidents, 4h for standard, 24/7.',
        },
      ],
    },
    {
      slug: 'proiectare-retele',
      title: 'Network Design',
      short: 'LAN, Wi-Fi mesh, fiber',
      summary:
        'Design, installation and configuration of structured networks for offices, stores and warehouses. Wi-Fi mesh with guaranteed coverage.',
      icon: 'fa6-solid:network-wired',
      priceFrom: 800,
      currency: 'MDL',
      features: [
        'Audit + structured cabling plan',
        'UniFi, MikroTik, Cisco equipment',
        'Wi-Fi mesh with seamless roaming',
        'VLANs, guest segregation',
        'Documentation and network diagram',
      ],
      faqs: [
        {
          q: 'Do you work with large sites?',
          a: 'Yes — from 50 m² offices up to 2000+ m² premises and multi-floor warehouses.',
        },
      ],
    },
    {
      slug: 'securitate-it',
      title: 'IT Security',
      short: 'Antivirus, VPN, audit',
      summary:
        'End-to-end protection for your business: EDR, firewall, VPN for remote employees, anti-phishing training and security audits.',
      icon: 'fa6-solid:shield-halved',
      priceFrom: 1500,
      currency: 'MDL',
      features: [
        'EDR / next-gen antivirus on all workstations',
        'WireGuard VPN for remote work',
        'ISO 27001 / GDPR audit',
        'Anti-phishing training for employees',
        'Incident response plan',
      ],
      faqs: [
        {
          q: 'Are you GDPR compliant?',
          a: 'Yes, we offer consulting and implementation for GDPR compliance and internal policies.',
        },
      ],
    },
    {
      slug: 'recuperare-date',
      title: 'Data Recovery',
      short: 'HDD, SSD, RAID, Flash',
      summary:
        'Detailed assessment and professional recovery of lost or accidentally deleted data, including from faulty memory devices.',
      icon: 'fa6-solid:hard-drive',
      priceFrom: 500,
      currency: 'MDL',
      features: [
        'Recovery from faulty HDD and SSD drives',
        'Data rescue from compromised RAID systems',
        'Partition and corrupted file reconstruction',
        'Initial in-lab assessment',
        'Full confidentiality guarantee',
      ],
      faqs: [
        {
          q: 'Is my data confidential?',
          a: 'Absolutely. We operate under strict confidentiality (NDA).',
        },
      ],
    },
    {
      slug: 'consultanta-it',
      title: 'IT Consulting',
      short: 'Audit, IT scaling, hardware',
      summary:
        'We help you make the right decisions for your IT infrastructure, optimize costs and gain efficiency through digitalization.',
      icon: 'fa6-solid:headset',
      priceFrom: 400,
      currency: 'MDL',
      features: [
        'Detailed audit of existing IT infrastructure',
        'Hardware and license procurement advice',
        'IT workflow optimization',
        'Operational cost reduction analysis',
        'Dedicated personalized support',
      ],
      faqs: [
        {
          q: 'When do I need IT consulting?',
          a: 'When your structure is growing fast or you keep running into the same tech problems repeatedly.',
        },
      ],
    },
  ],
}

// Backwards-compat: keep `services` as the RO default so legacy imports keep working.
export const services: Service[] = defaultServices.ro

export type ServiceLocale = 'ro' | 'ru' | 'en'

export function getService(slug: string, locale: ServiceLocale = 'ro'): Service | undefined {
  return defaultServices[locale].find((s) => s.slug === slug)
}

export function getServicesForLocale(locale: ServiceLocale): Service[] {
  return defaultServices[locale] ?? defaultServices.ro
}
