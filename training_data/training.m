battery_files = {
    'B0005.mat', 'B0006.mat', 'B0007.mat'
};

all_data = struct('Re', [], 'Rct', [], 'SoH', [], 'Battery', [], 'Time', []);

% colors = {[0, 0.4470, 0.7410], [0.8500, 0.3250, 0.0980], [0.9290, 0.6940, 0.1250]};
% 
% figure('Position', [100, 100, 1200, 800]);
% subplot(2, 2, [1 2]);
% hold on;


for file_idx = 1:length(battery_files)
    data = load(battery_files{file_idx});
    
    battery_number = 5 + (file_idx - 1);
    battery_name = ['B' sprintf('%04d', battery_number)];
    cycles = data.(battery_name).cycle;
    
    % Sort cycles chronologically
    time_vec = zeros(1, length(cycles));
    for i = 1:length(cycles)
        if iscell(cycles(i).time)
            date_vector = cycles(i).time{1}; 
        else
            date_vector = cycles(i).time; 
        end
        time_vec(i) = datenum(date_vector);
    end
    [~, sorted_idx] = sort(time_vec);
    cycles = cycles(sorted_idx);
    
    discharge_soh = table();
    impedance_data = struct('Re', [], 'Rct', [], 'Time', []);
    initial_capacity = [];
    
    for i = 1:length(cycles)
        if iscell(cycles(i).type)
            cycle_type = cycles(i).type{1};
        else
            cycle_type = cycles(i).type;
        end
        
        if iscell(cycles(i).time)
            date_vector = cycles(i).time{1}; 
        else
            date_vector = cycles(i).time;
        end
        cycle_time = datetime(date_vector); 
        
        if strcmp(cycle_type, 'discharge')
            capacity = cycles(i).data.Capacity(1);
            if isempty(initial_capacity)
                initial_capacity = capacity;
            end
            soh = (capacity / initial_capacity) * 100;
            
            new_row = table(soh, cycle_time, 'VariableNames', {'SoH', 'Time'});
            discharge_soh = [discharge_soh; new_row];
            
%             plot(cycle_time, soh, '.', 'Color', colors{file_idx}, 'MarkerSize', 10);
            
        elseif strcmp(cycle_type, 'impedance')
            re = cycles(i).data.Re(1);
            rct = cycles(i).data.Rct(1);
            impedance_data.Re = [impedance_data.Re; re];
            impedance_data.Rct = [impedance_data.Rct; rct];
            impedance_data.Time = [impedance_data.Time; cycle_time];
        end
    end
    
    for i = 1:length(impedance_data.Time)
        imp_time = impedance_data.Time(i);
        valid_discharge = discharge_soh(discharge_soh.Time <= imp_time, :);
        if ~isempty(valid_discharge)
            [~, idx] = max(valid_discharge.Time);
            all_data.Re = [all_data.Re; impedance_data.Re(i)];
            all_data.Rct = [all_data.Rct; impedance_data.Rct(i)];
            all_data.SoH = [all_data.SoH; valid_discharge.SoH(idx)];
            all_data.Battery = [all_data.Battery; battery_number];
            all_data.Time = [all_data.Time; imp_time];
        end
    end
end

save('training_data.mat', 'all_data');
