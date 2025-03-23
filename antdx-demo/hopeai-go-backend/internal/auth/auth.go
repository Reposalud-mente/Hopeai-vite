package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gofiber/fiber/v2"
)

// Errores de autenticación
var (
	ErrInvalidToken = errors.New("token inválido")
	ErrExpiredToken = errors.New("token expirado")
)

// Claims representa los claims de un token JWT
type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// Config contiene la configuración del servicio de autenticación
type Config struct {
	SecretKey     string
	TokenDuration time.Duration
}

// Auth proporciona funcionalidad para manejar la autenticación
type Auth struct {
	config Config
}

// NewAuth crea una nueva instancia del servicio de autenticación
func NewAuth(config Config) *Auth {
	return &Auth{
		config: config,
	}
}

// GenerateToken genera un nuevo token JWT para un usuario
func (a *Auth) GenerateToken(userID, role string) (string, error) {
	now := time.Now()
	expirationTime := now.Add(a.config.TokenDuration)

	claims := &Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "hopeai-backend",
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(a.config.SecretKey))
	if err != nil {
		return "", fmt.Errorf("error al firmar el token: %w", err)
	}

	return tokenString, nil
}

// ValidateToken valida un token JWT y devuelve sus claims
func (a *Auth) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de firma inesperado: %v", token.Header["alg"])
		}
		return []byte(a.config.SecretKey), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, ErrInvalidToken
}

// Middleware para verificar la autenticación en Fiber
func (a *Auth) AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Obtener el token del header de autorización
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Se requiere autorización",
			})
		}

		// Verificar el formato del token (Bearer <token>)
		if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Formato de autorización inválido",
			})
		}

		tokenString := authHeader[7:]

		// Validar el token
		claims, err := a.ValidateToken(tokenString)
		if err != nil {
			var statusCode int
			var message string

			switch {
			case errors.Is(err, ErrExpiredToken):
				statusCode = fiber.StatusUnauthorized
				message = "Token expirado"
			case errors.Is(err, ErrInvalidToken):
				statusCode = fiber.StatusUnauthorized
				message = "Token inválido"
			default:
				statusCode = fiber.StatusInternalServerError
				message = "Error de autenticación"
			}

			return c.Status(statusCode).JSON(fiber.Map{
				"error": message,
			})
		}

		// Almacenar los claims en el contexto para uso posterior
		c.Locals("user", claims)
		return c.Next()
	}
} 