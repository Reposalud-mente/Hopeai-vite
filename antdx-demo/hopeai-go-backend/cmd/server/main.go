package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	
	// Importaciones para GraphQL
	"github.com/hopeai/go-backend/pkg/graph/handler"
	"github.com/hopeai/go-backend/pkg/graph/resolver"
)

func main() {
	// Crear una nueva instancia de Fiber
	app := fiber.New(fiber.Config{
		AppName: "HopeAI Backend",
		// Habilitamos el modo estricto de rutas para mayor consistencia
		StrictRouting: true,
		// Definimos un manejador personalizado para errores
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			// En caso de error devolvemos un JSON con el mensaje de error
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Agregamos middleware para recuperación de pánico
	app.Use(recover.New())
	
	// Configuramos el CORS para permitir peticiones del frontend
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:3000, http://localhost:5173",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))
	
	// Configuramos el logger para registrar todas las peticiones
	app.Use(logger.New())

	// Ruta básica para verificar que el servidor está funcionando
	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":   "ok",
			"database": "connected", // En un futuro, esto vendría de una verificación real
			"timestamp": c.Context().Time().String(),
		})
	})
	
	// Configurar GraphQL
	// Crear el resolver para GraphQL
	resolvers := resolver.NewResolver()
	
	// Configurar el endpoint GraphQL
	app.Post("/graphql", handler.GraphQLHandler(resolver.NewExecutableSchema(resolver.Config{Resolvers: resolvers})))
	
	// Configurar el playground GraphQL (útil para desarrollo)
	app.Get("/playground", handler.PlaygroundHandler("/graphql"))

	// Definir el puerto donde escuchará el servidor
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Puerto por defecto
	}

	// Iniciar el servidor
	log.Printf("Servidor iniciado en el puerto %s", port)
	log.Printf("GraphQL Playground disponible en http://localhost:%s/playground", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Error al iniciar el servidor: %v", err)
	}
} 