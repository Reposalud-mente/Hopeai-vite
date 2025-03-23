package config

import (
	"os"
	"strconv"
)

// Config estructura con la configuración de la aplicación
type Config struct {
	// Configuración del servidor
	Server struct {
		Port         string
		ReadTimeout  int
		WriteTimeout int
	}

	// Configuración de la base de datos
	Database struct {
		Host     string
		Port     string
		Username string
		Password string
		DBName   string
		SSLMode  string
	}

	// Configuración de Redis para cache
	Redis struct {
		Host     string
		Port     string
		Password string
		DB       int
	}

	// Configuración de IA
	AI struct {
		DeepSeekAPIKey string
		DeepSeekModel  string
		Timeout        int
	}
}

// LoadConfig carga la configuración desde variables de entorno
func LoadConfig() *Config {
	config := &Config{}

	// Configuración del servidor
	config.Server.Port = getEnv("PORT", "8080")
	config.Server.ReadTimeout = getEnvAsInt("READ_TIMEOUT", 10)
	config.Server.WriteTimeout = getEnvAsInt("WRITE_TIMEOUT", 10)

	// Configuración de la base de datos
	config.Database.Host = getEnv("DB_HOST", "localhost")
	config.Database.Port = getEnv("DB_PORT", "5432")
	config.Database.Username = getEnv("DB_USER", "postgres")
	config.Database.Password = getEnv("DB_PASSWORD", "password")
	config.Database.DBName = getEnv("DB_NAME", "hopeai")
	config.Database.SSLMode = getEnv("DB_SSL_MODE", "disable")

	// Configuración de Redis
	config.Redis.Host = getEnv("REDIS_HOST", "localhost")
	config.Redis.Port = getEnv("REDIS_PORT", "6379")
	config.Redis.Password = getEnv("REDIS_PASSWORD", "")
	config.Redis.DB = getEnvAsInt("REDIS_DB", 0)

	// Configuración de IA
	config.AI.DeepSeekAPIKey = getEnv("DEEPSEEK_API_KEY", "")
	config.AI.DeepSeekModel = getEnv("DEEPSEEK_MODEL", "deepseek-chat")
	config.AI.Timeout = getEnvAsInt("AI_TIMEOUT", 60)

	return config
}

// getEnv obtiene una variable de entorno o un valor por defecto
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// getEnvAsInt obtiene una variable de entorno como entero o un valor por defecto
func getEnvAsInt(key string, defaultValue int) int {
	if valueStr, exists := os.LookupEnv(key); exists {
		if value, err := strconv.Atoi(valueStr); err == nil {
			return value
		}
	}
	return defaultValue
} 