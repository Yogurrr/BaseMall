package lsy.toy.backend.Dto;

public class ImageUploadResponse {
    private final String imageUrl;

    public ImageUploadResponse(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getImageUrl() { return imageUrl; }
}
