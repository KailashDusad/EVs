function nearest_station = find_nearest_station(current_location)
    
    petrol_data = load_json('src/web/data/petrol_pump_data.json');
    
    min_distance = inf;
    nearest_station = [];
    
    for i = 1:length(petrol_data)
        pump_location = petrol_data(i).location; % Assuming location is a struct with fields 'lat' and 'lon'
        distance = haversine(current_location.lat, current_location.lon, pump_location.lat, pump_location.lon);
        
        if distance < min_distance
            min_distance = distance;
            nearest_station = petrol_data(i);
        end
    end
end

function distance = haversine(lat1, lon1, lat2, lon2)
    R = 6371; % Radius of the Earth in kilometers
    dlat = deg2rad(lat2 - lat1);
    dlon = deg2rad(lon2 - lon1);
    
    a = sin(dlat/2)^2 + cos(deg2rad(lat1)) * cos(deg2rad(lat2)) * sin(dlon/2)^2;
    c = 2 * atan2(sqrt(a), sqrt(1 - a));
    
    distance = R * c; % Distance in kilometers
end