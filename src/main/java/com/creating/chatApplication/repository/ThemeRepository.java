package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.Theme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ThemeRepository extends JpaRepository<Theme, Integer> {
    Optional<Theme> findByThemeUrl(String themeUrl);
    Optional<Theme> findByThemeName(String themeName);
}