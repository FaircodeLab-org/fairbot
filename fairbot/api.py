# File: fairbot/fairbot/api.py

import frappe
import openai
import requests
import base64
import json
import threading
import numpy as np
import os
import time

# Import helper functions from faqs.py
from fairbot.fairbot.doctype.faqs.faqs import get_openai_api_key, get_embedding

# Global variables
faq_embeddings = []
embeddings_initialized = False
embeddings_lock = threading.Lock()

def initialize_faq_embeddings():
    """
    Initializes embeddings for FAQs by loading them from the database.
    """
    global faq_embeddings
    global embeddings_initialized

    with embeddings_lock:
        if embeddings_initialized:
            # Embeddings have already been initialized
            return

        try:
            # Fetch all FAQs with their embeddings
            faqs = frappe.get_all('FAQS', fields=['name', 'question', 'answer', 'embedding'])

            # Load embeddings for each FAQ
            faq_embeddings = []
            for faq in faqs:
                if faq['embedding']:
                    try:
                        # Load the embedding from JSON string
                        embedding = json.loads(faq['embedding'])
                        faq_embeddings.append({
                            'name': faq['name'],
                            'question': faq['question'],
                            'answer': faq['answer'],
                            'embedding': embedding
                        })
                        frappe.logger().debug(f"Loaded embedding for FAQ '{faq['name']}': First 5 values: {embedding[:5]}...")
                    except Exception as e:
                        frappe.log_error(f"Error loading embedding for FAQ {faq['name']}: {str(e)}", "Chatbot Embedding Error")
                else:
                    # If embedding is missing, compute and save it
                    openai_api_key = get_openai_api_key()
                    if not openai_api_key:
                        frappe.log_error("OpenAI API key is not set.", "Chatbot Error")
                        continue

                    embedding = get_embedding(faq['question'])
                    # Save the embedding in the database
                    frappe.db.set_value('FAQS', faq['name'], 'embedding', json.dumps(embedding))
                    frappe.db.commit()
                    faq_embeddings.append({
                        'name': faq['name'],
                        'question': faq['question'],
                        'answer': faq['answer'],
                        'embedding': embedding
                    })
            embeddings_initialized = True  # Mark embeddings as initialized
        except Exception as e:
            frappe.log_error(f"Error initializing embeddings: {str(e)}", "Chatbot Embedding Initialization Error")

@frappe.whitelist(allow_guest=True)
def get_bot_response(user_message):
    """
    Public method to get the bot's response.
    """
    # Ensure embeddings are initialized
    if not embeddings_initialized:
        initialize_faq_embeddings()

    response = process_message(user_message)
    return response

def process_message(user_message):
    """
    Processes the user's message and returns the bot's response.
    """
    user_message = user_message.strip()

    # Search the knowledge base for an exact match
    faq_answer = search_faq(user_message)
    if faq_answer:
        return faq_answer

    # If no exact match, use embeddings to find relevant FAQs
    relevant_faqs = get_relevant_faqs(user_message, top_k=5)
    gpt_answer = get_gpt_interpreted_response(user_message, relevant_faqs)
    return gpt_answer

def search_faq(user_message):
    """
    Searches for an exact match in the FAQs.
    """
    faqs = frappe.get_all('FAQS', fields=['question', 'answer'])
    for faq in faqs:
        if user_message.lower() == faq['question'].lower():
            return faq['answer']
    return None

def get_embedding(text, model="text-embedding-ada-002"):
    """
    Generates an embedding for the given text using the specified OpenAI model.
    """
    # Ensure OpenAI API key is set
    if not openai.api_key:
        openai_api_key = get_openai_api_key()
        if not openai_api_key:
            frappe.log_error("OpenAI API key is not set.", "Chatbot Error")
            return []

        openai.api_key = openai_api_key

    try:
        response = openai.Embedding.create(
            input=[text],
            model=model
        )
        embedding = response['data'][0]['embedding']
        return embedding
    except Exception as e:
        frappe.log_error(f"Error generating embedding: {str(e)}", "Chatbot Embedding Error")
        return []

def cosine_similarity(a, b):
    """
    Computes the cosine similarity between two vectors.
    """
    a = np.array(a)
    b = np.array(b)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def get_relevant_faqs(user_message, top_k=5):
    global faq_embeddings

    if not faq_embeddings:
        frappe.log_error("FAQ embeddings are not initialized.", "Chatbot Error")
        return []

    # Generate embedding for user message
    user_embedding = get_embedding(user_message)
    if not user_embedding:
        frappe.log_error("Failed to get embedding for user message.", "Chatbot Error")
        return []
    frappe.logger().debug(f"Generated embedding for user message: First 5 values: {user_embedding[:5]}...")

    # Compute cosine similarity between user message and FAQs
    similarities = []
    for faq in faq_embeddings:
        try:
            sim = cosine_similarity(user_embedding, faq['embedding'])
            similarities.append((sim, faq))
            # Log each similarity score
            frappe.logger().debug(f"Similarity between user message and FAQ '{faq['name']}': {sim}")
        except Exception as e:
            frappe.log_error(f"Error computing similarity for FAQ {faq['name']}: {str(e)}", "Chatbot Similarity Error")

    # Sort FAQs by similarity score in descending order
    similarities.sort(key=lambda x: x[0], reverse=True)

    # # Return top_k most similar FAQs
    # relevant_faqs = [faq for sim, faq in similarities[:top_k] if sim > 0]  # Exclude FAQs with zero similarity
    MIN_SIMILARITY_THRESHOLD = 0.0  # You can adjust this value
    relevant_faqs = [faq for sim, faq in similarities[:top_k] if sim >= MIN_SIMILARITY_THRESHOLD]

    # Log the selected relevant FAQs
    frappe.logger().debug(f"Top {len(relevant_faqs)} relevant FAQs selected.")
    return relevant_faqs

