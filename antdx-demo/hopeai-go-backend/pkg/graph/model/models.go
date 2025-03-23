package model

import (
	"time"
)

// HealthStatus representa el estado del sistema
type HealthStatus struct {
	Status    string `json:"status"`
	Database  string `json:"database"`
	Timestamp string `json:"timestamp"`
}

// Patient representa a un paciente en el sistema
type Patient struct {
	ID              string           `json:"id"`
	Name            string           `json:"name"`
	Age             int              `json:"age"`
	Status          string           `json:"status"`
	EvaluationDate  *string          `json:"evaluationDate,omitempty"`
	Psychologist    *string          `json:"psychologist,omitempty"`
	ConsultReason   string           `json:"consultReason"`
	EvaluationDraft *string          `json:"evaluationDraft,omitempty"`
	TestResults     []*TestResult    `json:"testResults,omitempty"`
	ClinicalQueries []*ClinicalQuery `json:"clinicalQueries,omitempty"`
	CreatedAt       string           `json:"createdAt"`
	UpdatedAt       string           `json:"updatedAt"`
}

// TestResult representa el resultado de una prueba psicológica
type TestResult struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	Score          float64  `json:"score"`
	Interpretation string   `json:"interpretation"`
	PatientID      string   `json:"patientId"`
	Patient        *Patient `json:"patient"`
	CreatedAt      string   `json:"createdAt"`
	UpdatedAt      string   `json:"updatedAt"`
}

// ClinicalQueryStatus representa el estado de una consulta clínica
type ClinicalQueryStatus string

// Constantes para los estados de consultas clínicas
const (
	ClinicalQueryStatusPending    ClinicalQueryStatus = "PENDING"
	ClinicalQueryStatusProcessing ClinicalQueryStatus = "PROCESSING"
	ClinicalQueryStatusCompleted  ClinicalQueryStatus = "COMPLETED"
	ClinicalQueryStatusError      ClinicalQueryStatus = "ERROR"
)

// ClinicalQuery representa una consulta clínica realizada por un profesional
type ClinicalQuery struct {
	ID         string              `json:"id"`
	PatientID  string              `json:"patientId"`
	Patient    *Patient            `json:"patient"`
	Question   string              `json:"question"`
	Answer     *string             `json:"answer,omitempty"`
	IsFavorite bool                `json:"isFavorite"`
	Status     ClinicalQueryStatus `json:"status"`
	Feedback   *string             `json:"feedback,omitempty"`
	CreatedAt  string              `json:"createdAt"`
	UpdatedAt  string              `json:"updatedAt"`
}

// ClinicalAnalysis representa el resultado de un análisis clínico
type ClinicalAnalysis struct {
	Symptoms             []string `json:"symptoms"`
	DsmAnalysis          []string `json:"dsmAnalysis"`
	PossibleDiagnoses    []string `json:"possibleDiagnoses"`
	TreatmentSuggestions []string `json:"treatmentSuggestions"`
	CurrentThinking      string   `json:"currentThinking"`
}

// PatientInput representa los datos de entrada para crear o actualizar un paciente
type PatientInput struct {
	Name            string  `json:"name"`
	Age             int     `json:"age"`
	Status          string  `json:"status"`
	EvaluationDate  *string `json:"evaluationDate,omitempty"`
	Psychologist    *string `json:"psychologist,omitempty"`
	ConsultReason   string  `json:"consultReason"`
	EvaluationDraft *string `json:"evaluationDraft,omitempty"`
}

// ClinicalQueryInput representa los datos de entrada para crear una consulta clínica
type ClinicalQueryInput struct {
	PatientID string `json:"patientId"`
	Question  string `json:"question"`
}

// TestResultInput representa los datos de entrada para crear o actualizar un resultado de prueba
type TestResultInput struct {
	Name           string  `json:"name"`
	Score          float64 `json:"score"`
	Interpretation string  `json:"interpretation"`
}

// ClinicalAnalysisInput representa los datos de entrada para el análisis clínico
type ClinicalAnalysisInput struct {
	PatientInfo          string   `json:"patientInfo"`
	Symptoms             []string `json:"symptoms"`
	DsmAnalysis          []string `json:"dsmAnalysis"`
	PossibleDiagnoses    []string `json:"possibleDiagnoses"`
	TreatmentSuggestions []string `json:"treatmentSuggestions"`
	CurrentThinking      string   `json:"currentThinking"`
}

// Función auxiliar para convertir time.Time a string en formato ISO
func FormatTime(t time.Time) string {
	return t.Format(time.RFC3339)
}

// Función auxiliar para generar timestamps actuales
func CurrentTimestamp() string {
	return FormatTime(time.Now())
}
