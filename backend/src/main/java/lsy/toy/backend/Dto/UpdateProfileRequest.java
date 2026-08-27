package lsy.toy.backend.Dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public class UpdateProfileRequest {
    @NotBlank(message = "이름을 입력해주세요.")
    private String name;
    private LocalDate birthDate;
    private String phoneNumber;
    // 💡 비밀번호를 바꾸지 않을 때는 둘 다 null/blank로 온다.
    private String currentPassword;
    private String newPassword;

    public String getName() { return name; }
    public LocalDate getBirthDate() { return birthDate; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getCurrentPassword() { return currentPassword; }
    public String getNewPassword() { return newPassword; }
}
