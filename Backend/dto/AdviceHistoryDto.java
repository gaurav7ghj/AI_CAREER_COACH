// src/main/java/com/aicareercoach/dto/AdviceHistoryDto.java
package com.aicareercoach.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

public class AdviceHistoryDto {
    private Long id;
    private String skills;
    private String interests;
    private String response;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    // Constructors
    public AdviceHistoryDto() {}

    public AdviceHistoryDto(Long id, String skills, String interests, String response, LocalDateTime localDateTime) {
        this.id = id;
        this.skills = skills;
        this.interests = interests;
        this.response = response;
        this.createdAt = localDateTime;
    }

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getSkills() {
		return skills; 
	}

	public void setSkills(String skills) {
		this.skills = skills;
	}

	public String getInterests() {
		return interests;
	}

	public void setInterests(String interests) {
		this.interests = interests;
	}

	public String getResponse() {
		return response;
	}

	public void setResponse(String response) {
		this.response = response;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

    // Getters and setters...
    // (or use Lombok @Data for brevity)
}
