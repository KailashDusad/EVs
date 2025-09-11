function route = route_planner(current_location, nearest_station)
    
    road_data = load_json('src/web/data/road_data.json');
    
    route = struct('path', [], 'distance', 0);
    
    route.path = [current_location; nearest_station];
    route.distance = calculate_distance(current_location, nearest_station);
end

function distance = calculate_distance(location1, location2)
    distance = sqrt((location2(1) - location1(1))^2 + (location2(2) - location1(2))^2);
end