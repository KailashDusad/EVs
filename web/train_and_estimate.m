% filepath: d:\Matlab\EV Batteries\works\works\test\ev-battery-navigation\src\web\train_and_estimate.m
function train_and_estimate(Re, Rct, ~, outputFile)
    % Load training data
    data = load('../training_data/training_data.mat');
    all_data = data.all_data;

    % Prepare feature matrix and target vector for SoH
    X = [all_data.Re(:), all_data.Rct(:)];
    y_soh = all_data.SoH(:);

    % Train linear regression model for SoH
    soh_model = fitlm(X, y_soh);

    % Predict SoH for new input
    X_new = [Re, Rct];
    soh = predict(soh_model, X_new);

    % Clamp SoH between 0 and 100
    soh = max(0, min(100, soh));


    % Save results to JSON
    result.soh = soh;
    fid = fopen(outputFile, 'w');
    fprintf(fid, jsonencode(result));
    fclose(fid);
end