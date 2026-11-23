# Публикация на GitHub и установка как приложение

Репозиторий уже подготовлен: git инициализирован, первый коммит сделан, есть workflow
`.github/workflows/deploy.yml`, который при каждом push в `main` собирает игру и публикует её
на **GitHub Pages**. Все пути в проекте относительные, поэтому сайт работает и в подпапке
`https://<логин>.github.io/pvz-city/`.

---

## 1. Создать пустой репозиторий

На GitHub: **New repository** → имя `pvz-city` → **Public** → *не* добавлять README, .gitignore и лицензию
(они уже есть локально) → **Create repository**.

## 2. Подключить доступ (SSH-ключ)

В проекте лежит готовая пара ключей:

| файл | что это | куда |
|---|---|---|
| `deploy-key/pvz_city` | **приватный** ключ | остаётся на устройстве, в git не попадает (`.gitignore`) |
| `deploy-key/pvz_city.pub` | публичный ключ | добавляем на GitHub |

Публичный ключ (он же — в файле `deploy-key/pvz_city.pub`):

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIy+N6kpV3JkzZxQnRcgotYz3KaNo0EUdTVI/Zk0sUYz pvz-city@arena deploy key
```

Дальше один из двух вариантов.

**А. Деплой-ключ только для этого репозитория (рекомендую)**
1. Репозиторий → **Settings** → **Deploy keys** → **Add deploy key**.
2. Title: `arena sandbox`, Key: вставить строку выше, включить ✅ **Allow write access** → **Add key**.
3. В проекте:
   ```bash
   git remote add origin git@github.com:<логин>/pvz-city.git
   git push -u origin main
   ```

**Б. Ключ на весь аккаунт**
1. **Settings (аккаунта)** → **SSH and GPG keys** → **New SSH key** → вставить ту же строку.
2. То же `git remote add origin git@github.com:<логин>/pvz-city.git && git push -u origin main`.

**В. Без SSH — по HTTPS с токеном**
```bash
# токен: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained,
# права Contents: Read and write на этот репозиторий
git remote add origin https://github.com/<логин>/pvz-city.git
git push -u origin main        # логин + токен вместо пароля
```

Если `ssh` ругается «Permission denied» — проверьте, что ключ подхватился:
```bash
ssh -i deploy-key/pvz_city -T git@github.com     # должно ответить: Hi <логин>! You've successfully authenticated…
```

## 3. Включить GitHub Pages

Репозиторий → **Settings** → **Pages** → **Build and deployment** →
**Source: GitHub Actions**. Больше ничего не нужно: workflow уже в репозитории.

После первого push откройте вкладку **Actions** → «Deploy PWA». Через ~40 секунд игра будет здесь:

```
https://<логин>.github.io/pvz-city/
```

## 4. Установить как приложение

- **Android / Chrome:** открыть ссылку → меню ⋮ → **Установить приложение** (или кнопка в меню игры
  «Установить приложение»). Иконка появится на главном экране, игра откроется без адресной строки.
- **iPhone / Safari:** «Поделиться» → **На экран «Домой»**.
- **Компьютер (Chrome/Edge):** иконка установки в адресной строке.
- Меню игры показывает состояние: *установлено / в браузере*, *в сети / офлайн*, *офлайн-кеш готов*.

После первого запуска оболочка лежит в кеше (`sw.js`, `pvz-v3`), и игра открывается **без интернета**.
Прогресс хранится в `localStorage` устройства.

---

## Локальная проверка перед push

Service worker работает только по http(s), не по `file://`:

```bash
python3 -m http.server 8123          # затем открыть http://127.0.0.1:8123/index.html
node test/pwa.mjs                    # манифест · иконки · SW · запуск без сети
node test/smoke.mjs                  # интерфейс
node test/economy.mjs                # экономика найма
node test/playtest.mjs               # полный игровой день в Chromium
```

## Что обновляется автоматически

| Шаг | Инструмент |
|---|---|
| `index.html` / `game.html` из `src/*` | `node build.mjs` (в CI тоже) |
| иконки приложения (192/512/maskable/apple/favicon) | `node make-icons.mjs` |
| кеш после правок | поднять `VERSION` в `sw.js` (`pvz-v3` → `pvz-v4`) |

## Про безопасность

- Приватный ключ лежит только в рабочей папке (`deploy-key/`) и исключён из репозитория.
- Деплой-ключ можно в любой момент отозвать: **Settings → Deploy keys → Remove**.
- В репозитории нет ни токенов, ни паролей, ни пользовательских данных.
