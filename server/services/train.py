import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import json
import os

def train_model(csv_path, model_dir):
    # Load dataset
    if not os.path.exists(csv_path):
        print(f"Error: Dataset not found at {csv_path}")
        return

    data = pd.read_csv(csv_path)
    
    # Preprocessing
    # Features (symptoms) are everything except 'prognosis'
    X = data.drop('prognosis', axis=1).dropna(axis=1, how='all')
    y = data['prognosis']
    
    # Save the symptom list (the feature columns)
    symptoms_list = X.columns.tolist()
    with open(os.path.join(model_dir, 'symptoms.json'), 'w') as f:
        json.dump(symptoms_list, f)
    
    # Encode labels (diseases)
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    # Save the label encoder
    joblib.dump(le, os.path.join(model_dir, 'label_encoder.joblib'))
    
    # Train Random Forest Classifier
    # We use a fixed random_state for reproducibility
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_model.fit(X, y_encoded)
    
    # Save the model
    joblib.dump(rf_model, os.path.join(model_dir, 'rf_model.joblib'))
    
    print("Model training complete. Files saved to:", model_dir)

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(current_dir)) # project/
    csv_path = os.path.join(current_dir, '../data/train_disease.csv')
    model_dir = os.path.join(current_dir, '../data/')
    
    # Ensure model directory exists
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)
        
    train_model(csv_path, model_dir)
