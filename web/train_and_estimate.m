function train_and_estimate(Re, Rct, ~, outputFile)
    
    data = load('../training_data/training_data.mat');
    all_data = data.all_data;

    X = [all_data.Re(:), all_data.Rct(:)];
    y_soh = all_data.SoH(:);

    soh_model = fitlm(X, y_soh);

    X_new = [Re, Rct];
    soh = predict(soh_model, X_new);

    soh = max(0, min(100, soh));

    result.soh = soh;
    fid = fopen(outputFile, 'w');
    fprintf(fid, jsonencode(result));
    fclose(fid);
end