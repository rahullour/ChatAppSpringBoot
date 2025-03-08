package com.creating.chatApplication.entity;

public class ThemeData {
    private int id;
    private String fileName;
    private String compressedUrl;

    public ThemeData(String fileName) {
        this.fileName = fileName;
    }

    public ThemeData(int id, String compressedUrl) {
        this.id = id;
        this.compressedUrl = compressedUrl;
    }

    public ThemeData(String fileName, String compressedUrl) {
        this.fileName = fileName;
        this.compressedUrl = compressedUrl;
    }

    public String getFileName() {
        return fileName;
    }

    public String getCompressedUrl() {
        return compressedUrl;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }
}