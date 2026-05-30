using DEFENDUDE.Application.Abstractions.Messaging;

namespace DEFENDUDE.Application.System;

public sealed record GetSystemInfoQuery(string ApplicationName, string EnvironmentName)
    : IQuery<SystemInfoResponse>;
