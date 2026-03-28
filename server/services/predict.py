import sys
import json
import os
import joblib
import numpy as np


def predict_disease(user_symptoms, model_dir, confirmed_symptoms=None):
    """
    Predict disease from symptoms.
    
    Parameters
    ----------
    user_symptoms : list[str]
        Symptoms entered / confirmed by the user (the full augmented set).
    model_dir : str
        Path to the directory containing model artefacts.
    confirmed_symptoms : list[str] or None
        Subset of user_symptoms that were confirmed through the follow-up
        questionnaire.  When supplied the confidence is boosted using a
        symptom-match ratio so that the score reflects diagnostic certainty
        gained from the questionnaire.
    """
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

    # Build feature vector from the full (augmented) symptom list
    input_vector = np.zeros(len(symptoms_list))
    symptom_to_idx = {s: i for i, s in enumerate(symptoms_list)}
    for s in user_symptoms:
        if s in symptom_to_idx:
            input_vector[symptom_to_idx[s]] = 1

    # ── Raw ML probabilities ──────────────────────────────────────────────
    probabilities = rf_model.predict_proba([input_vector])[0]
    classes = le.classes_

    results = []
    for disease, prob in zip(classes, probabilities):
        if prob > 0:
            results.append({"disease": disease, "score": float(prob)})

    results.sort(key=lambda x: x['score'], reverse=True)
    top_results = results[:3]

    # ── Confidence calculation ──────────────────────────────────────────────
    # • Initial call  (confirmed_symptoms is None):
    #     Use raw ML probability – the model’s best guess from initial symptoms.
    # • Final call (confirmed_symptoms is not None, i.e. after questionnaire):
    #     Custom formula:
    #       base  = matched_symptoms / total_characteristic  (recall)
    #       penalty = (irrelevant_symptoms / total_user_symptoms) * 0.3  (max 30%)
    #       confidence = clamp(base - penalty, 0, 1)
    #     Where:
    #       matched_symptoms  = user symptoms that ARE in the disease’s profile
    #       irrelevant_symptoms = user symptoms NOT in the disease’s profile
    #       total_characteristic = characteristic symptoms for that disease

    is_final_run = confirmed_symptoms is not None
    user_symptom_set = set(user_symptoms)
    final_results = []

    if is_final_run:
        # Load training data for characteristic-symptom lookup
        csv_path_conf = os.path.join(model_dir, 'train_disease.csv')
        if os.path.exists(csv_path_conf):
            import pandas as pd
            train_conf = pd.read_csv(csv_path_conf)

        for item in top_results:
            disease = item['disease']
            confidence = item['score']  # fallback to raw ML

            if os.path.exists(csv_path_conf):
                disease_rows = train_conf[train_conf['prognosis'] == disease]
                if not disease_rows.empty:
                    characteristic = [
                        s for s in symptoms_list
                        if disease_rows[s].mean() > 0.5
                    ]
                    if characteristic:
                        char_set = set(characteristic)
                        matched = [s for s in user_symptom_set if s in char_set]
                        irrelevant = [s for s in user_symptom_set if s not in char_set]

                        base_score = len(matched) / len(characteristic)
                        penalty_ratio = len(irrelevant) / len(user_symptom_set) if user_symptom_set else 0
                        penalty = penalty_ratio * 0.3  # max 30% deduction

                        confidence = max(0.0, min(base_score - penalty, 1.0))

            final_results.append({
                "disease": disease,
                "probability": round(confidence, 4)
            })
    else:
        # Initial prediction: use raw ML probability
        for item in top_results:
            final_results.append({
                "disease": item['disease'],
                "probability": round(item['score'], 4)
            })

    # ── Follow-up candidates (for the first / non-final call) ─────────────
    # For each of the top-3 predicted diseases, collect missing characteristic
    # symptoms so the frontend can ask follow-up questions.
    # When confirmed_symptoms are present this is the final run – skip follow-up.
    follow_up_candidates = []

    csv_path = os.path.join(model_dir, 'train_disease.csv')
    if final_results and not is_final_run and os.path.exists(csv_path):
        import pandas as pd
        train_df_fu = pd.read_csv(csv_path)

        for item in final_results:
            disease = item['disease']
            disease_rows = train_df_fu[train_df_fu['prognosis'] == disease]
            if disease_rows.empty:
                continue

            characteristic = [
                s for s in symptoms_list
                if disease_rows[s].mean() > 0.5
            ]
            missing = [s for s in characteristic if s not in user_symptom_set]

            if missing:
                follow_up_candidates.append({
                    "disease": disease,
                    "matchCount": len([s for s in characteristic if s in user_symptom_set]),
                    "totalCharacteristic": len(characteristic),
                    "missingSymptoms": missing
                })

    # Legacy single-disease followUp
    follow_up = None
    if follow_up_candidates:
        top = follow_up_candidates[0]
        follow_up = {
            "disease": top["disease"],
            "missingSymptoms": top["missingSymptoms"][:5],
            "question": f"Patients with {top['disease']} often experience these symptoms."
        }

    return {
        "predictions": final_results,
        "followUp": follow_up,
        "followUpCandidates": follow_up_candidates
    }


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Insufficient arguments"}))
        sys.exit(1)

    try:
        user_symptoms = json.loads(sys.argv[2])
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid symptoms format"}))
        sys.exit(1)

    # Optional 4th argument: JSON array of confirmed (questionnaire Yes) symptoms
    confirmed_symptoms = None
    if len(sys.argv) >= 4:
        try:
            confirmed_symptoms = json.loads(sys.argv[3])
        except json.JSONDecodeError:
            confirmed_symptoms = None

    model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../data/')

    result = predict_disease(user_symptoms, model_dir, confirmed_symptoms)
    print(json.dumps(result))
