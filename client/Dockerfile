FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY public ./public
COPY .next/standalone/Documents/Projectburithaiteam/manegementburithaiteam/Managment_BuriThaiTeam/client ./
COPY .next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
