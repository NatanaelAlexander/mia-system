FROM node:22.22-alpine3.22

WORKDIR /app
RUN npm install -g pnpm@9
RUN apk add --no-cache libc6-compat

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install

COPY . .

RUN apk add --no-cache su-exec
COPY docker-entrypoint.dev.sh /usr/local/bin/docker-entrypoint.dev.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.dev.sh
USER node

EXPOSE 3000

CMD ["pnpm", "exec", "next", "dev", "--webpack", "--hostname", "0.0.0.0", "--port", "3000"]
