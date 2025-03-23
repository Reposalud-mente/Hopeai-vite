package utils

import (
	"encoding/json"
	"fmt"
	"time"
)

// FormatTime formatea un tiempo en formato ISO8601
func FormatTime(t time.Time) string {
	return t.Format(time.RFC3339)
}

// ParseTime parsea una cadena ISO8601 a time.Time
func ParseTime(s string) (time.Time, error) {
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		return time.Time{}, fmt.Errorf("error al parsear tiempo: %w", err)
	}
	return t, nil
}

// JsonPretty devuelve una representación JSON con formato legible para humanos
func JsonPretty(v interface{}) string {
	bytes, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return fmt.Sprintf("Error en marshaling: %v", err)
	}
	return string(bytes)
}

// Contains verifica si un slice contiene un valor específico
func Contains[T comparable](slice []T, item T) bool {
	for _, v := range slice {
		if v == item {
			return true
		}
	}
	return false
}

// Map aplica una función a cada elemento de un slice y devuelve un nuevo slice
func Map[T, U any](slice []T, f func(T) U) []U {
	result := make([]U, len(slice))
	for i, v := range slice {
		result[i] = f(v)
	}
	return result
}

// Filter filtra un slice según una función de predicado
func Filter[T any](slice []T, predicate func(T) bool) []T {
	var result []T
	for _, v := range slice {
		if predicate(v) {
			result = append(result, v)
		}
	}
	return result
}

// Retry intenta ejecutar una función hasta que tenga éxito o se alcance el número máximo de intentos
func Retry(attempts int, sleep time.Duration, f func() error) error {
	var err error
	for i := 0; i < attempts; i++ {
		err = f()
		if err == nil {
			return nil
		}
		
		if i < attempts-1 {
			time.Sleep(sleep)
			sleep *= 2 // Backoff exponencial
		}
	}
	return fmt.Errorf("después de %d intentos, último error: %w", attempts, err)
} 