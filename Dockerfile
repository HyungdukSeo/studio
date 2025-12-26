# 1. 의존성 설치 (Install dependencies)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

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

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# [핵심] 데이터 전용 폴더 생성 및 권한 부여
# 이 /app/data 폴더를 시놀로지의 실제 폴더와 연결할 것입니다.
RUN mkdir -p /app/data && chmod 777 /app/data
RUN mkdir -p /app/.next/cache && chmod 777 /app/.next/cache

# root 권한으로 실행 (시놀로지 권한 충돌 방지)
# USER nextjs 

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]