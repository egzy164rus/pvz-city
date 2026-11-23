# GitHub → живой сайт → приложение на телефоне

Пошагово, с ссылками. Всё, что нужно сделать руками, — 4 коротких шага (~5 минут).
Локальная часть уже готова: git-репозиторий, коммиты, ключ деплоя и CI-сборка.

> Условные обозначения: **`<логин>`** — ваш ник на GitHub (например, `ivan-petrov`),
> **`pvz-city`** — имя репозитория (можно любое другое).

---

## Шаг 1. Создать пустой репозиторий

🔗 **https://github.com/new**
(если ещё не вошли — сначала 🔗 https://github.com/login)

Заполнить так:

| Поле | Значение |
|---|---|
| **Owner** | ваш аккаунт |
| **Repository name** | `pvz-city` |
| **Description** | `Симулятор пункта выдачи заказов — игра + PWA` |
| **Public / Private** | **Public** (для бесплатных GitHub Pages нужен публичный) |
| **Add a README file** | ❌ не ставить |
| **Add .gitignore** | ❌ не ставить (он уже есть в проекте) |
| **Choose a license** | ❌ не ставить |

→ **Create repository**. Откроется пустая страница репозитория — так и должно быть.

---

## Шаг 2. Добавить ключ деплоя

Публичный ключ проекта (лежит в `deploy-key/pvz_city.pub`):

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIy+N6kpV3JkzZxQnRcgotYz3KaNo0EUdTVI/Zk0sUYz pvz-city@arena deploy key
```

🔗 **https://github.com/`<логин>`/pvz-city/settings/keys**
(это же: страница репозитория → **Settings** → слева **Deploy keys**)

1. **Add deploy key**
2. **Title:** `arena-workspace`
3. **Key:** вставить строку выше целиком
4. ✅ **Allow write access** — обязательно, иначе не сможем пушить
5. **Add key**

Проверка, что ключ жив (в терминале проекта):

```bash
ssh -i deploy-key/pvz_city -T git@github.com
```

Хорошо: `Hi <логин>/pvz-city! You've successfully authenticated, but GitHub does not provide shell access.`
Плохо: `Permission denied (publickey)` → ключ не добавился или не включён *Allow write access*.

📚 Документация GitHub: 🔗 https://docs.github.com/ru/authentication/connecting-to-github-with-ssh/managing-deploy-keys

---

## Шаг 3. Запушить проект

Из папки проекта — одна команда со скриптом (он сам подставит ключ и сделает первый push):

```bash
./setup-github.sh <логин>
```

или вручную:

```bash
git remote add origin git@github.com:<логин>/pvz-city.git
GIT_SSH_COMMAND="ssh -i deploy-key/pvz_city" git push -u origin main
```

Проверка:

```bash
git remote -v        # origin  git@github.com:<логин>/pvz-city.git
git log --oneline    # коммиты на месте
```

После push страница репозитория обновится: 37 файлов, `index.html`, папка `src/`, `sw.js`.

> Нет SSH и не хочется с ключами? Вариант по HTTPS с токеном:
> 🔗 https://github.com/settings/tokens → **Fine-grained token** → доступ к репозиторию, право
> **Contents: Read and write** → затем
> `git remote set-url origin https://github.com/<логин>/pvz-city.git` и `git push -u origin main`
> (вместо пароля — токен).
>
> Можно и через GitHub CLI: 🔗 https://cli.github.com/ → `gh auth login` → `gh repo create pvz-city --public --source=. --push`.

---

## Шаг 4. Включить GitHub Pages

🔗 **https://github.com/`<логин>`/pvz-city/settings/pages**

- **Build and deployment** → **Source:** `GitHub Actions` (не «Deploy from a branch»)
- Сохранять ничего не нужно — выбор применяется сразу.

📚 Документация: 🔗 https://docs.github.com/ru/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

---

## Шаг 5. Посмотреть, как собирается

🔗 **https://github.com/`<логин>`/pvz-city/actions**

Должен идти workflow **Deploy PWA**: две задачи — `build` (запускает `node build.mjs` и собирает `_site`)
и `deploy`. Зелёные галочки ≈ 40–60 секунд с момента push.

Можно перезапустить вручную: **Deploy PWA** → **Run workflow**.

**Готово. Игра живёт здесь:**

```
https://<логин>.github.io/pvz-city/
```

(точный адрес — в задаче `deploy`, шаг `deploy-pages`, строка `page_url`; он же в Settings → Pages сверху)

---

## Шаг 6. Поставить на телефон как приложение

Открыть ссылку `https://<логин>.github.io/pvz-city/` на телефоне.

**Android (Chrome)**

1. Меню **⋮** справа сверху → **Установить приложение** / **Добавить на главный экран**
2. Подтвердить → иконка «ПВЗ-Сити» появится на рабочем столе
3. Внутри игры то же доступно в меню (⚙ → **Установить приложение**)

📚 🔗 https://support.google.com/chrome/answer/9658361

**iPhone / iPad (Safari)**

1. Кнопка **Поделиться** (квадрат со стрелкой) внизу
2. **На экран «Домой»** → **Добавить**

📚 🔗 https://support.apple.com/ru-ru/guide/iphone/iph42ab2f3a7/ios

**Компьютер (Chrome / Edge)**

Иконка установки в правой части адресной строки (монитор со стрелкой) → **Установить**.

После первого запуска игра работает **без интернета**: оболочка лежит в кеше service worker,
прогресс — в памяти устройства. В меню игры видно состояние: *установлено · в сети · офлайн-кеш готов*.

---

## Обновления

```bash
# правите src/*, затем
node build.mjs        # пересобрать index.html + game.html
node test/smoke.mjs   # быстрая проверка
git add -A && git commit -m "что изменилось"
git push              # CI сам пересоберёт и опубликует сайт
```

Если меняли `sw.js` или хотите, чтобы у всех обновился кеш, — поднимите версию внутри файла:
`const VERSION = 'pvz-v3'` → `'pvz-v4'`.

---

## Если что-то не так

| Симптом | Причина | Что делать |
|---|---|---|
| `Permission denied (publickey)` | ключ не добавлен или без write-доступа | повторить шаг 2, включить **Allow write access** |
| `Repository not found` | другое имя/логин в `origin` | `git remote -v`, затем `git remote set-url origin git@github.com:<логин>/pvz-city.git` |
| В Actions красный крест на `build` | упал `node build.mjs` | открыть лог задачи, проверить `src/*`; локально `node build.mjs` |
| Сайт отдаёт 404 | Pages не переключён на Actions | шаг 4: **Source: GitHub Actions** |
| Сайт открылся, но старая версия | кеш service worker | поднять `VERSION` в `sw.js`, обновить страницу |
| Установка не предлагается | нет https / не выполнен критерий installability | сайт должен быть на `https://…github.io`; проверить `node test/pwa.mjs` |
| «Deploy PWA» не появился в Actions | workflow не попал в репозиторий | `git ls-files .github` — должен быть `.github/workflows/deploy.yml` |

---

## Что где лежит

| Файл | Зачем |
|---|---|
| `index.html`, `game.html` | готовый автономный билд (его и открывает Pages) |
| `src/*` | исходники: движок, интерфейс, иконки, стили |
| `build.mjs` | сборка билда из `src/` |
| `manifest.webmanifest`, `sw.js`, `icon-*.png` | установка и офлайн |
| `.github/workflows/deploy.yml` | автопубликация на GitHub Pages |
| `deploy-key/` | ключ деплоя (**в git не попадает**) |
| `GITHUB.md` | эта инструкция |
