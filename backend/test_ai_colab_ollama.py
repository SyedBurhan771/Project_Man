import streamlit as st
import ollama
import json
import re

st.set_page_config(
    page_title="AI Create Project - Demo",
    layout="centered",
    page_icon="🪄"
)

# ====================== HARDCODE YOUR COLAB URL HERE ======================
COLAB_URL = "http://ngzmm-35-240-200-243.run.pinggy-free.link"   # ←←← CHANGE THIS LINE
MODEL = "qwen2.5:3b"
# =====================================================================

# Custom CSS for better demo look
st.markdown("""
<style>
    .main-header {font-size: 2.3rem; font-weight: bold; color: #4F46E5; text-align: center;}
    .sub-header {font-size: 1.1rem; color: #6B7280; text-align: center; margin-bottom: 2rem;}
    .project-card {border: 2px solid #E0E7FF; border-radius: 12px; padding: 20px; background-color: #F8FAFF; margin: 15px 0;}
    .stButton>button {width: 100%; border-radius: 8px; height: 48px; font-weight: 600;}
</style>
""", unsafe_allow_html=True)

st.markdown('<h1 class="main-header">🪄 AI Create Project</h1>', unsafe_allow_html=True)
st.markdown('<p class="sub-header">Powered by Ollama running on Google Colab</p>', unsafe_allow_html=True)

if not COLAB_URL or COLAB_URL == "https://your-url-here.pinggy.io":
    st.error("❌ Please paste your actual Colab URL in the code (Line 12)")
    st.stop()

client = ollama.Client(host=COLAB_URL)

# System Prompt
SYSTEM_PROMPT = """You are an expert Project Manager. 
Your ONLY job is to generate or refine project ideas.
STRICT RULES:
- ALWAYS respond with a VALID JSON ARRAY of projects only.
- Never add any extra text, explanation, or markdown outside the JSON."""

# Session State
if "messages" not in st.session_state:
    st.session_state.messages = []

# New Chat Button
col1, col2 = st.columns([5, 1])
with col1:
    st.markdown("### Chat with AI Project Assistant")
with col2:
    if st.button("🔄 New Chat"):
        st.session_state.messages = []
        st.rerun()

# Chat Container
chat_container = st.container(height=520, border=True)

with chat_container:
    for message in st.session_state.messages:
        if message["role"] == "user":
            st.chat_message("user").write(message["content"])
        else:
            st.chat_message("assistant").markdown(message.get("content", ""))
            
            # Show Project Cards
            if "projects" in message and message["projects"]:
                for idx, project in enumerate(message["projects"]):
                    with st.container():
                        st.markdown(f"""
                        <div class="project-card">
                            <h4>📋 {project.get('name', 'Untitled Project')}</h4>
                            <p>{project.get('description', '')}</p>
                            <div style="display:flex; gap:20px; margin-top:12px; font-size:0.95rem;">
                                <div><strong>Category:</strong> {project.get('category', 'Other')}</div>
                                <div><strong>Duration:</strong> {project.get('estimatedDurationDays', 0)} days</div>
                                <div><strong>Team Size:</strong> {project.get('teamSize', 0)} members</div>
                            </div>
                        </div>
                        """, unsafe_allow_html=True)
                        
                        if st.button(f"✅ Create This Project", key=f"btn_{idx}"):
                            st.success(f"🎉 Project '{project.get('name')}' Created Successfully!")
                            st.balloons()

# Input Box
if prompt := st.chat_input("Describe your project idea..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    
    with chat_container:
        st.chat_message("user").write(prompt)
    
    with chat_container:
        with st.spinner("🤖 Thinking on Google Colab GPU..."):
            try:
                ollama_messages = [
                    {"role": "system", "content": SYSTEM_PROMPT}
                ] + st.session_state.messages

                response = client.chat(
                    model=MODEL,
                    messages=ollama_messages,
                    options={"temperature": 0.7, "keep_alive": "30m"}
                )

                ai_content = response["message"]["content"].strip()
                ai_content = re.sub(r'^```json\s*|\s*```$', '', ai_content, flags=re.MULTILINE | re.IGNORECASE).strip()

                assistant_msg = {"role": "assistant", "content": ai_content}

                # Parse JSON projects
                try:
                    parsed = json.loads(ai_content)
                    if isinstance(parsed, list):
                        assistant_msg["projects"] = parsed
                    elif isinstance(parsed, dict) and "name" in parsed:
                        assistant_msg["projects"] = [parsed]
                except:
                    match = re.search(r'\[\s*\{[\s\S]*\}\s*\]', ai_content, re.DOTALL)
                    if match:
                        try:
                            extracted = json.loads(match.group(0))
                            assistant_msg["projects"] = extracted if isinstance(extracted, list) else [extracted]
                        except:
                            pass

                st.session_state.messages.append(assistant_msg)
                st.chat_message("assistant").markdown(ai_content)

                if "projects" in assistant_msg and assistant_msg["projects"]:
                    for idx, project in enumerate(assistant_msg["projects"]):
                        with st.container():
                            st.markdown(f"""
                            <div class="project-card">
                                <h4>📋 {project.get('name', 'Untitled Project')}</h4>
                                <p>{project.get('description', '')}</p>
                                <div style="display:flex; gap:20px; margin-top:12px; font-size:0.95rem;">
                                    <div><strong>Category:</strong> {project.get('category', 'Other')}</div>
                                    <div><strong>Duration:</strong> {project.get('estimatedDurationDays', 0)} days</div>
                                    <div><strong>Team Size:</strong> {project.get('teamSize', 0)} members</div>
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                            
                            if st.button(f"✅ Create This Project", key=f"btn2_{idx}"):
                                st.success(f"🎉 Project '{project.get('name')}' Created Successfully!")
                                st.balloons()

            except Exception as e:
                st.error(f"❌ Error: {str(e)}")
                st.info("Make sure your Colab notebook is still running.")

st.caption("🚀 Demo for Professor | Ollama running on Google Colab")