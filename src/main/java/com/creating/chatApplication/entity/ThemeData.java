package com.creating.chatApplication.entity;

public class ThemeData {
    private int id;
    private String fileName;
    private String base64Image;
    private String compressedUrl;

    public ThemeData(int id, String compressedUrl) {
        this.id = id;
        this.compressedUrl = compressedUrl;
    }

    public ThemeData(String fileName, String base64Image, String compressedUrl) {
        this.fileName = fileName;
        this.base64Image = base64Image;
        this.compressedUrl = compressedUrl;
    }

    public String getFileName() {
        return fileName;
    }

    public String getBase64Image() {
        return base64Image;
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