package lsy.toy.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// 💡 EnableScheduling: KakaoPayService/TossPayService의 정합성 배치(reconcileStuckPayments)가
// @Scheduled로 동작하기 위해 필요하다.
@SpringBootApplication
@EnableScheduling
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
