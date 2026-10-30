FROM golang:1.25-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN if [ ! -f internal/docs/docs.go ]; then \
        go install github.com/swaggo/swag/cmd/swag@latest && \
        swag init -g cmd/api/main.go --output internal/docs --parseDependency --parseInternal --parseDepth 2; \
    fi
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/importexport ./cmd/api

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /out/importexport /app/importexport
COPY appsettings.json /app/appsettings.json
EXPOSE 8060
ENTRYPOINT ["/app/importexport"]
