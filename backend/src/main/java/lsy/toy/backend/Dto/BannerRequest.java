package lsy.toy.backend.Dto;

public class BannerRequest {
    private String eyebrow;
    private String title;
    private String description;
    private String ctaLabel;
    private String gradient;
    private String imageUrl;
    private Integer sortOrder;
    private Boolean active;

    public String getEyebrow() { return eyebrow; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCtaLabel() { return ctaLabel; }
    public String getGradient() { return gradient; }
    public String getImageUrl() { return imageUrl; }
    public Integer getSortOrder() { return sortOrder; }
    public Boolean getActive() { return active; }
}
