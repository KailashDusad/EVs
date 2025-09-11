function route = route_planner(current_location, nearest_station)
    % This function plans a route from the current location to the nearest charging station.
    
    % Load road data
    road_data = load_json('src/web/data/road_data.json');
    
    % Initialize route
    route = struct('path', [], 'distance', 0);
    
    % Find the path from current location to nearest station
    % This is a placeholder for the actual pathfinding algorithm
    % You can implement Dijkstra's algorithm, A* algorithm, etc.
    
    % Example of a simple route planning logic (to be replaced with actual logic)
    route.path = [current_location; nearest_station];
    route.distance = calculate_distance(current_location, nearest_station);
end

function distance = calculate_distance(location1, location2)
    % Calculate the Euclidean distance between two locations
    distance = sqrt((location2(1) - location1(1))^2 + (location2(2) - location1(2))^2);
end