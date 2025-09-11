function model = train_soh_model(training_data)
    % Train a State of Health (SoH) model using the provided training data
    
    % Extract features and labels from the training data
    features = training_data(:, 1:end-1); % Assuming last column is the label
    labels = training_data(:, end);
    
    % Define the model (e.g., a simple linear regression model)
    model = fitlm(features, labels);
    
    % Save the trained model for future use
    save('src/models/soh_model.mat', 'model');
end