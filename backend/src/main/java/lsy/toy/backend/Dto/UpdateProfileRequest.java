package lsy.toy.backend.Dto;

import java.time.LocalDate;

public class UpdateProfileRequest {
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
