FROM golang:1.23.4-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . ./

RUN CGO_ENABLED=0 GOOS=linux go build -o server

## Minimal runtime image
#FROM alpine:latest
#WORKDIR /app
#COPY --from=builder /app/server .
#
## Optional:
## To bind to a TCP port, runtime parameters must be supplied to the docker command.
## But we can document in the Dockerfile what ports
## the application is going to listen on by default.
## https://docs.docker.com/reference/dockerfile/#expose
EXPOSE 8080

CMD ["./server"]
