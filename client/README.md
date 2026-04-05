# LiveLec — Клиентская часть (Frontend)

Интерактивная платформа для проведения лекций в реальном времени. 

## Технологический стек
* **Framework:** [React.js](https://react.dev/) (v18+)
* **Build Tool:** [Vite](https://vitejs.dev/) — выбран за высокую скорость сборки и поддержку HMR.
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) — используется для адаптивной верстки (Mobile-first).
* **Icons:** [Lucide React](https://lucide.dev/)
* **Routing:** [React Router DOM](https://reactrouter.com/)
* **Charts:** [Recharts](https://recharts.org/) — для визуализации тепловой карты понимания.

## Архитектура проекта
Проект разделен на логические блоки для удобства поддержки и масштабирования:
* `/src/pages` — основные экраны приложения (Студент, Преподаватель, Аналитика).
* `/src/components` — переиспользуемые UI-компоненты.
* `/src/assets` — статические ресурсы (логотипы, стили).

## Как запустить проект локально
1. Установите зависимости:
   npm install
2. Запустите сервер разработки:
   npm run dev
3. Откройте в браузере: http://localhost:5173