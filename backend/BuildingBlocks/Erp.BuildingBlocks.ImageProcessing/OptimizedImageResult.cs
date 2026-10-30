namespace Erp.BuildingBlocks.ImageProcessing;

public sealed class OptimizedImageResult : IDisposable
{
	public OptimizedImageResult(Stream stream, string contentType, string fileExtension, int width, int height)
	{
		Stream = stream;
		ContentType = contentType;
		FileExtension = fileExtension;
		Width = width;
		Height = height;
	}

	public Stream Stream { get; }
	public string ContentType { get; }
	public string FileExtension { get; }
	public int Width { get; }
	public int Height { get; }

	public void Dispose() => Stream.Dispose();
}
