namespace DEFENDUDE.Domain.Common;

public static class Guard
{
    public static string AgainstNullOrWhiteSpace(string? value, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Value cannot be null or whitespace.", parameterName);
        }

        return value;
    }

    public static T AgainstNull<T>(T? value, string parameterName)
        where T : class
    {
        return value ?? throw new ArgumentNullException(parameterName);
    }

    public static int AgainstNegative(int value, string parameterName)
    {
        if (value < 0)
        {
            throw new ArgumentOutOfRangeException(parameterName, "Value cannot be negative.");
        }

        return value;
    }
}
