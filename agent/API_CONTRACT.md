# PulseBridge Agent System - API Contract

## For Frontend Team

This document defines the API contract between the frontend and the agent backend.
The backend is running on `http://localhost:8000` by default.

---

## Base URL

```
http://localhost:8000
```

---

## Endpoints

### 1. Health Check

**Endpoint:** `GET /api/health`

**Purpose:** Check if the system is operational

**Response:**
```json
{
  "status": "healthy",
  "agents_loaded": ["triage", "cardiology", "neurology", "dermatology"],
  "metta_engine_status": "active",
  "contract_connected": true,
  "asi_one_available": true,
  "timestamp": "2025-01-24T10:30:00Z"
}
```

---

### 2. Symptom Analysis (PRIMARY ENDPOINT)

**Endpoint:** `POST /api/analyze-symptoms`

**Purpose:** Analyze patient symptoms and get doctor recommendations

**Request Body:**
```typescript
interface SymptomAnalysisRequest {
  symptoms: string;                    // Required: 10-2000 characters
  patient_age?: number;                // Optional: 0-120
  patient_gender?: "male" | "female" | "other";  // Optional
  medical_history?: string[];          // Optional: ["hypertension", "diabetes"]
}
```

**Example Request:**
```json
{
  "symptoms": "I have been experiencing chest pain and shortness of breath for the past 2 days. The pain is sharp and gets worse when I climb stairs.",
  "patient_age": 45,
  "patient_gender": "male",
  "medical_history": ["hypertension", "diabetes type 2"]
}
```

**Response:**
```typescript
interface SymptomAnalysisResponse {
  // High-level summary
  preliminary_diagnosis: string;
  recommended_specialization: string;
  urgency_level: "low" | "moderate" | "high" | "critical";
  overall_confidence: number;  // 0.0 to 1.0

  // Transparent agent collaboration (show this to users!)
  agent_collaboration: {
    [agentRole: string]: {
      agent_name: string;
      agent_role: string;
      analysis: string;
      confidence_score: number;  // 0.0 to 1.0
      risk_level: "low" | "moderate" | "high" | "critical";
      recommendations: string[];
      metta_reasoning?: {
        matched_rules: number;
        confidence_calculation: string;
        risk_factors_identified: string[];
        urgency_score: number;  // 0.0 to 1.0
        key_findings: string[];
      };
      processing_time_ms: number;
    };
  };

  consensus_reasoning: string;

  // Matched doctors from blockchain
  available_doctors: Doctor[];
  total_doctors_found: number;

  // Metadata
  analysis_timestamp: string;  // ISO 8601
  processing_time_ms: number;
  asi_one_enhanced: boolean;
}

interface Doctor {
  doctor_id: number;
  name: string;
  specialization: string;
  profile_description: string;
  email: string;
  address: string;  // Ethereum address
  consultation_fee_per_hour: number;  // USD
  deposit_fee_stored: number;
  legal_documents_ipfs_hash: string;
}
```

**Example Response:**
```json
{
  "preliminary_diagnosis": "Possible angina with high cardiac risk",
  "recommended_specialization": "Cardiology",
  "urgency_level": "high",
  "overall_confidence": 0.82,
  "agent_collaboration": {
    "triage": {
      "agent_name": "Triage Coordinator",
      "agent_role": "triage",
      "analysis": "Patient symptoms indicate potential cardiac issue...",
      "confidence_score": 0.75,
      "risk_level": "high",
      "recommendations": [
        "Route to cardiology specialist",
        "Assess urgency level"
      ],
      "processing_time_ms": 120
    },
    "cardiology": {
      "agent_name": "Cardiology Specialist",
      "agent_role": "cardiology",
      "analysis": "Patient presents with chest pain, hypertension, and diabetes...",
      "confidence_score": 0.85,
      "risk_level": "high",
      "recommendations": [
        "Urgent consultation within 24 hours",
        "EKG recommended",
        "Stress test advised"
      ],
      "metta_reasoning": {
        "matched_rules": 5,
        "confidence_calculation": "Base 0.5 + symptom match 0.2 + risk factors 0.15",
        "risk_factors_identified": ["hypertension", "diabetes", "age>40"],
        "urgency_score": 0.85,
        "key_findings": [
          "Multiple cardiac risk factors",
          "Chest pain with exertion"
        ]
      },
      "processing_time_ms": 450
    }
  },
  "consensus_reasoning": "After collaborative analysis, Cardiology specialist identified 85% probability...",
  "available_doctors": [
    {
      "doctor_id": 1,
      "name": "Dr. Sarah Johnson",
      "specialization": "Cardiologist",
      "profile_description": "Board-certified cardiologist with 15 years experience",
      "email": "sarah.johnson@example.com",
      "address": "0x1234567890123456789012345678901234567890",
      "consultation_fee_per_hour": 150,
      "deposit_fee_stored": 50,
      "legal_documents_ipfs_hash": "0x..."
    }
  ],
  "total_doctors_found": 1,
  "analysis_timestamp": "2025-01-24T10:30:00Z",
  "processing_time_ms": 850,
  "asi_one_enhanced": true
}
```

