function model = train_soc_model(training_data)
    % Extract features and labels from the training data
    features = training_data(:, 1:end-1); % Assuming last column is the label
    labels = training_data(:, end);
    
    % Define the model (e.g., a simple linear regression model)
    model = fitlm(features, labels);
    
    % Save the trained model to a file
    save('src/models/soc_model.mat', 'model');
end