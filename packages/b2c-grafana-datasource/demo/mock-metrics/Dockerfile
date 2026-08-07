FROM golang:1.26-alpine AS builder

WORKDIR /build
COPY go.mod ./
COPY main.go ./

RUN go build -o mock-metrics .

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app
COPY --from=builder /build/mock-metrics .

EXPOSE 8080

CMD ["./mock-metrics"]
