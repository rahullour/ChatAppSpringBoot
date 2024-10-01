package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.ThemeData;

import java.util.List;

public interface ThemeService {
    List<ThemeData> loadDefaultThemes();
    void setTheme(int id);
}