def get_gpt_interpreted_response(user_message, relevant_faqs):
    """
    Uses OpenAI's ChatCompletion API to generate a response based on relevant FAQs.
    """
    # Ensure OpenAI API key is set
    if not openai.api_key:
        openai_api_key = get_openai_api_key()
        if not openai_api_key:
            frappe.log_error("OpenAI API key is not set.", "Chatbot Error")
            return "I'm sorry, I cannot process your request at the moment."

        openai.api_key = openai_api_key

    # Prepare the FAQ prompt with relevant FAQs
    if relevant_faqs:
        faq_prompt = "\n".join([f"Q: {faq['question']}\nA: {faq['answer']}" for faq in relevant_faqs])
    else:
        faq_prompt = ""

    # Incorporate company description, vision, and mission into the system prompt
    company_description = """
    At FaircodeLab, we believe in the transformative power of technology to create a better world. As the IT division of FairtradeGSFZE UAE, our mission is to harness cutting-edge innovations that not only drive business growth but also empower communities, foster transparency, and support sustainable development.

    Rooted in the core values of Fairtrade, we bring together the brightest minds in technology to develop solutions that bridge the gap between businesses and ethical practices. From state-of-the-art ERP systems to groundbreaking traceability platforms, we are committed to shaping a future where technology and sustainability work hand in hand.

    Every line of code we write and every solution we deploy reflects our dedication to:
    Empower communities and customers through seamless digital integration.
    Champion sustainability and fair practices in every project.
    Drive innovation that aligns with our values of integrity, fairness, and transparency.
    Join us as we pioneer a future where technology transforms industries and positively impacts lives across the globe. Together, we are building a world where every business decision not only advances growth but also creates lasting value for people and the planet.

    Team meeting at FaircodeLab
    Empowering Businesses Through Innovative Solutions
    The company’s mission is to drive software innovation, improve business performance, and ensure the seamless dissemination of cutting-edge technology across international markets. FaircodeLab is committed to bridging the gap between technology and business needs, ensuring that enterprises have the right tools to stay competitive in an ever-evolving digital landscape.

    Experience a Friendly Atmosphere
    FaircodeLab is not just about delivering top-notch IT solutions; it’s about creating a welcoming and collaborative environment for our clients and team. We believe in fostering relationships built on trust and mutual respect, ensuring a positive experience for everyone involved.
    """

    system_prompt = f"""
    You are a helpful assistant for FaircodeLab. Use the following information to answer the user's questions in a clear and friendly manner.

    Company Description:
    {company_description}

    FAQs:
    {faq_prompt}
    """

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4-1106-preview",  # Make sure this model is available to you
            messages=[
                {"role": "system", "content": system_prompt.strip()},
                {"role": "user", "content": user_message.strip()}
            ],
            max_tokens=200,
            temperature=0.7,
        )
        return response.choices[0].message['content'].strip()
    except Exception as e:
        frappe.log_error(f"OpenAI API Error: {str(e)}", "Chatbot Response Error")
        return "I'm sorry, I'm having trouble responding right now. Please try again later."


@frappe.whitelist(allow_guest=True)
def process_image():
    OPENAI_API_KEY = frappe.local.conf.get("openai_api_key", None)
    OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"

    if 'image' not in frappe.request.files:
        return {"error": "No image provided."}

    image_file = frappe.request.files['image']
    
    # Convert image to base64
    image_base64 = base64.b64encode(image_file.read()).decode('utf-8')

    # Prepare OpenAI API request
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gpt-4-turbo",
        "messages": [
            {"role": "system", "content": "You are an AI that analyzes images and provides insights."},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Analyze this image and describe its contents."},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                ]
            }
        ],
        "max_tokens": 500
    }

    try:
        # Send request to OpenAI API
        response = requests.post(OPENAI_ENDPOINT, json=payload, headers=headers)
        response_data = response.json()

        if "error" in response_data:
            error_message = response_data["error"].get("message", "Unknown error")
            frappe.log_error(f"OpenAI Error: {error_message[:120]}", "OpenAI API Debug")  # Truncate error log
            return {"error": error_message}

        # Extract the AI response
        analysis = response_data.get("choices", [{}])[0].get("message", {}).get("content", "No response received.")

        return {"message": "Image processed successfully.", "analysis": analysis}

    except requests.exceptions.RequestException as e:
        frappe.log_error(f"Request Exception: {str(e)[:120]}", "OpenAI API Debug")
        return {"error": "Failed to connect to OpenAI API."}


@frappe.whitelist(allow_guest=True)
def get_api_credentials():
    """Fetch API Key and Secret securely from site_config.json."""
    api_key = frappe.conf.get("api_key")
    api_secret = frappe.conf.get("api_secret")

    if not api_key or not api_secret:
        frappe.throw(_("API credentials not found"))

    return {"api_key": api_key, "api_secret": api_secret}