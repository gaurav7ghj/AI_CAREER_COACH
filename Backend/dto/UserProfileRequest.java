package com.aicareercoach.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserProfileRequest {

    @NotBlank(message = "Skills must not be blank")
    private String skills;

    @NotBlank(message = "Interests must not be blank")
    private String interests;
}
