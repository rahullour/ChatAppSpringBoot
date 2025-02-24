package com.creating.chatApplication.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;

public class RequestUrlFilter implements Filter {

    private static final ThreadLocal<String> currentUrl = new ThreadLocal<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        currentUrl.set(httpRequest.getRequestURI());
        try {
            chain.doFilter(request, response);
        } finally {
            currentUrl.remove();
        }
    }

    public static String getCurrentUrl() {
        return currentUrl.get();
    }
}


