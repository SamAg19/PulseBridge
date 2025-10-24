# PulseBridge Agent System

**AI-Powered Multi-Specialist Consultation Network**

Using ASI:One and MeTTa reasoning to provide intelligent medical triage and specialist recommendations.

---

## Quick Start

### 1. Install Dependencies

```bash
cd agent
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `SEPOLIA_RPC_URL` - Ethereum RPC endpoint
- `PRIVATE_KEY` - Ethereum private key
- `ASIONE_API_KEY` - ASI:One API key
- `AGENT_PORT` - API server port (default: 8000)

### 3. Run the Server

```bash
python main.py
```

Server will start on `http://localhost:8000`

---

## API Documentation

### Frontend Integration
See [API_CONTRACT.md](./API_CONTRACT.md) for complete API specification

### Main Endpoint

```bash
POST /api/analyze-symptoms
```

Analyzes patient symptoms using multi-agent AI system and returns:
- Preliminary diagnosis
- Recommended specialization
- Matched doctors from blockchain
- Transparent agent collaboration details

**Example:**

```bash
curl -X POST http://localhost:8000/api/analyze-symptoms \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": "chest pain and shortness of breath",
    "patient_age": 45,
    "patient_gender": "male",
    "medical_history": ["hypertension"]
  }'
```