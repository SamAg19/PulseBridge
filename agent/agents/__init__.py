"""
PulseBridge Specialist Agents

Multi-agent system for medical consultation
"""

from .cardiology_agent import CardiologyAgent
from .triage_agent import TriageAgent

__all__ = ['CardiologyAgent', 'TriageAgent']
