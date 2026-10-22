Place the generated local-only TLS certificate files here:
- quiz.crt
- quiz.key

Generate from PowerShell in the project root (Docker Engine must be running):
New-Item -ItemType Directory -Force nginx/certs
docker run --rm -v "${PWD}/nginx/certs:/certs" alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/quiz.key -out /certs/quiz.crt -subj "/CN=localhost"

Never commit quiz.key to GitHub. This self-signed certificate is only for local coursework.
