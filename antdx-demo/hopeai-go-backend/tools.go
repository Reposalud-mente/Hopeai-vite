//go:build tools
// +build tools

package tools

import (
	_ "github.com/99designs/gqlgen"
)

//go:generate go run github.com/99designs/gqlgen generate
