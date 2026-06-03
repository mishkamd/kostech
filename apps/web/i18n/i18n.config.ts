export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'ro',
  messages: {
    ro: {
      nav: { services: 'Servicii', booking: 'Programare', contact: 'Contact' },
      footer: {
        tagline: 'Servicii IT pentru afaceri din Chișinău: mentenanță, securitate, rețele și suport.',
        services: 'Servicii', company: 'Companie', contact: 'Contact',
        bookVisit: 'Programează vizită', admin: 'Admin',
        rights: 'Toate drepturile rezervate.', city: 'Chișinău, Moldova',
      },
      theme: { dark: 'Activează modul întunecat', light: 'Activează modul luminos' },
      phone: 'Sună-ne',
    },
    ru: {
      nav: { services: 'Услуги', booking: 'Запись', contact: 'Контакты' },
      footer: {
        tagline: 'IT-услуги для бизнеса в Кишинёве: обслуживание, безопасность, сети и поддержка.',
        services: 'Услуги', company: 'Компания', contact: 'Контакты',
        bookVisit: 'Записаться на визит', admin: 'Админ',
        rights: 'Все права защищены.', city: 'Кишинёв, Молдова',
      },
      theme: { dark: 'Тёмный режим', light: 'Светлый режим' },
      phone: 'Позвонить',
    },
    en: {
      nav: { services: 'Services', booking: 'Book', contact: 'Contact' },
      footer: {
        tagline: 'IT services for businesses in Chișinău: maintenance, security, networking and support.',
        services: 'Services', company: 'Company', contact: 'Contact',
        bookVisit: 'Book a visit', admin: 'Admin',
        rights: 'All rights reserved.', city: 'Chișinău, Moldova',
      },
      theme: { dark: 'Enable dark mode', light: 'Enable light mode' },
      phone: 'Call us',
    },
  },
}))
