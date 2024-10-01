package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Theme;
import com.creating.chatApplication.entity.ThemeData;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.repository.ThemeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
public class ThemeServiceImpl implements ThemeService {

    private static final String THEMES_DIRECTORY_PATH = "src/main/resources/static/themes";
    private static final String COMPRESSED_THEMES_DIRECTORY_PATH = "src/main/resources/static/themes/compressed";

    @Autowired
    private ThemeRepository themeRepository;

    @Autowired
    private UserService userService;

    @PostConstruct
    public void init() {
        loadAndSaveThemes();
    }

    public void loadAndSaveThemes() {
        List<ThemeData> defaultThemes = loadDefaultThemes();

        for (ThemeData theme : defaultThemes) {
            // If not present, save it
            Theme newTheme = new Theme();
            newTheme.setThemeUrl(theme.getBase64Image());
            newTheme.setThemeName(theme.getFileName());
            newTheme.setThemeUrlCompressed(theme.getCompressedUrl());
            themeRepository.save(newTheme);
        }
    }

    @Override
    public List<ThemeData> loadDefaultThemes() {
        List<ThemeData> defaultThemes = new ArrayList<>();
        File themesDirectory = new File(THEMES_DIRECTORY_PATH);
        File compressedThemesDirectory = new File(COMPRESSED_THEMES_DIRECTORY_PATH);

        if (themesDirectory.exists() && themesDirectory.isDirectory() && compressedThemesDirectory.exists() && compressedThemesDirectory.isDirectory()) {
            File[] imageFiles = themesDirectory.listFiles((dir, name) -> {
                File file = new File(dir, name);
                return file.isFile(); // Only include files, exclude directories
            });
            File[] compressedImageFiles = compressedThemesDirectory.listFiles((dir, name) -> true);

            if (imageFiles != null) {
                int i = 0;
                for (File imageFile : imageFiles) {
                    if (themeRepository.findByThemeName(imageFile.getName()).isEmpty()) {
                        String base64Image = convertImageToBase64(imageFile.getAbsolutePath());
                        String compressedBase64Image = convertImageToBase64(compressedImageFiles[i++].getAbsolutePath());
                        defaultThemes.add(new ThemeData(imageFile.getName(), base64Image, base64Image));
                    }
                }
            }
        } else {
            System.out.println("Themes directory does not exist or is not a directory.");
        }

        return defaultThemes;
    }

    @Override
    public void setTheme(int id) {
        User currentUser = userService.getCurrentUser();
        Optional<Theme> optionalTheme = themeRepository.findById(id);
        optionalTheme.ifPresentOrElse(
                theme -> {
                    currentUser.setTheme(theme);
                    userService.saveUser(currentUser);
                },
                () -> {
                    throw new RuntimeException("Theme not found");
                }
        );
    }

    private String convertImageToBase64(String imagePath) {
        try {
            byte[] fileContent = Files.readAllBytes(new File(imagePath).toPath());
            return Base64.getEncoder().encodeToString(fileContent);
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }
}