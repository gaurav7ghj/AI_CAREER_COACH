// src/main/java/com/aicareercoach/service/JobService.java
package com.aicareercoach.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.aicareercoach.dto.JobDto;

@Service
public class JobService {

    @Value("${adzuna.app.id}")
    private String appId;

    @Value("${adzuna.app.key}")
    private String appKey;

    public List<JobDto> getJobRecommendations(String query, String location) {
        String apiUrl = String.format(
            "https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=%s&app_key=%s&q=%s&location0=%s",
            appId, appKey, query, location);

        // Use RestTemplate to fetch from Adzuna
        RestTemplate restTemplate = new RestTemplate();
        var response = restTemplate.getForObject(apiUrl, Map.class);

        // Parse and map response to List<JobDto>
        List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
        return results.stream().map(job -> new JobDto(
            (String) job.get("title"),
            job.containsKey("company") ? ((Map<String, String>) job.get("company")).get("display_name") : "",
            (String) job.get("location").toString(),
            (String) job.get("description"),
            (String) job.get("redirect_url")
        )).collect(Collectors.toList());
    }
    
    public List<JobDto> getRemotiveJobs(String search) {
        String url = "https://remotive.com/api/remote-jobs?search=" + URLEncoder.encode(search, StandardCharsets.UTF_8);
        RestTemplate restTemplate = new RestTemplate();
        Map response;

        try {
            response = restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            // Log the error (optionally use a logger in real apps)
            System.out.println("❗ Remotive API fetch error: " + e.getMessage());
            throw new RuntimeException("Failed to connect to Remotive API. Please try again.");
        }

        if (response == null || !response.containsKey("jobs")) {
            System.out.println("❗ Remotive API response invalid or missing 'jobs': " + response);
            throw new RuntimeException("Remotive API error: No jobs found or bad response.");
        }

        List<Map<String, Object>> jobs = (List<Map<String, Object>>) response.get("jobs");
        return jobs.stream().map(job -> new JobDto(
            (String) job.getOrDefault("title", ""),
            (String) job.getOrDefault("company_name", ""),
            (String) job.getOrDefault("candidate_required_location", ""),
            (String) job.getOrDefault("description", ""),
            (String) job.getOrDefault("url", "")
        )).collect(Collectors.toList());
    }


}
