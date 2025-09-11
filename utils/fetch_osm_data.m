function fetch_osm_data()
    % Fetch road and petrol pump data from OpenStreetMap for Gujarat, India.
    overpass_url = 'https://overpass-api.de/api/interpreter';

    % Gujarat bounding box
%     south = 20.10; west = 68.13; north = 24.74; east = 74.46;
    % Ahmedabad bounding box
    south = 22.95; west = 72.45; north = 23.15; east = 72.75;

    % Queries
    road_query = sprintf(['[out:json][timeout:300];' ...
        '(way["highway"](%f,%f,%f,%f); node(w);); out geom;'], ...
        south, west, north, east);

    fuel_query = sprintf(['[out:json][timeout:300];' ...
        'node["amenity"="fuel"](%f,%f,%f,%f); out;'], ...
        south, west, north, east);

    opts = weboptions('Timeout', 300);

    % Save to file instead of decoding
    websave('../web/data/road_data.json', overpass_url, 'data', road_query, opts);
    websave('../web/data/petrol_pump_data.json', overpass_url, 'data', fuel_query, opts);
end
