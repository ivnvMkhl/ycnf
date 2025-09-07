# Настройка GitHub Actions для автоматической публикации

## 1. Создание NPM Token

1. Войдите в [npm](https://www.npmjs.com/)
2. Перейдите в **Account Settings** → **Access Tokens**
3. Нажмите **Generate New Token** → **Automation**
4. Скопируйте созданный токен

## 2. Добавление секрета в GitHub

1. Перейдите в ваш репозиторий на GitHub
2. Откройте **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**
4. Имя: `NPM_TOKEN`
5. Значение: вставьте ваш npm token
6. Нажмите **Add secret**

## 3. Как работает автоматическая публикация

### Триггеры:
- **Создание релиза** на GitHub
- **Push тега** (например, `v1.0.0`)

### Процесс:
1. GitHub Action запускается автоматически
2. Устанавливает Node.js 20
3. Устанавливает зависимости
4. Запускает тесты
5. Извлекает версию из тега
6. Обновляет package.json
7. Публикует в npm
8. Проверяет успешность публикации

## 4. Создание релиза

### Через GitHub UI:
1. Перейдите в **Releases** в вашем репозитории
2. Нажмите **Create a new release**
3. Выберите тег (например, `v1.0.0`)
4. Заполните описание
5. Нажмите **Publish release**

### Через командную строку:
```bash
# Создать тег
git tag v1.0.0
git push origin v1.0.0

# Или создать релиз через GitHub CLI
gh release create v1.0.0 --title "Release v1.0.0" --notes "Initial release"
```

## 5. Проверка работы

После создания релиза:
1. Перейдите в **Actions** в вашем репозитории
2. Найдите запущенный workflow "Publish to npm"
3. Дождитесь завершения
4. Проверьте, что пакет появился в npm: https://www.npmjs.com/package/ycnf

## 6. Troubleshooting

### Ошибка "NPM_TOKEN not found":
- Убедитесь, что секрет `NPM_TOKEN` добавлен в репозиторий

### Ошибка "Package already exists":
- Увеличьте версию в package.json или создайте новый тег

### Ошибка "Invalid version":
- Убедитесь, что тег соответствует семантическому версионированию (v1.0.0, v1.0.1, etc.)

## 7. Безопасность

- NPM_TOKEN имеет права только на публикацию пакетов
- Токен автоматически скрыт в логах GitHub Actions
- Workflow запускается только при создании релизов или push тегов
