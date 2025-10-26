# PulseBridge Agent Guide

## System Architecture

PulseBridge uses a **multi-agent architecture** with 5 autonomous agents that communicate via Fetch.ai's uagents framework using mailbox-based asynchronous messaging.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    COORDINATOR AGENT                            │
│                      (Port 8001)                                │
│                                                                 │
│  Responsibilities:                                              │
│  • Orchestrates the complete multi-agent workflow              │
│  • Exposes REST endpoint: POST /chat                           │
│  • Manages session state across async workflow                 │
│  • Integrates with blockchain for doctor recommendations       │
│  • Handles both DeltaV/ASI:One and REST API requests          │
│                                                                 │
│  Address: agent1qtp0vky7yjfv4wpnt9gamzy7llmw03pfc2kj...        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Step 1: Send SymptomRoutingRequest
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                      TRIAGE AGENT                               │
│                      (Port 8002)                                │
│                                                                 │
│  Responsibilities:                                              │
│  • Analyzes symptoms using MeTTa reasoning (35+ rules)         │
│  • Routes to appropriate medical specialty                     │
│  • Determines urgency level (critical/high/moderate/low)       │
│  • Returns confidence score and reasoning                      │
│                                                                 │
│  Technology: MeTTa symbolic AI for pattern matching            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Step 2: Return SpecialtyRecommendation
                     │         (specialty, confidence, urgency)
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│               COORDINATOR (Routing Logic)                       │
└────────┬──────────────┬──────────────┬─────────────────────────┘
         │              │              │
         │ Step 3: Send SpecialistAnalysisRequest
         ↓              ↓              ↓
┌────────────┐  ┌────────────┐  ┌────────────┐
│ CARDIOLOGY │  │ NEUROLOGY  │  │DERMATOLOGY │
│   AGENT    │  │   AGENT    │  │   AGENT    │
│ (Port 8003)│  │ (Port 8004)│  │ (Port 8005)│
│            │  │            │  │            │
│ Heart &    │  │ Brain &    │  │ Skin       │
│ Vascular   │  │ Nervous    │  │ Conditions │
│ Conditions │  │ System     │  │            │
│            │  │            │  │            │
│ 32+ MeTTa  │  │ 28+ MeTTa  │  │ 25+ MeTTa  │
│ Rules      │  │ Rules      │  │ Rules      │
│            │  │            │  │            │
│ ASI:One    │  │ ASI:One    │  │ ASI:One    │
│ Enhanced   │  │ Enhanced   │  │ Enhanced   │
└────────┬───┘  └────────┬───┘  └────────┬───┘
         │              │              │
         │ Step 4: Return SpecialistAnalysisResponse
         │         (diagnosis, condition, risk, recommendations)
         └──────────────┴──────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│               COORDINATOR (Aggregation)                         │
│                                                                 │
│  Step 5: Query Blockchain DoctorRegistry Contract              │
└────────┬────────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                  BLOCKCHAIN INTEGRATION                         │
│                   (Sepolia Testnet)                             │
│                                                                 │
│  • DoctorRegistry Smart Contract                               │
│  • Find doctors by specialty                                   │
│  • Return verified doctor profiles (name, email, fees, etc.)   │
└────────┬────────────────────────────────────────────────────────┘
         │
         │ Step 6: Return complete ChatResponse
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    USER / FRONTEND                              │
│                                                                 │
│  Receives:                                                      │
│  • Patient-friendly diagnosis                                  │
│  • Specialty recommendation + confidence                       │
│  • Urgency level with emoji indicators                         │
│  • Clinical recommendations (3-5 items)                        │
│  • Matched doctors from blockchain (1-3 doctors)               │
│  • AI transparency (MeTTa rules matched, ASI:One usage)        │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Communication Protocol

All agents communicate via **uagents mailbox protocol** using strongly-typed Pydantic message models:

1. **ChatMessage** → Coordinator receives user symptoms
2. **SymptomRoutingRequest** → Coordinator → Triage
3. **SpecialtyRecommendation** → Triage → Coordinator
4. **SpecialistAnalysisRequest** → Coordinator → Specialist
5. **SpecialistAnalysisResponse** → Specialist → Coordinator
6. **ChatResponse** → Coordinator returns to user

### Agent Details

| Agent | Port | Address Prefix | Technology Stack | Purpose |
|-------|------|----------------|------------------|---------|
| **Coordinator** | 8001 | `agent1qtp0v...` | uagents + Web3.py | Orchestration & REST API |
| **Triage** | 8002 | `agent1q...` | uagents + MeTTa | Symptom routing |
| **Cardiology** | 8003 | `agent1q...` | uagents + MeTTa + ASI:One | Heart diagnosis |
| **Neurology** | 8004 | `agent1q...` | uagents + MeTTa + ASI:One | Neurological diagnosis |
| **Dermatology** | 8005 | `agent1q...` | uagents + MeTTa + ASI:One | Skin diagnosis |

### Key Features

- **Asynchronous Communication**: Agents use mailbox protocol for non-blocking message passing
- **Session Management**: Coordinator tracks multi-step conversations via session IDs
- **MeTTa Reasoning**: 90+ symbolic AI rules across all agents for transparent medical logic
- **ASI:One Enhancement**: Optional LLM integration for patient-friendly language
- **Blockchain Integration**: Verified doctor recommendations from on-chain registry
- **Fault Tolerance**: Each agent is independent; failures are gracefully handled

