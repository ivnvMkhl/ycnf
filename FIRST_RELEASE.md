# Первый релиз

## Шаги для первого релиза

### 1. Настройка GitHub Actions

1. Создайте NPM token:
   - Войдите в [npm](https://www.npmjs.com/)
   - Account Settings → Access Tokens → Generate New Token → Automation
   - Скопируйте токен

2. Добавьте секрет в GitHub:
   - Перейдите в Settings → Secrets and variables → Actions
   - New repository secret: `NPM_TOKEN` = ваш токен

### 2. Создание первого релиза

```bash
# Создайте тег
git tag v1.0.0
git push origin v1.0.0

# Создайте релиз на GitHub
gh release create v1.0.0 --title "Release v1.0.0" --notes "Initial release of YCNF CLI"
```

### 3. Проверка

1. Перейдите в Actions в GitHub - должен запуститься workflow "Publish to npm"
2. Дождитесь завершения
3. Проверьте npm: https://www.npmjs.com/package/ycnf

### 4. Тестирование установки

```bash
# В другом проекте
npm install -g ycnf
ycnf --version
```

## Последующие релизы

Для следующих релизов просто:

```bash
git tag v1.0.1
git push origin v1.0.1
gh release create v1.0.1 --title "Release v1.0.1" --notes "Bug fixes"
```

GitHub Action автоматически опубликует новую версию в npm.
