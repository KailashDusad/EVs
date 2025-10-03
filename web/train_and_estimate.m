function train_and_estimate(Re, Rct, temperature, outputFile)
    modelFile = 'soh_model.mat';
    dataFile = '../training_data/training_data.mat';

    retrain = true;
    mdl = [];
    perf = [];
    modelType = '';
    
    if exist(modelFile, 'file')
        modelInfo = load(modelFile);
        dataHash = getFileHash(dataFile);
        if isfield(modelInfo, 'dataHash') && isequal(modelInfo.dataHash, dataHash) ...
                && isfield(modelInfo, 'mdl') && isfield(modelInfo, 'perf') && isfield(modelInfo, 'modelType')
            retrain = false;
            mdl = modelInfo.mdl;
            perf = modelInfo.perf;
            modelType = modelInfo.modelType;

            if ~isfield(perf, 'R2_tfln'), perf.R2_tfln = NaN; end
            if ~isfield(perf, 'RMSE_tfln'), perf.RMSE_tfln = NaN; end
            if ~isfield(perf, 'R2_ensemble'), perf.R2_ensemble = NaN; end
            if ~isfield(perf, 'RMSE_ensemble'), perf.RMSE_ensemble = NaN; end
        end
    end


    if retrain
        data = load(dataFile);
        all_data = data.all_data;
        X = [all_data.Re(:), all_data.Rct(:), all_data.Temperature_measured(:)];
        y_soh = all_data.SoH(:);

        % Ensemble 
        mdl_ensemble = fitrensemble(X, y_soh, 'Method', 'Bag');
        cvmdl_ensemble = crossval(mdl_ensemble);
        y_pred_ensemble = kfoldPredict(cvmdl_ensemble);
        R2_ensemble = 1 - sum((y_soh - y_pred_ensemble).^2) / sum((y_soh - mean(y_soh)).^2);
        RMSE_ensemble = sqrt(mean((y_soh - y_pred_ensemble).^2));

        % TFLN
        X_tfln = [X, sin((pi/4).*X), cos((pi/4).*X), sin(2*(pi/4).*X), cos(2*(pi/4).*X), sin(3*(pi/4).*X), cos(3*(pi/4).*X), sin(4*(pi/4).*X), cos(4*(pi/4).*X), sin(5*(pi/4).*X), cos(5*(pi/4).*X), sin(6*(pi/4).*X), cos(6*(pi/4).*X), sin(7*(pi/4).*X), cos(7*(pi/4).*X), sin(8*(pi/4).*X), cos(8*(pi/4).*X)];
        
        % mdl_tfln = fitrnet(X_tfln, y_soh, 'Standardize', true);
        % mdl_tfln = fitrensemble(X_tfln, y_soh, 'Method', 'Bag'); % Works good
        mdl_tfln = fitrensemble(X_tfln, y_soh, 'OptimizeHyperparameters', 'all', 'HyperparameterOptimizationOptions', struct('AcquisitionFunctionName','expected-improvement-plus')); % Works best till now, but takes time to train
        cvmdl_tfln = crossval(mdl_tfln);
        y_pred_tfln = kfoldPredict(cvmdl_tfln);
        R2_tfln = 1 - sum((y_soh - y_pred_tfln).^2) / sum((y_soh - mean(y_soh)).^2)
        RMSE_tfln = sqrt(mean((y_soh - y_pred_tfln).^2));

        % fln_order = 1;
        % mu = 0.000001;
        % epochs = 200;
        % [fln_weights, R2_tfln, RMSE_tfln] = train_tfln(X, y_soh, fln_order, mu, epochs);

        perf.R2_ensemble = R2_ensemble;
        perf.RMSE_ensemble = RMSE_ensemble;
        perf.R2_tfln = R2_tfln;
        perf.RMSE_tfln = RMSE_tfln;

        if R2_ensemble >= R2_tfln
            mdl = mdl_ensemble;
            perf.R2 = R2_ensemble;
            perf.RMSE = RMSE_ensemble;
            modelType = 'Ensemble';
            
            
        else
            mdl = mdl_tfln;
            perf.R2 = R2_tfln;
            perf.RMSE = RMSE_tfln;
            modelType = 'TFLN';
        end

        dataHash = getFileHash(dataFile);
        save(modelFile, 'mdl', 'perf', 'dataHash', 'modelType');
    end

    X_new = [Re, Rct, temperature];
    % soh = predict(mdl, X_new);
    if strcmp(modelType, 'TFLN')
        X_new_tfln = [X_new, sin((pi/4).*X_new), cos((pi/4).*X_new), sin(2*(pi/4).*X_new), cos(2*(pi/4).*X_new), sin(3*(pi/4).*X_new), cos(3*(pi/4).*X_new), sin(4*(pi/4).*X_new), cos(4*(pi/4).*X_new), sin(5*(pi/4).*X_new), cos(5*(pi/4).*X_new), sin(6*(pi/4).*X_new), cos(6*(pi/4).*X_new), sin(7*(pi/4).*X_new), cos(7*(pi/4).*X_new), sin(8*(pi/4).*X_new), cos(8*(pi/4).*X_new)];
        soh = predict(mdl, X_new_tfln);
        % FEB=[];
        % for k=1:fln_order
        %     FEB = [FEB, sin(pi*k*X_new), cos(pi*k*X_new)];
        % end
        % X_new_tfln = [X_new, FEB];
        % soh = fln_weights * X_new_tfln;
    else
        soh = predict(mdl, X_new);
    end

    soh = max(0, min(100, soh));

    result.soh = soh;
    result.model_R2 = perf.R2;
    result.model_RMSE = perf.RMSE;
    result.model_accuracy_percent = perf.R2 * 100; % Accuracy in %
    result.model_type = modelType;

    result.R2_Tfln = perf.R2_tfln;
    result.RMSE_tfln = perf.RMSE_tfln;
    result.R2_ensemble = perf.R2_ensemble;
    result.RMSE_ensemble = perf.RMSE_ensemble;

    fid = fopen(outputFile, 'w');
    fprintf(fid, jsonencode(result));
    fclose(fid);
end

function hash = getFileHash(filename)
    fid = fopen(filename, 'rb');
    bytes = fread(fid, inf, '*uint8');
    fclose(fid);
    hash = sum(bytes); 
end


% function [fln_weights, R2, RMSE] = train_tfln(X, y, fln_order, mu, epochs)
% 
%     N = size(X,1);
%     M = size(X,2) + 2*fln_order*size(X,2); 
%     fln_weights = 0.01*randn(1,M);
% 
%     for ep = 1:epochs
%         for i=1:N
%             x_buffer = X(i,:);
%             
%             FEB = [];
%             for k=1:fln_order
%                 FEB = [FEB, sin(pi*k*x_buffer), cos(pi*k*x_buffer)];
%             end
%             fln_input = [x_buffer, FEB];
%             
%             y_hat = fln_weights * fln_input';
%             e = y(i) - y_hat;
%             fln_weights = fln_weights + 2*mu*e*fln_input;
%         end
%     end

%     Y_pred = zeros(N,1);
%     for i=1:N
%         FEB=[];
%         for k=1:fln_order
%             FEB=[FEB, sin(pi*k*X(i,:)), cos(pi*k*X(i,:))];
%         end
%         fln_input=[X(i,:), FEB];
%         Y_pred(i)=fln_weights*fln_input';
%     end

%     R2 = 1 - sum((y - Y_pred).^2) / sum((y - mean(y)).^2);
%     RMSE = sqrt(mean((y - Y_pred).^2));
% end
