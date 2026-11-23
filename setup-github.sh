#!/usr/bin/env bash
# Подключение проекта к GitHub и первый push.
# Использование:  ./setup-github.sh <логин> [имя-репозитория] [ветка]
# Пример:         ./setup-github.sh ivan-petrov pvz-city main
set -euo pipefail

LOGIN="${1:-}"
REPO="${2:-pvz-city}"
BRANCH="${3:-main}"
KEY="deploy-key/pvz_city"

if [ -z "$LOGIN" ]; then
  echo "Укажите логин GitHub:  ./setup-github.sh <логин> [репозиторий]"
  exit 1
fi

if [ ! -f "$KEY" ]; then
  echo "✗ Нет ключа $KEY — сгенерируйте: ssh-keygen -t ed25519 -f $KEY -N ''"
  exit 1
fi

URL="git@github.com:${LOGIN}/${REPO}.git"
echo "→ Репозиторий: $URL"
echo "→ Проверяю ключ…"
if ! GIT_SSH_COMMAND="ssh -i $KEY -o StrictHostKeyChecking=accept-new" ssh -i "$KEY" -o StrictHostKeyChecking=accept-new -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
  echo "✗ GitHub не принял ключ."
  echo "  Добавьте публичный ключ как Deploy key с правом записи:"
  echo "  https://github.com/${LOGIN}/${REPO}/settings/keys"
  echo
  echo "  Публичный ключ:"
  echo "  $(cat "$KEY.pub")"
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$URL"
else
  git remote add origin "$URL"
fi

echo "→ Пушу ветку ${BRANCH}…"
GIT_SSH_COMMAND="ssh -i $KEY -o StrictHostKeyChecking=accept-new" git push -u origin "$BRANCH"

echo
echo "✓ Готово. Дальше:"
echo "  1) включите Pages:  https://github.com/${LOGIN}/${REPO}/settings/pages  (Source: GitHub Actions)"
echo "  2) смотрите сборку: https://github.com/${LOGIN}/${REPO}/actions"
echo "  3) сайт будет здесь: https://${LOGIN}.github.io/${REPO}/"
