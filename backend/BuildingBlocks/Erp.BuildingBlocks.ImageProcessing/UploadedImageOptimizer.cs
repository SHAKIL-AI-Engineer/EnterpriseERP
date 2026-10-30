using SkiaSharp;

namespace Erp.BuildingBlocks.ImageProcessing;

public static class UploadedImageOptimizer
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase) { "image/jpeg", "image/png", "image/webp" };
    public static async Task<OptimizedImageResult> OptimizeAsync(Stream input, string contentType, ImageUploadProfile profile, CancellationToken cancellationToken = default)
    {
        if (!AllowedContentTypes.Contains(contentType)) throw new InvalidOperationException("Only JPG, PNG, or WebP images are allowed.");
        if (input.CanSeek) input.Position = 0;
        using var buffer = new MemoryStream();
        var chunk = new byte[81920]; int count;
        while ((count = await input.ReadAsync(chunk, cancellationToken)) > 0)
        {
            if (buffer.Length + count > 10 * 1024 * 1024) throw new InvalidOperationException("Image must be 10 MB or smaller.");
            await buffer.WriteAsync(chunk.AsMemory(0, count), cancellationToken);
        }
        using var data = SKData.CreateCopy(buffer.ToArray());
        using var codec = SKCodec.Create(data) ?? throw new InvalidOperationException("The uploaded image is invalid.");
        if (codec.EncodedFormat is not (SKEncodedImageFormat.Jpeg or SKEncodedImageFormat.Png or SKEncodedImageFormat.Webp))
            throw new InvalidOperationException("Only JPG, PNG, or WebP images are allowed.");
        var w = codec.Info.Width; var h = codec.Info.Height;
        if (w <= 0 || h <= 0 || (long)w * h > 40_000_000) throw new InvalidOperationException("Image dimensions exceed the supported limit.");
        var swapped = codec.EncodedOrigin is SKEncodedOrigin.LeftTop or SKEncodedOrigin.RightTop or SKEncodedOrigin.RightBottom or SKEncodedOrigin.LeftBottom;
        var orientedWidth = swapped ? h : w; var orientedHeight = swapped ? w : h;
        var scale = Math.Min(1d, Math.Min((double)profile.MaxWidth / orientedWidth, (double)profile.MaxHeight / orientedHeight));
        var width = Math.Max(1, (int)Math.Round(orientedWidth * scale)); var height = Math.Max(1, (int)Math.Round(orientedHeight * scale));
        using var source = SKImage.FromEncodedData(data) ?? throw new InvalidOperationException("Unable to decode the image.");
        using var surface = SKSurface.Create(new SKImageInfo(width, height));
        var canvas = surface.Canvas; canvas.Clear(SKColors.Transparent); canvas.Scale((float)scale);
        var m = codec.EncodedOrigin switch {
            SKEncodedOrigin.TopRight => new SKMatrix { ScaleX=-1, ScaleY=1, TransX=w, Persp2=1 },
            SKEncodedOrigin.BottomRight => new SKMatrix { ScaleX=-1, ScaleY=-1, TransX=w, TransY=h, Persp2=1 },
            SKEncodedOrigin.BottomLeft => new SKMatrix { ScaleX=1, ScaleY=-1, TransY=h, Persp2=1 },
            SKEncodedOrigin.LeftTop => new SKMatrix { SkewX=1, SkewY=1, Persp2=1 },
            SKEncodedOrigin.RightTop => new SKMatrix { SkewX=-1, SkewY=1, TransX=h, Persp2=1 },
            SKEncodedOrigin.RightBottom => new SKMatrix { SkewX=-1, SkewY=-1, TransX=h, TransY=w, Persp2=1 },
            SKEncodedOrigin.LeftBottom => new SKMatrix { SkewX=1, SkewY=-1, TransY=w, Persp2=1 },
            _ => SKMatrix.Identity
        };
        canvas.Concat(m); canvas.DrawImage(source, 0, 0);
        using var image = surface.Snapshot();
        using var encoded = image.Encode(SKEncodedImageFormat.Webp, profile.Quality) ?? throw new InvalidOperationException("Unable to encode image.");
        var output = new MemoryStream(encoded.ToArray());
        return new OptimizedImageResult(output, "image/webp", ".webp", width, height);
    }
}
