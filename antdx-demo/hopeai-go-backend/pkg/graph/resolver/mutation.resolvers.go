package resolver

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/hopeai/go-backend/pkg/graph/model"
)

// CreatePatient crea un nuevo paciente
func (r *Resolver) CreatePatient(ctx context.Context, input model.PatientInput) (*model.Patient, error) {
	// Generar un nuevo ID para el paciente
	id := uuid.New().String()

	// Crear el timestamp actual
	now := model.CurrentTimestamp()

	// Crear un nuevo paciente con los datos proporcionados
	patient := &model.Patient{
		ID:              id,
		Name:            input.Name,
		Age:             input.Age,
		Status:          input.Status,
		EvaluationDate:  input.EvaluationDate,
		Psychologist:    input.Psychologist,
		ConsultReason:   input.ConsultReason,
		EvaluationDraft: input.EvaluationDraft,
		TestResults:     []*model.TestResult{},
		ClinicalQueries: []*model.ClinicalQuery{},
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	// En producción, aquí guardaríamos el paciente en la base de datos
	r.patients = append(r.patients, patient)

	fmt.Printf("Paciente creado: %s (%s)\n", patient.Name, patient.ID)

	return patient, nil
}

// UpdatePatient actualiza un paciente existente
func (r *Resolver) UpdatePatient(ctx context.Context, id string, input model.PatientInput) (*model.Patient, error) {
	for i, p := range r.patients {
		if p.ID == id {
			// Actualizar campos del paciente
			r.patients[i].Name = input.Name
			r.patients[i].Age = input.Age
			r.patients[i].Status = input.Status
			r.patients[i].EvaluationDate = input.EvaluationDate
			r.patients[i].Psychologist = input.Psychologist
			r.patients[i].ConsultReason = input.ConsultReason
			r.patients[i].EvaluationDraft = input.EvaluationDraft
			r.patients[i].UpdatedAt = model.CurrentTimestamp()

			fmt.Printf("Paciente actualizado: %s (%s)\n", r.patients[i].Name, r.patients[i].ID)

			return r.patients[i], nil
		}
	}

	return nil, errors.New("paciente no encontrado")
}

// DeletePatient elimina un paciente por su ID
func (r *Resolver) DeletePatient(ctx context.Context, id string) (bool, error) {
	for i, p := range r.patients {
		if p.ID == id {
			// Eliminar paciente de la lista
			r.patients = append(r.patients[:i], r.patients[i+1:]...)

			fmt.Printf("Paciente eliminado: %s\n", id)

			return true, nil
		}
	}

	return false, errors.New("paciente no encontrado")
}

// UpdateEvaluationDraft actualiza el borrador de evaluación de un paciente
func (r *Resolver) UpdateEvaluationDraft(ctx context.Context, id string, draft string) (*model.Patient, error) {
	for i, p := range r.patients {
		if p.ID == id {
			// Actualizar el borrador de evaluación
			r.patients[i].EvaluationDraft = &draft
			r.patients[i].UpdatedAt = model.CurrentTimestamp()

			fmt.Printf("Borrador de evaluación actualizado para paciente: %s\n", id)

			return r.patients[i], nil
		}
	}

	return nil, errors.New("paciente no encontrado")
}

// CreateClinicalQuery crea una nueva consulta clínica
func (r *Resolver) CreateClinicalQuery(ctx context.Context, input model.ClinicalQueryInput) (*model.ClinicalQuery, error) {
	// Verificar que el paciente existe
	var patient *model.Patient
	for _, p := range r.patients {
		if p.ID == input.PatientID {
			patient = p
			break
		}
	}

	if patient == nil {
		return nil, errors.New("paciente no encontrado")
	}

	// Generar un nuevo ID para la consulta
	id := uuid.New().String()

	// Crear el timestamp actual
	now := model.CurrentTimestamp()

	// Crear una nueva consulta clínica
	query := &model.ClinicalQuery{
		ID:         id,
		PatientID:  input.PatientID,
		Patient:    patient,
		Question:   input.Question,
		Answer:     nil,
		IsFavorite: false,
		Status:     model.ClinicalQueryStatusPending,
		Feedback:   nil,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	// Agregar la consulta a la lista
	r.clinicalQueries = append(r.clinicalQueries, query)

	// Agregar la consulta al paciente
	for i, p := range r.patients {
		if p.ID == input.PatientID {
			r.patients[i].ClinicalQueries = append(r.patients[i].ClinicalQueries, query)
			break
		}
	}

	fmt.Printf("Consulta clínica creada: %s (Paciente: %s)\n", id, input.PatientID)

	return query, nil
}

// ProcessClinicalQuery procesa una consulta clínica existente
func (r *Resolver) ProcessClinicalQuery(ctx context.Context, id string) (*model.ClinicalQuery, error) {
	for i, q := range r.clinicalQueries {
		if q.ID == id {
			// Actualizar el estado de la consulta a "PROCESSING"
			r.clinicalQueries[i].Status = model.ClinicalQueryStatusProcessing
			r.clinicalQueries[i].UpdatedAt = model.CurrentTimestamp()

			// En una implementación real, aquí se enviaría la consulta a un procesamiento asíncrono
			// Por ahora, simulamos un procesamiento inmediato
			answer := "Esta es una respuesta simulada para la consulta: " + q.Question
			r.clinicalQueries[i].Answer = &answer
			r.clinicalQueries[i].Status = model.ClinicalQueryStatusCompleted

			fmt.Printf("Consulta clínica procesada: %s\n", id)

			// Actualizar también la referencia en el paciente
			for j, p := range r.patients {
				if p.ID == q.PatientID {
					for k, pq := range p.ClinicalQueries {
						if pq.ID == id {
							r.patients[j].ClinicalQueries[k] = r.clinicalQueries[i]
							break
						}
					}
					break
				}
			}

			return r.clinicalQueries[i], nil
		}
	}

	return nil, errors.New("consulta clínica no encontrada")
}

// ToggleFavoriteClinicalQuery marca/desmarca una consulta clínica como favorita
func (r *Resolver) ToggleFavoriteClinicalQuery(ctx context.Context, id string) (*model.ClinicalQuery, error) {
	for i, q := range r.clinicalQueries {
		if q.ID == id {
			// Cambiar el estado de favorito
			r.clinicalQueries[i].IsFavorite = !r.clinicalQueries[i].IsFavorite
			r.clinicalQueries[i].UpdatedAt = model.CurrentTimestamp()

			fmt.Printf("Consulta clínica %s como favorita: %v\n", id, r.clinicalQueries[i].IsFavorite)

			// Actualizar también la referencia en el paciente
			for j, p := range r.patients {
				if p.ID == q.PatientID {
					for k, pq := range p.ClinicalQueries {
						if pq.ID == id {
							r.patients[j].ClinicalQueries[k] = r.clinicalQueries[i]
							break
						}
					}
					break
				}
			}

			return r.clinicalQueries[i], nil
		}
	}

	return nil, errors.New("consulta clínica no encontrada")
}

// ProvideFeedback proporciona feedback a una consulta clínica
func (r *Resolver) ProvideFeedback(ctx context.Context, id string, feedback string) (*model.ClinicalQuery, error) {
	for i, q := range r.clinicalQueries {
		if q.ID == id {
			// Agregar feedback
			r.clinicalQueries[i].Feedback = &feedback
			r.clinicalQueries[i].UpdatedAt = model.CurrentTimestamp()

			fmt.Printf("Feedback proporcionado para consulta clínica: %s\n", id)

			// Actualizar también la referencia en el paciente
			for j, p := range r.patients {
				if p.ID == q.PatientID {
					for k, pq := range p.ClinicalQueries {
						if pq.ID == id {
							r.patients[j].ClinicalQueries[k] = r.clinicalQueries[i]
							break
						}
					}
					break
				}
			}

			return r.clinicalQueries[i], nil
		}
	}

	return nil, errors.New("consulta clínica no encontrada")
}

// DeleteClinicalQuery elimina una consulta clínica
func (r *Resolver) DeleteClinicalQuery(ctx context.Context, id string) (bool, error) {
	for i, q := range r.clinicalQueries {
		if q.ID == id {
			// Eliminar la consulta de la lista principal
			r.clinicalQueries = append(r.clinicalQueries[:i], r.clinicalQueries[i+1:]...)

			// Eliminar la consulta también del paciente asociado
			for j, p := range r.patients {
				if p.ID == q.PatientID {
					for k, pq := range p.ClinicalQueries {
						if pq.ID == id {
							r.patients[j].ClinicalQueries = append(
								r.patients[j].ClinicalQueries[:k],
								r.patients[j].ClinicalQueries[k+1:]...,
							)
							break
						}
					}
					break
				}
			}

			fmt.Printf("Consulta clínica eliminada: %s\n", id)

			return true, nil
		}
	}

	return false, errors.New("consulta clínica no encontrada")
}

// AnalyzeClinicalData analiza los datos clínicos proporcionados
func (r *Resolver) AnalyzeClinicalData(ctx context.Context, patientData string) (*model.ClinicalAnalysis, error) {
	// En una implementación real, aquí se llamaría a un servicio de IA/LLM
	// para analizar los datos clínicos del paciente

	// Por ahora, devolvemos un análisis simulado
	return &model.ClinicalAnalysis{
		Symptoms: []string{
			"Insomnio persistente",
			"Ansiedad social",
			"Fatiga crónica",
		},
		DsmAnalysis: []string{
			"Cumple criterios para trastorno de ansiedad generalizada",
			"Posibles síntomas de depresión",
		},
		PossibleDiagnoses: []string{
			"Trastorno de ansiedad generalizada (F41.1)",
			"Episodio depresivo moderado (F32.1)",
		},
		TreatmentSuggestions: []string{
			"Terapia cognitivo-conductual",
			"Evaluación para posible tratamiento farmacológico",
			"Técnicas de manejo del estrés",
		},
		CurrentThinking: "El paciente presenta un cuadro compatible con ansiedad generalizada con componentes depresivos. Se recomienda evaluación más profunda del componente depresivo.",
	}, nil
}

// AnswerClinicalQuestion responde una pregunta específica sobre un análisis clínico
func (r *Resolver) AnswerClinicalQuestion(ctx context.Context, analysisState model.ClinicalAnalysisInput, question string) (string, error) {
	// En una implementación real, aquí se utilizaría un modelo de IA para generar
	// una respuesta a la pregunta basada en el estado actual del análisis

	// Por ahora, devolvemos una respuesta simulada
	response := fmt.Sprintf(
		"Basado en el análisis actual que muestra %d síntomas y %d posibles diagnósticos, la respuesta a '%s' es: Este es un ejemplo de respuesta que sería generada por un modelo de IA, considerando la información clínica disponible y aplicando conocimientos de psicología clínica.",
		len(analysisState.Symptoms),
		len(analysisState.PossibleDiagnoses),
		question,
	)

	return response, nil
}

// AddTestResult añade un resultado de prueba a un paciente
func (r *Resolver) AddTestResult(ctx context.Context, patientID string, input model.TestResultInput) (*model.TestResult, error) {
	// Buscar el paciente
	var patientIndex = -1
	for i, p := range r.patients {
		if p.ID == patientID {
			patientIndex = i
			break
		}
	}

	if patientIndex == -1 {
		return nil, errors.New("paciente no encontrado")
	}

	// Generar un nuevo ID para el resultado
	id := uuid.New().String()

	// Crear el timestamp actual
	now := model.CurrentTimestamp()

	// Crear un nuevo resultado de prueba
	testResult := &model.TestResult{
		ID:             id,
		Name:           input.Name,
		Score:          input.Score,
		Interpretation: input.Interpretation,
		PatientID:      patientID,
		Patient:        r.patients[patientIndex],
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	// Agregar el resultado al paciente
	r.patients[patientIndex].TestResults = append(r.patients[patientIndex].TestResults, testResult)

	fmt.Printf("Resultado de prueba añadido: %s (Paciente: %s)\n", id, patientID)

	return testResult, nil
}

// UpdateTestResult actualiza un resultado de prueba existente
func (r *Resolver) UpdateTestResult(ctx context.Context, id string, input model.TestResultInput) (*model.TestResult, error) {
	// Buscar el resultado de prueba
	for i, p := range r.patients {
		for j, tr := range p.TestResults {
			if tr.ID == id {
				// Actualizar los campos del resultado
				r.patients[i].TestResults[j].Name = input.Name
				r.patients[i].TestResults[j].Score = input.Score
				r.patients[i].TestResults[j].Interpretation = input.Interpretation
				r.patients[i].TestResults[j].UpdatedAt = model.CurrentTimestamp()

				fmt.Printf("Resultado de prueba actualizado: %s\n", id)

				return r.patients[i].TestResults[j], nil
			}
		}
	}

	return nil, errors.New("resultado de prueba no encontrado")
}

// DeleteTestResult elimina un resultado de prueba
func (r *Resolver) DeleteTestResult(ctx context.Context, id string) (bool, error) {
	// Buscar el resultado de prueba
	for i, p := range r.patients {
		for j, tr := range p.TestResults {
			if tr.ID == id {
				// Eliminar el resultado de la lista
				r.patients[i].TestResults = append(
					r.patients[i].TestResults[:j],
					r.patients[i].TestResults[j+1:]...,
				)

				fmt.Printf("Resultado de prueba eliminado: %s\n", id)

				return true, nil
			}
		}
	}

	return false, errors.New("resultado de prueba no encontrado")
}
