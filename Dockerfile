# 1. 의존성 설치 (Install dependencies)
FROM node:20-alpine AS deps
WORKDIR /app

# package.json과 lock 파일을 복사합니다.
#COPY package.json ./
# npm 대신 다른 패키지 매니저를 사용한다면 아래 줄을 수정하세요.
# e.g. COPY package.json yarn.lock ./
# e.g. COPY package.json pnpm-lock.yaml ./

# 의존성을 설치합니다.
#RUN npm install

COPY package.json package-lock.json ./
RUN npm ci

# 2. 빌드 (Build)
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js가 telemetry 데이터를 수집하지 않도록 설정합니다.
ENV NEXT_TELEMETRY_DISABLED 1

# 애플리케이션을 빌드합니다.
RUN npm run build

# 3. 프로덕션 이미지 (Production image)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Next.js가 telemetry 데이터를 수집하지 않도록 설정합니다.
ENV NEXT_TELEMETRY_DISABLED 1

# Standalone 모드에서 생성된 파일을 복사합니다.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 기본 포트를 3000으로 설정합니다.
EXPOSE 3000

# 서버를 실행합니다.
CMD ["node", "server.js"]
