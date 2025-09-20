battery_files = {'B0005.mat', 'B0006.mat', 'B0007.mat', 'B0008.mat', 'B0009', 'B0010', 'B0011', 'B0012', 'B0013', 'B0014', 'B0015', 'B0016', 'B0017', 'B0018', 'B0019', 'B0020', 'B0021', 'B0022', 'B0023', 'B0024', 'B0025', 'B0026'};
all_data = struct(...
    'Re', [], 'Rct', [], 'SoH', [], 'Battery', [], 'Time', [], ...
    'Temperature_measured', [] ...  
);

for file_idx = 1:length(battery_files)
    data = load(battery_files{file_idx});
    battery_name = ['B' sprintf('%04d', 5 + (file_idx - 1))];
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
    
    discharge_data = table();
    impedance_data = struct('Re', [], 'Rct', [], 'Time', []);
    initial_capacity = [];
    
    % Process cycles
    for i = 1:length(cycles)
        cycle = cycles(i);
        cycle_time = datetime(cycle.time);
        
        switch lower(cycle.type)
            case 'discharge'
                % Extract discharge data
                capacity = cycle.data.Capacity(1);
                temp_mean = mean(cycle.data.Temperature_measured);  % Only temperature
                
                if isempty(initial_capacity)
                    initial_capacity = capacity;
                end
                soh = (capacity / initial_capacity) * 100;
                
                % Append to discharge_data
                discharge_data = [discharge_data; table(...
                    soh, cycle_time, temp_mean, ...
                    'VariableNames', {'SoH', 'Time', 'Temp'}...
                )];
                
            case 'impedance'
                % Extract impedance parameters (Re and Rct)
                re = cycle.data.Re;
                rct = cycle.data.Rct;
                impedance_data.Re = [impedance_data.Re; re];
                impedance_data.Rct = [impedance_data.Rct; rct];
                impedance_data.Time = [impedance_data.Time; cycle_time];
        end
    end
    
    % Merge impedance data with discharge data
    for i = 1:length(impedance_data.Time)
        imp_time = impedance_data.Time(i);
        valid_discharge = discharge_data(discharge_data.Time <= imp_time, :);
        if ~isempty(valid_discharge)
            [~, idx] = max(valid_discharge.Time);
            if ((valid_discharge.SoH(idx) <= 100) && (valid_discharge.SoH(idx) > 10))
                all_data.Re = [all_data.Re; impedance_data.Re(i)];
                all_data.Rct = [all_data.Rct; impedance_data.Rct(i)];
                all_data.SoH = [all_data.SoH; valid_discharge.SoH(idx)];
                all_data.Battery = [all_data.Battery; 5 + (file_idx - 1)];
                all_data.Time = [all_data.Time; imp_time];
                all_data.Temperature_measured = [all_data.Temperature_measured; valid_discharge.Temp(idx)];
            end
        end
    end
end

save('training_data.mat', 'all_data');
