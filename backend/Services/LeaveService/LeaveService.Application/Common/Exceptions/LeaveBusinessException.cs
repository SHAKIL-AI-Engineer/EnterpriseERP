namespace LeaveService.Application.Common.Exceptions;

public sealed class LeaveBusinessException : Exception
{
    public LeaveBusinessException(string message) : base(message)
    {
    }
}
