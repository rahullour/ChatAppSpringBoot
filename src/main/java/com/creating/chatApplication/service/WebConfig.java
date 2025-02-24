package com.creating.chatApplication.service;

import com.creating.chatApplication.config.RequestUrlFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;
import org.springframework.web.filter.RequestContextFilter;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Bean
    public StandardServletMultipartResolver multipartResolver() {
        return new StandardServletMultipartResolver();
    }

    @Bean
    public FilterRegistrationBean<RequestContextFilter> requestContextFilter() {
        FilterRegistrationBean<RequestContextFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new RequestContextFilter());
        registration.addUrlPatterns("/*"); // Or be more specific if needed
        registration.setName("requestContextFilter");
        registration.setOrder(1); // Ensure it runs early
        return registration;
    }

    @Bean
    public FilterRegistrationBean<RequestUrlFilter> requestUrlFilter() {
        FilterRegistrationBean<RequestUrlFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new RequestUrlFilter());
        registration.addUrlPatterns("/*"); // Apply to all URLs
        registration.setName("requestUrlFilter");
        registration.setOrder(2); // Ensure it runs after RequestContextFilter
        return registration;
    }
}

