package com.creating.chatApplication.entity;

import jakarta.persistence.*;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "theme")
public class Theme {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "theme_url", columnDefinition = "LONGTEXT")
    private String themeUrl;

    @Column(name = "theme_name")
    private String themeName;

    @Column(name = "theme_url_compressed", columnDefinition = "LONGTEXT")
    private String themeUrlCompressed;


    public Theme() {
    }

    public String getThemeName() {
        return themeName;
    }

    public void setThemeName(String themeName) {
        this.themeName = themeName;
    }

    public Theme(String themeUrl){
        this.themeUrl = themeUrl;
    }

    public String getThemeUrlCompressed() {
        return themeUrlCompressed;
    }

    public void setThemeUrlCompressed(String themeUrlCompressed) {
        this.themeUrlCompressed = themeUrlCompressed;
    }

    public String getThemeUrl() {
        return themeUrl;
    }

    public void setThemeUrl(String themeUrl) {
        this.themeUrl = themeUrl;
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
                ", themeUrl='" + themeUrl + '\'' +
                '}';
    }
}
