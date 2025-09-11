function app()
    import matlab.net.http.*
    import matlab.net.http.io.*
    
    port = 8080;
    
    server = matlab.net.http.io.HttpServer(port);
    
    server.addRoute('/', @homePage);
    server.addRoute('/navigate', @navigate);
    
    disp(['Starting server on port ' num2str(port) '...']);
    server.start();
    
    function response = homePage(~, ~)
        html = fileread('src/web/static/index.html');
        response = matlab.net.http.ResponseMessage(200, 'text/html', html);
    end

    function response = navigate(request, ~)
        params = request.getQueryParameters();
        current_location = params.current_location;
        Re = str2double(params.Re);
        Rct = str2double(params.Rct);
        Temperature = str2double(params.Temperature);
        
        nearest_station = find_nearest_station(current_location);
        route = route_planner(current_location, nearest_station);
        
        SoH = estimate_soh(Re, Rct, Temperature);
        SoC = estimate_soc(Re, Rct, Temperature);
        
        response_data = struct('nearest_station', nearest_station, 'route', route, 'SoH', SoH, 'SoC', SoC);
        response = matlab.net.http.ResponseMessage(200, 'application/json', jsonencode(response_data));
    end
end