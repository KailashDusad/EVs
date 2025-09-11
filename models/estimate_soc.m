function soc_estimate = estimate_soc(Re, Rct, Temperature)
    % Constants for the estimation model
    a = 0.5; % Example coefficient for Re
    b = 0.3; % Example coefficient for Rct
    c = 0.2; % Example coefficient for Temperature

    % Estimate State of Charge (SoC) based on inputs
    soc_estimate = a * Re + b * Rct + c * Temperature;

    % Ensure SoC is within valid range [0, 100]
    soc_estimate = max(0, min(100, soc_estimate));
end