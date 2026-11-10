// Initial dates follow the user brief; new event details use the supplied 2026 documents.
export const events = [
  { id:'kaliningrad', title:'Цифровой день в Калининграде', posterTitle:'Цифровой<br>день', city:'Калининград', category:'digital', type:'Цифровой день', start:'2026-11-19', end:'2026-11-19', date:'19 ноября', summary:'Технологии и новые возможности для бизнеса региона.', background:'#dfd0f7', color:'#28232f', art:'city', description:'Встреча, посвящённая цифровой трансформации в Калининграде. Сохраните событие, чтобы вернуться к нему, когда появятся программа и подробности.' },
  { id:'murmansk', title:'Цифровой день в Мурманске', posterTitle:'Цифровой<br>день', city:'Мурманск', category:'digital', type:'Цифровой день', start:'2026-11-26', end:'2026-11-26', date:'26 ноября', summary:'Цифровые горизонты и технологии на Севере.', background:'#d9e9ff', color:'#243147', art:'north', description:'Цифровой день в Мурманске. Событие для знакомства с цифровыми возможностями региона. Детальная программа будет доступна после подтверждения организатором.' },
  { id:'lenoblast', title:'Цифровой день в Ленинградской области', posterTitle:'Цифровой<br>день', city:'Ленинградская область', category:'digital', type:'Цифровой день', start:'2026-11-09', end:'2026-11-09', date:'9 ноября', summary:'Точки роста цифровой экономики региона.', background:'#e6edc8', color:'#343b2b', art:'region', description:'Встреча о цифровой трансформации в Ленинградской области. Сохраните дату; точное место, время и программа пока не опубликованы на платформе.' },
  { id:'royal', title:'Королевский Акселератор', posterTitle:'Королевский<br>Акселератор', city:'Санкт-Петербург', category:'accelerator', type:'Акселератор', start:'2026-12-10', end:'2026-12-10', date:'10 декабря', summary:'Пространство идей и новых возможностей для роста.', background:'#ffc6ab', color:'#35251e', art:'accelerator', description:'Королевский Акселератор пройдёт 10 декабря в Санкт-Петербурге. Условия участия, программа и площадка требуют уточнения у организатора.' },
  { id:'aij', title:'AI Journey', posterTitle:'AI<br>JOURNEY', city:null, category:'forum', type:'Форум', start:'2026-11-27', end:'2026-11-28', date:'27–28 ноября', summary:'Два дня в мире искусственного интеллекта.', background:'#29242f', color:'#edddff', art:'ai', description:'AIJ — событие об искусственном интеллекте 27 и 28 ноября. Даты указаны по вашему календарю событий; программа, место проведения и регистрация требуют подтверждения.' },
  {
    "id": "business-dinner",
    "title": "От пилотов к результату: бизнес-ужин Сбера",
    "city": "Санкт-Петербург",
    "category": "business",
    "type": "Бизнес-ужин",
    "start": "2026-12-02",
    "end": "2026-12-02",
    "date": "2 декабря",
    "summary": "Практическое внедрение GenAI, ИИ-агенты и экономика ИИ-проектов в Юсуповском дворце.",
    "description": "Закрытый бизнес-ужин Сбера о практическом внедрении GenAI в бизнесе: переходе от личного опыта к системной агентной трансформации, перестройке процессов и взаимодействию с рынком.",
    "venue": "Юсуповский дворец",
    "address": "Санкт-Петербург, набережная реки Мойки, 94. Вход с набережной Мойки.",
    "time": "17:00–23:30",
    "startTime": "17:00",
    "endTime": "23:30",
    "timeZone": "Europe/Moscow",
    "registrationText": "Закрытое мероприятие. Участие необходимо подтвердить ответным письмом на полученное приглашение.",
    "program": [
      {
        "time": "17:00–17:20",
        "title": "Сбор гостей",
        "description": "Welcome Drink."
      },
      {
        "time": "17:20–18:00",
        "title": "Экскурсия по Юсуповскому дворцу"
      },
      {
        "time": "18:00–20:00",
        "title": "Деловая программа",
        "description": "ИИ-агенты, экономика ИИ-проектов и трансформация операционной модели."
      },
      {
        "time": "20:00–20:30",
        "title": "Театральное представление"
      },
      {
        "time": "20:30–23:30",
        "title": "Ужин, живая музыка и неформальное общение"
      }
    ],
    "speakers": [
      {
        "name": "Андрей Кутуков",
        "role": "Директор центра технологического бизнеса, Сбер",
        "topic": "От личного агента к агентной экономике"
      },
      {
        "name": "Елена Борисова",
        "role": "Директор по технологическому консалтингу «Салют для Бизнеса»",
        "topic": "ИИ-агенты для бизнеса: как повысить эффективность сотрудников и ускорить процессы"
      },
      {
        "name": "Дмитрий Юдин",
        "role": "Директор департамента стратегии и развития ИИ Cloud.ru",
        "topic": "Экономика ИИ-проектов: от экспериментов к реальной эффективности"
      }
    ],
    "topics": [
      "Как оценивать бизнес-эффект, выбирать метрики и масштабировать ИИ без потери эффективности.",
      "Как встраивать ИИ-агентов в корпоративные системы и работу команд; реальные кейсы GigaCowork.",
      "Новая модель производства: цифровые исполнители, MCP и AI-агенты, управляемая автономность и предсказуемость процессов.",
      "Риски ИИ-агентов и сокращение пути от идеи до работающего ИИ-продукта."
    ],
    "terms": [
      "Дресс-код — Business casual."
    ],
    "documents": [
      {
        "title": "Деловая программа (PDF)",
        "href": "./assets/events/materials/business-dinner-program.pdf"
      }
    ]
  },
  {
    "id": "dss-spb",
    "title": "Digital Strategy smart — Санкт-Петербург",
    "city": "Санкт-Петербург",
    "category": "education",
    "type": "Образовательная программа",
    "start": "2026-05-28",
    "end": "2026-05-31",
    "date": "28–31 мая",
    "summary": "Четыре дня о цифровой стратегии, GenAI, бизнес-моделях и лидерстве от СберУниверситета.",
    "description": "Программа СберУниверситета для собственников бизнеса, руководителей, топ-менеджеров и лидеров с управленческим опытом от трёх лет. Тренды инновационной экономики, цифровые технологии и компетенции лидера цифровой трансформации бизнеса.",
    "venue": "Гранд Отель Европа",
    "time": "28 мая — 10:00–21:30; 29 мая — 09:00–18:00; 30 мая — 10:00–18:00; 31 мая — 10:00–15:00",
    "program": [
      {
        "time": "28 мая · 10:00–21:30",
        "title": "Тренды инноваций и цифровые технологии",
        "description": "Технологическая революция, новые модели управления, компетенции лидера, подход Сбера к цифровой трансформации и клиентские кейсы. Вечером — прогулка на теплоходе."
      },
      {
        "time": "29 мая · 09:00–18:00",
        "title": "Цифровая трансформация с GenAI",
        "description": "GPT-модели и ИИ-агенты: возможности, внедрение и корпоративные практики; ассистентский и агентский подходы. Экскурсия в музей Фаберже."
      },
      {
        "time": "30 мая · 10:00–18:00",
        "title": "Бизнес-модели и гибкие методы управления",
        "description": "Трансформация бизнес-моделей, цифровые платформы и экосистемы, инструменты анализа, Agile, Scrum и Kanban."
      },
      {
        "time": "31 мая · 10:00–15:00",
        "title": "Эмоциональный интеллект лидера",
        "description": "Эмоциональная зрелость, культура инноваций, диагностика и развитие эмоционального интеллекта. Вручение сертификатов."
      }
    ],
    "terms": [
      "Стоимость программы — 590 000 ₽.",
      "Группа — 40 мест. Заезд 27 мая, выезд 31 мая 2026 года.",
      "В стоимость включены четыре очных дня, два вебинара в записи, электронные курсы и доступ к материалам на один год.",
      "Также включены проживание, питание, кофе-брейки и вечернее мероприятие."
    ],
    "registrationText": "По вопросам программы и участия: Сергей Громов.",
    "contact": {
      "name": "Сергей Громов",
      "phone": "+7 928 007 55 35",
      "email": "SAnGromov@sberbank.ru"
    },
    "documents": [
      {
        "title": "Программа обучения (PDF)",
        "href": "./assets/events/materials/dss-spb-program.pdf"
      }
    ]
  }
];
export const eventYear=2026;
export const eventMonthBounds={min:Math.min(...events.map(e=>Number(e.start.slice(5,7)))),max:Math.max(...events.map(e=>Number(e.end.slice(5,7))))};
export const eventMonths=[...new Set(events.flatMap(e=>[e.start.slice(5,7),e.end.slice(5,7)]))].sort();
export const sourceUrl = 'https://sber-northwest-casebook.tenderlion1.chatgpt.site/';
export function filterEvents(items, { category='all', query='', region='all', month='all', day='all', savedOnly=false, saved=[] }={}) {
  const normalized = query.trim().toLocaleLowerCase('ru');
  return items.filter(e => (category==='all'||e.category===category) && (region==='all'||(region==='unknown' ? !e.city : e.city===region)) && (month==='all'||e.start.slice(5,7)===month) && (day==='all'||(e.start<=day&&e.end>=day)) && (!savedOnly||saved.includes(e.id)) && (!normalized||`${e.title} ${e.city||''} ${e.summary} ${e.type} ${e.venue||''} ${(e.topics||[]).join(' ')} ${e.id==='aij'?'AIJ искусственный интеллект':''}`.toLocaleLowerCase('ru').includes(normalized)));
}
export function calendarText(e) {
  const dayAfter = new Date(e.end+'T00:00:00Z'); dayAfter.setUTCDate(dayAfter.getUTCDate()+1);
  const escape = value => String(value).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const stamp=date=>date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const timed=e.startTime&&e.endTime&&e.timeZone==='Europe/Moscow';
  const dates=timed?[
    'DTSTART:'+stamp(new Date(e.start+'T'+e.startTime+':00+03:00')),
    'DTEND:'+stamp(new Date(e.end+'T'+e.endTime+':00+03:00'))
  ]:[
    'DTSTART;VALUE=DATE:'+e.start.replaceAll('-',''),
    'DTEND;VALUE=DATE:'+dayAfter.toISOString().slice(0,10).replaceAll('-','')
  ];
  const location=[e.venue,e.address||e.city].filter(Boolean).join(', ');
  const description=[e.description,e.time,e.registrationText].filter(Boolean).join('\n');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//DTaaS SZB//Events//RU','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${e.id}-${e.start.slice(0,4)}@dtaas.local`,`DTSTAMP:${stamp(new Date())}`,...dates,`SUMMARY:${escape(e.title)}`,`DESCRIPTION:${escape(description)}`,...(location?[`LOCATION:${escape(location)}`]:[]),'END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
