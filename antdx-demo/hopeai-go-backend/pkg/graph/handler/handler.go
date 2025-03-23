package handler

import (
	"net/http"

	"github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/adaptor"
)

// GraphQLHandler crea un manejador de Fiber para procesar solicitudes GraphQL
func GraphQLHandler(executableSchema graphql.ExecutableSchema) fiber.Handler {
	// Crear el servidor GraphQL estándar
	h := handler.NewDefaultServer(executableSchema)

	// Usar el adaptador de Fiber para HTTP handlers
	httpHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.ServeHTTP(w, r)
	})

	return adaptor.HTTPHandler(httpHandler)
}

// PlaygroundHandler crea un manejador de Fiber para el playground GraphQL
func PlaygroundHandler(endpoint string) fiber.Handler {
	playgroundHandler := playground.Handler("GraphQL Playground", endpoint)

	// Usar el adaptador de Fiber para HTTP handlers
	return adaptor.HTTPHandler(playgroundHandler)
}

// fiberResponseWriter adapta Fiber para ser compatible con la interfaz http.ResponseWriter
type fiberResponseWriter struct {
	c          *fiber.Ctx
	headers    http.Header
	statusCode int
}

func (w *fiberResponseWriter) Header() http.Header {
	if w.headers == nil {
		w.headers = make(http.Header)
	}
	return w.headers
}

func (w *fiberResponseWriter) Write(data []byte) (int, error) {
	w.c.Write(data)
	return len(data), nil
}

func (w *fiberResponseWriter) WriteHeader(statusCode int) {
	w.statusCode = statusCode
	w.c.Status(statusCode)
}
