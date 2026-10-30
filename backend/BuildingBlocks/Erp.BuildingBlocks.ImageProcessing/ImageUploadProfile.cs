namespace Erp.BuildingBlocks.ImageProcessing;

public sealed class ImageUploadProfile
{
	public static readonly ImageUploadProfile Avatar = new(512, 512, quality: 82);
	public static readonly ImageUploadProfile Signature = new(800, 320, quality: 85);
	public static readonly ImageUploadProfile Logo = new(512, 512, quality: 82);

	public ImageUploadProfile(int maxWidth, int maxHeight, int quality)
	{
		if (maxWidth <= 0 || maxHeight <= 0)
		{
			throw new ArgumentOutOfRangeException(nameof(maxWidth), "Dimensions must be positive.");
		}

		MaxWidth = maxWidth;
		MaxHeight = maxHeight;
		Quality = Math.Clamp(quality, 50, 95);
	}

	public int MaxWidth { get; }
	public int MaxHeight { get; }
	public int Quality { get; }
}
