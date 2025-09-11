function data = load_json(filename)
    % Load data from a JSON file
    fid = fopen(filename, 'r');
    raw = fread(fid, inf);
    str = char(raw');
    fclose(fid);
    data = jsondecode(str);
end