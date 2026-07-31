package lsy.toy.backend.Dto;

public class UpdateFavoriteTeamRequest {
    // 💡 null 또는 빈 문자열이면 응원팀 선택을 해제한다.
    private String team;

    public String getTeam() { return team; }
}
