package lsy.toy.backend.Dto;

public class KakaoReadyResponse {
    private final String redirectUrl;

    public KakaoReadyResponse(String redirectUrl) {
        this.redirectUrl = redirectUrl;
    }

    public String getRedirectUrl() { return redirectUrl; }
}
