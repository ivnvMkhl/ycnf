# YCNF - Yandex Cloud Functions CLI

[![npm version](https://badge.fury.io/js/ycnf.svg)](https://badge.fury.io/js/ycnf)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/ivnvMkhl/ycnf/workflows/CI/badge.svg)](https://github.com/ivnvMkhl/ycnf/actions)
[![Publish](https://github.com/ivnvMkhl/ycnf/workflows/Publish%20to%20npm/badge.svg)](https://github.com/ivnvMkhl/ycnf/actions)

CLI утилита для управления функциями Yandex Cloud.

## Установка

### Глобальная установка (рекомендуется)

```bash
npm install -g ycnf
```

### Локальная установка

```bash
npm install ycnf
npx ycnf --help
```

## Быстрый старт

1. В вашем проекте создайте файл `.env`:
```bash
echo "YC_FOLDER_ID=your_folder_id_here" > .env
```

2. Создайте файл `.functionconfig.json`:
```bash
# Скопируйте пример из установленного пакета
cp node_modules/ycnf/functionconfig.example.json .functionconfig.json
```

3. Отредактируйте `.functionconfig.json` под ваши нужды

4. Используйте CLI:
```bash
ycnf create    # Создание нового проекта из шаблона
ycnf public    # Публикация функции
ycnf check     # Информация о функции
ycnf delete    # Удаление функции
```

## Настройка

### Переменные окружения

Создайте файл `.env` в корне вашего проекта:
```env
YC_FOLDER_ID=your_folder_id_here
```

**Опционально:** Если у вас несколько профилей YC CLI, добавьте:
```env
YC_PROFILE=your_profile_name
```

## Настройка

### Yandex Cloud CLI

Убедитесь, что у вас установлен и настроен Yandex Cloud CLI:

```bash
# Установка YC CLI
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash

# Инициализация
yc init
```

### Конфигурация функции

Настройки функции хранятся в файле `.functionconfig.json` (создается в каждом проекте):

```json
{
  "name": "api-handler",
  "runtime": "nodejs22",
  "memory": 256,
  "timeout": 60,
  "public": true,
  "logging": true,
  "description": "REST API handler with routing",
  "entrypoint": "index.handler"
}
```

**Важно:** 
- Поле `name` обязательно и должно содержать имя функции в Yandex Cloud
- `logging`: `true` - включить логирование в папку по умолчанию, `false` - отключить логирование, не указано - использовать поведение по умолчанию

## Использование

### Установка в проект

1. Установите CLI утилиту глобально:
```bash
npm install -g ycnf
```

2. В вашем проекте создайте необходимые файлы:
```bash
# Создайте .env файл
echo "YC_FOLDER_ID=your_folder_id_here" > .env

# Создайте .functionconfig.json
cp /path/to/ycnf/functionconfig.example.json .functionconfig.json
```

3. Отредактируйте `.functionconfig.json` под ваши нужды (имя функции, runtime, память и т.д.)

### Создание нового проекта

Для быстрого создания нового проекта Yandex Cloud Function используйте команду `create`:

```bash
npx ycnf create --name my-function
```

Или без указания имени (будет запрошено в диалоге):
```bash
npx ycnf create
```

Эта команда создаст:
- Структуру проекта с папкой `src/`
- Файл `src/index.js` с базовым обработчиком
- Конфигурацию `.functionconfig.json`
- GitHub Actions workflow для автоматического деплоя
- Файлы `.gitignore`, `package.json`, `README.md`

### Публикация функции
```bash
npx ycnf public
```

Опции:
- `-f, --force` - Принудительное создание новой версии (в настоящее время работает как обычная публикация)

### Удаление функции
```bash
npx ycnf delete
```

Опции:
- `-f, --force` - Удаление без подтверждения

### Получение информации о функции
```bash
npx ycnf check
```

## Структура проекта

```
.
├── cli.js                      # Основной CLI файл
├── package.json                # Зависимости и конфигурация
├── .functionconfig.json        # Конфигурация функции (создать в каждом проекте)
├── .env                        # Переменные окружения (создать в каждом проекте)
├── env.example                 # Пример переменных окружения
├── functionconfig.example.json # Пример конфигурации функции
├── src/                        # Исходный код функции
│   └── index.js
└── README.md
```

## Требования

- Node.js >= 14.0.0
- Yandex Cloud CLI
- Настроенный аккаунт Yandex Cloud
- ID папки в Yandex Cloud (YC_FOLDER_ID)

## Разработка

### Установка для разработки

```bash
git clone https://github.com/ivnvMkhl/ycnf.git
cd ycnf
npm install
npm link
```

### Тестирование

```bash
npm test
```

### Публикация

#### Автоматическая публикация (рекомендуется)

Пакет автоматически публикуется в npm при создании релиза на GitHub:

1. Создайте тег:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

2. Создайте релиз на GitHub или используйте GitHub CLI:
   ```bash
   gh release create v1.0.1 --title "Release v1.0.1" --notes "Bug fixes"
   ```

3. GitHub Action автоматически опубликует пакет в npm

#### Ручная публикация

```bash
npm version patch  # или minor, major
npm publish
```

**Примечание:** Для автоматической публикации необходимо настроить `NPM_TOKEN` в секретах GitHub репозитория. См. [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md) для подробностей.

## Автор

**iMkhl** - [mkhl.ivnv@gmail.com](mailto:mkhl.ivnv@gmail.com)

## Лицензия

MIT License. См. [LICENSE](LICENSE) для подробностей.

## Ссылки

- [GitHub Repository](https://github.com/ivnvMkhl/ycnf)
- [npm Package](https://www.npmjs.com/package/ycnf)
- [Yandex Cloud Functions Documentation](https://cloud.yandex.ru/docs/functions/)
