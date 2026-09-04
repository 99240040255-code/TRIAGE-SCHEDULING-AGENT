import json
import re

# =====================================================================
# TIER 1: DETERMINISTIC MEDICAL SAFETY LAYER (Hardcoded Red Flags)
# Bypasses LLM entirely to ensure zero hallucination on critical cases
# =====================================================================

RED_FLAG_KEYWORDS = [
    r"chest pain", r"shortness of breath", r"difficulty breathing",
    r"severe bleeding", r"fainted", r"unconscious", r"stroke",
    r"numbness on one side", r"slurred speech", r"sudden loss of vision",
    r"coughing blood", r"severe anaphylaxis", r"allergic reaction swelling"
]

def check_tier1_red_flags(user_input: str) -> dict:
    """Evaluates input against hardcoded emergency safety rules."""
    clean_input = user_input.lower()
    for pattern in RED_FLAG_KEYWORDS:
        if re.search(pattern, clean_input):
            return {
                "is_emergency": True,
                "action": "IMMEDIATE_ER_REDIRECT",
                "message": "CRITICAL WARNING: Your symptoms indicate a potential medical emergency. Please call 911 or proceed to the nearest Emergency Room immediately.",
                "esi_level": 1
            }
    return {"is_emergency": False}

# =====================================================================
# TIER 2: ADAPTIVE LLM CLINICAL TRIAGE LAYER
# Evaluates non-emergency complaints & maps specialist slots
# =====================================================================

SPECIALIST_MAP = {
    "joint_pain": "Orthopedics",
    "skin_rash": "Dermatology",
    "stomach_ache": "Gastroenterology",
    "headache": "Neurology",
    "general": "General Internal Medicine"
}

def tier2_adaptive_triage(symptom_description: str, follow_up_response: str = None) -> dict:
    """
    Simulates clinical LLM triage returning structured JSON schema.
    In production, this call integrates directly with OpenAI / Gemini API.
    """
    symptom = symptom_description.lower()
    
    # Needs clarification question if context is minimal
    if not follow_up_response and len(symptom.split()) < 4:
        return {
            "is_emergency": False,
            "requires_clarification": True,
            "next_question": "How long have you been experiencing these symptoms, and how severe is the discomfort on a scale of 1 to 10?"
        }

    # Clinical Urgency Scoring (ESI 2 to 5)
    if "severe" in symptom or "high fever" in symptom:
        esi_score = 2
        timeframe = "Within 12 Hours"
    elif "moderate" in symptom or "swelling" in symptom:
        esi_score = 3
        timeframe = "Within 24 Hours"
    else:
        esi_score = 4
        timeframe = "Next Available (2-3 Days)"

    # Department Mapping
    matched_dept = "General Internal Medicine"
    for key, dept in SPECIALIST_MAP.items():
        if key in symptom:
            matched_dept = dept

    return {
        "is_emergency": False,
        "requires_clarification": False,
        "triage_result": {
            "esi_level": esi_score,
            "recommended_specialty": matched_dept,
            "priority_timeframe": timeframe,
            "reasoning": f"Assessed chief complaint '{symptom_description}' under ESI Level {esi_score} clinical criteria."
        }
    }

# =====================================================================
# EXECUTION DEMO (For Testing & Presentation Output)
# =====================================================================
if __name__ == "__main__":
    print("--- TEST CASE 1: RED-FLAG EMERGENCY TRIGGER ---")
    user_case_1 = "I am having severe chest pain and short of breath."
    tier1_result = check_tier1_red_flags(user_case_1)
    print(json.dumps(tier1_result, indent=2))

    print("\n--- TEST CASE 2: ROUTINE TRIAGE & SPECIALIST MAPPING ---")
    user_case_2 = "I have moderate joint pain in my right knee after running."
    tier1_check = check_tier1_red_flags(user_case_2)
    if not tier1_check["is_emergency"]:
        tier2_result = tier2_adaptive_triage(user_case_2)
        print(json.dumps(tier2_result, indent=2))
