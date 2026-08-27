package lsy.toy.backend.Controller;

import lsy.toy.backend.Entity.Team;
import lsy.toy.backend.Service.TeamService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    // 구단 목록 조회 (GET)
    @GetMapping
    public List<String> getTeams() {
        return teamService.getTeams().stream()
            .map(Team::getName)
            .toList();
    }
}
