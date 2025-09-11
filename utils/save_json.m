function save_json(data, filename)
    jsonData = jsonencode(data);
    
    fid = fopen(filename, 'w');
    
    if fid == -1
        error('Could not open file for writing: %s', filename);
    end
    
    fwrite(fid, jsonData, 'char');
    
    fclose(fid);
end