package com.creating.chatApplication.dto;

public class UserDTO {
    private String userId;

    public UserDTO(String userId) {
        this.userId = userId;
    }

    public String getStatusValue() {
        return userId;
    }

    public void setStatusValue(String statusValue) {
        this.userId = statusValue;
    }
}
