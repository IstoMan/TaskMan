FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o /bin/taskmanager-backend ./main.go

FROM alpine:3.22

RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=builder /bin/taskmanager-backend /usr/local/bin/taskmanager-backend

ENV PORT=10000
EXPOSE 10000

CMD ["taskmanager-backend"]
