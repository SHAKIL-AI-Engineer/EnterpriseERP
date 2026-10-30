.PHONY: swagger build run

swagger:
	swag init -g cmd/api/main.go -o internal/docs --parseDependency --parseInternal

build: swagger
	go build -o bin/importexport-api ./cmd/api
	go build -o bin/importexport-worker ./cmd/worker

run:
	./bin/importexport-api
