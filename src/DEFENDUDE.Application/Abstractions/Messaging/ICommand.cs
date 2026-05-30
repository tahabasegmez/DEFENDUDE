namespace DEFENDUDE.Application.Abstractions.Messaging;

public interface ICommand;

public interface ICommand<out TResponse>;
