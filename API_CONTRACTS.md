# LiveLec API Контракты

## Общие принципы
- Префикс: `/api/`
- Формат: `application/json`
- Авторизация: `Bearer <token>` (JWT)
- Даты: ISO формат

---

## 1. Аутентификация

### Регистрация преподавателя
`POST /api/auth/register`

**Request:**
```json
{
  "email": "teacher@example.com",
  "name": "Иван Петров",
  "password": "secure123"
}