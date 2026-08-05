package lsy.toy.backend.Security;

import org.springframework.jdbc.datasource.DelegatingDataSource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

// 💡 Postgres RLS 정책이 참조하는 세션 변수(app.user_id/app.user_role)를 커넥션을
// 꺼낼 때마다(=트랜잭션 시작 시) 현재 로그인한 사용자 기준으로 채워 넣는다.
// set_config(..., true)는 SET LOCAL과 동일하게 트랜잭션 종료 시 자동으로 리셋되므로
// 커넥션 풀에서 재사용되어도 이전 요청의 값이 다음 요청으로 새지 않는다.
public class RlsAwareDataSource extends DelegatingDataSource {

    private static final String SET_SESSION_CONTEXT_SQL =
        "SELECT set_config('app.user_id', ?, true), set_config('app.user_role', ?, true)";

    public RlsAwareDataSource(DataSource targetDataSource) {
        super(targetDataSource);
    }

    @Override
    public Connection getConnection() throws SQLException {
        Connection connection = super.getConnection();
        applyRlsContext(connection);
        return connection;
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        Connection connection = super.getConnection(username, password);
        applyRlsContext(connection);
        return connection;
    }

    private void applyRlsContext(Connection connection) throws SQLException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = "";
        String role = "";
        if (authentication != null && authentication.getPrincipal() instanceof AppUserPrincipal principal) {
            userId = String.valueOf(principal.getId());
            role = principal.getRole();
        }

        try (PreparedStatement statement = connection.prepareStatement(SET_SESSION_CONTEXT_SQL)) {
            statement.setString(1, userId);
            statement.setString(2, role);
            statement.execute();
        }
    }
}
