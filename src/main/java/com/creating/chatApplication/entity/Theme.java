package com.creating.chatApplication.entity;

import jakarta.persistence.*;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "theme")
public class Theme {
    private static final String THEMES_DIRECTORY_PATH = "/images/themes";
    private static final String COMPRESSED_THEMES_DIRECTORY_PATH = "/images/themes/compressed";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "theme_name")
    private String themeName;

    public Theme() {
    }

    public String getThemeName() {
        return themeName;
    }

    public void setThemeName(String themeName) {
        this.themeName = themeName;
    }

    public String getThemeUrl() {
        String fileName = this.themeName;
        return THEMES_DIRECTORY_PATH + '/' + fileName;
    }

    public String getThemeUrlCompressed() {
        String fileName = this.themeName; // Example: "1.png"
        int lastDotIndex = fileName.lastIndexOf(".");

        if (lastDotIndex != -1) {
            // Insert "-c" before the file extension
            String namePart = fileName.substring(0, lastDotIndex); // "1"
            String extensionPart = fileName.substring(lastDotIndex); // ".png"
            fileName = namePart + "-c" + extensionPart; // "1-c.png"
        } else {
            // If no extension is found, just append "-c" at the end
            fileName += "-c";
        }

        return COMPRESSED_THEMES_DIRECTORY_PATH + '/' + fileName;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    @Override
    public String toString() {
        return "Theme{" +
                "id=" + id +
                '}';
    }
}
