package lsy.toy.backend.Config;

import lsy.toy.backend.Security.RlsAwareDataSource;
import org.springframework.boot.jdbc.autoconfigure.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

// 💡 Hibernate/Hikari가 실제 요청을 처리할 때 쓰는 DataSource를 RlsAwareDataSource로 감싼다.
// Flyway는 spring.flyway.* 설정으로 이 빈과 별개의(소유자 권한) 커넥션을 쓰므로 영향받지 않는다.
@Configuration
public class DataSourceConfig {

    @Bean
    @ConfigurationProperties("spring.datasource.hikari")
    public DataSource actualDataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().build();
    }

    @Bean
    @Primary
    public DataSource dataSource(DataSource actualDataSource) {
        return new RlsAwareDataSource(actualDataSource);
    }
}
