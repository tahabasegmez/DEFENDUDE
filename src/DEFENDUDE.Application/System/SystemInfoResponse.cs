namespace DEFENDUDE.Application.System;

public sealed record SystemInfoResponse(
    string ApplicationName,
    string EnvironmentName,
    DateTimeOffset ServerTimeUtc);
