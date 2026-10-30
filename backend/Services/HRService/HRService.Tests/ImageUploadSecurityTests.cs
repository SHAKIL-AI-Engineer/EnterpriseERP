using Erp.BuildingBlocks.ImageProcessing;
using SkiaSharp;

namespace HRService.Tests;

public sealed class ImageUploadSecurityTests
{
    [Fact]
    public async Task Valid_image_is_resized_and_encoded_without_changing_the_public_contract()
    {
        using var image = SKImage.Create(new SKImageInfo(1000, 500));
        using var encoded = image.Encode(SKEncodedImageFormat.Png, 100);
        using var input = new MemoryStream(encoded.ToArray());
        using var result = await UploadedImageOptimizer.OptimizeAsync(input, "image/png", ImageUploadProfile.Avatar);
        Assert.Equal(512, result.Width); Assert.Equal(256, result.Height); Assert.Equal("image/webp", result.ContentType);
    }

    [Fact]
    public async Task Unrecognized_payload_is_rejected_even_with_an_image_content_type()
    {
        using var input = new MemoryStream("not an image"u8.ToArray());
        await Assert.ThrowsAsync<InvalidOperationException>(() => UploadedImageOptimizer.OptimizeAsync(input, "image/png", ImageUploadProfile.Avatar));
    }
}
