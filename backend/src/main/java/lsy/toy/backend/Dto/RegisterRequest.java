package lsy.toy.backend.Dto;

import java.time.LocalDate;

public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private LocalDate birthDate;
    private String phoneNumber;

    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public LocalDate getBirthDate() { return birthDate; }
    public String getPhoneNumber() { return phoneNumber; }
}