---

## Prerequisites

- Python 3.11
- pip

---

## Installation

### 1. Create Virtual Environment

```bash
cd agent
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
```

### 2. Install Dependencies

```bash
pip install uagents python-dotenv web3 httpx hyperon
```

---

## Configuration

### 1. Create `.env` File

```bash
cd agent
touch .env
```

### 2. Add Configuration

```bash
# Agent Seeds (generates deterministic addresses)
COORDINATOR_AGENT_SEED="pulsebridge_coordinator_user_facing_seed_phrase"
TRIAGE_AGENT_SEED="pulsebridge_triage_routing_seed_phrase"
CARDIOLOGY_AGENT_SEED="pulsebridge_cardiology_specialist_seed"
NEUROLOGY_AGENT_SEED="pulsebridge_neurology_specialist_seed"
DERMATOLOGY_AGENT_SEED="pulsebridge_dermatology_specialist_seed"

# Agent Ports
COORDINATOR_AGENT_PORT=8001
TRIAGE_AGENT_PORT=8002
CARDIOLOGY_AGENT_PORT=8003
NEUROLOGY_AGENT_PORT=8004
DERMATOLOGY_AGENT_PORT=8005

# Agent Addresses (fill these after Step 3)
TRIAGE_AGENT_ADDRESS=""
CARDIOLOGY_AGENT_ADDRESS=""
NEUROLOGY_AGENT_ADDRESS=""
DERMATOLOGY_AGENT_ADDRESS=""

# Optional: Web3 Configuration
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY"
DOCTOR_REGISTRY_ADDRESS=""  # Leave empty to disable

# Optional: ASI:One API
ASIONE_API_KEY=""  # Leave empty to disable
ASIONE_ENABLED="false"
```

### 3. Get Agent Addresses

Run each agent once to get its address:

```bash
# Terminal 1
python -m fetch_agents.triage_agent
# Look for: "Triage Agent Address: agent1q..."
# Copy the address

# Terminal 2
python -m fetch_agents.cardiology_fetch_agent
# Copy the address

# Terminal 3
python -m fetch_agents.neurology_fetch_agent
# Copy the address

# Terminal 4
python -m fetch_agents.dermatology_fetch_agent
# Copy the address
```

Update `.env` with the addresses:

```bash
TRIAGE_AGENT_ADDRESS="agent1q..."
CARDIOLOGY_AGENT_ADDRESS="agent1q..."
NEUROLOGY_AGENT_ADDRESS="agent1q..."
DERMATOLOGY_AGENT_ADDRESS="agent1q..."
```

---

## Deployment

### Start All Agents

Open 5 terminal windows:

**Terminal 1 - Triage Agent:**
```bash
cd agent
source venv/bin/activate
python -m fetch_agents.triage_agent
```

**Terminal 2 - Cardiology Agent:**
```bash
cd agent
source venv/bin/activate
python -m fetch_agents.cardiology_fetch_agent
```

**Terminal 3 - Neurology Agent:**
```bash
cd agent
source venv/bin/activate
python -m fetch_agents.neurology_fetch_agent
```

**Terminal 4 - Dermatology Agent:**
```bash
cd agent
source venv/bin/activate
python -m fetch_agents.dermatology_fetch_agent
```

**Terminal 5 - Coordinator Agent:**
```bash
cd agent
source venv/bin/activate
python -m fetch_agents.coordinator_agent
```

### Expected Output

Each agent should show:
```
INFO:     [agent-name]: Starting agent...
INFO:     Agent Address: agent1q...
INFO:     Uvicorn running on http://0.0.0.0:800X
```

Coordinator should show:
```
============================================================
Coordinator Agent (User-Facing) Starting...
Agent Address: agent1qtp0vky7yjfv4wpnt9gamzy7llmw03pfc2kj54falmjtv46advqv2336tuc
Port: 8001

Configured Agent Addresses:
  Triage Agent: agent1q...
  Cardiology Agent: agent1q...
  Neurology Agent: agent1q...
  Dermatology Agent: agent1q...

Chat Protocol: ENABLED
REST Endpoint: http://127.0.0.1:8001/chat
============================================================
```

---

## Verification

### Test Agent Communication

Run:
```bash
python test_local.py
```

You should receive a complete medical consultation response after ~20-30 seconds.

### Test REST Endpoint

```bash
curl -X POST http://localhost:8001/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"I have a headache"}'
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process
lsof -i :8001
kill -9 <PID>

# Or kill all agents
pkill -f fetch_agents
```

### Agent Addresses Not Set

Check `.env` file has all addresses filled:
```bash
cat .env | grep AGENT_ADDRESS
```

All should have values starting with `agent1q...`

### Session Not Found

- Ensure all agents are running
- Restart coordinator after updating `.env`
- Check agent logs for errors

### Web3 Errors

Disable blockchain temporarily:
```bash
# In .env:
DOCTOR_REGISTRY_ADDRESS=""
```

That's it! All agents are now running and ready to process medical consultations.
