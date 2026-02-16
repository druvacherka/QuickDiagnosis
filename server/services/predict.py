import sys
import json
import os
import joblib
import random
import numpy as np

def predict_disease(user_symptoms, model_dir):
    # Load Model Artifacts
    model_path = os.path.join(model_dir, 'rf_model.joblib')
    labels_path = os.path.join(model_dir, 'label_encoder.joblib')
    symptoms_json_path = os.path.join(model_dir, 'symptoms.json')

    if not all(os.path.exists(p) for p in [model_path, labels_path, symptoms_json_path]):
        return {"error": "Model not trained. Please train the model first."}

    rf_model = joblib.load(model_path)
    le = joblib.load(labels_path)
    with open(symptoms_json_path, 'r') as f:
        symptoms_list = json.load(f)

    # Convert user symptoms to feature vector
    # Vector length = number of symptoms in training set
    input_vector = np.zeros(len(symptoms_list))
    
    # Map symptoms to indices
    symptom_to_idx = {s: i for i, s in enumerate(symptoms_list)}
    
    for s in user_symptoms:
        if s in symptom_to_idx:
            input_vector[symptom_to_idx[s]] = 1

    # Predict Probabilities
    # model.predict_proba returns probability for each class
    probabilities = rf_model.predict_proba([input_vector])[0]
    
    # Get all disease classes
    classes = le.classes_
    
    # Pair class with probability
    results = []
    for disease, prob in zip(classes, probabilities):
        if prob > 0:
            results.append({
                "disease": disease,
                "score": float(prob)
            })

    # Sort results by probability descending
    results.sort(key=lambda x: x['score'], reverse=True)
    
    # Limit to Top 3
    top_results = results[:3]
    
    final_results = []
    for item in top_results:
        # Apply random penalty (5-8%) for UI consistency as per user request
        penalty = random.uniform(0.05, 0.08)
        p = max(0, item['score'] - penalty)
        final_results.append({
            "disease": item['disease'],
            "probability": p
        })

    # FOLLOW-UP LOGIC (ML interpretation)
    # If the top prediction is not 100%, suggest related symptoms from that disease
    follow_up = None
    if final_results:
        top_disease = final_results[0]['disease']
        top_score = final_results[0]['probability']
        
        if top_score < 0.9: # Threshold for follow-up
            # In a real ML project, you might look at feature importance or 
            # common symptoms from the training set for this disease.
            # For now, we'll keep the logic of recommending symptoms the user didn't pick.
            # We'll load the training data to find common symptoms for this disease.
            csv_path = os.path.join(model_dir, 'train_disease.csv')
            if os.path.exists(csv_path):
                import pandas as pd
                train_df = pd.read_csv(csv_path)
                disease_data = train_df[train_df['prognosis'] == top_disease]
                
                # Find symptoms that are 1 for this disease but not in user input
                potential_missing = []
                for s in symptoms_list:
                    if s not in user_symptoms:
                        # Check if this symptom is common (e.g. > 50% frequency) for this disease
                        if disease_data[s].mean() > 0.5:
                            potential_missing.append(s)
                
                if potential_missing:
                    follow_up = {
                        "disease": top_disease,
                        "missingSymptoms": potential_missing[:5], # Limit to 5
                        "question": f"Patients with {top_disease} often experience these symptoms."
                    }

    return {
        "predictions": final_results,
        "followUp": follow_up
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Insufficient arguments"}))
        sys.exit(1)
        
    # First arg is CSV path (ignored now in favor of saved model, but kept for signature)
    # Second arg is the symptoms JSON string
    try:
        user_symptoms = json.loads(sys.argv[2])
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid symptoms format"}))
        sys.exit(1)
        
    model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../data/')
    
    result = predict_disease(user_symptoms, model_dir)
    print(json.dumps(result))
