# latent_space

`ьё` — mobile-first статический сайт-колода. Пользователь выбирает одну из пяти галерей, получает трёхкарточный расклад, может перейти к поиску по образам и тегам, а также открыть отдельный режим `об авторе`.

Проект собран без bundler и без серверного рендера: это обычный статический фронтенд на нативных ES-модулях, который выкладывается по FTP.

## Что внутри

- `5` кураторских галерей по `18` вертикальных изображений в каждой
- стартовый экран с выбором колоды
- расклад на `3` карты
- completion sheet после завершения расклада
- поиск по словам, тегам и ассоциациям
- отдельный блок `об авторе`
- фоновая музыка из двух треков
- клиентский полнотекстовый поиск на `MiniSearch`

## Основные принципы

- mobile-first: сначала проверяются мобильные размеры, потом десктоп
- без обрезки изображений: карточки показывают работу целиком внутри рамки
- статическая доставка: сайт должен открываться без backend-сервиса
- кураторский контент: все итоговые изображения уже отобраны и лежат в репозитории

## Структура проекта

```text
latent_space/
├── app.js
├── index.html
├── styles.css
├── assets/
│   ├── audio/
│   ├── author/
│   └── galleries/
├── modules/
│   ├── audio.js
│   ├── catalog.js
│   ├── copy.js
│   ├── deck.js
│   ├── flip.js
│   ├── gestures.js
│   ├── renderer.js
│   ├── search-index.js
│   ├── search-query.js
│   ├── search.js
│   └── theme.js
├── scripts/
│   ├── ftp_upload.py
│   ├── optimize_gallery_images.py
│   ├── prepare_curated_galleries.py
│   ├── scan_exposition.py
│   └── serve_static.py
└── vendor/
    └── minisearch.js
```

## Как устроен интерфейс

### 1. Первый экран

На главном экране пользователь видит:

- бренд `ьё`
- выбор из пяти колод
- вход в режим `об авторе`
- нижний поиск

При выборе колоды первая карта открывается сразу.

### 2. Расклад

Поведение расклада:

- пока открыто меньше трёх карт, тап по большой карте открывает следующую
- после третьей карты тап по большой карте листает уже открытые карты по кругу
- верхний ряд мини-карт даёт прямой выбор фокуса
- снизу появляется панель завершения с действиями:
  - выбрать другую колоду
  - собрать новый расклад
  - перейти в поиск

### 3. Поиск

Поиск работает полностью на клиенте.

Что он умеет:

- поиск по словам
- поиск по тегам
- частичный `prefix` match
- лёгкий `fuzzy` match
- расширение запроса через ассоциативные токены
- fallback на ручной доменный скоринг

Повторный выбор того же тега или повторный запуск того же запроса показывает следующий результат из найденных, а не всегда первый.

### 4. Об авторе

Режим `об авторе` — это отдельная последовательность из трёх карточек:

- автор
- практика
- связь

Контакты автора задаются в [copy.js](/Users/ilyagmirin/PycharmProjects/latent_space/modules/copy.js).

## Основные модули

### [app.js](/Users/ilyagmirin/PycharmProjects/latent_space/app.js)

Точка входа приложения.

Отвечает за:

- загрузку каталога
- инициализацию поиска
- загрузочный экран `поднимаем колоду`
- глобальные обработчики клавиатуры и кликов
- переключение экранов
- запуск фоновой музыки

### [catalog.js](/Users/ilyagmirin/PycharmProjects/latent_space/modules/catalog.js)

Загружает [manifest.json](/Users/ilyagmirin/PycharmProjects/latent_space/assets/galleries/manifest.json), собирает карточки и готовит поисковые поля:

- `searchTitle`
- `searchDescription`
- `searchTone`
- `searchGallery`
- `searchTagsText`
- `searchText`

### [deck.js](/Users/ilyagmirin/PycharmProjects/latent_space/modules/deck.js)

Хранит и меняет состояние UI:

- home
- spread
- search
- author

### [renderer.js](/Users/ilyagmirin/PycharmProjects/latent_space/modules/renderer.js)

Рендерит экран и карточки.

### [search-query.js](/Users/ilyagmirin/PycharmProjects/latent_space/modules/search-query.js)

Нормализация поискового ввода:

- lowercase
- схлопывание мусора
- токенизация
- ассоциативное расширение запроса

### [search-index.js](/Users/ilyagmirin/PycharmProjects/latent_space/modules/search-index.js)

Клиентский поиск на [MiniSearch](/Users/ilyagmirin/PycharmProjects/latent_space/vendor/minisearch.js).

Схема:

- `MiniSearch` даёт быстрый retrieval
- поверх этого накладывается дополнительный доменный `post-ranking`
- если нужно, остаётся fallback на ручной `scoreCards()`

### [search.js](/Users/ilyagmirin/PycharmProjects/latent_space/modules/search.js)

Ручной скоринг и сборка расклада.

