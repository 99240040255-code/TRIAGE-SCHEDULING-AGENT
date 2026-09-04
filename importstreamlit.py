import streamlit as st
import re
import json
from datetime import datetime, timedelta

# =====================================================================
# PAGE CONFIGURATION & CUSTOM STYLING
# =====================================================================
st.set_page_config(
    page_title="MedTriage AI | Clinical Triage & Scheduling Engine",
    page_icon="🏥",
    layout="wide"
)

# Custom CSS for modern medical dark-mode dashboard
st.markdown("""
<style>
    .main { background-color: #0E1117; }
    .stCard {
        background-color: #1E222D;
        border-radius: 10px;
        padding: 20px;
        border: 1px solid #2E3440;
        margin-bottom: 15px;
    }
    .badge-esi1 { background-color: #8B0000; color: #FF4B4B; padding: 4px 12px; border-radius: 12px; font-weight: bold; }
    .badge-esi2 { background-color: #5C3A00; color: #FFC107; padding: 4px 12px; border-radius: 12px; font-weight: bold; }
    .badge-esi3 { background-color: #003366; color: #1E88E5; padding: 4px 12px; border-radius: 12px; font-weight: bold; }
    .badge-esi4 { background-color: #004D40; color: #00E676; padding: 4px 12px; border-radius: 12px; font-weight: bold; }
    .alert-box {
        background-color: #2D1215;
        border-left: 5px solid #FF4B4B;
        padding: 15px;
        border-radius: 5px;
        color: #FFC0C0;
    }
</style>
""", unsafe_allow_html=True)

# =====================================================================
# TIER 1: DETERMINISTIC RED-FLAG SAFETY GUARDRAILS
# =====================================================================
RED_FLAG_PATTERNS = [
    r"chest pain", r"shortness of breath", r"difficulty breathing",
    r"severe bleeding", r"fainted", r"unconscious", r"stroke",
    r"numbness on one side", r"slurred speech", r"sudden loss of vision",
    r"coughing blood", r"severe anaphylaxis"
]

def evaluate_tier1_safety(symptom_text: str) -> dict:
    clean_text = symptom_text.lower()
    for pattern in RED_FLAG_PATTERNS:
        if re.search(pattern, clean_text):
            return {
                "is_emergency": True,
                "matched_pattern": pattern,
                "esi_level": 1,
                "urgency_label": "ESI LEVEL 1 - RESUSCITATION / IMMEDIATE",
                "action": "EMERGENCY_EJECTION",
                "message": "CRITICAL MEDICAL ALERT: Immediate Emergency Services Required."
            }
    return {"is_emergency": False}

# =====================================================================
# TIER 2: ADAPTIVE CLINICAL TRIAGE ENGINE & SPECIALIST ROUTER
# =====================================================================
DEPARTMENT_MAPPING = {
    "knee": ("Orthopedics", 3, "24 Hours"),
    "joint": ("Orthopedics", 3, "24 Hours"),
    "bone": ("Orthopedics", 3, "24 Hours"),
    "rash": ("Dermatology", 4, "48 Hours"),
    "skin": ("Dermatology", 4, "48 Hours"),
    "stomach": ("Gastroenterology", 3, "24-48 Hours"),
    "abdomen": ("Gastroenterology", 3, "24-48 Hours"),
    "headache": ("Neurology", 3, "24-48 Hours"),
    "numbness": ("Neurology", 2, "12 Hours"),
    "vision": ("Ophthalmology", 2, "12 Hours")
}

def evaluate_tier2_triage(symptom_text: str, pain_scale: int) -> dict:
    clean = symptom_text.lower()
    dept = "General Internal Medicine"
    esi = 4
    timeframe = "Standard Window (3-5 Days)"

    for key, (d, base_esi, base_time) in DEPARTMENT_MAPPING.items():
        if key in clean:
            dept = d
            esi = base_esi
            timeframe = base_time
            break

    # Urgency escalation based on self-reported pain
    if pain_scale >= 8 and esi > 2:
        esi = 2
        timeframe = "Priority Window (Within 12 Hours)"
    elif pain_scale <= 3 and esi == 3:
        esi = 4
        timeframe = "Standard Window (3-5 Days)"

    return {
        "is_emergency": False,
        "recommended_specialty": dept,
        "esi_level": esi,
        "priority_timeframe": timeframe,
        "allocated_slot": (datetime.now() + timedelta(hours=12 if esi == 2 else (24 if esi == 3 else 72))).strftime("%A, %b %d at %I:00 %p"),
        "reasoning": f"Symptom matched clinical category for '{dept}' modified by severity pain score of {pain_scale}/10."
    }

