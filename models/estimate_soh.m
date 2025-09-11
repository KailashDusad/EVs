function soh_estimate = estimate_soh(Re, Rct, Temperature)
    % Load the trained SoH model
    model = load('src/training_data/training_data.mat', 'soh_model');
    
    % Extract the model from the loaded structure
    soh_model = model.soh_model;
    
    % Prepare the input features for the model
    input_features = [Re, Rct, Temperature];
    
    % Estimate the State of Health (SoH) using the trained model
    soh_estimate = predict(soh_model, input_features);
end