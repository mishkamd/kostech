export interface HomepageContent {
  hero: {
    title: string; badge1: string; badge2: string; description: string
    rating: string; location: string; ctaPhoneLabel: string; ctaTelegramLabel: string
  }
  stats: { title: string; items: Array<{ value: string; label: string }> }
  form: {
    title: string; namePlaceholder: string; phonePlaceholder: string
    locationPlaceholder: string; descPlaceholder: string; dateLabel: string
    submitLabel: string; submittingLabel: string
    successTitle: string; successText: string
    errorRequired: string; errorGeneric: string
  }
  services: { title: string; fromLabel: string; moreLabel: string }
  location: { title: string; city: string; mapsLabel: string; mapsUrl: string }
  cta: { title: string; heading: string; text: string; btnLabel: string }
  seo: { title: string; description: string }
  layoutOrder: string[]
}

export const defaultContent: Record<string, HomepageContent> = {
  ro: {
    hero: {
      title: 'Kostech', badge1: 'Mentenanță', badge2: 'Securitate',
      description: 'Rezolvăm problemele tehnice rapid, asigurăm protecția datelor și îți oferim încrederea de a-ți crește afacerea alături de noi.',
      rating: '4.95', location: 'Chișinău, Moldova',
      ctaPhoneLabel: 'Sună-ne', ctaTelegramLabel: 'Telegram',
    },
    stats: {
      title: 'Cifre',
      items: [
        { value: '500+', label: 'Clienți mulțumiți' },
        { value: '8 ani', label: 'Experiență' },
        { value: '1h', label: 'Răspuns mediu' },
        { value: '24/7', label: 'Suport critic' },
      ],
    },
    form: {
      title: 'Solicită o comandă',
      namePlaceholder: 'Numele tău', phonePlaceholder: 'Telefonul tău',
      locationPlaceholder: 'Locația (adresa / oraș)',
      descPlaceholder: 'Descrie problema sau ce dorești să comanzi...',
      dateLabel: 'Alege data dorită', submitLabel: 'Trimite comanda',
      submittingLabel: 'Se trimite…', successTitle: 'Mulțumim!',
      successText: 'Te contactăm în cel mai scurt timp.',
      errorRequired: 'Te rugăm să completezi numele și telefonul.',
      errorGeneric: 'A apărut o eroare. Încearcă din nou.',
    },
    services: { title: 'Servicii principale', fromLabel: 'De la', moreLabel: 'Vezi mai multe servicii' },
    location: {
      title: 'Locație', city: 'Chișinău, Republica Moldova',
      mapsLabel: 'Deschide Google Maps', mapsUrl: 'https://maps.app.goo.gl/MAqnSnd3QdHuKNtv6',
    },
    cta: {
      title: 'Programare rapidă', heading: 'Diagnoză gratuită',
      text: 'Programează o vizită — evaluăm hardware-ul și-ți spunem exact ce trebuie făcut, fără costuri ascunse.',
      btnLabel: 'Programează acum',
    },
    seo: {
      title: 'Kostech — Servicii IT și mentenanță PC în Chișinău',
      description: 'Mentenanță PC și laptop, administrare servere, proiectare rețele și securitate IT pentru afaceri din Chișinău.',
    },
    layoutOrder: ['hero', 'services', 'contact', 'location', 'cta', 'form', 'stats'],
  },
  ru: {
    hero: {
      title: 'Kostech', badge1: 'Обслуживание', badge2: 'Безопасность',
      description: 'Решаем технические проблемы быстро, обеспечиваем защиту данных и предоставляем надёжную поддержку для роста вашего бизнеса.',
      rating: '4.95', location: 'Кишинёв, Молдова',
      ctaPhoneLabel: 'Позвонить', ctaTelegramLabel: 'Telegram',
    },
    stats: {
      title: 'Цифры',
      items: [
        { value: '500+', label: 'Довольных клиентов' },
        { value: '8 лет', label: 'Опыт работы' },
        { value: '1ч', label: 'Среднее время ответа' },
        { value: '24/7', label: 'Критическая поддержка' },
      ],
    },
    form: {
      title: 'Оставить заявку',
      namePlaceholder: 'Ваше имя', phonePlaceholder: 'Ваш телефон',
      locationPlaceholder: 'Адрес / город',
      descPlaceholder: 'Опишите проблему или что хотите заказать...',
      dateLabel: 'Выберите дату', submitLabel: 'Отправить заявку',
      submittingLabel: 'Отправка…', successTitle: 'Спасибо!',
      successText: 'Мы свяжемся с вами как можно скорее.',
      errorRequired: 'Пожалуйста, заполните имя и телефон.',
      errorGeneric: 'Произошла ошибка. Попробуйте ещё раз.',
    },
    services: { title: 'Основные услуги', fromLabel: 'От', moreLabel: 'Все услуги' },
    location: {
      title: 'Расположение', city: 'Кишинёв, Республика Молдова',
      mapsLabel: 'Открыть Google Maps', mapsUrl: 'https://maps.app.goo.gl/MAqnSnd3QdHuKNtv6',
    },
    cta: {
      title: 'Быстрая запись', heading: 'Бесплатная диагностика',
      text: 'Запишитесь на визит — оценим оборудование и скажем, что нужно сделать, без скрытых расходов.',
      btnLabel: 'Записаться',
    },
    seo: {
      title: 'Kostech — IT-услуги и обслуживание ПК в Кишинёве',
      description: 'Обслуживание ПК и ноутбуков, администрирование серверов, проектирование сетей и IT-безопасность для бизнеса в Кишинёве.',
    },
    layoutOrder: ['hero', 'services', 'contact', 'location', 'cta', 'form', 'stats'],
  },
  en: {
    hero: {
      title: 'Kostech', badge1: 'Maintenance', badge2: 'Security',
      description: 'We solve technical problems fast, protect your data, and give you the confidence to grow your business with us.',
      rating: '4.95', location: 'Chișinău, Moldova',
      ctaPhoneLabel: 'Call us', ctaTelegramLabel: 'Telegram',
    },
    stats: {
      title: 'By the numbers',
      items: [
        { value: '500+', label: 'Happy clients' },
        { value: '8 yrs', label: 'Experience' },
        { value: '1h', label: 'Avg response' },
        { value: '24/7', label: 'Critical support' },
      ],
    },
    form: {
      title: 'Request a service',
      namePlaceholder: 'Your name', phonePlaceholder: 'Your phone',
      locationPlaceholder: 'Location (address / city)',
      descPlaceholder: 'Describe your issue or what you need...',
      dateLabel: 'Choose a date', submitLabel: 'Send request',
      submittingLabel: 'Sending…', successTitle: 'Thank you!',
      successText: 'We will contact you shortly.',
      errorRequired: 'Please fill in your name and phone.',
      errorGeneric: 'An error occurred. Please try again.',
    },
    services: { title: 'Our services', fromLabel: 'From', moreLabel: 'See all services' },
    location: {
      title: 'Location', city: 'Chișinău, Republic of Moldova',
      mapsLabel: 'Open Google Maps', mapsUrl: 'https://maps.app.goo.gl/MAqnSnd3QdHuKNtv6',
    },
    cta: {
      title: 'Quick booking', heading: 'Free diagnosis',
      text: 'Book a visit — we assess your hardware and tell you exactly what needs to be done, no hidden costs.',
      btnLabel: 'Book now',
    },
    seo: {
      title: 'Kostech — IT Services & PC Maintenance in Chișinău',
      description: 'PC and laptop maintenance, server administration, network design and IT security for businesses in Chișinău, Moldova.',
    },
    layoutOrder: ['hero', 'services', 'contact', 'location', 'cta', 'form', 'stats'],
  },
}

export function getDefaultContent(locale: string): HomepageContent {
  return defaultContent[locale] ?? defaultContent['ro']!
}

function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const result = { ...base }
  for (const key of Object.keys(override) as Array<keyof T>) {
    const ov = override[key]
    const bv = base[key]
    if (ov && typeof ov === 'object' && !Array.isArray(ov) && bv && typeof bv === 'object' && !Array.isArray(bv)) {
      result[key] = deepMerge(bv as Record<string, unknown>, ov as Record<string, unknown>) as T[typeof key]
    } else if (ov !== undefined) {
      result[key] = ov as T[typeof key]
    }
  }
  return result
}

export function mergeContent(base: HomepageContent, override: Partial<HomepageContent> | null): HomepageContent {
  if (!override) return base
  return deepMerge(base as unknown as Record<string, unknown>, override as Record<string, unknown>) as unknown as HomepageContent
}
