FROM node:20-alpine AS base
WORKDIR /app

# Install only production deps in a separate layer for caching
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy source
COPY src ./src

# Create writable uploads dir
RUN mkdir -p /app/uploads

# Drop root
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 5000

# Simple healthcheck (curl is not in alpine by default; use node fetch)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||5000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
