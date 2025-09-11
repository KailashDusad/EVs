function save_json(data, filename)
    % Convert data to JSON format
    jsonData = jsonencode(data);
    
    % Open the file for writing
    fid = fopen(filename, 'w');
    
    % Check if the file opened successfully
    if fid == -1
        error('Could not open file for writing: %s', filename);
    end
    
    % Write JSON data to the file
    fwrite(fid, jsonData, 'char');
    
    % Close the file
    fclose(fid);
end