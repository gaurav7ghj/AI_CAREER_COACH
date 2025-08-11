// src/main/java/com/aicareercoach/dto/JobDto.java
package com.aicareercoach.dto;

public class JobDto {
    private String title;
    private String company;
    private String location;
    private String description;
    private String redirectUrl;
	public JobDto(String title, String company, String location, String description, String redirectUrl) {
		super();
		this.title = title;
		this.company = company;
		this.location = location;
		this.description = description;
		this.redirectUrl = redirectUrl;
	}
	public String getTitle() {
		return title;
	}
	public void setTitle(String title) {
		this.title = title;
	}
	public String getCompany() {
		return company;
	}
	public void setCompany(String company) {
		this.company = company;
	}
	public String getLocation() {
		return location;
	}
	public void setLocation(String location) {
		this.location = location;
	}
	public String getDescription() {
		return description;
	}
	public void setDescription(String description) {
		this.description = description;
	}
	public String getRedirectUrl() {
		return redirectUrl;
	}
	public void setRedirectUrl(String redirectUrl) {
		this.redirectUrl = redirectUrl;
	}

    
    // getters, setters, constructor(s)
}
