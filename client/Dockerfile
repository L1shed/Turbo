# syntax=docker/dockerfile:1

FROM golang:1.23.4

# Set destination for COPY
WORKDIR /app

# Download Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code. Note the slash at the end, as explained in
# https://docs.docker.com/reference/dockerfile/#copy
COPY *.go ./
COPY assets ./assets

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o /client

# Run
CMD ["/client"]