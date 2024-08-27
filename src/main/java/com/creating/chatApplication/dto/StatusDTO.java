package com.creating.chatApplication.dto;

public class StatusDTO {
    private String statusValue;

    public StatusDTO(String statusValue) {
        this.statusValue = statusValue;
    }

    public String getStatusValue() {
        return statusValue;
    }

    public void setStatusValue(String statusValue) {
        this.statusValue = statusValue;
    }
}
