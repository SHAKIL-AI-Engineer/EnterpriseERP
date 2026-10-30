FROM golang:1.25-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# internal/docs is committed; if it is missing, regenerate the swagger spec.
RUN if [ ! -f internal/docs/docs.go ]; then \
        go install github.com/swaggo/swag/cmd/swag@latest && \
        swag init -g cmd/server/main.go --output internal/docs --parseDependency --parseInternal --parseDepth 2; \
    fi
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/punchdata ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /out/punchdata /app/punchdata
COPY appsettings.json /app/appsettings.json
EXPOSE 5050
ENTRYPOINT ["/app/punchdata"]