---

### 3. Agent Status

**Endpoint:** `GET /api/agents/status`

**Purpose:** Get status of all agents (for debugging/monitoring)

**Response:**
```json
{
  "total_agents": 4,
  "agents": {
    "triage": {
      "status": "active",
      "role": "routing",
      "knowledge_base": "triage.metta"
    },
    "cardiology": {
      "status": "active",
      "role": "specialist",
      "knowledge_base": "cardiology.metta",
      "rules_count": 20
    }
  },
  "system_health": "operational"
}
```

---

## Frontend Integration Example

### React/TypeScript Example

```typescript
import { useState } from 'react';

interface SymptomForm {
  symptoms: string;
  age?: number;
  gender?: string;
  medicalHistory?: string[];
}

async function analyzeSymptoms(data: SymptomForm) {
  try {
    const response = await fetch('http://localhost:8000/api/analyze-symptoms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symptoms: data.symptoms,
        patient_age: data.age,
        patient_gender: data.gender,
        medical_history: data.medicalHistory
      })
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    const result = await response.json();

    // Display results
    console.log('Diagnosis:', result.preliminary_diagnosis);
    console.log('Urgency:', result.urgency_level);
    console.log('Recommended:', result.recommended_specialization);
    console.log('Confidence:', result.overall_confidence);

    // Show agent collaboration
    Object.entries(result.agent_collaboration).forEach(([role, analysis]) => {
      console.log(`${analysis.agent_name}:`, analysis.analysis);
    });

    // Show matched doctors
    result.available_doctors.forEach(doctor => {
      console.log(`Doctor: ${doctor.name} - $${doctor.consultation_fee_per_hour}/hr`);
    });

    return result;

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Usage in component
function SymptomAnalysisComponent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (formData: SymptomForm) => {
    setLoading(true);
    try {
      const analysis = await analyzeSymptoms(formData);
      setResult(analysis);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Your form UI */}
      {loading && <p>Analyzing symptoms...</p>}
      {result && (
        <div>
          <h3>{result.preliminary_diagnosis}</h3>
          <p>Urgency: {result.urgency_level}</p>
          {/* Display doctors, agent reasoning, etc. */}
        </div>
      )}
    </div>
  );
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error type",
  "detail": "Detailed error message",
  "path": "/api/analyze-symptoms"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `422` - Validation Error
- `500` - Internal Server Error

---

## Testing with curl

```bash
# Health check
curl http://localhost:8000/api/health

# Analyze symptoms
curl -X POST http://localhost:8000/api/analyze-symptoms \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": "chest pain and shortness of breath",
    "patient_age": 45,
    "patient_gender": "male",
    "medical_history": ["hypertension"]
  }' | jq '.'
```

---

## Important Notes for Frontend Team

1. **Response Time:** Expect 1-3 seconds for analysis (includes MeTTa reasoning + blockchain query)

2. **Agent Collaboration:** The `agent_collaboration` object is KEY for demos. Show this to users to demonstrate AI reasoning transparency.

3. **Urgency Levels:**
   - `critical`: Red alert, immediate action
   - `high`: Orange, within 24 hours
   - `moderate`: Yellow, within 2-3 days
   - `low`: Green, routine consultation

4. **Confidence Scores:** 0.0 to 1.0 scale
   - < 0.5: Low confidence
   - 0.5 - 0.7: Moderate confidence
   - 0.7 - 0.85: High confidence
   - > 0.85: Very high confidence

5. **Doctor List:** May be empty if no doctors match the specialization. Handle gracefully.

6. **Booking Flow:** After getting doctor recommendations:
   - User selects doctor
   - Navigate to booking page
   - Use Nexus SDK for payment

---

## Auto-Generated Docs

Visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI).

---

## Questions?

Contact: AI team member (working on agent backend)

Last Updated: 2025-01-24
