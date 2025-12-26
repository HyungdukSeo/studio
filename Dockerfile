# 1. 의존성 설치 (Install dependencies)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# 2. 빌드 (Build)
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 경고 해결: ENV key=value 형식 사용
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# 3. 프로덕션 이미지 (Production image)
FROM node:20-alpine AS runner
WORKDIR /app

# 보안 및 권한 설정을 위해 유저 추가
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Standalone 모드에서 생성된 파일을 복사합니다.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# [중요] 데이터 저장용 빈 파일 생성 및 권한 부여
# 빌드 타임에 미리 만들어두어야 나중에 볼륨 마운트 시 권한 충돌이 적습니다.
RUN touch data.json && chown nextjs:nodejs data.json

USER nextjs

EXPOSE 3000
ENV PORT=3000

# 서버를 실행합니다.
CMD ["node", "server.js"]