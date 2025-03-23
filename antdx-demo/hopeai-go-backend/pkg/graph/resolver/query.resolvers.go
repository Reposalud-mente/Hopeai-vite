package resolver

import (
	"context"

	"github.com/hopeai/go-backend/pkg/graph/model"
)

// HealthCheck devuelve el estado del sistema
func (r *Resolver) HealthCheck(ctx context.Context) (*model.HealthStatus, error) {
	return &model.HealthStatus{
		Status:    "ok",
		Database:  "connected", // En producción, esto sería una verificación real
		Timestamp: model.CurrentTimestamp(),
	}, nil
}

// Patient devuelve un paciente por su ID
func (r *Resolver) Patient(ctx context.Context, id string) (*model.Patient, error) {
	// En producción, esto sería una consulta a la base de datos
	for _, p := range r.patients {
		if p.ID == id {
			return p, nil
		}
	}
	return nil, nil // Retornamos nil si no encontramos el paciente
}

// AllPatients devuelve todos los pacientes
func (r *Resolver) AllPatients(ctx context.Context) ([]*model.Patient, error) {
	// En producción, esto sería una consulta a la base de datos
	return r.patients, nil
}

// PatientsByFilter devuelve pacientes filtrados por status y/o psicólogo
func (r *Resolver) PatientsByFilter(ctx context.Context, status *string, psychologist *string) ([]*model.Patient, error) {
	// En producción, esto sería una consulta filtrada a la base de datos
	if status == nil && psychologist == nil {
		return r.patients, nil
	}

	var filteredPatients []*model.Patient
	for _, p := range r.patients {
		matches := true

		if status != nil && p.Status != *status {
			matches = false
		}

		if psychologist != nil && (p.Psychologist == nil || *p.Psychologist != *psychologist) {
			matches = false
		}

		if matches {
			filteredPatients = append(filteredPatients, p)
		}
	}

	return filteredPatients, nil
}

// ClinicalQuery devuelve una consulta clínica por su ID
func (r *Resolver) ClinicalQuery(ctx context.Context, id string) (*model.ClinicalQuery, error) {
	// En producción, esto sería una consulta a la base de datos
	for _, q := range r.clinicalQueries {
		if q.ID == id {
			return q, nil
		}
	}
	return nil, nil
}

// ClinicalQueriesByPatient devuelve todas las consultas clínicas de un paciente
func (r *Resolver) ClinicalQueriesByPatient(ctx context.Context, patientID string) ([]*model.ClinicalQuery, error) {
	var queries []*model.ClinicalQuery
	for _, q := range r.clinicalQueries {
		if q.PatientID == patientID {
			queries = append(queries, q)
		}
	}
	return queries, nil
}

// ClinicalAnalysis realiza un análisis clínico para un paciente específico
func (r *Resolver) ClinicalAnalysis(ctx context.Context, patientID string) (*model.ClinicalAnalysis, error) {
	// Verificar que el paciente existe
	var patient *model.Patient
	for _, p := range r.patients {
		if p.ID == patientID {
			patient = p
			break
		}
	}

	if patient == nil {
		return nil, nil
	}

	// En una implementación real, aquí se utilizaría un servicio de IA/LLM para
	// generar un análisis clínico basado en los datos del paciente

	// Por ahora, devolvemos un análisis simulado
	return &model.ClinicalAnalysis{
		Symptoms: []string{
			"Insomnio persistente",
			"Dificultad para concentrarse",
			"Irritabilidad",
		},
		DsmAnalysis: []string{
			"Cumple 5/9 criterios para trastorno de ansiedad generalizada",
			"Cumple 4/9 criterios para trastorno depresivo",
		},
		PossibleDiagnoses: []string{
			"Trastorno de ansiedad generalizada (F41.1)",
			"Trastorno adaptativo con estado de ánimo depresivo (F43.20)",
		},
		TreatmentSuggestions: []string{
			"Terapia cognitivo-conductual enfocada en manejo de ansiedad",
			"Intervención para regulación emocional",
			"Evaluación para posible intervención farmacológica",
		},
		CurrentThinking: "Basado en la evaluación actual, el patrón sintomático sugiere un trastorno de ansiedad generalizada con componentes depresivos reactivos a estresores identificables. Se recomienda profundizar en la historia personal para identificar factores desencadenantes específicos.",
	}, nil
}

// TestResult devuelve un resultado de prueba por su ID
func (r *Resolver) TestResult(ctx context.Context, id string) (*model.TestResult, error) {
	// Implementación provisional
	for _, p := range r.patients {
		for _, tr := range p.TestResults {
			if tr.ID == id {
				return tr, nil
			}
		}
	}
	return nil, nil
}

// TestResultsByPatient devuelve todos los resultados de pruebas de un paciente
func (r *Resolver) TestResultsByPatient(ctx context.Context, patientID string) ([]*model.TestResult, error) {
	// Implementación provisional
	for _, p := range r.patients {
		if p.ID == patientID {
			return p.TestResults, nil
		}
	}
	return []*model.TestResult{}, nil
}

// AvailableModels devuelve los modelos de IA disponibles (debugging)
func (r *Resolver) AvailableModels(ctx context.Context) ([]string, error) {
	// En producción, esto consultaría los modelos disponibles realmente
	return []string{"deepseek-coder", "deepseek-chat", "local-llama2"}, nil
}