### [audio.js](/Users/ilyagmirin/PycharmProjects/latent_space/modules/audio.js)

Фоновая музыка:

- два трека
- тихое воспроизведение
- плавный fade-in / fade-out
- сохранение состояния между перезагрузками

### [theme.js](/Users/ilyagmirin/PycharmProjects/latent_space/modules/theme.js)

Подстраивает цветовую атмосферу экрана под активную карту.

## Контент

### Галереи

Итоговые изображения лежат в [assets/galleries](/Users/ilyagmirin/PycharmProjects/latent_space/assets/galleries).

Важные файлы:

- [manifest.json](/Users/ilyagmirin/PycharmProjects/latent_space/assets/galleries/manifest.json) — данные для фронтенда
- [README.md](/Users/ilyagmirin/PycharmProjects/latent_space/assets/galleries/README.md) — человекочитаемая расшифровка слотов

### Авторский блок

Файлы лежат в [assets/author](/Users/ilyagmirin/PycharmProjects/latent_space/assets/author).

### Музыка

Файлы лежат в [assets/audio](/Users/ilyagmirin/PycharmProjects/latent_space/assets/audio).

## Локальный запуск

Самый простой способ:

```bash
python3 -m http.server 8127
```

Или через вспомогательный скрипт:

```bash
python3 scripts/serve_static.py
```

После этого сайт доступен по локальному адресу сервера.

## Деплой

В проекте есть FTP-выкладка через [ftp_upload.py](/Users/ilyagmirin/PycharmProjects/latent_space/scripts/ftp_upload.py).

### Что нужно в `.env`

```env
FTP_HOST=...
FTP_USERNAME=...
FTP_PASSWORD=...
FTP_REMOTE_DIR=...
```

`FTP_REMOTE_DIR` опционален. Если он не задан, выкладка идёт в корень FTP-аккаунта.

### Команды

Проверка подключения:

```bash
python3 scripts/ftp_upload.py --check-connection
```

Сухой прогон:

```bash
python3 scripts/ftp_upload.py --dry-run
```

Полная выкладка:

```bash
python3 scripts/ftp_upload.py
```

### Как работает выкладка

Скрипт:

- загружает корневые `html/js/css`
- загружает `assets/`
- загружает `modules/`
- загружает `vendor/`
- пропускает файл, если на сервере уже такая же версия по размеру и дате
- делает до `3` попыток при ошибке

То есть это не “залить всё заново”, а инкрементальная выкладка.

## Подготовка галерей

Сборка галерей начинается из локальных исходников, перечисленных в [prepare_curated_galleries.py](/Users/ilyagmirin/PycharmProjects/latent_space/scripts/prepare_curated_galleries.py).

Этот скрипт:

- копирует выбранные исходные файлы в `assets/galleries/<slug>/`
- собирает `manifest.json`
- обновляет `assets/galleries/README.md`

Запуск:

```bash
python3 scripts/prepare_curated_galleries.py
```

После этого обычно требуется дополнительная оптимизация изображений и ручная проверка.

## Медиа и производительность

Текущее состояние:

- галереи в основном лежат в `WEBP`
- авторские изображения тоже в `WEBP`
- фоновая музыка — `MP3`
- тяжёлые outlier-файлы уже пережаты

Если меняешь медиа, проверь:

- вертикальную ориентацию
- отсутствие кропа внутри карточки
- фактический вес файла
- соответствие `manifest.json`

## Типографика

Подключены шрифты:

- `Cormorant Garamond`
- `Source Serif 4`
- `IBM Plex Sans`

Роли:

- крупные заголовки и бренд — более выразительный serif
- основной текст — читаемый serif
- интерфейсные элементы — нейтральный sans

## Что важно не сломать

- mobile-first геометрию карточек
- целостный показ изображения без обрезки краёв
- загрузочный экран
- поиск по тегам и словам
- completion sheet после третьей карты
- загрузку `vendor/minisearch.js` на проде

## Минимальный чек перед выкладкой

1. Главная открывается без ошибок.
2. Любая из пяти колод стартует с первой карты.
3. Три карты расклада открываются без развала вёрстки.
4. Completion sheet появляется после третьей карты.
5. Поиск находит результаты по `ритуал`, `миф`, `рыжая`, `алгоритм`.
6. Повторный выбор того же тега листает найденные результаты.
7. `Об авторе` открывается и листается.
8. Фоновая музыка запускается без ошибок.
9. FTP dry-run включает `vendor/minisearch.js`.

## Замечания по сопровождению

- Проект живёт как статический сайт, поэтому любые новые зависимости нужно оценивать с точки зрения простоты выкладки.
- Если добавляется новый внешний модуль, он должен либо лежать внутри уже выгружаемых директорий, либо быть явно включён в FTP-скрипт.
- Если меняются пути к медиафайлам, проверь, что они совпадают и в коде, и в файловой системе.
