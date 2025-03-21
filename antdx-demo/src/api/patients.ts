/**
 * API para gestión de pacientes
 * 
 * Este módulo proporciona funciones para interactuar con los datos de pacientes
 * almacenados en la base de datos PostgreSQL.
 */

import axios from 'axios';
import { Patient, TestResult } from '../types/clinical-types';

// URL base para la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Cliente axios configurado
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Obtiene la lista de todos los pacientes
 * @returns {Promise<Array>} - Lista de pacientes
 */
export async function getPatients(): Promise<Patient[]> {
  try {
    const response = await apiClient.get('/patients');
    return response.data;
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    throw new Error('No se pudieron obtener los datos de los pacientes');
  }
}

/**
 * Obtiene los datos de un paciente específico
 * @param {number} id - ID del paciente
 * @returns {Promise<Object>} - Datos del paciente
 */
export async function getPatientById(id: number): Promise<Patient> {
  try {
    const response = await apiClient.get(`/patients/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener paciente ${id}:`, error);
    throw new Error(`No se pudo obtener la información del paciente ${id}`);
  }
}

/**
 * Actualiza los datos de un paciente
 * @param {number} id - ID del paciente
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} - Paciente actualizado
 */
export async function updatePatient(id: number, data: Partial<Patient>): Promise<Patient> {
  try {
    const response = await apiClient.put(`/patients/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar paciente ${id}:`, error);
    throw new Error('No se pudieron actualizar los datos del paciente');
  }
}

/**
 * Actualiza el borrador de evaluación de un paciente
 * @param {number} id - ID del paciente
 * @param {string} draft - Texto del borrador
 * @returns {Promise<Object>} - Paciente actualizado
 */
export async function updateEvaluationDraft(id: number, draft: string): Promise<Patient> {
  try {
    const response = await apiClient.put(`/patients/${id}/evaluation-draft`, { draft });
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar borrador ${id}:`, error);
    throw new Error('No se pudo guardar el borrador de evaluación');
  }
}

/**
 * Agrega un nuevo resultado de prueba psicológica
 * @param {number} patientId - ID del paciente
 * @param {Object} testResult - Resultado de la prueba
 * @returns {Promise<Object>} - Resultado de prueba creado
 */
export async function addTestResult(patientId: number, testResult: TestResult): Promise<TestResult> {
  try {
    const response = await apiClient.post(`/patients/${patientId}/test-results`, testResult);
    return response.data;
  } catch (error) {
    console.error('Error al agregar resultado de prueba:', error);
    throw new Error('No se pudo guardar el resultado de la prueba');
  }
} 