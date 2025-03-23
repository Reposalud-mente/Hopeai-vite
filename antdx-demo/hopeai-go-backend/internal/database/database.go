package database

import (
	"fmt"
	"log"
	"time"

	"github.com/hopeai/go-backend/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Database representa la conexión a la base de datos
type Database struct {
	DB *gorm.DB
}

// NewDatabase crea una nueva instancia de la base de datos
func NewDatabase(cfg *config.Config) (*Database, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Username,
		cfg.Database.Password,
		cfg.Database.DBName,
		cfg.Database.SSLMode,
	)

	// Configurar el logger de GORM
	gormLogger := logger.New(
		log.New(log.Writer(), "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	// Abrir la conexión a la base de datos
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return nil, fmt.Errorf("error al conectar a la base de datos: %w", err)
	}

	// Configurar la conexión
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("error al obtener la conexión SQL: %w", err)
	}

	// Configurar el pool de conexiones
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Conexión a la base de datos establecida")

	return &Database{
		DB: db,
	}, nil
}

// Migrate ejecuta las migraciones de la base de datos
func (d *Database) Migrate(models ...interface{}) error {
	log.Println("Ejecutando migraciones de la base de datos...")
	err := d.DB.AutoMigrate(models...)
	if err != nil {
		return fmt.Errorf("error en la migración de la base de datos: %w", err)
	}
	log.Println("Migraciones completadas")
	return nil
}

// Close cierra la conexión a la base de datos
func (d *Database) Close() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return fmt.Errorf("error al obtener la conexión SQL: %w", err)
	}
	err = sqlDB.Close()
	if err != nil {
		return fmt.Errorf("error al cerrar la conexión a la base de datos: %w", err)
	}
	log.Println("Conexión a la base de datos cerrada")
	return nil
} 