# =====================================================================
# APP LAYOUT & DUAL-TAB WORKFLOW
# =====================================================================
st.title("🏥 MedTriage AI — Agentic Clinical Triage & Scheduling")
st.caption("Phase 2 Build: Dual-Tier Guardrails & Dynamic Calendar Routing Engine")

tab1, tab2 = st.tabs(["💬 Patient Intake Portal", "📊 Clinician Decision Hub"])

with tab1:
    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader("1. Patient Intake")
        st.info("Describe your primary concern in natural language.")
        
        # Quick Presets for Demo
        preset = st.selectbox("⚡ Hackathon Demo Presets:", [
            "Custom Input",
            "Emergency: 'I have sudden numbness on one side of my face and arm.'",
            "Urgent: 'Severe knee pain and swelling after playing football.'",
            "Routine: 'Mild skin rash on my left wrist for 3 days.'"
        ])

        if preset != "Custom Input":
            default_text = preset.split(": '")[1].rstrip("'")
        else:
            default_text = ""

        user_symptom = st.text_area("What symptoms are you experiencing?", value=default_text, height=100)
        pain_level = st.slider("Discomfort / Severity Level (1 = Mild, 10 = Unbearable)", 1, 10, 5)
        
        submit_btn = st.button("Run Clinical Triage & Check Availability", use_container_width=True, type="primary")

    with col2:
        st.subheader("2. Triage & Allocation Result")
        if submit_btn and user_symptom:
            # Step 1: Run Tier 1 Safety Layer
            tier1_result = evaluate_tier1_safety(user_symptom)
            
            if tier1_result["is_emergency"]:
                st.markdown(f"""
                <div class="alert-box">
                    <h3>🚨 RED-FLAG EMERGENCY TRIGGERED</h3>
                    <p><b>Pattern Detected:</b> <code>{tier1_result['matched_pattern']}</code></p>
                    <p><b>ESI Severity:</b> <span class="badge-esi1">ESI LEVEL 1 (CRITICAL)</span></p>
                    <hr>
                    <h4>ACTION REQUIRED: DO NOT SCHEDULE ROUTINE VISIT</h4>
                    <p>Please dial <b>911 / 112</b> or report to the nearest Emergency Room immediately.</p>
                </div>
                """, unsafe_allow_html=True)
                st.session_state['last_triage'] = tier1_result
            else:
                # Step 2: Run Tier 2 Clinical Triage
                tier2_result = evaluate_tier2_triage(user_symptom, pain_level)
                st.session_state['last_triage'] = tier2_result

                badge_class = f"badge-esi{tier2_result['esi_level']}"
                st.success("✅ Triage Evaluation Complete")
                
                st.markdown(f"""
                <div style="background-color: #1E222D; padding: 20px; border-radius: 10px; border: 1px solid #333;">
                    <h4>Assigned Department: <span style="color: #4CAF50;">{tier2_result['recommended_specialty']}</span></h4>
                    <p><b>Clinical Severity:</b> <span class="{badge_class}">ESI Level {tier2_result['esi_level']}</span></p>
                    <p><b>Target Window:</b> {tier2_result['priority_timeframe']}</p>
                    <hr style="border-color: #444;">
                    <p><b>📅 Recommended Slot:</b></p>
                    <h3 style="color: #2196F3;">{tier2_result['allocated_slot']}</h3>
                    <p><i>{tier2_result['reasoning']}</i></p>
                </div>
                """, unsafe_allow_html=True)
                st.button("Confirm & Book Appointment", use_container_width=True)

with tab2:
    st.subheader("Clinician Real-Time Oversight Panel")
    if 'last_triage' in st.session_state:
        st.json(st.session_state['last_triage'])
    else:
        st.write("No active patient triage session evaluated yet. Use Tab 1 to run a patient case.")
